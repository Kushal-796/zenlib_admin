import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setReturnRequests, updateReturnRequest, setLoading, setError, addProcessedRequest } from '../../store/slices/appSlice';
import { FirestoreService } from '../../services/firestoreService';
import { ReturnRequest } from '../../types';
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

const OverdueBadge = styled(Badge)`
  background-color: ${colors.danger};
  color: white;
`;

const PendingReturnRequests: React.FC = () => {
  const dispatch = useAppDispatch();
  const { returnRequests, loading, error } = useAppSelector((state) => state.app);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadReturnRequests();
    
    // Set up real-time listener
    const unsubscribe = FirestoreService.onReturnRequestsChange((requests) => {
      dispatch(setReturnRequests(requests));
    });

    return () => unsubscribe();
  }, [dispatch]);

  const loadReturnRequests = async () => {
    dispatch(setLoading(true));
    try {
      const requests = await FirestoreService.getReturnRequests();
      const pendingRequests = requests.filter(req => req.status === 'pending');
      dispatch(setReturnRequests(pendingRequests));
    } catch (error: any) {
      console.error('Error loading return requests:', error);
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleApproveReturn = async (request: ReturnRequest) => {
    setProcessingRequest(request.id);
    
    try {
      const updateData = {
        status: 'approved' as const,
        processedBy: 'admin',
        processedAt: new Date(),
        returnedAt: new Date(),
      };

      await FirestoreService.updateReturnRequest(request.id, updateData);
      
      const updatedRequest = { ...request, ...updateData };
      dispatch(updateReturnRequest(updatedRequest));

      // Add to processed requests
      const processedRequest = {
        id: request.id,
        type: 'return' as const,
        userId: request.userId,
        userName: request.userName,
        userEmail: request.userEmail,
        bookId: request.bookId,
        bookTitle: request.bookTitle,
        bookAuthor: request.bookAuthor,
        requestedAt: request.returnRequestedAt,
        processedAt: new Date(),
        processedBy: 'admin',
        status: 'approved' as const,
      };

      await FirestoreService.addProcessedRequest(processedRequest);
      dispatch(addProcessedRequest(processedRequest));

      setSuccessMessage(`Return request for "${request.bookTitle}" has been approved.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error approving return:', error);
      dispatch(setError(error.message));
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectReturn = async (request: ReturnRequest) => {
    setProcessingRequest(request.id);
    
    try {
      const updateData = {
        status: 'rejected' as const,
        processedBy: 'admin',
        processedAt: new Date(),
      };

      await FirestoreService.updateReturnRequest(request.id, updateData);
      
      const updatedRequest = { ...request, ...updateData };
      dispatch(updateReturnRequest(updatedRequest));

      // Add to processed requests
      const processedRequest = {
        id: request.id,
        type: 'return' as const,
        userId: request.userId,
        userName: request.userName,
        userEmail: request.userEmail,
        bookId: request.bookId,
        bookTitle: request.bookTitle,
        bookAuthor: request.bookAuthor,
        requestedAt: request.returnRequestedAt,
        processedAt: new Date(),
        processedBy: 'admin',
        status: 'rejected' as const,
      };

      await FirestoreService.addProcessedRequest(processedRequest);
      dispatch(addProcessedRequest(processedRequest));

      setSuccessMessage(`Return request for "${request.bookTitle}" has been rejected.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error rejecting return:', error);
      dispatch(setError(error.message));
    } finally {
      setProcessingRequest(null);
    }
  };

  const isOverdue = (dueDate: Date) => {
    return new Date() > dueDate;
  };

  const getDaysOverdue = (dueDate: Date) => {
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div>
        <PageTitle>Pending Return Requests</PageTitle>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <FlexContainer justify="space-between" align="center">
        <PageTitle>Pending Return Requests</PageTitle>
        <Badge variant="warning">
          ⏰ {returnRequests.length} Pending
        </Badge>
      </FlexContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

      {returnRequests.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', color: colors.success }}>✅</div>
            <h3 style={{ marginTop: '16px' }}>No Pending Returns</h3>
            <p>All return requests have been processed!</p>
          </div>
        </Card>
      ) : (
        returnRequests.map((request) => {
          const overdue = isOverdue(request.dueDate);
          const daysOverdue = overdue ? getDaysOverdue(request.dueDate) : 0;
          
          return (
            <RequestCard key={request.id}>
              <RequestHeader>
                <RequestInfo>
                  <RequestTitle>{request.bookTitle}</RequestTitle>
                  <Badge variant="info">Return requested by {request.userName}</Badge>
                  {overdue && (
                    <OverdueBadge>
                      ⚠️ Overdue by {daysOverdue} days
                    </OverdueBadge>
                  )}
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
                  <DetailLabel>Borrowed At</DetailLabel>
                  <DetailValue>
                    {request.borrowedAt.toLocaleDateString()} at {request.borrowedAt.toLocaleTimeString()}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Due Date</DetailLabel>
                  <DetailValue style={{ color: overdue ? colors.danger : colors.primaryText }}>
                    {request.dueDate.toLocaleDateString()} at {request.dueDate.toLocaleTimeString()}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Return Requested At</DetailLabel>
                  <DetailValue>
                    {request.returnRequestedAt.toLocaleDateString()} at {request.returnRequestedAt.toLocaleTimeString()}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Status</DetailLabel>
                  <Badge variant="warning">Pending Return</Badge>
                </DetailItem>
              </RequestDetails>

              <ActionButtons>
                <Button
                  variant="danger"
                  onClick={() => handleRejectReturn(request)}
                  disabled={processingRequest === request.id}
                >
                  ❌ Reject Return
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleApproveReturn(request)}
                  disabled={processingRequest === request.id}
                >
                  ✅ Approve Return
                </Button>
              </ActionButtons>
            </RequestCard>
          );
        })
      )}
    </div>
  );
};

export default PendingReturnRequests;