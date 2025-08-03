import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
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

const SearchContainer = styled.div`
  margin-bottom: 24px;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: ${colors.info};
    box-shadow: 0 0 0 3px ${colors.info}20;
  }
`;

const PenaltyCard = styled(Card)`
  margin-bottom: 16px;
`;

const PenaltyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const PenaltyInfo = styled.div`
  flex: 1;
`;

const PenaltyTitle = styled.h3`
  color: ${colors.primaryText};
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const PenaltyDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
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

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled(Card)`
  text-align: center;
  padding: 20px;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: ${colors.info};
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
  font-weight: 500;
`;

const PenaltyManagement: React.FC = () => {
  const [penaltyRequests, setPenaltyRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoadingState] = useState(true);
  const [error, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Real-time stream for penalty requests (penaltyAmount > 0 && isPaid = false)
  useEffect(() => {
    console.log('Setting up penalty requests stream...');
    setLoadingState(true);
    
    const unsubscribe = FirestoreService.onSnapshot(
      'lending_requests',
      [
        { field: 'penaltyAmount', operator: '>', value: 0 },
        { field: 'isPaid', operator: '==', value: false }
      ],
      [
        { field: 'penaltyAmount', direction: 'desc' },
        { field: 'timestamp', direction: 'desc' }
      ],
      async (docs) => {
        console.log(`Received ${docs.length} penalty documents from lending_requests`);
        
        const requestsWithDetails = await Promise.all(
          docs.map(async (doc) => {
            const data = doc.data() as any;
            console.log(`Processing penalty request ${doc.id}:`, data);
            
            // Get book and user details
            const [book, user] = await Promise.all([
              FirestoreService.getBook(data.bookId),
              FirestoreService.getUser(data.userId)
            ]);
            
            return {
              id: doc.id,
              userId: data.userId,
              userName: user?.name || 'Unknown User',
              userEmail: user?.email || 'Unknown Email',
              bookId: data.bookId,
              bookTitle: book?.title || 'Unknown Book',
              bookAuthor: book?.author || 'Unknown Author',
              timeStamp: data.timestamp?.toDate() || new Date(),
              status: data.status || 'pending',
              processedAt: data.processedAt?.toDate(),
              processedBy: data.processedBy,
              isReturned: data.isReturned || false,
              isReturnRequest: data.isReturnRequest || false,
              isPaid: data.isPaid || false,
              penaltyAmount: data.penaltyAmount || 0,
              approvedAt: data.approvedAt?.toDate(),
              returnRequestStatus: data.returnRequestStatus,
              returnTimestamp: data.returnTimestamp?.toDate()
            } as BorrowRequest;
          })
        );
        
        console.log('Processed penalty requests:', requestsWithDetails);
        setPenaltyRequests(requestsWithDetails);
        setLoadingState(false);
      },
      (error) => {
        console.error('Error in penalty requests stream:', error);
        setErrorMessage(error.message);
        setLoadingState(false);
      }
    );

    return () => {
      console.log('Cleaning up penalty requests stream');
      unsubscribe();
    };
  }, []);

  const markAsPaid = async (requestId: string) => {
    console.log(`Attempting to mark penalty ${requestId} as paid...`);
    setProcessingRequest(requestId);
    
    try {
      await FirestoreService.updateDocument('lending_requests', requestId, {
        isPaid: true
      });
      
      console.log(`Penalty ${requestId} marked as paid`);
      setSuccessMessage('Penalty marked as paid!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error: any) {
      console.error('Error marking penalty as paid:', error);
      setErrorMessage(`Error marking penalty as paid: ${error.message}`);
    } finally {
      setProcessingRequest(null);
    }
  };

  const confirmMarkAsPaid = async (request: BorrowRequest) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark this penalty as paid?\n\nBook: ${request.bookTitle}\nUser: ${request.userName}\nAmount: ₹${request.penaltyAmount}`
    );
    
    if (confirmed) {
      await markAsPaid(request.id);
    }
  };

  const filteredRequests = penaltyRequests.filter(request =>
    request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.bookAuthor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPendingAmount = filteredRequests.reduce((sum, req) => sum + (req.penaltyAmount || 0), 0);
  const unpaidPenalties = filteredRequests.length;

  if (loading) {
    return (
      <div>
        <PageTitle>Penalty Management</PageTitle>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <FlexContainer justify="space-between" align="center">
        <PageTitle>Penalty Management</PageTitle>
        <Badge variant="warning">
          ⚠️ {unpaidPenalties} Unpaid Penalties
        </Badge>
      </FlexContainer>

      <StatsContainer>
        <StatCard>
          <StatValue>₹{totalPendingAmount}</StatValue>
          <StatLabel>Total Pending Amount</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{unpaidPenalties}</StatValue>
          <StatLabel>Unpaid Penalties</StatLabel>
        </StatCard>
      </StatsContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Search by user name, email, book title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchContainer>

      {filteredRequests.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', color: colors.success }}>✅</div>
            <h3 style={{ marginTop: '16px' }}>No Unpaid Penalties Found</h3>
            <p>All penalty amounts have been paid!</p>
          </div>
        </Card>
      ) : (
        filteredRequests.map((request) => {
          const formattedTime = request.timeStamp.toLocaleDateString() + ' ' + 
                              request.timeStamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          return (
            <PenaltyCard key={request.id}>
              <PenaltyHeader>
                <FlexContainer align="center" gap="12px">
                  <div style={{ fontSize: '24px', color: colors.warning }}>⚠️</div>
                  <PenaltyInfo>
                    <PenaltyTitle>Book: {request.bookTitle}</PenaltyTitle>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      User: {request.userName}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Issued: {formattedTime}
                    </div>
                  </PenaltyInfo>
                </FlexContainer>
                <FlexContainer direction="column" align="flex-end" gap="8px">
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: colors.danger 
                  }}>
                    ₹{request.penaltyAmount}
                  </div>
                  
                  {request.isPaid ? (
                    <Badge variant="success">Paid</Badge>
                  ) : request.penaltyAmount === 0 ? (
                    <Badge variant="info">No Fine</Badge>
                  ) : (
                    <Button
                      variant={request.isReturnRequest ? "success" : "warning"}
                      size="small"
                      onClick={() => confirmMarkAsPaid(request)}
                      disabled={!request.isReturnRequest || processingRequest === request.id}
                      style={{
                        backgroundColor: request.isReturnRequest ? colors.success : '#ccc',
                        cursor: request.isReturnRequest ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {processingRequest === request.id ? '⏳ Processing...' : 'Mark Paid'}
                    </Button>
                  )}
                </FlexContainer>
              </PenaltyHeader>

              <PenaltyDetails>
                <DetailItem>
                  <DetailLabel>Book Author</DetailLabel>
                  <DetailValue>{request.bookAuthor}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>User Email</DetailLabel>
                  <DetailValue>{request.userEmail}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Status</DetailLabel>
                  <DetailValue>
                    <FlexContainer gap="8px">
                      <Badge variant={request.status === 'approved' ? 'success' : 'warning'}>
                        {request.status}
                      </Badge>
                      {request.isReturnRequest && (
                        <Badge variant="info">Return Requested</Badge>
                      )}
                      {!request.isReturnRequest && (
                        <Badge variant="warning">Not Return Requested</Badge>
                      )}
                    </FlexContainer>
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Return Status</DetailLabel>
                  <DetailValue>
                    {request.isReturned ? (
                      <Badge variant="success">Returned</Badge>
                    ) : (
                      <Badge variant="warning">Not Returned</Badge>
                    )}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Payment Status</DetailLabel>
                  <DetailValue>
                    {request.isPaid ? (
                      <Badge variant="success">Paid</Badge>
                    ) : (
                      <Badge variant="danger">Unpaid</Badge>
                    )}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Can Mark as Paid</DetailLabel>
                  <DetailValue>
                    {request.isReturnRequest ? (
                      <Badge variant="success">Yes (Return Requested)</Badge>
                    ) : (
                      <Badge variant="info">No (No Return Request)</Badge>
                    )}
                  </DetailValue>
                </DetailItem>
              </PenaltyDetails>
            </PenaltyCard>
          );
        })
      )}
    </div>
  );
};

export default PenaltyManagement;
