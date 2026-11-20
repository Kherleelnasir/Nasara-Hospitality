
import {
  Component,
  inject,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import {
  onAuthStateChanged,
  Unsubscribe
} from 'firebase/auth';

import {
  doc,
  onSnapshot
} from 'firebase/firestore';

import { auth, db } from '../../firebase';

import { AuthService } from '../../core/services/auth';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnDestroy {

  private authService = inject(AuthService);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);

  themeService = inject(ThemeService);

  adminDropdownOpen = false;

  profilePhotoUrl = '';
  adminName = 'Admin';
  adminInitial = 'A';

  private authUnsubscribe?: Unsubscribe;
  private profileUnsubscribe?: Unsubscribe;

  constructor() {

    this.authUnsubscribe = onAuthStateChanged(
      auth,
      (user) => {

        this.profileUnsubscribe?.();
        this.profileUnsubscribe = undefined;

        this.profilePhotoUrl = '';
        this.adminName = 'Admin';
        this.adminInitial = 'A';

        if (!user) {
          this.changeDetector.markForCheck();
          return;
        }

        // Use email as a fallback name
        this.adminName = user.email?.split('@')[0] || 'Admin';
        this.adminInitial = this.adminName.charAt(0).toUpperCase();

        // Listen to the administrator's Firestore profile
        const profileRef = doc(db, 'adminProfiles', user.uid);

        this.profileUnsubscribe = onSnapshot(
          profileRef,
          (snapshot) => {

            if (snapshot.exists()) {

              const data = snapshot.data();

              this.profilePhotoUrl =
                data['profilePhotoUrl'] || '';

              const firstName = data['firstName'] || '';
              const lastName = data['lastName'] || '';

              const fullName = `${firstName} ${lastName}`.trim();

              if (fullName) {
                this.adminName = fullName;
              }

              this.adminInitial =
                this.adminName.charAt(0).toUpperCase() || 'A';

            }

            this.changeDetector.markForCheck();

          },
          (error) => {
            console.error('Unable to load admin profile:', error);
            this.changeDetector.markForCheck();
          }
        );

      }
    );

  }

  toggleAdminDropdown(event: Event): void {
    event.stopPropagation();
    this.adminDropdownOpen = !this.adminDropdownOpen;
  }

  closeAdminDropdown(): void {
    this.adminDropdownOpen = false;
  }

  get pageTitle(): string {

    const url = this.router.url;

    if (url.includes('/admin/dashboard')) return 'Dashboard';
    if (url.includes('/admin/services')) return 'Manage Services';
    if (url.includes('/admin/reviews')) return 'Customer Reviews';
    if (url.includes('/admin/messages')) return 'Customer Messages';
    if (url.includes('/admin/business-information')) return 'Business Information';
    if (url.includes('/admin/manage-team')) return 'Manage Our Team';
    if (url.includes('/admin/admin-profile')) return 'Admin Profile';

    return 'Admin Panel';
  }

  get pageDescription(): string {

    const url = this.router.url;

    if (url.includes('/admin/dashboard')) {
      return "Welcome back, Admin. Here's an overview of your hospitality website.";
    }

    if (url.includes('/admin/services')) {
      return 'Add, update and manage your hospitality services.';
    }

    if (url.includes('/admin/reviews')) {
      return 'View and manage customer feedback and reviews.';
    }

    if (url.includes('/admin/messages')) {
      return 'View and respond to messages from your customers.';
    }

    if (url.includes('/admin/business-information')) {
      return 'Manage your hospitality business information and contact details.';
    }

    if (url.includes('/admin/manage-team')) {
      return 'Add, edit and manage your team members.';
    }

    if (url.includes('/admin/admin-profile')) {
      return 'Manage your administrator account and profile settings.';
    }

    return 'Manage your hospitality website.';
  }

  logout(): void {

    this.closeAdminDropdown();

    this.authService.logout().then(() => {
      this.router.navigate(['/admin/login']);
    });

  }

  ngOnDestroy(): void {
    this.authUnsubscribe?.();
    this.profileUnsubscribe?.();
  }

}
