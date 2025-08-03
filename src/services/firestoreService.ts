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
  runTransaction,
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

  static async getBook(bookId: string): Promise<Book | null> {
    const bookRef = doc(db, 'books', bookId);
    const snapshot = await getDoc(bookRef);
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as Book;
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

  // Get pending borrow requests with status filtering
  static async getPendingBorrowRequests(): Promise<BorrowRequest[]> {
    console.log('FirestoreService: Starting getPendingBorrowRequests method');
    try {
      const lendingRequestsCollection = collection(db, 'lending_requests');
      const q = query(lendingRequestsCollection, where('status', '==', 'pending'));
      console.log('FirestoreService: Executing Firebase query with status filter');
      
      const querySnapshot = await getDocs(q);
      console.log('FirestoreService: Query completed. Document count:', querySnapshot.docs.length);
      
      const pendingRequests = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          console.log('FirestoreService: Processing document:', docSnapshot.id, 'Status:', data.status);
          
          // Get book details
          let bookTitle = 'Unknown Book';
          let bookAuthor = 'Unknown Author';
          if (data.bookId) {
            try {
              const bookRef = doc(db, 'books', data.bookId);
              const bookDoc = await getDoc(bookRef);
              if (bookDoc.exists()) {
                const bookData = bookDoc.data();
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
                const userData = userDoc.data();
                userName = userData.name || userName;
                userEmail = userData.email || userEmail;
              }
            } catch (error) {
              console.warn(`Could not fetch user details for ID: ${data.userId}`);
            }
          }

          const processedRequest: BorrowRequest = {
            id: docSnapshot.id,
            bookId: data.bookId,
            bookTitle,
            bookAuthor,
            userId: data.userId,
            userName,
            userEmail,
            status: data.status,
            timeStamp: data.timeStamp?.toDate() || new Date(),
            isReturned: false
          };
          
          console.log('FirestoreService: Processed request:', processedRequest);
          return processedRequest;
        })
      );

      console.log('FirestoreService: Final result count:', pendingRequests.length);
      return pendingRequests;
    } catch (error) {
      console.error('FirestoreService: Error in getPendingBorrowRequests:', error);
      throw error;
    }
  }

  // Approve book request with Firebase transaction logic
  static async approveBookRequest(requestId: string, bookId: string): Promise<boolean> {
    const requestRef = doc(db, 'lending_requests', requestId);
    const bookRef = doc(db, 'books', bookId);

    try {
      await runTransaction(db, async (transaction) => {
        // --- ALL READS MUST BE AT THE BEGINNING OF THE TRANSACTION ---
        const bookSnap = await transaction.get(bookRef);
        const requestSnap = await transaction.get(requestRef);
        
        // Ensure userId is read here if used by transaction operations later
        const requestData = requestSnap.data();
        const userId = requestData?.userId;

        // Throw exception if critical documents are missing
        if (!bookSnap.exists()) throw new Error("Book not found for approval.");
        if (!requestSnap.exists()) throw new Error("Lending request not found for approval.");
        if (!userId) throw new Error("User ID not found in request for approval.");

        const bookData = bookSnap.data();
        const currentCount = bookData?.count ?? 0;
        const bookTitle = bookData?.title ?? 'Unknown Book'; // Get title inside transaction
        const now = Timestamp.now();

        if (currentCount > 0) {
          const newCount = currentCount - 1;

          // --- ALL WRITES MUST BE AFTER ALL READS ---
          transaction.update(bookRef, {
            count: newCount,
            isAvailable: newCount > 0,
          });

          transaction.update(requestRef, {
            status: 'approved',
            approvedAt: now,
            penaltyAmount: 0,
            isPaid: false,
            isReturnRequest: false, // <--- ADDED THIS LINE FOR APPROVAL
          });

          // Add alert within the transaction using transaction.set
          const alertRef = doc(collection(db, 'alerts'));
          transaction.set(alertRef, {
            userId: userId,
            bookId: bookId,
            isRead: false,
            timestamp: now,
            message: `✅ Your request for "${bookTitle}" has been approved!`,
          });
        } else {
          // If book is unavailable, delete the request
          transaction.delete(requestRef);
          throw new Error('❌ Book unavailable. Request deleted.');
        }
      });

      console.log('Request approved successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating request:', error);
      if (error.message === '❌ Book unavailable. Request deleted.') {
        return false; // Indicates book was unavailable
      }
      throw error;
    }
  }

  // Reject book request
  static async rejectBookRequest(requestId: string, bookId: string): Promise<void> {
    const requestRef = doc(db, 'lending_requests', requestId);
    const bookRef = doc(db, 'books', bookId);

    try {
      // --- REJECTED PATH (NOT A TRANSACTION) ---
      const requestSnap = await getDoc(requestRef); // Read request details
      const requestData = requestSnap.data();
      const userId = requestData?.userId;
      const bookSnap = await getDoc(bookRef);
      const bookTitle = bookSnap.data()?.title ?? 'Unknown Book'; // Read book title

      if (!requestSnap.exists() || !userId) {
        throw new Error("Lending request or user ID not found for rejection.");
      }

      await updateDoc(requestRef, {
        status: 'rejected', // 'rejected'
      });

      // Review: Decrementing 'nob' on rejection is unusual if 'nob' means 'number of books currently borrowed'.
      // It typically only decrements on return. If this is intentional for your model, keep it.
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentNob = userData?.nob ?? 0;
        if (currentNob > 0) {
          await updateDoc(userRef, { nob: currentNob - 1 });
        }
      }

      await addDoc(collection(db, 'alerts'), {
        userId: userId,
        bookId: bookId,
        isRead: false,
        timestamp: Timestamp.now(),
        message: `❌ Your request for "${bookTitle}" was rejected.`,
      });

      console.log('Request rejected successfully');
    } catch (error: any) {
      console.error('Error updating request:', error);
      throw error;
    }
  }

  // Fetch details for return requests (user name, book title, can approve status)
  static async fetchReturnRequestDetails(userId: string, bookId: string, requestData: any): Promise<{
    userName: string;
    bookTitle: string;
    canApprove: boolean;
  }> {
    let userName = 'Unknown';
    let bookTitle = 'Unknown';
    let canApprove = true;

    try {
      // Fetch user details
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        userName = userDoc.data().name || 'Unknown';
      }

      // Fetch book details
      const bookRef = doc(db, 'books', bookId);
      const bookDoc = await getDoc(bookRef);
      if (bookDoc.exists()) {
        bookTitle = bookDoc.data().title || 'Unknown';
      }

      // Check if can approve based on penalty payment
      const isPaid = requestData.isPaid === true;
      const amount = (requestData.penaltyAmount || 0);
      if (!isPaid && amount > 0) {
        canApprove = false;
      }

    } catch (error) {
      console.error('🔥 Error in fetchReturnRequestDetails:', error);
    }

    return {
      userName,
      bookTitle,
      canApprove,
    };
  }

  // Process return request (approve or reject)
  static async processReturnRequest(
    lendingRequestId: string,
    bookId: string,
    approve: boolean
  ): Promise<void> {
    const lendingRef = doc(db, 'lending_requests', lendingRequestId);
    const bookRef = doc(db, 'books', bookId);

    try {
      if (approve) {
        await runTransaction(db, async (transaction) => {
          const bookSnap = await transaction.get(bookRef);
          const requestSnap = await transaction.get(lendingRef);
          
          if (!bookSnap.exists() || !requestSnap.exists()) {
            throw new Error('Book or request not found');
          }

          const bookData = bookSnap.data();
          const requestData = requestSnap.data();
          const currentCount = bookData?.count ?? 0;
          const userId = requestData?.userId;
          const now = Timestamp.now();
          
          const userRef = doc(db, 'users', userId);
          const userSnap = await transaction.get(userRef);

          // Update book count and availability
          transaction.update(bookRef, {
            count: currentCount + 1,
            isAvailable: true,
          });

          // Update lending request
          transaction.update(lendingRef, {
            isReturned: true,
            isReturnRequest: false,
            returnRequestStatus: 'approved',
            processedAt: now,
            isPaid: true,
          });

          // Update user's book count
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const currentNob = userData?.nob ?? 0;
            if (currentNob > 0) {
              transaction.update(userRef, { nob: currentNob - 1 });
            }
          }

          const bookTitle = bookData?.title ?? 'a book';

          // Create alert - using transaction.set with generated doc ref
          const alertRef = doc(collection(db, 'alerts'));
          transaction.set(alertRef, {
            userId: userId,
            bookId: bookId,
            isRead: false,
            timestamp: now,
            message: `✅ Your return request for "${bookTitle}" has been approved!`,
          });
        });

        console.log('Return approved ✅');
      } else {
        // Rejection logic (non-transactional)
        const requestSnap = await getDoc(lendingRef);
        const requestData = requestSnap.data();
        const userId = requestData?.userId;
        
        const bookSnap = await getDoc(bookRef);
        const bookData = bookSnap.data();
        const bookTitle = bookData?.title ?? 'a book';
        const now = Timestamp.now();

        await updateDoc(lendingRef, {
          isReturnRequest: false,
          returnRequestStatus: 'rejected',
          processedAt: now,
        });

        await addDoc(collection(db, 'alerts'), {
          userId: userId,
          bookId: bookId,
          isRead: false,
          timestamp: now,
          message: `❌ Your return request for "${bookTitle}" was rejected.`,
        });

        console.log('Return request rejected ❌');
      }
    } catch (error: any) {
      console.error('❌ Error processing return:', error);
      throw new Error(`Failed: ${error.message}`);
    }
  }

  // Get pending return requests
  static async getPendingReturnRequests(): Promise<BorrowRequest[]> {
    console.log('FirestoreService: Starting getPendingReturnRequests method');
    try {
      const lendingRequestsCollection = collection(db, 'lending_requests');
      const q = query(
        lendingRequestsCollection, 
        where('status', '==', 'approved'),
        where('isReturned', '==', false),
        where('isReturnRequest', '==', true)
      );
      console.log('FirestoreService: Executing Firebase query for pending returns');
      
      const querySnapshot = await getDocs(q);
      console.log('FirestoreService: Query completed. Return request count:', querySnapshot.docs.length);
      
      const pendingReturns = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          console.log('FirestoreService: Processing return request:', docSnapshot.id, 'Status:', data.status);
          
          // Get additional details using the fetch method
          const details = await this.fetchReturnRequestDetails(data.userId, data.bookId, data);
          
          const processedRequest: BorrowRequest = {
            id: docSnapshot.id,
            bookId: data.bookId,
            bookTitle: details.bookTitle,
            bookAuthor: data.bookAuthor || 'Unknown Author',
            userId: data.userId,
            userName: details.userName,
            userEmail: data.userEmail || 'unknown@email.com',
            status: data.status,
            timeStamp: data.timeStamp?.toDate() || new Date(),
            isReturned: data.isReturned || false,
            // Add additional fields for return requests
            penaltyAmount: data.penaltyAmount || 0,
            isPaid: data.isPaid || false,
            isReturnRequest: data.isReturnRequest || false,
            canApprove: details.canApprove
          };
          
          console.log('FirestoreService: Processed return request:', processedRequest);
          return processedRequest;
        })
      );

      console.log('FirestoreService: Final return requests count:', pendingReturns.length);
      return pendingReturns;
    } catch (error) {
      console.error('FirestoreService: Error in getPendingReturnRequests:', error);
      throw error;
    }
  }

  // Get processed requests (approved/rejected) - matches Flutter logic
  static async getProcessedRequestsStream(): Promise<BorrowRequest[]> {
    try {
      const requestsCollection = collection(db, 'lending_requests');
      const q = query(
        requestsCollection,
        where('status', 'in', ['approved', 'rejected']),
        orderBy('timeStamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          bookId: data.bookId,
          userId: data.userId,
          status: data.status,
          isReturned: data.isReturned || false,
          timeStamp: data.timeStamp?.toDate() || new Date(),
          userName: '',  // Will be populated by component
          userEmail: '',  // Will be populated by component
          bookTitle: '',  // Will be populated by component
          bookAuthor: '',  // Will be populated by component
          dueDate: data.dueDate?.toDate(),
          borrowDate: data.borrowDate?.toDate(),
          returnDate: data.returnDate?.toDate(),
          penaltyAmount: data.penaltyAmount || 0,
          isPaid: data.isPaid || false,
          isReturnRequest: data.isReturnRequest || false,
          canApprove: false
        } as BorrowRequest;
      });
    } catch (error) {
      console.error('Error fetching processed requests:', error);
      throw error;
    }
  }

  // Get borrow requests for a specific user
  static async getUserBorrowRequests(userId: string): Promise<BorrowRequest[]> {
    try {
      console.log('Fetching borrow requests for userId:', userId);
      
      // First, let's try to get all requests and filter client-side to avoid index issues
      const requestsCollection = collection(db, 'lending_requests');
      const snapshot = await getDocs(requestsCollection);
      
      console.log('Total documents in lending_requests:', snapshot.docs.length);
      
      const userRequests = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // Check if this request belongs to the user
        if (data.userId === userId) {
          console.log('Found matching request for user:', data);
          
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
          
          const request = {
            id: docSnapshot.id,
            bookId: data.bookId,
            userId: data.userId,
            status: data.status || 'pending',
            isReturned: data.isReturned || false,
            timeStamp: data.timeStamp?.toDate() || new Date(),
            userName: '', 
            userEmail: '', 
            bookTitle,
            bookAuthor,
            dueDate: data.dueDate?.toDate(),
            borrowDate: data.borrowDate?.toDate(),
            returnDate: data.returnDate?.toDate(),
            penaltyAmount: data.penaltyAmount || 0,
            isPaid: data.isPaid || false,
            isReturnRequest: data.isReturnRequest || false,
            canApprove: false,
            processedAt: data.processedAt?.toDate()
          } as BorrowRequest;
          
          userRequests.push(request);
        }
      }
      
      // Sort by timestamp, newest first
      userRequests.sort((a, b) => new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime());
      
      console.log('Found', userRequests.length, 'requests for user:', userId);
      console.log('Final requests array:', userRequests);
      return userRequests;
    } catch (error) {
      console.error('Error fetching user borrow requests:', error);
      throw error;
    }
  }

  // Generic methods for penalty management
  static onSnapshot(
    collectionName: string,
    filters: Array<{ field: string; operator: any; value: any }> = [],
    orderByFields: Array<{ field: string; direction: 'asc' | 'desc' }> = [],
    onSuccess: (docs: any[]) => void,
    onError: (error: Error) => void
  ): () => void {
    try {
      const collectionRef = collection(db, collectionName);
      let q = query(collectionRef);

      // Apply filters
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      // Apply ordering
      orderByFields.forEach(orderField => {
        q = query(q, orderBy(orderField.field, orderField.direction));
      });

      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          data: () => doc.data()
        }));
        onSuccess(docs);
      }, onError);
    } catch (error) {
      onError(error as Error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  static async updateDocument(collectionName: string, documentId: string, updates: Record<string, any>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }
}
