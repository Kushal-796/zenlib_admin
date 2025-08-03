import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setBooks, addBook, updateBook, removeBook, setLoading, setError } from '../../store/slices/appSlice';
import { FirestoreService } from '../../services/firestoreService';
import { Book } from '../../types';
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

const AddBookButton = styled(Button)`
  margin-bottom: 24px;
`;

const BookCard = styled(Card)`
  margin-bottom: 16px;
`;

const BookHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const BookInfo = styled.div`
  flex: 1;
`;

const BookTitle = styled.h3`
  color: ${colors.primaryText};
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const BookDetails = styled.div`
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

const BookImage = styled.img`
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 16px;
`;

const BookImageContainer = styled.div`
  display: flex;
  align-items: flex-start;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled(Card)`
  width: 90%;
  max-width: 500px;
  margin: 0;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  color: ${colors.primaryText};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: ${colors.primaryText};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: ${colors.primaryText};
`;

const Input = styled.input`
  width: 100%;
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: ${colors.info};
    box-shadow: 0 0 0 3px ${colors.info}20;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
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

interface BookFormData {
  title: string;
  author: string;
  genre: string;
  count: number;
  imageUrl: string;
  bookId: string;
}

const ManageBooks: React.FC = () => {
  const dispatch = useAppDispatch();
  const { books, loading, error } = useAppSelector((state) => state.app);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [processingBook, setProcessingBook] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    genre: '',
    count: 1,
    imageUrl: '',
    bookId: ''
  });

  const loadBooks = async () => {
    dispatch(setLoading(true));
    try {
      const booksData = await FirestoreService.getBooks();
      dispatch(setBooks(booksData));
    } catch (error: any) {
      console.error('Error loading books:', error);
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    loadBooks();
  }, [dispatch]);

  const handleAddBook = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      genre: '',
      count: 1,
      imageUrl: '',
      bookId: ''
    });
    setShowModal(true);
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      genre: book.genre,
      count: book.count || 1,
      imageUrl: book.imageUrl || '',
      bookId: book.bookId
    });
    setShowModal(true);
  };

  const handleDeleteBook = async (book: Book) => {
    if (!window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      return;
    }

    setProcessingBook(book.id);
    
    try {
      await FirestoreService.deleteBook(book.id);
      dispatch(removeBook(book.id));
      
      setSuccessMessage(`"${book.title}" has been deleted.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error: any) {
      console.error('Error deleting book:', error);
      dispatch(setError(error.message));
    } finally {
      setProcessingBook(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.author || !formData.genre || !formData.bookId) {
      dispatch(setError('Please fill in all required fields.'));
      return;
    }

    try {
      const bookData = {
        ...formData,
        isAvailable: formData.count > 0
      };

      if (editingBook) {
        // Update existing book
        await FirestoreService.updateBook(editingBook.id, bookData);
        dispatch(updateBook({ ...editingBook, ...bookData }));
        setSuccessMessage(`"${formData.title}" has been updated.`);
      } else {
        // Add new book
        const newBookId = await FirestoreService.addBook(bookData);
        const newBook = { id: newBookId, ...bookData };
        dispatch(addBook(newBook));
        setSuccessMessage(`"${formData.title}" has been added.`);
      }

      setShowModal(false);
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error: any) {
      console.error('Error saving book:', error);
      dispatch(setError(error.message));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'count' ? parseInt(value) || 0 : value
    }));
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.bookId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBooks = books.reduce((sum, book) => sum + (book.count || 0), 0);
  const availableBooks = books.filter(book => book.isAvailable).length;
  const outOfStockBooks = books.filter(book => !book.isAvailable || (book.count || 0) === 0).length;

  if (loading) {
    return (
      <div>
        <PageTitle>Manage Books</PageTitle>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <FlexContainer justify="space-between" align="center">
        <PageTitle>Manage Books</PageTitle>
        <Badge variant="info">
          📚 {books.length} Book Types
        </Badge>
      </FlexContainer>

      <StatsContainer>
        <StatCard>
          <StatValue>{books.length}</StatValue>
          <StatLabel>Total Book Types</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{totalBooks}</StatValue>
          <StatLabel>Total Copies</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{availableBooks}</StatValue>
          <StatLabel>Available Types</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{outOfStockBooks}</StatValue>
          <StatLabel>Out of Stock</StatLabel>
        </StatCard>
      </StatsContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

      <AddBookButton variant="primary" onClick={handleAddBook}>
        ➕ Add New Book
      </AddBookButton>

      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Search by title, author, genre, or book ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchContainer>

      {filteredBooks.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', color: colors.info }}>📚</div>
            <h3 style={{ marginTop: '16px' }}>No Books Found</h3>
            <p>No books match your current search criteria.</p>
          </div>
        </Card>
      ) : (
        filteredBooks.map((book) => (
          <BookCard key={book.id}>
            <BookImageContainer>
              {book.imageUrl && (
                <BookImage src={book.imageUrl} alt={book.title} />
              )}
              <div style={{ flex: 1 }}>
                <BookHeader>
                  <BookInfo>
                    <BookTitle>{book.title}</BookTitle>
                    <FlexContainer gap="8px">
                      <Badge variant="info">📖 {book.author}</Badge>
                      <Badge variant="info">🏷️ {book.genre}</Badge>
                      {book.isAvailable ? (
                        <Badge variant="success">✅ Available</Badge>
                      ) : (
                        <Badge variant="danger">❌ Out of Stock</Badge>
                      )}
                    </FlexContainer>
                  </BookInfo>
                </BookHeader>

                <BookDetails>
                  <DetailItem>
                    <DetailLabel>Book ID</DetailLabel>
                    <DetailValue>{book.bookId}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Genre</DetailLabel>
                    <DetailValue>{book.genre}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Copies Available</DetailLabel>
                    <DetailValue>{book.count || 0}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Status</DetailLabel>
                    <DetailValue style={{ 
                      color: book.isAvailable ? colors.success : colors.danger
                    }}>
                      {book.isAvailable ? 'Available' : 'Out of Stock'}
                    </DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Database ID</DetailLabel>
                    <DetailValue style={{ fontSize: '12px', color: '#666' }}>
                      {book.id}
                    </DetailValue>
                  </DetailItem>
                </BookDetails>

                <ActionButtons>
                  <Button
                    variant="info"
                    onClick={() => handleEditBook(book)}
                    disabled={processingBook === book.id}
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteBook(book)}
                    disabled={processingBook === book.id}
                  >
                    {processingBook === book.id ? '⏳ Deleting...' : '🗑️ Delete'}
                  </Button>
                </ActionButtons>
              </div>
            </BookImageContainer>
          </BookCard>
        ))
      )}

      {showModal && (
        <Modal onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
            </ModalHeader>

            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Book Title *</Label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Author *</Label>
                <Input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Genre *</Label>
                <Input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Book ID *</Label>
                <Input
                  type="text"
                  name="bookId"
                  value={formData.bookId}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Number of Copies *</Label>
                <Input
                  type="number"
                  name="count"
                  min="0"
                  value={formData.count}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Image URL</Label>
                <Input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/book-cover.jpg"
                />
              </FormGroup>

              <FormActions>
                <Button type="button" variant="warning" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingBook ? 'Update Book' : 'Add Book'}
                </Button>
              </FormActions>
            </form>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default ManageBooks;
