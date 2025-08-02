import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setProcessedRequests, setLoading, setError } from '../../store/slices/appSlice';
import { FirestoreService } from '../../services/firestoreService';
import { ProcessedRequest } from '../../types';
import { 
  PageTitle, 
  Card, 
  Button, 
  Badge, 
  FlexContainer,
  LoadingSpinner,
  ErrorMessage,
  Input,
  colors 
} from '../styles/GlobalStyles';

const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterButton = styled(Button)<{ active: boolean }>`
  background-color: ${props => props.active ? colors.info : 'transparent'};
  color: ${props => props.active ? 'white' : colors.info};
  border: 1px solid ${colors.info};
  
  &:hover {
    background-color: ${colors.info};
    color: white;
  }
`;

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
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const RequestDetails = styled.div`
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

const SearchInput = styled(Input)`
  flex: 1;
  max-width: 300px;
`;

const ExportButton = styled(Button)`
  margin-left: auto;
`;

type FilterType = 'all' | 'borrow' | 'return' | 'approved' | 'rejected';

const ProcessedHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { processedRequests, loading, error } = useAppSelector((state) => state.app);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadProcessedRequests();
  }, [dispatch]);

  const loadProcessedRequests = async () => {
    dispatch(setLoading(true));
    try {
      const requests = await FirestoreService.getProcessedRequests();
      dispatch(setProcessedRequests(requests));
    } catch (error: any) {
      console.error('Error loading processed requests:', error);
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const filteredRequests = processedRequests.filter((request: ProcessedRequest) => {
    const matchesSearch = 
      request.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filter) {
      case 'borrow':
        return request.type === 'borrow';
      case 'return':
        return request.type === 'return';
      case 'approved':
        return request.status === 'approved';
      case 'rejected':
        return request.status === 'rejected';
      default:
        return true;
    }
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'info';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'borrow':
        return 'info';
      case 'return':
        return 'warning';
      default:
        return 'info';
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Date Processed',
      'Type',
      'Status',
      'Book Title',
      'Book Author',
      'User Name',
      'User Email',
      'Processed By',
      'Original Request Date'
    ];
    
    const csvData = filteredRequests.map(request => [
      request.processedAt.toLocaleDateString(),
      request.type,
      request.status,
      request.bookTitle,
      request.bookAuthor,
      request.userName,
      request.userEmail,
      request.processedBy,
      request.requestedAt.toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div>
        <PageTitle>Processed History</PageTitle>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <FlexContainer justify="space-between" align="center">
        <PageTitle>Processed History</PageTitle>
        <Badge variant="info">{filteredRequests.length} Records</Badge>
      </FlexContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <FlexContainer justify="space-between" align="center" style={{ marginBottom: '24px' }}>
        <SearchInput
          type="text"
          placeholder="Search by book title, user name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ExportButton variant="primary" onClick={exportToCSV}>
          📊 Export CSV
        </ExportButton>
      </FlexContainer>

      <FilterContainer>
        <FilterButton 
          active={filter === 'all'} 
          onClick={() => setFilter('all')}
          variant="info"
        >
          All ({processedRequests.length})
        </FilterButton>
        <FilterButton 
          active={filter === 'borrow'} 
          onClick={() => setFilter('borrow')}
          variant="info"
        >
          Borrow Requests ({processedRequests.filter(r => r.type === 'borrow').length})
        </FilterButton>
        <FilterButton 
          active={filter === 'return'} 
          onClick={() => setFilter('return')}
          variant="info"
        >
          Return Requests ({processedRequests.filter(r => r.type === 'return').length})
        </FilterButton>
        <FilterButton 
          active={filter === 'approved'} 
          onClick={() => setFilter('approved')}
          variant="info"
        >
          Approved ({processedRequests.filter(r => r.status === 'approved').length})
        </FilterButton>
        <FilterButton 
          active={filter === 'rejected'} 
          onClick={() => setFilter('rejected')}
          variant="info"
        >
          Rejected ({processedRequests.filter(r => r.status === 'rejected').length})
        </FilterButton>
      </FilterContainer>

      {filteredRequests.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', color: colors.secondaryText }}>📋</div>
            <h3 style={{ marginTop: '16px' }}>No Records Found</h3>
            <p>No processed requests match your current filters.</p>
          </div>
        </Card>
      ) : (
        filteredRequests.map((request) => (
          <RequestCard key={request.id}>
            <RequestHeader>
              <RequestInfo>
                <RequestTitle>{request.bookTitle}</RequestTitle>
                <FlexContainer gap="8px" style={{ marginTop: '8px' }}>
                  <Badge variant={getTypeBadgeVariant(request.type)}>
                    {request.type === 'borrow' ? '📚 Borrow' : '↩️ Return'}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(request.status)}>
                    {request.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                  </Badge>
                </FlexContainer>
              </RequestInfo>
            </RequestHeader>

            <RequestDetails>
              <DetailItem>
                <DetailLabel>Book Author</DetailLabel>
                <DetailValue>{request.bookAuthor}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>User</DetailLabel>
                <DetailValue>{request.userName}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Email</DetailLabel>
                <DetailValue>{request.userEmail}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Requested Date</DetailLabel>
                <DetailValue>
                  {request.requestedAt.toLocaleDateString()} at {request.requestedAt.toLocaleTimeString()}
                </DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Processed Date</DetailLabel>
                <DetailValue>
                  {request.processedAt.toLocaleDateString()} at {request.processedAt.toLocaleTimeString()}
                </DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Processed By</DetailLabel>
                <DetailValue>{request.processedBy}</DetailValue>
              </DetailItem>
            </RequestDetails>
          </RequestCard>
        ))
      )}
    </div>
  );
};

export default ProcessedHistory;
