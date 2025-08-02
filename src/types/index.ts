// Types for the application
// Types for the application
export interface Book {
  id: string;
  bookId: string;
  title: string;
  author: string;
  genre: string;
  imageUrl: string;
  count: number;
  isAvailable: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  nob: number; // number of books
}

export interface BorrowRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  timeStamp: Date;
  status: 'pending' | 'approved' | 'rejected';
  processedAt?: Date;
  processedBy?: string;
  isReturned: boolean;
  notes?: string;
}

export interface ReturnRequest {
  id: string;
  borrowRequestId: string;
  userId: string;
  userName: string;
  userEmail: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  borrowedAt: Date;
  dueDate: Date;
  returnRequestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  processedAt?: Date;
  processedBy?: string;
  isOverdue: boolean;
  penaltyAmount?: number;
  notes?: string;
}

export interface Penalty {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bookId: string;
  bookTitle: string;
  borrowRequestId: string;
  amount: number;
  reason: string;
  createdAt: Date;
  dueDate: Date;
  overdueBy: number; // days
  isPaid: boolean;
  paidAt?: Date;
  paidBy?: string;
}

export interface ProcessedRequest {
  id: string;
  type: 'borrow' | 'return';
  userId: string;
  userName: string;
  userEmail: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  requestedAt: Date;
  processedAt: Date;
  processedBy: string;
  status: 'approved' | 'rejected';
  isReturned?: boolean;
  notes?: string;
}

export interface AlertMessage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bookId: string;
  bookTitle: string;
  message: string;
  sentAt: Date;
  sentBy: string;
  type: 'overdue' | 'reminder' | 'custom';
}

export interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
}

export interface AppState {
  books: Book[];
  users: User[];
  borrowRequests: BorrowRequest[];
  returnRequests: ReturnRequest[];
  penalties: Penalty[];
  processedRequests: ProcessedRequest[];
  loading: boolean;
  error: string | null;
}
