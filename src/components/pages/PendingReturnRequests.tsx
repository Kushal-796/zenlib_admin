import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateBorrowRequest, setLoading, setError, addProcessedRequest } from '../../store/slices/appSlice';
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

const PendingReturnRequests: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.app);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingReturns, setPendingReturns] = useState<BorrowRequest[]>([]);

  const loadPendingReturns = async () => {
    dispatch(setLoading(true));
    try {
      // Use the new method to get pending return requests
      const pendingReturnRequests = await FirestoreService.getPendingReturnRequests();
      console.log('Loaded pending return requests:', pendingReturnRequests.length);
      setPendingReturns(pendingReturnRequests);
    } catch (error: any) {
      console.error('Error loading pending returns:', error);
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    loadPendingReturns();
  }, [dispatch]);

  const handleProcessReturn = async (request: BorrowRequest, approve: boolean) => {
    setProcessingRequest(request.id);
    
    try {
      await FirestoreService.processReturnRequest(request.id, request.bookId, approve);
      
      if (approve) {
        setSuccessMessage(`Return for "${request.bookTitle}" has been approved ✅`);
      } else {
        setSuccessMessage(`Return request for "${request.bookTitle}" has been rejected ❌`);
      }
      
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload the pending returns
      await loadPendingReturns();
    } catch (error: any) {
      console.error('Error processing return:', error);
      dispatch(setError(error.message || 'Failed to process return request'));
    } finally {
      setProcessingRequest(null);
    }
  };

  const calculateDaysOverdue = (borrowDate: Date): number => {
    const today = new Date();
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + 14); // Assuming 14-day loan period
    
    if (today > dueDate) {
      return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 0;
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
          📚 {pendingReturns.length} Books Out
        </Badge>
      </FlexContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

      {pendingReturns.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', color: colors.success }}>✅</div>
            <h3 style={{ marginTop: '16px' }}>No Pending Return Requests</h3>
            <p>All return requests have been processed!</p>
          </div>
        </Card>
      ) : (
        pendingReturns.map((request) => {
          const daysOverdue = calculateDaysOverdue(request.timeStamp);
          const isOverdue = daysOverdue > 0;
          const hasPenalty = (request.penaltyAmount || 0) > 0;
          const isPenaltyPaid = request.isPaid || false;
          const canApprove = request.canApprove !== false; // Default to true if not set
          
          return (
            <RequestCard key={request.id}>
              <RequestHeader>
                <RequestInfo>
                  <RequestTitle>{request.bookTitle}</RequestTitle>
                  <FlexContainer gap="8px">
                    <Badge variant="info">📖 Return by {request.userName}</Badge>
                    {isOverdue && (
                      <Badge variant="danger">⚠️ {daysOverdue} days overdue</Badge>
                    )}
                    {hasPenalty && (
                      <Badge variant={isPenaltyPaid ? "success" : "danger"}>
                        💰 ₹{request.penaltyAmount} {isPenaltyPaid ? "Paid" : "Pending"}
                      </Badge>
                    )}
                    {!canApprove && (
                      <Badge variant="warning">⚠️ Penalty not paid</Badge>
                    )}
                  </FlexContainer>
                </RequestInfo>
              </RequestHeader>

              <RequestDetails>
                <DetailItem>
                  <DetailLabel>Book Author</DetailLabel>
                  <DetailValue>{request.bookAuthor}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Borrower Email</DetailLabel>
                  <DetailValue>{request.userEmail}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Borrowed Date</DetailLabel>
                  <DetailValue>
                    {request.timeStamp.toLocaleDateString()} at {request.timeStamp.toLocaleTimeString()}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Book ID</DetailLabel>
                  <DetailValue>{request.bookId}</DetailValue>
                </DetailItem>
                {hasPenalty && (
                  <>
                    <DetailItem>
                      <DetailLabel>Penalty Amount</DetailLabel>
                      <DetailValue>₹{request.penaltyAmount}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Payment Status</DetailLabel>
                      <DetailValue style={{ color: isPenaltyPaid ? colors.success : colors.danger }}>
                        {isPenaltyPaid ? '✅ Paid' : '❌ Not Paid'}
                      </DetailValue>
                    </DetailItem>
                  </>
                )}
              </RequestDetails>

              <ActionButtons>
                <Button
                  variant="danger"
                  onClick={() => handleProcessReturn(request, false)}
                  disabled={processingRequest === request.id}
                >
                  {processingRequest === request.id ? '⏳ Processing...' : '❌ Reject Return'}
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleProcessReturn(request, true)}
                  disabled={processingRequest === request.id || !canApprove}
                  title={!canApprove ? "Cannot approve: Penalty payment required" : ""}
                >
                  {processingRequest === request.id ? '⏳ Processing...' : '✅ Approve Return'}
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
