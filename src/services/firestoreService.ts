import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { Book, User, BorrowRequest, ReturnRequest, Penalty, ProcessedRequest } from '../types';

export class FirestoreService {
  // Books
  static async getBooks(): Promise<Book[]> {
    const booksCollection = collection(db, 'books');
    const snapshot = await getDocs(booksCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Book[];
  }

  static async addBook(bookData: Omit<Book, 'id'>): Promise<string> {
    const booksCollection = collection(db, 'books');
    const docRef = await addDoc(booksCollection, bookData);
    return docRef.id;
  }

  static async updateBook(bookId: string, updates: Partial<Book>): Promise<void> {
    const bookRef = doc(db, 'books', bookId);
    await updateDoc(bookRef, updates);
  }

  static async deleteBook(bookId: string): Promise<void> {
    const bookRef = doc(db, 'books', bookId);
    await deleteDoc(bookRef);
  }

  static async uploadBookCover(file: File, bookId: string): Promise<string> {
    const storageRef = ref(storage, `book-covers/${bookId}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  // Users
  static async getUsers(): Promise<User[]> {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  }

  static async getUser(userId: string): Promise<User | null> {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as User;
    }
    return null;
  }

  // Borrow Requests
  static async getBorrowRequests(): Promise<BorrowRequest[]> {
    const requestsCollection = collection(db, 'lending_requests');
    const q = query(requestsCollection, orderBy('timeStamp', 'desc'));
    const snapshot = await getDocs(q);
    
    const requests = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      
      // Fetch user details
      let userName = 'Unknown User';
      let userEmail = '';
      try {
        const userDoc = await getDoc(doc(db, 'users', data.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userName = userData.name || 'Unknown User';
          userEmail = userData.email || '';
        }
      } catch (error) {
        console.warn('Could not fetch user details for userId:', data.userId);
      }
      
      // Fetch book details
      let bookTitle = 'Unknown Book';
      let bookAuthor = 'Unknown Author';
      try {
        const bookDoc = await getDoc(doc(db, 'books', data.bookId));
        if (bookDoc.exists()) {
          const bookData = bookDoc.data();
          bookTitle = bookData.title || 'Unknown Book';
          bookAuthor = bookData.author || 'Unknown Author';
        }
      } catch (error) {
        console.warn('Could not fetch book details for bookId:', data.bookId);
      }
      
      return {
        id: docSnapshot.id,
        bookId: data.bookId,
        userId: data.userId,
        status: data.status,
        isReturned: data.isReturned || false,
        timeStamp: data.timeStamp?.toDate() || new Date(),
        userName,
        userEmail,
        bookTitle,
        bookAuthor,
        processedAt: data.processedAt?.toDate(),
      } as BorrowRequest;
    }));
    
    return requests;
  }

  static async updateBorrowRequest(requestId: string, updates: Partial<BorrowRequest>): Promise<void> {
    const requestRef = doc(db, 'lending_requests', requestId);
    const updateData: any = {};
    
    // Only include defined fields in the update
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });
    
    // Convert Date objects to Firestore Timestamps
    if (updateData.timeStamp) {
      updateData.timeStamp = Timestamp.fromDate(updateData.timeStamp);
    }
    if (updateData.processedAt) {
      updateData.processedAt = Timestamp.fromDate(updateData.processedAt);
    }
    
    await updateDoc(requestRef, updateData);
  }

  // Return Requests
  static async getReturnRequests(): Promise<ReturnRequest[]> {
    const requestsCollection = collection(db, 'returnRequests');
    const q = query(requestsCollection, orderBy('returnRequestedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      borrowedAt: doc.data().borrowedAt?.toDate(),
      dueDate: doc.data().dueDate?.toDate(),
      returnRequestedAt: doc.data().returnRequestedAt?.toDate(),
      processedAt: doc.data().processedAt?.toDate(),
    })) as ReturnRequest[];
  }

  static async updateReturnRequest(requestId: string, updates: Partial<ReturnRequest>): Promise<void> {
    const requestRef = doc(db, 'returnRequests', requestId);
    await updateDoc(requestRef, {
      ...updates,
      processedAt: updates.status ? Timestamp.now() : undefined,
    });
  }

  // Penalties
  static async getPenalties(): Promise<Penalty[]> {
    const penaltiesCollection = collection(db, 'penalties');
    const q = query(penaltiesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      dueDate: doc.data().dueDate?.toDate(),
      paidAt: doc.data().paidAt?.toDate(),
    })) as Penalty[];
  }

  static async updatePenalty(penaltyId: string, updates: Partial<Penalty>): Promise<void> {
    const penaltyRef = doc(db, 'penalties', penaltyId);
    await updateDoc(penaltyRef, {
      ...updates,
      paidAt: updates.isPaid ? Timestamp.now() : undefined,
    });
  }

  static async addProcessedRequest(requestData: Omit<ProcessedRequest, 'id'>): Promise<string> {
    const requestsCollection = collection(db, 'processedRequests');
    const docRef = await addDoc(requestsCollection, {
      ...requestData,
      processedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  // Real-time listeners
  static onBooksChange(callback: (books: Book[]) => void) {
    const booksCollection = collection(db, 'books');
    return onSnapshot(booksCollection, (snapshot) => {
      const books = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Book[];
      callback(books);
    });
  }

  static onBorrowRequestsChange(callback: (requests: BorrowRequest[]) => void) {
    const requestsCollection = collection(db, 'lending_requests');
    const q = query(requestsCollection, where('status', '==', 'pending'), orderBy('timeStamp', 'desc'));
    return onSnapshot(q, async (snapshot) => {
      const requests = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        
        // Fetch user details
        let userName = 'Unknown User';
        let userEmail = '';
        try {
          const userDoc = await getDoc(doc(db, 'users', data.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userName = userData.name || 'Unknown User';
            userEmail = userData.email || '';
          }
        } catch (error) {
          console.warn('Could not fetch user details for userId:', data.userId);
        }
        
        // Fetch book details
        let bookTitle = 'Unknown Book';
        let bookAuthor = 'Unknown Author';
        try {
          const bookDoc = await getDoc(doc(db, 'books', data.bookId));
          if (bookDoc.exists()) {
            const bookData = bookDoc.data();
            bookTitle = bookData.title || 'Unknown Book';
            bookAuthor = bookData.author || 'Unknown Author';
          }
        } catch (error) {
          console.warn('Could not fetch book details for bookId:', data.bookId);
        }
        
        return {
          id: docSnapshot.id,
          bookId: data.bookId,
          userId: data.userId,
          status: data.status,
          isReturned: data.isReturned || false,
          timeStamp: data.timeStamp?.toDate() || new Date(),
          userName,
          userEmail,
          bookTitle,
          bookAuthor,
          processedAt: data.processedAt?.toDate(),
        } as BorrowRequest;
      }));
      callback(requests);
    });
  }

  static onReturnRequestsChange(callback: (requests: ReturnRequest[]) => void) {
    const requestsCollection = collection(db, 'returnRequests');
    const q = query(requestsCollection, where('status', '==', 'pending'), orderBy('returnRequestedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        borrowedAt: doc.data().borrowedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
        returnRequestedAt: doc.data().returnRequestedAt?.toDate(),
        processedAt: doc.data().processedAt?.toDate(),
      })) as ReturnRequest[];
      callback(requests);
    });
  }

  // Processed Requests History
  static async getProcessedRequests(): Promise<ProcessedRequest[]> {
    try {
      // Fetch processed borrow requests
      const borrowRequestsCollection = collection(db, 'lending_requests');
      const borrowQuery = query(
        borrowRequestsCollection, 
        where('status', 'in', ['approved', 'rejected']),
        orderBy('processedAt', 'desc')
      );
      const borrowSnapshot = await getDocs(borrowQuery);
      
      const borrowRequests = await Promise.all(
        borrowSnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          
          // Get book details
          let bookTitle = 'Unknown Book';
          let bookAuthor = 'Unknown Author';
          if (data.bookId) {
            try {
              const bookRef = doc(db, 'books', data.bookId);
              const bookDoc = await getDoc(bookRef);
              if (bookDoc.exists()) {
                const bookData = bookDoc.data() as any;
                bookTitle = bookData.title || bookTitle;
                bookAuthor = bookData.author || bookAuthor;
              }
            } catch (error) {
              console.warn(`Could not fetch book details for ID: ${data.bookId}`);
            }
          }
          
          // Get user details
          let userName = 'Unknown User';
          let userEmail = 'unknown@email.com';
          if (data.userId) {
            try {
              const userRef = doc(db, 'users', data.userId);
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                const userData = userDoc.data() as any;
                userName = userData.name || userName;
                userEmail = userData.email || userEmail;
              }
            } catch (error) {
              console.warn(`Could not fetch user details for ID: ${data.userId}`);
            }
          }
          
          return {
            id: docSnapshot.id,
            type: 'borrow' as const,
            status: data.status,
            bookId: data.bookId,
            bookTitle,
            bookAuthor,
            userId: data.userId,
            userName,
            userEmail,
            requestedAt: data.timeStamp?.toDate() || new Date(),
            processedAt: data.processedAt?.toDate() || new Date(),
            processedBy: data.processedBy || 'System',
          };
        })
      );

      // For now, just return borrow requests since return requests seem to be handled differently in your database
      const allRequests = [...borrowRequests];
      return allRequests.sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime());
      
    } catch (error) {
      console.error('Error fetching processed requests:', error);
      throw new Error('Failed to fetch processed requests');
    }
  }
}
