import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setBooks, setLoading, setError, updateBook } from '../../store/slices/appSlice';
import { FirestoreService } from '../../services/firestoreService';
import { Book } from '../../types';
import { 
  PageTitle, 
  Card, 
  Input, 
  Button, 
  Grid, 
  FlexContainer, 
  Badge, 
  SearchBox,
  LoadingSpinner,
  ErrorMessage,
  colors 
} from '../styles/GlobalStyles';

const SearchContainer = styled(SearchBox)`
  position: relative;
  
  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
  }
`;

const SearchInput = styled(Input)`
  padding-left: 40px;
`;

const BookCard = styled(Card)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const BookImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
  background-color: #f5f5f5;
`;

const PlaceholderImage = styled.div`
  width: 100%;
  height: 200px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
`;

const BookInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const BookTitle = styled.h3`
  color: ${colors.primaryText};
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.3;
`;

const BookAuthor = styled.p`
  color: #666;
  font-size: 14px;
  margin: 0 0 8px 0;
`;

const BookGenre = styled.span`
  color: #888;
  font-size: 12px;
  margin-bottom: 12px;
  display: block;
`;

const BookStats = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const CopyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const CopyCount = styled.span`
  font-weight: 600;
  color: ${colors.primaryText};
`;

const AvailabilityBadge = styled(Badge)<{ available: boolean }>`
  background-color: ${props => props.available ? colors.success : colors.danger};
  color: white;
`;

const RestockContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: auto;
  padding-top: 12px;
`;

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { books, loading, error } = useAppSelector((state) => state.app);
  const [searchTerm, setSearchTerm] = useState('');
  const [restockAmounts, setRestockAmounts] = useState<{ [key: string]: number }>({});

  const loadBooks = async () => {
    dispatch(setLoading(true));
    try {
      const booksData = await FirestoreService.getBooks();
      dispatch(setBooks(booksData));
    } catch (error: any) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    loadBooks();
    
    // Set up real-time listener
    const unsubscribe = FirestoreService.onBooksChange((books) => {
      dispatch(setBooks(books));
    });

    return () => unsubscribe();
  }, [dispatch]);

  const handleRestock = async (book: Book) => {
    const amount = restockAmounts[book.id] || 0;
    if (amount <= 0) return;

    try {
      const updatedBook = {
        ...book,
        count: (book.count || 0) + amount,
        isAvailable: true, // Set to available when restocking
      };

      await FirestoreService.updateBook(book.id, updatedBook);
      dispatch(updateBook(updatedBook));
      
      setRestockAmounts(prev => ({ ...prev, [book.id]: 0 }));
    } catch (error: any) {
      dispatch(setError(error.message));
    }
  };

  const filteredBooks = books.filter((book: Book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <PageTitle>Dashboard - Available Books</PageTitle>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <FlexContainer justify="space-between" align="center">
        <PageTitle>Dashboard - Available Books</PageTitle>
        <Badge variant="info">{books.length} Total Books</Badge>
      </FlexContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <SearchContainer>
        🔍
        <SearchInput
          type="text"
          placeholder="Search books by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchContainer>

      <Grid>
        {filteredBooks.map((book: Book) => {
          const isAvailable = book.isAvailable;
          const totalCount = book.count || 0;
          
          return (
            <BookCard key={book.id}>
              {book.imageUrl ? (
                <BookImage 
                  src={book.imageUrl} 
                  alt={book.title}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <PlaceholderImage>📚 No Image</PlaceholderImage>
              )}
              
              <BookInfo>
                <BookTitle>{book.title}</BookTitle>
                <BookAuthor>by {book.author}</BookAuthor>
                <BookGenre>{book.genre}</BookGenre>
                
                <BookStats>
                  <Badge variant="info">ID: {book.bookId}</Badge>
                  <AvailabilityBadge available={isAvailable}>
                    {isAvailable ? 'Available' : 'Not Available'}
                  </AvailabilityBadge>
                </BookStats>

                <CopyInfo>
                  <CopyCount>{totalCount} copies</CopyCount>
                  {totalCount > 0 && (
                    <Badge variant="success">In Stock</Badge>
                  )}
                  {totalCount === 0 && (
                    <Badge variant="danger">Out of Stock</Badge>
                  )}
                </CopyInfo>

                {totalCount === 0 && (
                  <RestockContainer>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Add copies"
                      value={restockAmounts[book.id] || ''}
                      onChange={(e) => setRestockAmounts(prev => ({
                        ...prev,
                        [book.id]: parseInt(e.target.value) || 0
                      }))}
                    />
                    <Button
                      variant="success"
                      size="small"
                      onClick={() => handleRestock(book)}
                      disabled={!restockAmounts[book.id] || restockAmounts[book.id] <= 0}
                    >
                      ➕ Restock
                    </Button>
                  </RestockContainer>
                )}
              </BookInfo>
            </BookCard>
          );
        })}
      </Grid>

      {filteredBooks.length === 0 && !loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>No books found</h3>
            <p>Try adjusting your search or add new books to the library.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
