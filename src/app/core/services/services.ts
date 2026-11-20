import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';

import { Observable } from 'rxjs';

import { db } from '../../firebase';

export interface ServiceItem {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  status?: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  private firestore = db;

  private servicesCollection = collection(
    this.firestore,
    'services'
  );

  getServices(): Observable<ServiceItem[]> {

    return new Observable((observer) => {

      const unsubscribe = onSnapshot(
        this.servicesCollection,

        (snapshot) => {

          const services: ServiceItem[] =
            snapshot.docs.map((item) => ({
              id: item.id,
              ...(item.data() as ServiceItem)
            }));

          observer.next(services);

        },

        (error) => {
          observer.error(error);
        }
      );

      return unsubscribe;

    });

  }

  addService(service: ServiceItem) {

    return addDoc(
      this.servicesCollection,
      service
    );

  }

  updateService(
    id: string,
    service: Partial<ServiceItem>
  ) {

    const serviceDoc = doc(
      this.firestore,
      'services',
      id
    );

    return updateDoc(
      serviceDoc,
      service
    );

  }

  deleteService(id: string) {

    const serviceDoc = doc(
      this.firestore,
      'services',
      id
    );

    return deleteDoc(serviceDoc);

  }

}