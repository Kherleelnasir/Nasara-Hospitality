import { Injectable } from '@angular/core';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';

import { Observable } from 'rxjs';

import { auth } from '../../firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authInstance = auth;

  login(email: string, password: string) {
    return signInWithEmailAndPassword(
      this.authInstance,
      email,
      password
    );
  }

  requestPasswordReset(email: string) {
    return sendPasswordResetEmail(this.authInstance, email);
  }

  logout() {
    return signOut(this.authInstance);
  }

  getCurrentUser(): User | null {
    return this.authInstance.currentUser;
  }

  getAuthState(): Observable<User | null> {
    return new Observable((observer) => {
      const unsubscribe = onAuthStateChanged(
        this.authInstance,
        (user: User | null) => {
          observer.next(user);
        }
      );

      return unsubscribe;
    });
  }
}