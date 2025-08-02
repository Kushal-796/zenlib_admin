import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState, Book, User, BorrowRequest, ReturnRequest, Penalty, ProcessedRequest } from '../../types';

const initialState: AppState = {
  books: [],
  users: [],
  borrowRequests: [],
  returnRequests: [],
  penalties: [],
  processedRequests: [],
  loading: false,
  error: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setBooks: (state, action: PayloadAction<Book[]>) => {
      state.books = action.payload;
    },
    addBook: (state, action: PayloadAction<Book>) => {
      state.books.push(action.payload);
    },
    updateBook: (state, action: PayloadAction<Book>) => {
      const index = state.books.findIndex(book => book.id === action.payload.id);
      if (index !== -1) {
        state.books[index] = action.payload;
      }
    },
    removeBook: (state, action: PayloadAction<string>) => {
      state.books = state.books.filter(book => book.id !== action.payload);
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    setBorrowRequests: (state, action: PayloadAction<BorrowRequest[]>) => {
      state.borrowRequests = action.payload;
    },
    updateBorrowRequest: (state, action: PayloadAction<BorrowRequest>) => {
      const index = state.borrowRequests.findIndex(req => req.id === action.payload.id);
      if (index !== -1) {
        state.borrowRequests[index] = action.payload;
      }
    },
    setReturnRequests: (state, action: PayloadAction<ReturnRequest[]>) => {
      state.returnRequests = action.payload;
    },
    updateReturnRequest: (state, action: PayloadAction<ReturnRequest>) => {
      const index = state.returnRequests.findIndex(req => req.id === action.payload.id);
      if (index !== -1) {
        state.returnRequests[index] = action.payload;
      }
    },
    setPenalties: (state, action: PayloadAction<Penalty[]>) => {
      state.penalties = action.payload;
    },
    updatePenalty: (state, action: PayloadAction<Penalty>) => {
      const index = state.penalties.findIndex(penalty => penalty.id === action.payload.id);
      if (index !== -1) {
        state.penalties[index] = action.payload;
      }
    },
    setProcessedRequests: (state, action: PayloadAction<ProcessedRequest[]>) => {
      state.processedRequests = action.payload;
    },
    addProcessedRequest: (state, action: PayloadAction<ProcessedRequest>) => {
      state.processedRequests.unshift(action.payload);
    },
  },
});

export const {
  setLoading,
  setError,
  setBooks,
  addBook,
  updateBook,
  removeBook,
  setUsers,
  setBorrowRequests,
  updateBorrowRequest,
  setReturnRequests,
  updateReturnRequest,
  setPenalties,
  updatePenalty,
  setProcessedRequests,
  addProcessedRequest,
} = appSlice.actions;

export default appSlice.reducer;
