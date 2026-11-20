import {
  ChangeDetectorRef,
  Component,
  NgZone,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ReviewsService,
  Review
} from '../../core/services/reviews';

@Component({
  selector: 'app-reviews',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './reviews.html',
  styleUrl: './reviews.css'
})
export class Reviews {

  private reviewsService = inject(ReviewsService);
  private ngZone = inject(NgZone);
  private changeDetector = inject(ChangeDetectorRef);

  reviews: Review[] = [];
  filteredReviews: Review[] = [];

  loading = true;

  message = '';
  errorMessage = '';

  searchText = '';
  selectedStatus = 'all';
  selectedRating = 'all';


  constructor() {
    this.loadReviews();
  }


  loadReviews(): void {

    console.log('REVIEWS: loadReviews() started');

    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.reviewsService.getReviews().subscribe({

      next: (data) => {

        console.log('REVIEWS: Firestore returned:', data);

        this.ngZone.run(() => {

          this.reviews = data || [];

          this.filteredReviews = [...this.reviews];

          this.loading = false;
          this.changeDetector.markForCheck();

          console.log(
            'REVIEWS: loading:',
            this.loading
          );

          console.log(
            'REVIEWS: reviews:',
            this.reviews
          );

        });

      },

      error: (error) => {

        console.error(
          'REVIEWS: Firestore error:',
          error
        );

        this.ngZone.run(() => {

          this.reviews = [];
          this.filteredReviews = [];

          this.errorMessage =
            'Unable to load reviews.';

          this.loading = false;
          this.changeDetector.markForCheck();

        });

      }

    });
  }


  searchReviews(): void {

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    this.filteredReviews =
      this.reviews.filter((review) => {

        const matchesSearch =
          !search ||
          (review.customerName || '')
            .toLowerCase()
            .includes(search) ||
          (review.comment || '')
            .toLowerCase()
            .includes(search);


        const matchesStatus =
          this.selectedStatus === 'all' ||
          review.status === this.selectedStatus;


        const matchesRating =
          this.selectedRating === 'all' ||
          review.rating ===
          Number(this.selectedRating);


        return (
          matchesSearch &&
          matchesStatus &&
          matchesRating
        );

      });
  }


  clearFilters(): void {

    this.searchText = '';

    this.selectedStatus = 'all';

    this.selectedRating = 'all';

    this.filteredReviews = [
      ...this.reviews
    ];
  }


  formatDate(date: any): string {

    if (!date) {
      return '-';
    }

    try {

      if (date?.toDate) {
        return date
          .toDate()
          .toLocaleDateString();
      }

      return new Date(date)
        .toLocaleDateString();

    } catch {

      return '-';

    }
  }


  getStars(rating: number): string {

    return '★'.repeat(
      rating || 0
    );
  }


  approveReview(review: Review): void {

    if (!review.id) {
      return;
    }

    this.message = '';
    this.errorMessage = '';

    this.reviewsService
      .updateReview(
        review.id,
        {
          status: 'approved'
        }
      )
      .then(() => {

        this.ngZone.run(() => {

          this.message =
            'Review approved successfully.';

          this.loadReviews();

        });

      })
      .catch((error) => {

        console.error(error);

        this.ngZone.run(() => {

          this.errorMessage =
            'Unable to approve review.';

        });

      });
  }


  rejectReview(review: Review): void {

    if (!review.id) {
      return;
    }

    this.message = '';
    this.errorMessage = '';

    this.reviewsService
      .updateReview(
        review.id,
        {
          status: 'rejected'
        }
      )
      .then(() => {

        this.ngZone.run(() => {

          this.message =
            'Review rejected successfully.';

          this.loadReviews();

        });

      })
      .catch((error) => {

        console.error(error);

        this.ngZone.run(() => {

          this.errorMessage =
            'Unable to reject review.';

        });

      });
  }

  deleteReview(review: Review): void {
    if (!review.id) {
      return;
    }

    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    this.message = '';
    this.errorMessage = '';

    this.reviewsService
      .deleteReview(review.id)
      .then(() => {
        this.ngZone.run(() => {
          this.message = 'Review deleted successfully.';
          this.loadReviews();
        });
      })
      .catch((error) => {
        console.error('Unable to delete review:', error);

        this.ngZone.run(() => {
          this.errorMessage = 'Unable to delete review.';
        });
      });
  }

}