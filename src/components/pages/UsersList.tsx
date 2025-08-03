import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setUsers, setLoading, setError } from '../../store/slices/appSlice';
import { FirestoreService } from '../../services/firestoreService';
import { User, BorrowRequest } from '../../types';

// Styled Components - Flutter-inspired design
const Container = styled.div`
  padding: 16px;
  background-color: #F3FAF8;
  min-height: 100vh;
`;

const AppBarContainer = styled.div`
  background-color: #F3FAF8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #00253A;
  font-size: 32px;
  padding: 0;
`;

const PageTitle = styled.h1`
  color: #00253A;
  font-weight: bold;
  font-size: 20px;
  margin: 0;
  text-align: center;
  flex: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  background-color: white;
  margin-bottom: 16px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

// Flutter-inspired Grid Layout for Users
const UsersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (min-width: 1440px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const UserCard = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: auto;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const UserAvatar = styled.div<{ isAvailable: boolean }>`
  flex: 1;
  height: 150px;
  background: ${props => 
    props.isAvailable 
      ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
      : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 40px;
  font-weight: bold;
  position: relative;
  overflow: hidden;
`;

const UserInitials = styled.span`
  font-size: 48px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const UserInfo = styled.div`
  padding: 8px;
  flex-shrink: 0;
`;

const UserName = styled.h3`
  color: #00253A;
  font-weight: bold;
  font-size: 14px;
  margin: 0;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  line-height: 1.2;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  grid-column: 1 / -1;
  
  .icon {
    font-size: 64px;
    color: #6b7280;
    margin-bottom: 16px;
  }
  
  h3 {
    color: #00253A;
    margin: 0 0 8px 0;
    font-size: 20px;
  }
  
  p {
    color: #6b7280;
    margin: 0;
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

// User Details Modal/Overlay
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  color: #00253A;
  font-weight: bold;
  font-size: 20px;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    color: #00253A;
  }
`;

const ModalContent = styled.div`
  padding: 20px;
`;

const UserDetailSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  color: #00253A;
  font-weight: bold;
  font-size: 16px;
  margin: 0 0 12px 0;
`;

const UserDetail = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  color: #6b7280;
  font-size: 14px;
`;

const DetailValue = styled.span`
  color: #00253A;
  font-weight: 500;
`;

const BookItem = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const BookTitle = styled.div`
  font-weight: bold;
  color: #00253A;
  margin-bottom: 4px;
`;

const BookAuthor = styled.div`
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 8px;
`;

const BookStatus = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ status }) => {
    switch (status) {
      case 'approved':
        return '#e8f5e8';
      case 'pending':
        return '#fff3cd';
      case 'rejected':
        return '#f8d7da';
      case 'active':
        return '#d4edda';
      case 'return-requested':
        return '#d1ecf1';
      case 'overdue':
        return '#f5c6cb';
      case 'returned':
        return '#d1ecf1';
      default:
        return '#e9ecef';
    }
  }};
  color: ${({ status }) => {
    switch (status) {
      case 'approved':
        return '#155724';
      case 'pending':
        return '#856404';
      case 'rejected':
        return '#721c24';
      case 'active':
        return '#155724';
      case 'return-requested':
        return '#0c5460';
      case 'overdue':
        return '#721c24';
      case 'returned':
        return '#0c5460';
      default:
        return '#495057';
    }
  }};
`;

const BookDate = styled.div`
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
`;

const EmptyBooksMessage = styled.div`
  text-align: center;
  color: #6b7280;
  padding: 20px;
  font-style: italic;
`;

const UsersList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector((state) => state.app);
  const [searchTerm, setSearchTerm] = useState('');
  const [usersBorrowData, setUsersBorrowData] = useState<Record<string, BorrowRequest[]>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Fetch users stream (matches Flutter StreamBuilder pattern)
  const loadUsers = async () => {
    dispatch(setLoading(true));
    try {
      const usersData = await FirestoreService.getUsers();
      dispatch(setUsers(usersData));

      // Fetch borrow data for each user to determine availability status
      const borrowDataPromises = usersData.map(async (user) => {
        try {
          console.log('Fetching data for user:', user.name, user.id);
          const userRequests = await FirestoreService.getUserBorrowRequests(user.id);
          console.log('Got requests for', user.name, ':', userRequests);
          return { userId: user.id, requests: userRequests };
        } catch (error) {
          console.warn(`Could not fetch borrow data for user ${user.id}:`, error);
          return { userId: user.id, requests: [] };
        }
      });

      const borrowDataResults = await Promise.all(borrowDataPromises);
      console.log('All borrow data results:', borrowDataResults);
      
      const borrowDataMap: Record<string, BorrowRequest[]> = {};
      borrowDataResults.forEach(({ userId, requests }) => {
        borrowDataMap[userId] = requests;
      });
      
      console.log('Final borrow data map:', borrowDataMap);
      setUsersBorrowData(borrowDataMap);
    } catch (error: any) {
      console.error('Error loading users:', error);
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    loadUsers();
  }, [dispatch]);

  // Determine if user is "available" based on lending_requests fields
  const isUserAvailable = (userId: string): boolean => {
    const userRequests = usersBorrowData[userId] || [];
    // User is available if they have no approved requests where isReturnRequest is false
    const activeBooks = userRequests.filter(req => 
      req.status === 'approved' && req.isReturnRequest === false
    );
    return activeBooks.length === 0;
  };

  // Get user initials for avatar (matches Flutter pattern)
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter users based on search term (matches Flutter filtering)
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  // Handle user card click to show details
  const handleUserClick = (user: User) => {
    console.log('Clicked user:', user);
    console.log('User borrow data:', usersBorrowData[user.id]);
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  // Close user details modal
  const closeUserDetails = () => {
    setShowUserDetails(false);
    setSelectedUser(null);
  };

  // Get user's borrow history
  const getUserBorrowHistory = (userId: string): BorrowRequest[] => {
    return usersBorrowData[userId] || [];
  };

  // Check if book is overdue
  const isOverdue = (borrowDate: Date): boolean => {
    const today = new Date();
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + 14); // 14-day loan period
    return today > dueDate;
  };

  // Get user statistics based on lending_requests collection
  const getUserStats = (userId: string) => {
    const userRequests = usersBorrowData[userId] || [];
    console.log('getUserStats for userId:', userId);
    console.log('userRequests:', userRequests);
    
    // Total borrow requests: how many lending_requests are there with field userId that matches the user
    const totalBorrows = userRequests.length;
    
    // Approved borrows: in how many of the above requests, status field is "approved"
    const approvedRequests = userRequests.filter(req => req.status === 'approved');
    const approvedBorrows = approvedRequests.length;
    
    // Currently active: in how many of the approved borrows, the isReturnRequest is false
    const activeBooks = approvedRequests.filter(req => req.isReturnRequest === false).length;
    
    // Overdue books: in how many of the approved borrows, isReturned is false, and penaltyAmount > 0
    const overdueBooks = approvedRequests.filter(req => 
      req.isReturned === false && (req.penaltyAmount || 0) > 0
    ).length;
    
    const stats = {
      totalBorrows,
      approvedBorrows,
      activeBooks,
      overdueBooks
    };
    
    console.log('Calculated stats based on lending_requests fields:', stats);
    console.log('Approved requests:', approvedRequests);
    console.log('Active books (isReturnRequest=false):', approvedRequests.filter(req => req.isReturnRequest === false));
    console.log('Overdue books (isReturned=false && penaltyAmount>0):', approvedRequests.filter(req => req.isReturned === false && (req.penaltyAmount || 0) > 0));
    
    return stats;
  };

  if (loading) {
    return (
      <Container>
        <AppBarContainer>
          <BackButton>
            ‹
          </BackButton>
          <PageTitle>Users</PageTitle>
          <div style={{ width: '32px' }} />
        </AppBarContainer>
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <AppBarContainer>
        <BackButton>
          ‹
        </BackButton>
        <PageTitle>Users</PageTitle>
        <div style={{ width: '32px' }} />
      </AppBarContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <SearchInput
        type="text"
        placeholder="Search users by name or email..."
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
      />

      {filteredUsers.length === 0 ? (
        <UsersGrid>
          <EmptyState>
            <div className="icon">👥</div>
            <h3>No users found.</h3>
            <p>No users match your search criteria.</p>
          </EmptyState>
        </UsersGrid>
      ) : (
        <UsersGrid>
          {filteredUsers.map((user) => {
            const isAvailable = isUserAvailable(user.id);
            const initials = getUserInitials(user.name);
            
            return (
              <UserCard 
                key={user.id}
                onClick={() => handleUserClick(user)}
              >
                <UserAvatar isAvailable={isAvailable}>
                  <UserInitials>{initials}</UserInitials>
                </UserAvatar>
                
                <UserInfo>
                  <UserName>{user.name}</UserName>
                </UserInfo>
              </UserCard>
            );
          })}
        </UsersGrid>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <Overlay onClick={closeUserDetails}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{selectedUser.name}</ModalTitle>
              <CloseButton onClick={closeUserDetails}>×</CloseButton>
            </ModalHeader>
            
            <ModalContent>
              {/* User Information */}
              <UserDetailSection>
                <SectionTitle>User Information</SectionTitle>
                <UserDetail>
                  <DetailLabel>Name</DetailLabel>
                  <DetailValue>{selectedUser.name}</DetailValue>
                </UserDetail>
                <UserDetail>
                  <DetailLabel>Email</DetailLabel>
                  <DetailValue>{selectedUser.email}</DetailValue>
                </UserDetail>
                <UserDetail>
                  <DetailLabel>User ID</DetailLabel>
                  <DetailValue>{selectedUser.id}</DetailValue>
                </UserDetail>
              </UserDetailSection>

              {/* User Statistics */}
              <UserDetailSection>
                <SectionTitle>Borrowing Statistics</SectionTitle>
                {(() => {
                  const stats = getUserStats(selectedUser.id);
                  return (
                    <>
                      <UserDetail>
                        <DetailLabel>Total Borrow Requests</DetailLabel>
                        <DetailValue>{stats.totalBorrows}</DetailValue>
                      </UserDetail>
                      <UserDetail>
                        <DetailLabel>Approved Borrows</DetailLabel>
                        <DetailValue>{stats.approvedBorrows}</DetailValue>
                      </UserDetail>
                      <UserDetail>
                        <DetailLabel>Currently Active</DetailLabel>
                        <DetailValue>{stats.activeBooks}</DetailValue>
                      </UserDetail>
                      <UserDetail>
                        <DetailLabel>Overdue Books</DetailLabel>
                        <DetailValue style={{ color: stats.overdueBooks > 0 ? '#ef4444' : '#10b981' }}>
                          {stats.overdueBooks}
                        </DetailValue>
                      </UserDetail>
                    </>
                  );
                })()}
              </UserDetailSection>

              {/* Borrow History */}
              <UserDetailSection>
                <SectionTitle>Borrow History</SectionTitle>
                {(() => {
                  const borrowHistory = getUserBorrowHistory(selectedUser.id);
                  
                  if (borrowHistory.length === 0) {
                    return (
                      <EmptyBooksMessage>
                        This user has not borrowed any books yet.
                      </EmptyBooksMessage>
                    );
                  }

                  return borrowHistory
                    .sort((a, b) => new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime())
                    .map((book, index) => (
                      <BookItem key={index}>
                        <BookTitle>{book.bookTitle || 'Unknown Book'}</BookTitle>
                        <BookAuthor>by {book.bookAuthor || 'Unknown Author'}</BookAuthor>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <BookStatus status={book.status}>
                            {book.status}
                          </BookStatus>
                          
                          {/* Show additional status based on lending_requests fields */}
                          {book.status === 'approved' && (
                            <>
                              {book.isReturnRequest === false && (
                                <BookStatus status="active">
                                  Active
                                </BookStatus>
                              )}
                              {book.isReturnRequest === true && (
                                <BookStatus status="return-requested">
                                  Return Requested
                                </BookStatus>
                              )}
                              {book.isReturned === false && (book.penaltyAmount || 0) > 0 && (
                                <BookStatus status="overdue">
                                  Overdue (₹{book.penaltyAmount})
                                </BookStatus>
                              )}
                              {book.isReturned === true && (
                                <BookStatus status="returned">
                                  Returned
                                </BookStatus>
                              )}
                            </>
                          )}
                        </div>
                        <BookDate>
                          Requested: {new Date(book.timeStamp).toLocaleDateString()}
                          {book.status === 'approved' && (
                            <>
                              {book.borrowDate && (
                                <> • Borrowed: {new Date(book.borrowDate).toLocaleDateString()}</>
                              )}
                              {book.returnDate && (
                                <> • Returned: {new Date(book.returnDate).toLocaleDateString()}</>
                              )}
                              {book.penaltyAmount && book.penaltyAmount > 0 && (
                                <> • Penalty: ₹{book.penaltyAmount}</>
                              )}
                            </>
                          )}
                        </BookDate>
                      </BookItem>
                    ));
                })()}
              </UserDetailSection>
            </ModalContent>
          </Modal>
        </Overlay>
      )}
    </Container>
  );
};

export default UsersList;
