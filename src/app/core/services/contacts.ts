import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot
} from 'firebase/firestore';

import { Observable } from 'rxjs';

import { db } from '../../firebase';


export interface ContactMessage {

  id?: string;

  fullName: string;

  email: string;

  phone: string;

  subject: string;

  message: string;

  createdAt?: any;
}


@Injectable({
  providedIn: 'root'
})
export class ContactsService {

  private firestore = db;

  private contactsCollection =
    collection(this.firestore, 'contacts');


  // =========================================
  // GET CUSTOMER MESSAGES
  // =========================================

  getMessages(): Observable<ContactMessage[]> {

    return new Observable((observer) => {

      const unsubscribe = onSnapshot(

        this.contactsCollection,

        (snapshot) => {

          const messages: ContactMessage[] = [];

          snapshot.docs.forEach((item) => {

            const data =
              item.data() as ContactMessage;


            /*
             * Ignore empty documents.
             *
             * A real message must contain
             * at least a customer name OR
             * email OR subject OR message.
             */

            const hasRealMessage =
              !!data.fullName?.trim() ||
              !!data.email?.trim() ||
              !!data.subject?.trim() ||
              !!data.message?.trim();


            if (hasRealMessage) {

              messages.push({

                id: item.id,

                ...data

              });

            }

          });


          console.log(
            'CONTACTS: Valid messages:',
            messages
          );


          observer.next(messages);

        },

        (error) => {

          console.error(
            'CONTACTS: Firestore error:',
            error
          );

          observer.error(error);

        }

      );


      return unsubscribe;

    });

  }


  // =========================================
  // ADD MESSAGE
  // =========================================

  addMessage(message: ContactMessage) {

    return addDoc(
      this.contactsCollection,
      message
    );

  }


  // =========================================
  // DELETE MESSAGE
  // =========================================

  deleteMessage(id: string) {

    const contactDoc =
      doc(
        this.firestore,
        'contacts',
        id
      );

    return deleteDoc(contactDoc);

  }

}