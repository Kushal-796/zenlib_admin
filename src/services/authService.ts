import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';

export class AuthService {
  static async login(email: string, password: string) {
    try {
      // Additional security check - only allow specific admin email
      if (email !== 'kushal23241a05c7@grietcollege.com') {
        throw new Error('Access denied. Unauthorized email address.');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async logout() {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}
