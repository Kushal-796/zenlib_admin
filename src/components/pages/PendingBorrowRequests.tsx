import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setBorrowRequests, updateBorrowRequest, setLoading, setError, addProcessedRequest } from '../../store/slices/appSlice';
import { FirestoreService } from '../../services/firestoreService';
import { BorrowRequest, ProcessedRequest } from '../../types';
import { 
  PageTitle, 
  Card, 
  Button, 
  Badge, 
  FlexContainer,
  LoadingSpinner,
  ErrorMessage,
  colors 
} from '../styles/GlobalStyles';

const RequestCard = styled(Card)`
  margin-bottom: 16px;
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: between;
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

  useEffect(() => {
    loadBorrowRequests();
    
    // Set up real-time listener
    const unsubscribe = FirestoreService.onBorrowRequestsChange((requests) => {
      dispatch(setBorrowRequests(requests));
    });

    return () => unsubscribe();
  }, [dispatch]);

  const loadBorrowRequests = async () => {
    dispatch(setLoading(true));
    try {
      const requests = await FirestoreService.getBorrowRequests();
      const pendingRequests = requests.filter(req => req.status === 'pending');
      dispatch(setBorrowRequests(pendingRequests));
    } catch (error: any) {
      console.error('Error loading borrow requests:', error);
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleApproveRequest = async (request: BorrowRequest) => {
    setProcessingRequest(request.id);
    
    try {
      // Calculate due date (14 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // Only update the fields we want to change
      const updateData = {
        status: 'approved' as const,
        processedBy: 'admin',
        processedAt: new Date(),
        dueDate: dueDate,
      };

      await FirestoreService.updateBorrowRequest(request.id, updateData);
      
      // Update local state with the complete updated request
      const updatedRequest = { ...request, ...updateData };
      dispatch(updateBorrowRequest(updatedRequest));

      // Add to processed requests
      const processedRequest: ProcessedRequest = {
        id: '',
        type: 'borrow',
        userId: request.userId,
        userName: request.userName,
        userEmail: request.userEmail,
        bookId: request.bookId,
        bookTitle: request.bookTitle,
        bookAuthor: request.bookAuthor,
        requestedAt: request.timeStamp,
        processedAt: new Date(),
        processedBy: 'admin',
        status: 'approved' as const,
      };      await FirestoreService.addProcessedRequest(processedRequest);
      dispatch(addProcessedRequest(processedRequest));

      setSuccessMessage(`Borrow request for "${request.bookTitle}" has been approved.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error approving request:', error);
      dispatch(setError(error.message));
    } finally {
      setProcessingRequest(null);
    }
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

      // Add to processed requests
      const processedRequest = {
        id: request.id,
        type: 'borrow' as const,
        userId: request.userId,
        userName: request.userName,
        userEmail: request.userEmail,
        bookId: request.bookId,
        bookTitle: request.bookTitle,
        bookAuthor: request.bookAuthor,
        requestedAt: request.timeStamp,
        processedAt: new Date(),
        processedBy: 'admin',
        status: 'rejected' as const,
      };

      await FirestoreService.addProcessedRequest(processedRequest);
      dispatch(addProcessedRequest(processedRequest));

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
                <Badge variant="info">Requested by {request.userName}</Badge>
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
                <DetailValue>
                  {request.timeStamp.toLocaleDateString()} at {request.timeStamp.toLocaleTimeString()}
                </DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Status</DetailLabel>
                <Badge variant="warning">Pending Review</Badge>
              </DetailItem>
            </RequestDetails>

            <ActionButtons>
              <Button
                variant="danger"
                onClick={() => handleRejectRequest(request)}
                disabled={processingRequest === request.id}
              >
                ❌ Reject
              </Button>
              <Button
                variant="success"
                onClick={() => handleApproveRequest(request)}
                disabled={processingRequest === request.id}
              >
                ✅ Approve
              </Button>
            </ActionButtons>
          </RequestCard>
        ))
      )}
    </div>
  );
};

export default PendingBorrowRequests;
