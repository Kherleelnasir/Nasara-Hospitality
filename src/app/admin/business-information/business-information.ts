import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../../firebase';

@Component({
  selector: 'app-business-information',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './business-information.html',
  styleUrl: './business-information.css'
})
export class BusinessInformation {

  private changeDetector = inject(ChangeDetectorRef);

  loading = true;
  saving = false;

  businessExists = false;

  successMessage = '';
  errorMessage = '';

  businessName = '';
  shortDescription = '';
  description = '';

  phone = '';
  whatsapp = '';
  email = '';
  website = '';

  country = '';
  state = '';
  city = '';
  address = '';

  openingTime = '';
  closingTime = '';

  // SOCIAL MEDIA
  facebook = '';
  instagram = '';
  tiktok = '';
  twitter = '';
  youtube = '';

  constructor() {
    this.loadBusinessInformation();
  }

  async loadBusinessInformation() {

    this.loading = true;
    this.errorMessage = '';

    console.log(
      'Loading business information...'
    );

    try {

      const businessRef = doc(
        db,
        'businessInformation',
        'main'
      );

      const businessSnapshot = await getDoc(
        businessRef
      );

      console.log(
        'Firestore request completed.'
      );

      if (businessSnapshot.exists()) {

        const data = businessSnapshot.data();

        console.log(
          'Business information found:',
          data
        );

        this.businessExists = true;

        this.businessName =
          data['businessName'] ?? '';

        this.shortDescription =
          data['shortDescription'] ?? '';

        this.description =
          data['description'] ?? '';

        this.phone =
          data['phone'] ?? '';

        this.whatsapp =
          data['whatsapp'] ?? '';

        this.email =
          data['email'] ?? '';

        this.website =
          data['website'] ?? '';

        this.country =
          data['country'] ?? '';

        this.state =
          data['state'] ?? '';

        this.city =
          data['city'] ?? '';

        this.address =
          data['address'] ?? '';

        this.openingTime =
          data['openingTime'] ?? '';

        this.closingTime =
          data['closingTime'] ?? '';

        // SOCIAL MEDIA
        this.facebook =
          data['facebook'] ?? '';

        this.instagram =
          data['instagram'] ?? '';

        this.tiktok =
          data['tiktok'] ?? '';

        this.twitter =
          data['twitter'] ?? '';

        this.youtube =
          data['youtube'] ?? '';

      } else {

        console.log(
          'No business information exists yet.'
        );

        this.businessExists = false;
      }

    } catch (error: any) {

      console.error(
        'Error loading business information:',
        error
      );

      if (
        error?.code === 'permission-denied'
      ) {

        this.errorMessage =
          'Permission denied. Please check your Firestore security rules.';

      } else if (
        error?.code === 'unavailable'
      ) {

        this.errorMessage =
          'Firestore is unavailable. Please check your internet connection.';

      } else if (
        error?.code === 'unauthenticated'
      ) {

        this.errorMessage =
          'You must be logged in as an administrator.';

      } else {

        this.errorMessage =
          'Unable to load business information. Please try again.';
      }

    } finally {

      this.loading = false;

      this.changeDetector.markForCheck();

      console.log(
        'Business information loading finished.'
      );
    }
  }

  async saveBusinessInformation() {

    this.successMessage = '';
    this.errorMessage = '';

    this.saving = true;

    try {

      const businessRef = doc(
        db,
        'businessInformation',
        'main'
      );

      const businessData = {

        businessName:
          this.businessName.trim(),

        shortDescription:
          this.shortDescription.trim(),

        description:
          this.description.trim(),

        phone:
          this.phone.trim(),

        whatsapp:
          this.whatsapp.trim(),

        email:
          this.email.trim(),

        website:
          this.website.trim(),

        country:
          this.country.trim(),

        state:
          this.state.trim(),

        city:
          this.city.trim(),

        address:
          this.address.trim(),

        openingTime:
          this.openingTime,

        closingTime:
          this.closingTime,

        // SOCIAL MEDIA
        facebook:
          this.facebook.trim(),

        instagram:
          this.instagram.trim(),

        tiktok:
          this.tiktok.trim(),

        twitter:
          this.twitter.trim(),

        youtube:
          this.youtube.trim(),

        updatedAt:
          new Date()

      };

      await setDoc(
        businessRef,
        businessData,
        {
          merge: true
        }
      );

      this.businessExists = true;

      this.successMessage =
        'Business information saved successfully.';

    } catch (error: any) {

      console.error(
        'Error saving business information:',
        error
      );

      if (
        error?.code === 'permission-denied'
      ) {

        this.errorMessage =
          'Permission denied. Please check your Firestore security rules.';

      } else if (
        error?.code === 'unavailable'
      ) {

        this.errorMessage =
          'Firestore is unavailable. Please check your internet connection.';

      } else {

        this.errorMessage =
          'Unable to save business information. Please try again.';
      }

    } finally {

      this.saving = false;
    }
  }
}