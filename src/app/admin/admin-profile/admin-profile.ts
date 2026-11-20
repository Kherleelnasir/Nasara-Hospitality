
import {
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  updatePassword,
  User
} from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

import { auth, db } from '../../firebase';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-profile.html',
  styleUrl: './admin-profile.css'
})
export class AdminProfile {
  private readonly changeDetector = inject(ChangeDetectorRef);

  currentUser: User | null = null;

  // Profile picture
  profilePhotoUrl = '';
  photoPreview = '';
  selectedPhoto: File | null = null;
  photoSaving = false;

  // Personal information
  firstName = '';
  lastName = '';
  phone = '';
  country = '';
  state = '';
  city = '';
  zipCode = '';
  address = '';

  // Password
  newPassword = '';
  confirmPassword = '';

  saving = false;
  savingProfile = false;

  message = '';
  errorMessage = '';

  private readonly cloudName = 'ttlnuq35';
  private uploadPreset = 'admin_profile_photos';

  constructor() {
    this.currentUser = auth.currentUser;

    if (this.currentUser) {
      void this.loadProfile(this.currentUser);
    }
  }

  private async loadProfile(user: User): Promise<void> {
    try {
      const profileRef = doc(db, 'adminProfiles', user.uid);
      const snapshot = await getDoc(profileRef);

      if (snapshot.exists()) {
        const data = snapshot.data();

        this.profilePhotoUrl = data['profilePhotoUrl'] || '';
        this.firstName = data['firstName'] || '';
        this.lastName = data['lastName'] || '';
        this.phone = data['phone'] || '';
        this.country = data['country'] || '';
        this.state = data['state'] || '';
        this.city = data['city'] || '';
        this.zipCode = data['zipCode'] || '';
        this.address = data['address'] || '';
      }
    } catch (error) {
      console.error('Unable to load administrator profile:', error);
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.message = '';
    this.errorMessage = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'The image must not exceed 5 MB.';
      input.value = '';
      return;
    }

    this.releasePhotoPreview();

    this.selectedPhoto = file;
    this.photoPreview = URL.createObjectURL(file);
  }

  async uploadProfilePhoto(): Promise<void> {
    this.message = '';
    this.errorMessage = '';

    const user = auth.currentUser;

    if (!user) {
      this.errorMessage = 'Please log in before updating your profile.';
      return;
    }

    if (!this.selectedPhoto) {
      this.errorMessage = 'Please select an image first.';
      return;
    }

    this.photoSaving = true;

    try {
      const formData = new FormData();
      formData.append('file', this.selectedPhoto);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', 'admin-profiles');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const result = await response.json();

      if (!response.ok || !result.secure_url) {
        throw new Error(
          result.error?.message || 'Cloudinary image upload failed.'
        );
      }

      const imageUrl: string = result.secure_url;

      await setDoc(
        doc(db, 'adminProfiles', user.uid),
        {
          uid: user.uid,
          email: user.email || '',
          profilePhotoUrl: imageUrl,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      this.profilePhotoUrl = imageUrl;
      this.selectedPhoto = null;
      this.releasePhotoPreview();

      this.message = 'Profile picture updated successfully.';
    } catch (error) {
      console.error('Profile picture upload failed:', error);

      this.errorMessage = error instanceof Error
        ? error.message
        : 'Unable to upload the profile picture.';
    } finally {
      this.photoSaving = false;
      this.changeDetector.markForCheck();
    }
  }

  cancelPhotoSelection(): void {
    this.selectedPhoto = null;
    this.releasePhotoPreview();
    this.message = '';
    this.errorMessage = '';
  }

  private releasePhotoPreview(): void {
    if (this.photoPreview) {
      URL.revokeObjectURL(this.photoPreview);
      this.photoPreview = '';
    }
  }

  async saveProfile(): Promise<void> {
    this.message = '';
    this.errorMessage = '';

    const user = auth.currentUser;

    if (!user) {
      this.errorMessage = 'Please log in before saving your profile.';
      return;
    }

    this.savingProfile = true;

    try {
      await setDoc(
        doc(db, 'adminProfiles', user.uid),
        {
          uid: user.uid,
          email: user.email || '',
          firstName: this.firstName.trim(),
          lastName: this.lastName.trim(),
          phone: this.phone.trim(),
          country: this.country.trim(),
          state: this.state.trim(),
          city: this.city.trim(),
          zipCode: this.zipCode.trim(),
          address: this.address.trim(),
          profilePhotoUrl: this.profilePhotoUrl,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      this.message = 'Profile information saved successfully.';
    } catch (error) {
      console.error('Unable to save profile:', error);
      this.errorMessage =
        'Unable to save profile information. Check your Firestore rules.';
    } finally {
      this.savingProfile = false;
      this.changeDetector.markForCheck();
    }
  }

  changePassword(): void {
    this.message = '';
    this.errorMessage = '';

    const user = auth.currentUser;

    if (!user) {
      this.errorMessage = 'No administrator is currently logged in.';
      return;
    }

    if (!this.newPassword) {
      this.errorMessage = 'Please enter a new password.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must contain at least 6 characters.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.saving = true;

    updatePassword(user, this.newPassword)
      .then(() => {
        this.message = 'Password changed successfully.';
        this.newPassword = '';
        this.confirmPassword = '';
      })
      .catch((error) => {
        console.error(error);

        this.errorMessage =
          error.code === 'auth/requires-recent-login'
            ? 'For security, log out and log in again before changing your password.'
            : 'Unable to change password.';
      })
      .finally(() => {
        this.saving = false;
        this.changeDetector.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.releasePhotoPreview();
  }
}
