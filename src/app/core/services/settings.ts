import { Injectable } from '@angular/core';
import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

import { Observable } from 'rxjs';

import { db } from '../../firebase';

export interface BusinessSettings {
  businessName: string;
  description: string;
  mission: string;
  vision: string;
  coreValues: string;

  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  openingHours: string;

  logoUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private firestore = db;

  private businessDocument = doc(
    this.firestore,
    'settings',
    'business'
  );


  // Get business information
  getBusinessSettings(): Observable<BusinessSettings | null> {

    return new Observable((observer) => {

      getDoc(this.businessDocument)
        .then((snapshot) => {

          if (snapshot.exists()) {

            observer.next(
              snapshot.data() as BusinessSettings
            );

          } else {

            observer.next(null);

          }

          observer.complete();

        })
        .catch((error) => {

          observer.error(error);

        });

    });

  }


  // Save business information
  saveBusinessSettings(
    business: BusinessSettings
  ) {

    return setDoc(
      this.businessDocument,
      business,
      {
        merge: true
      }
    );

  }

}