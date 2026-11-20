import {
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../core/services/auth';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private authService = inject(AuthService);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  themeService = inject(ThemeService);

  email = '';
  password = '';

  errorMessage = '';
  successMessage = '';
  loading = false;
  isResetMode = false;

  login() {

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    this.authService
      .login(this.email, this.password)
      .then(() => {

        this.loading = false;

        this.router.navigate(['/admin/dashboard']);

      })
      .catch((error: any) => {

        console.error(error);

        this.loading = false;

        this.errorMessage = error.code === 'auth/api-key-not-valid'
          ? 'Firebase configuration error: the API key is invalid or restricted.'
          : 'Invalid email or password. Please try again.';
      })
      .finally(() => {
        this.changeDetector.markForCheck();
      });
  }

  async resetPassword(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.email.trim();
    if (!email) {
      this.errorMessage = 'Enter your email address to request a password reset.';
      return;
    }

    this.loading = true;

    try {
      await this.authService.requestPasswordReset(email);
      this.successMessage =
        'If an account exists for this email, a password reset link will be sent.';
    } catch (error) {
      console.error('Password reset request failed:', error);

      const code = (error as { code?: string }).code;
      this.errorMessage = code === 'auth/invalid-email'
        ? 'Enter a valid email address.'
        : 'Unable to request a password reset right now. Please try again.';
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }

  showLogin(): void {
    this.isResetMode = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  showPasswordReset(): void {
    this.isResetMode = true;
    this.errorMessage = '';
    this.successMessage = '';
  }
}