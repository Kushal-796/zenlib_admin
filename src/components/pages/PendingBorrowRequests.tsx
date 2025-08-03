import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setBorrowRequests, updateBorrowRequest, setLoading, setError } from '../../store/slices/appSlice';
import { FirestoreService } from '../../services/firestoreService';
import { BorrowRequest } from '../../types';
import { 
  PageTitle, 
  Card, 
  Button, 
  Badge, 
  FlexContainer,
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
  colors 
} from '../styles/GlobalStyles';

const RequestCard = styled(Card)`
  margin-bottom: 16px;
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const RequestInfo = styled.div`
  flex: 1;
`;

const RequestTitle = styled.h3`
  color: ${colors.primaryText};
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const RequestDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const DetailLabel = styled.span`
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  font-weight: 500;
  margin-bottom: 4px;
`;

const DetailValue = styled.span`
  color: ${colors.primaryText};
  font-weight: 500;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const PendingBorrowRequests: React.FC = () => {
  const dispatch = useAppDispatch();
  const { borrowRequests, loading, error } = useAppSelector((state) => state.app);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadBorrowRequests = async () => {
    dispatch(setLoading(true));
    try {
      const pendingRequests = await FirestoreService.getPendingBorrowRequests();
      // Additional client-side filter to ensure only pending status documents are shown
      const filteredPendingRequests = pendingRequests.filter(request => request.status === 'pending');
      
      console.log('Total requests fetched:', pendingRequests.length);
      console.log('Filtered pending requests:', filteredPendingRequests.length);
      console.log('Pending requests data:', filteredPendingRequests.map(r => ({ id: r.id, status: r.status, title: r.bookTitle })));
      
      dispatch(setBorrowRequests(filteredPendingRequests));
    } catch (error: any) {
      console.error('Error loading pending borrow requests:', error);
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    loadBorrowRequests();
    
    // Set up real-time listener for pending requests only
    const unsubscribe = FirestoreService.onBorrowRequestsChange((pendingRequests) => {
      // Additional client-side filter to ensure only pending status documents are shown
      const filteredPendingRequests = pendingRequests.filter(request => request.status === 'pending');
      dispatch(setBorrowRequests(filteredPendingRequests));
    });

    return () => unsubscribe();
  }, [dispatch]);

  const updateRequest = async (requestId: string, bookId: string, status: 'approved' | 'rejected') => {
    setProcessingRequest(requestId);
    
    try {
      if (status === 'approved') {
        // Handle approval with transaction logic
        const success = await FirestoreService.approveBookRequest(requestId, bookId);
        
        if (success) {
          setSuccessMessage('Request approved successfully');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          // Book was unavailable, request was deleted
          setSuccessMessage('❌ Book unavailable. Request deleted.');
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      } else {
        // Handle rejection
        await FirestoreService.rejectBookRequest(requestId, bookId);
        setSuccessMessage('Request rejected successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      
      // Reload the requests after update
      await loadBorrowRequests();
      
    } catch (error: any) {
      console.error('Error updating request:', error);
      dispatch(setError(`Error: ${error.message || error.toString()}`));
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatDate = (timestamp: Date): string => {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleRejectRequest = async (request: BorrowRequest) => {
    setProcessingRequest(request.id);
    
    try {
      // Only update the fields we want to change
      const updateData = {
        status: 'rejected' as const,
        processedBy: 'admin',
        processedAt: new Date(),
      };

      await FirestoreService.updateBorrowRequest(request.id, updateData);
      
      // Update local state with the complete updated request
      const updatedRequest = { ...request, ...updateData };
      dispatch(updateBorrowRequest(updatedRequest));

      setSuccessMessage(`Borrow request for "${request.bookTitle}" has been rejected.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      dispatch(setError(error.message));
    } finally {
      setProcessingRequest(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageTitle>Pending Borrow Requests</PageTitle>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <FlexContainer justify="space-between" align="center">
        <PageTitle>Pending Borrow Requests</PageTitle>
        <Badge variant="warning">
          ⏰ {borrowRequests.length} Pending
        </Badge>
      </FlexContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

      {borrowRequests.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', color: colors.success }}>✅</div>
            <h3 style={{ marginTop: '16px' }}>No Pending Requests</h3>
            <p>All borrow requests have been processed!</p>
          </div>
        </Card>
      ) : (
        borrowRequests.map((request) => (
          <RequestCard key={request.id}>
            <RequestHeader>
              <RequestInfo>
                <RequestTitle>{request.bookTitle}</RequestTitle>
                <FlexContainer gap="8px">
                  <Badge variant="info">📖 {request.bookAuthor}</Badge>
                  <Badge variant="warning">👤 {request.userName}</Badge>
                </FlexContainer>
              </RequestInfo>
            </RequestHeader>

            <RequestDetails>
              <DetailItem>
                <DetailLabel>Book Author</DetailLabel>
                <DetailValue>{request.bookAuthor}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>User Email</DetailLabel>
                <DetailValue>{request.userEmail}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Requested At</DetailLabel>
                <DetailValue>{formatDate(request.timeStamp)}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Status</DetailLabel>
                <Badge variant={request.status === 'pending' ? 'warning' : 'danger'}>
                  {request.status === 'pending' ? 'Pending Review' : `Status: ${request.status}`}
                </Badge>
              </DetailItem>
            </RequestDetails>

            <ActionButtons>
              <Button
                variant="success"
                onClick={() => updateRequest(request.id, request.bookId, 'approved')}
                disabled={processingRequest === request.id}
              >
                {processingRequest === request.id ? '⏳ Processing...' : '✅ Approve'}
              </Button>
              <Button
                variant="danger"
                onClick={() => updateRequest(request.id, request.bookId, 'rejected')}
                disabled={processingRequest === request.id}
              >
                {processingRequest === request.id ? '⏳ Processing...' : '❌ Reject'}
              </Button>
            </ActionButtons>
          </RequestCard>
        ))
      )}
    </div>
  );
};

export default PendingBorrowRequests;
