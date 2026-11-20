
import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where
} from 'firebase/firestore';

import { Observable } from 'rxjs';

import { db } from '../../firebase';

export interface Review {
  id?: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {

  private firestore = db;

  private reviewsCollection = collection(
    this.firestore,
    'reviews'
  );

  // All reviews: for the admin dashboard
  getReviews(): Observable<Review[]> {
    return new Observable((observer) => {
      const unsubscribe = onSnapshot(
        this.reviewsCollection,
        (snapshot) => {
          observer.next(
            snapshot.docs.map((item) => ({
              id: item.id,
              ...(item.data() as Review)
            }))
          );
        },
        (error) => observer.error(error)
      );

      return unsubscribe;
    });
  }

  // Approved reviews only: for the public website
  getApprovedReviews(): Observable<Review[]> {
    const approvedQuery = query(
      this.reviewsCollection,
      where('status', '==', 'approved')
    );

    return new Observable((observer) => {
      const unsubscribe = onSnapshot(
        approvedQuery,
        (snapshot) => {
          observer.next(
            snapshot.docs.map((item) => ({
              id: item.id,
              ...(item.data() as Review)
            }))
          );
        },
        (error) => observer.error(error)
      );

      return unsubscribe;
    });
  }

  // Submit a customer review
  addReview(review: Review) {
    return addDoc(
      this.reviewsCollection,
      review
    );
  }

  // Update a review: admin use
  updateReview(
    id: string,
    review: Partial<Review>
  ) {
    const reviewDoc = doc(
      this.firestore,
      'reviews',
      id
    );

    return updateDoc(reviewDoc, review);
  }

  // Delete a review: admin use
  deleteReview(id: string) {
    const reviewDoc = doc(
      this.firestore,
      'reviews',
      id
    );

    return deleteDoc(reviewDoc);
  }
}
