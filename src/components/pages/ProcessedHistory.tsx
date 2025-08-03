import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setLoading, setError } from '../../store/slices/appSlice';
import { FirestoreService } from '../../services/firestoreService';
import { BorrowRequest } from '../../types';

// Styled Components
const Container = styled.div`
  padding: 24px;
`;

const PageTitle = styled.h1`
  color: #333;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 24px;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Badge = styled.span<{ variant: string }>`
  background-color: ${props => {
    switch (props.variant) {
      case 'info': return '#3b82f6';
      case 'success': return '#10b981';
      case 'danger': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 24px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const RequestCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const RequestListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatusAvatar = styled.div<{ isApproved: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => props.isApproved ? '#10b981' : '#ef4444'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
`;

const RequestContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const BookTitle = styled.h3`
  margin: 0;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
`;

const UserInfo = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 14px;
`;

const StatusChip = styled.span<{ isApproved: boolean }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  background-color: ${props => props.isApproved ? '#10b981' : '#ef4444'};
  margin-top: 4px;
  width: fit-content;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  
  &::after {
    content: '';
    width: 32px;
    height: 32px;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  
  .icon {
    font-size: 48px;
    color: #6b7280;
    margin-bottom: 16px;
  }
  
  h3 {
    color: #111827;
    margin: 0 0 8px 0;
  }
  
  p {
    color: #6b7280;
    margin: 0;
  }
`;

const ProcessedHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.app);
  const [processedRequests, setProcessedRequests] = useState<BorrowRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch user name (matches Flutter logic)
  const getUserName = async (userId: string): Promise<string> => {
    try {
      const userDetails = await FirestoreService.getUser(userId);
      return userDetails?.name || 'Unknown User';
    } catch (e) {
      console.error('Error fetching user name:', e);
      return 'Unknown User';
    }
  };

  // Fetch book title (matches Flutter logic)
  const getBookTitle = async (bookId: string): Promise<string> => {
    try {
      const bookDetails = await FirestoreService.getBook(bookId);
      return bookDetails?.title || 'Unknown Book';
    } catch (e) {
      console.error('Error fetching book title:', e);
      return 'Unknown Book';
    }
  };

  const loadProcessedRequests = async () => {
    dispatch(setLoading(true));
    try {
      // Stream processed requests (matches Flutter StreamBuilder logic)
      const requests = await FirestoreService.getProcessedRequestsStream();
      
      // Fetch user and book details for each request
      const requestsWithDetails = await Promise.all(
        requests.map(async (request) => {
          const [userName, bookTitle] = await Promise.all([
            getUserName(request.userId),
            getBookTitle(request.bookId)
          ]);
          
          return {
            ...request,
            userName,
            bookTitle
          };
        })
      );
      
      setProcessedRequests(requestsWithDetails);
    } catch (error: any) {
      console.error('Error loading processed requests:', error);
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    loadProcessedRequests();
  }, [dispatch]);

  // Filter requests based on search term (matches Flutter filtering)
  const filteredRequests = processedRequests.filter((request) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      request.bookTitle?.toLowerCase().includes(searchLower) ||
      request.userName?.toLowerCase().includes(searchLower) ||
      request.userEmail?.toLowerCase().includes(searchLower) ||
      request.status.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Container>
        <PageTitle>Processed Requests</PageTitle>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <HeaderContainer>
        <PageTitle>Processed Requests</PageTitle>
        <Badge variant="info">{filteredRequests.length} Records</Badge>
      </HeaderContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <SearchInput
        type="text"
        placeholder="Search by book title, user name, email, or status..."
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
      />

      {filteredRequests.length === 0 ? (
        <RequestCard>
          <EmptyState>
            <div className="icon">📋</div>
            <h3>No processed requests.</h3>
            <p>No requests have been processed yet.</p>
          </EmptyState>
        </RequestCard>
      ) : (
        filteredRequests.map((request) => {
          const isApproved = request.status === 'approved';
          
          return (
            <RequestCard key={request.id}>
              <RequestListItem>
                <StatusAvatar isApproved={isApproved}>
                  {isApproved ? (
                    <span>✓</span>
                  ) : (
                    <span>✕</span>
                  )}
                </StatusAvatar>
                
                <RequestContent>
                  <BookTitle>{request.bookTitle}</BookTitle>
                  <UserInfo>User: {request.userName}</UserInfo>
                  <StatusChip isApproved={isApproved}>
                    {request.status.toUpperCase()}
                  </StatusChip>
                </RequestContent>
              </RequestListItem>
            </RequestCard>
          );
        })
      )}
    </Container>
  );
};

export default ProcessedHistory;
