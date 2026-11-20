import {
  ChangeDetectorRef,
  Component,
  NgZone,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  RouterModule
} from '@angular/router';

import {
  ServicesService,
  ServiceItem
} from '../../core/services/services';

import {
  ReviewsService,
  Review
} from '../../core/services/reviews';

import {
  ContactsService,
  ContactMessage
} from '../../core/services/contacts';


@Component({
  selector: 'app-dashboard',

  standalone: true,

  imports: [
    CommonModule,
    RouterModule
  ],

  templateUrl: './dashboard.html',

  styleUrl: './dashboard.css'
})
export class Dashboard {

  private servicesService =
    inject(ServicesService);

  private reviewsService =
    inject(ReviewsService);

  private contactsService =
    inject(ContactsService);

  private ngZone =
    inject(NgZone);

  private changeDetector =
    inject(ChangeDetectorRef);


  // =========================================
  // STATISTICS
  // =========================================

  totalServices = 0;

  activeServices = 0;

  inactiveServices = 0;

  totalReviews = 0;

  pendingReviews = 0;

  totalMessages = 0;


  // =========================================
  // RECENT REVIEWS
  // =========================================

  recentReviews: Review[] = [];


  // =========================================
  // LOADING
  // =========================================

  loading = true;

  errorMessage = '';


  constructor() {

    this.loadDashboard();

  }


  // =========================================
  // LOAD DASHBOARD
  // =========================================

  loadDashboard(): void {

    this.loading = true;

    this.errorMessage = '';


    // =======================================
    // SERVICES
    // =======================================

    this.servicesService
      .getServices()
      .subscribe({

        next: (services: ServiceItem[]) => {

          this.ngZone.run(() => {

            this.totalServices =
              services.length;


            this.activeServices =
              services.filter(
                service =>
                  service.status === 'active'
              ).length;


            this.inactiveServices =
              services.filter(
                service =>
                  service.status === 'inactive'
              ).length;


            this.loading = false;

            this.changeDetector.markForCheck();

          });

        },

        error: (error) => {

          console.error(
            'DASHBOARD: Services error:',
            error
          );

          this.ngZone.run(() => {

            this.errorMessage =
              'Unable to load service statistics.';

            this.loading = false;

            this.changeDetector.markForCheck();

          });

        }

      });


    // =======================================
    // REVIEWS
    // =======================================

    this.reviewsService
      .getReviews()
      .subscribe({

        next: (reviews: Review[]) => {

          this.ngZone.run(() => {

            this.totalReviews =
              reviews.length;


            this.pendingReviews =
              reviews.filter(
                review =>
                  review.status === 'pending'
              ).length;


            this.recentReviews =
              [...reviews]
                .sort(
                  (a, b) =>
                    this.getTime(b.createdAt) -
                    this.getTime(a.createdAt)
                )
                .slice(0, 5);


            this.changeDetector.markForCheck();

          });

        },

        error: (error) => {

          console.error(
            'DASHBOARD: Reviews error:',
            error
          );

          this.ngZone.run(() => {

            this.errorMessage =
              'Unable to load review statistics.';

            this.changeDetector.markForCheck();

          });

        }

      });


    // =======================================
    // CONTACT MESSAGES
    // =======================================

    this.contactsService
      .getMessages()
      .subscribe({

        next: (messages: ContactMessage[]) => {

          this.ngZone.run(() => {

            this.totalMessages =
              messages.length;


            this.changeDetector.markForCheck();

          });

        },

        error: (error) => {

          console.error(
            'DASHBOARD: Messages error:',
            error
          );

          this.ngZone.run(() => {

            this.errorMessage =
              'Unable to load message statistics.';

            this.changeDetector.markForCheck();

          });

        }

      });

  }


  // =========================================
  // DATE
  // =========================================

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


  // =========================================
  // DATE SORTING
  // =========================================

  private getTime(date: any): number {

    if (!date) {

      return 0;

    }


    try {

      if (date?.toDate) {

        return date
          .toDate()
          .getTime();

      }


      return new Date(date)
        .getTime();

    } catch {

      return 0;

    }

  }


  // =========================================
  // STARS
  // =========================================

  getStars(rating: number): string {

    const value =
      Math.max(
        0,
        Math.min(
          5,
          rating || 0
        )
      );


    return '★'.repeat(value);

  }

}