import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';

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

import { ThemeService } from '../../core/services/theme.service';
import { db } from '../../firebase';

interface HomeService {
  id: string;
  name: string;
  title?: string;
  description: string;
  imageUrl: string;
  imageLoadError?: boolean;
  status?: string;
}

interface LeadershipMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  imageUrl: string;
  order: number;
  status?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  private servicesService = inject(ServicesService);
  private reviewsService = inject(ReviewsService);
  private contactsService = inject(ContactsService);
  themeService = inject(ThemeService);

  // BUSINESS INFORMATION

  businessName = '';
  businessShortDescription = '';
  businessDescription = '';

  businessPhone = '';
  businessWhatsapp = '';
  businessEmail = '';
  businessWebsite = '';

  businessCountry = '';
  businessState = '';
  businessCity = '';
  businessAddress = '';

  businessOpeningTime = '';
  businessClosingTime = '';

  facebook = '';
  instagram = '';
  tiktok = '';
  twitter = '';
  youtube = '';

  get description(): string {
    return this.businessDescription;
  }

  get phone(): string {
    return this.businessPhone;
  }

  get whatsapp(): string {
    return this.businessWhatsapp;
  }

  get email(): string {
    return this.businessEmail;
  }

  get website(): string {
    return this.businessWebsite;
  }

  get address(): string {
    return this.businessAddress;
  }

  get city(): string {
    return this.businessCity;
  }

  get state(): string {
    return this.businessState;
  }

  get country(): string {
    return this.businessCountry;
  }

  get openingTime(): string {
    return this.businessOpeningTime;
  }

  get closingTime(): string {
    return this.businessClosingTime;
  }

  get whatsappLink(): string {
    const number = this.businessWhatsapp.replace(/\D/g, '');

    return number ? `https://wa.me/${number}` : '';
  }

  get hasSocialLinks(): boolean {
    return Boolean(
      this.facebook ||
      this.instagram ||
      this.tiktok ||
      this.twitter ||
      this.youtube
    );
  }

  // SERVICES

  services: HomeService[] = [];
  servicesLoading = true;

  // REVIEWS

  approvedReviews: Review[] = [];
  reviewsLoading = true;

  reviewForm = {
    customerName: '',
    rating: 0,
    comment: ''
  };

  readonly ratingOptions = [1, 2, 3, 4, 5];

  reviewSubmitting = false;
  reviewSuccess = '';
  reviewError = '';

  // LEADERSHIP TEAM

  leadershipTeam: LeadershipMember[] = [];
  leadershipLoading = true;

  // CONTACT FORM

  contactForm: ContactMessage = {
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  formLoading = false;
  formSuccess = '';
  formError = '';

  // FOOTER

  currentYear = new Date().getFullYear();

  // INITIALIZE

  ngOnInit(): void {
    this.loadBusinessInformation();
    this.loadServices();
    this.loadReviews();
    this.loadLeadershipTeam();
  }

  // CAROUSEL NAVIGATION

  scrollCarousel(
    carouselId: string,
    direction: number
  ): void {
    const carousel = document.getElementById(carouselId);

    if (!carousel) {
      return;
    }

    const firstCard = carousel.querySelector<HTMLElement>(
      '.service-card, .review-card, .team-card'
    );

    if (!firstCard) {
      return;
    }

    const carouselStyles = window.getComputedStyle(carousel);

    const gapValue =
      carouselStyles.columnGap ||
      carouselStyles.gap ||
      '0px';

    const gap = Number.parseFloat(gapValue) || 0;
    const cardWidth = firstCard.getBoundingClientRect().width;

    carousel.scrollBy({
      left: direction * (cardWidth + gap),
      behavior: 'smooth'
    });
  }

  // LOAD BUSINESS INFORMATION

  async loadBusinessInformation(): Promise<void> {
    try {
      const businessReference = doc(
        db,
        'businessInformation',
        'main'
      );

      const snapshot = await getDoc(businessReference);

      if (!snapshot.exists()) {
        console.warn(
          'Business information document does not exist.'
        );
        return;
      }

      const data = snapshot.data();

      this.businessName = data['businessName'] || '';
      this.businessShortDescription =
        data['shortDescription'] || '';
      this.businessDescription = data['description'] || '';

      this.businessPhone = data['phone'] || '';
      this.businessWhatsapp = data['whatsapp'] || '';
      this.businessEmail = data['email'] || '';
      this.businessWebsite = data['website'] || '';

      this.businessCountry = data['country'] || '';
      this.businessState = data['state'] || '';
      this.businessCity = data['city'] || '';
      this.businessAddress = data['address'] || '';

      this.businessOpeningTime = data['openingTime'] || '';
      this.businessClosingTime = data['closingTime'] || '';

      this.facebook = data['facebook'] || '';
      this.instagram = data['instagram'] || '';
      this.tiktok = data['tiktok'] || '';
      this.twitter = data['twitter'] || '';
      this.youtube = data['youtube'] || '';

    } catch (error) {
      console.error(
        'Error loading business information:',
        error
      );
    } finally {
      this.cdr.markForCheck();
    }
  }

  // LOAD SERVICES FROM FIRESTORE

  loadServices(): void {
    this.servicesLoading = true;

    this.servicesService.getServices().subscribe({
      next: (items: ServiceItem[]) => {
        console.log(
          'Services received from Firestore:',
          items
        );

        this.services = items
          .filter(item => item.status !== 'inactive')
          .map((item, index): HomeService => {
            const raw = item as ServiceItem & {
              name?: string;
              serviceName?: string;
              image?: string;
              photoUrl?: string;
              shortDescription?: string;
            };

            const imageUrl = (
              raw.imageUrl ||
              raw.image ||
              raw.photoUrl ||
              ''
            ).trim();

            return {
              id: String(raw.id || index),
              name:
                raw.title ||
                raw.name ||
                raw.serviceName ||
                'Our Service',
              title: raw.title || '',
              description:
                raw.description ||
                raw.shortDescription ||
                '',
              imageUrl,
              imageLoadError: false,
              status: raw.status || 'active'
            };
          });

        console.log(
          'Services prepared for home page:',
          this.services
        );

        this.servicesLoading = false;
        this.cdr.markForCheck();
      },

      error: (error: unknown) => {
        console.error('Error loading services:', error);

        this.services = [];
        this.servicesLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // HANDLE SERVICE IMAGE ERRORS

  onServiceImageError(service: HomeService): void {
    console.error(
      'Unable to display service image:',
      service.name,
      service.imageUrl
    );

    service.imageLoadError = true;
    this.cdr.markForCheck();
  }

  // LOAD APPROVED REVIEWS

  loadReviews(): void {
    this.reviewsLoading = true;

    this.reviewsService.getApprovedReviews().subscribe({
      next: (reviews) => {
        this.approvedReviews = [...reviews].sort(
          (a, b) =>
            this.getTimestamp(b.createdAt) -
            this.getTimestamp(a.createdAt)
        );

        this.reviewsLoading = false;
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Error loading reviews:', error);

        this.approvedReviews = [];
        this.reviewsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // SELECT STAR RATING

  selectRating(rating: number): void {
    this.reviewForm.rating = rating;
    this.reviewError = '';
    this.reviewSuccess = '';
  }

  // SUBMIT CUSTOMER REVIEW

  async submitReview(): Promise<void> {
    this.reviewSuccess = '';
    this.reviewError = '';

    const customerName =
      this.reviewForm.customerName.trim();

    const comment =
      this.reviewForm.comment.trim();

    const rating = this.reviewForm.rating;

    if (
      !customerName ||
      !comment ||
      rating < 1 ||
      rating > 5
    ) {
      this.reviewError =
        'Please enter your name, select a star rating, and write your review.';
      return;
    }

    if (
      customerName.length > 100 ||
      comment.length > 2000
    ) {
      this.reviewError =
        'Your name must be at most 100 characters and your review at most 2,000 characters.';
      return;
    }

    this.reviewSubmitting = true;

    try {
      await this.reviewsService.addReview({
        customerName,
        rating,
        comment,
        status: 'pending',
        createdAt: new Date()
      });

      this.reviewForm = {
        customerName: '',
        rating: 0,
        comment: ''
      };

      this.reviewSuccess =
        'Thank you! Your review has been submitted for approval.';

    } catch (error) {
      console.error(
        'Error submitting customer review:',
        error
      );

      this.reviewError =
        'Unable to submit your review. Please try again.';
    } finally {
      this.reviewSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  // REVIEW INITIAL

  getInitial(name: string | undefined): string {
    return name?.trim()
      ? name.trim().charAt(0).toUpperCase()
      : 'C';
  }

  // REVIEW STARS

  getStars(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(star => star <= rating);
  }

  // TIMESTAMP

  getTimestamp(timestamp: any): number {
    if (!timestamp) {
      return 0;
    }

    try {
      if (typeof timestamp?.toDate === 'function') {
        return timestamp.toDate().getTime();
      }

      if (timestamp instanceof Date) {
        return timestamp.getTime();
      }

      if (typeof timestamp === 'number') {
        return timestamp;
      }

      const parsed = new Date(timestamp).getTime();

      return Number.isNaN(parsed) ? 0 : parsed;

    } catch {
      return 0;
    }
  }

  // DISPLAY REVIEW DATE

  getTime(timestamp: any): string {
    const time = this.getTimestamp(timestamp);

    if (!time) {
      return '';
    }

    return new Date(time).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // LOAD PUBLISHED TEAM MEMBERS

  async loadLeadershipTeam(): Promise<void> {
    this.leadershipLoading = true;

    try {
      const teamCollection = collection(db, 'teamMembers');

      const publishedTeamQuery = query(
        teamCollection,
        where('published', '==', true)
      );

      const snapshot = await getDocs(publishedTeamQuery);

      this.leadershipTeam = snapshot.docs
        .map(item => {
          const data = item.data();

          return {
            id: item.id,
            name: data['fullName'] || '',
            position: data['position'] || '',
            bio: data['biography'] || '',
            imageUrl: data['photoUrl'] || '',
            order: Number(data['displayOrder'] ?? 0),
            status: data['published'] === true
              ? 'active'
              : 'inactive'
          };
        })
        .filter(member => Boolean(member.name))
        .sort((a, b) => a.order - b.order);

      console.log(
        'Published team members loaded:',
        this.leadershipTeam
      );

    } catch (error) {
      console.error(
        'Error loading published team members:',
        error
      );

      this.leadershipTeam = [];

    } finally {
      this.leadershipLoading = false;
      this.cdr.markForCheck();
    }
  }

  // SUBMIT CONTACT FORM

  async submitContactForm(): Promise<void> {
    this.formSuccess = '';
    this.formError = '';

    const fullName = this.contactForm.fullName.trim();
    const email = this.contactForm.email.trim();
    const phone = this.contactForm.phone.trim();
    const subject = this.contactForm.subject.trim();
    const message = this.contactForm.message.trim();

    if (!fullName || !email || !subject || !message) {
      this.formError =
        'Please fill in all required fields.';
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      this.formError =
        'Please enter a valid email address.';
      return;
    }

    this.formLoading = true;

    try {
      await this.contactsService.addMessage({
        fullName,
        email,
        phone,
        subject,
        message,
        createdAt: new Date()
      });

      this.contactForm = {
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      };

      this.formSuccess =
        'Your message has been sent successfully. Thank you for contacting us!';

    } catch (error) {
      console.error(
        'Error sending contact message:',
        error
      );

      this.formError =
        'Unable to send your message. Please try again.';
    } finally {
      this.formLoading = false;
      this.cdr.markForCheck();
    }
  }
}