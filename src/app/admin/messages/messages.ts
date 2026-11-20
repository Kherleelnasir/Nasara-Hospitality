import {
  ChangeDetectorRef,
  Component,
  inject,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ContactsService,
  ContactMessage
} from '../../core/services/contacts';


@Component({
  selector: 'app-messages',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './messages.html',

  styleUrl: './messages.css'
})
export class Messages {

  private contactsService =
    inject(ContactsService);

  private zone =
    inject(NgZone);

  private changeDetector =
    inject(ChangeDetectorRef);


  messages: ContactMessage[] = [];

  loading = true;

  message = '';

  errorMessage = '';


  constructor() {

    console.log(
      'MESSAGES: component created'
    );

    this.loadMessages();
  }


  // =========================================
  // LOAD MESSAGES
  // =========================================

  loadMessages() {

    console.log(
      'MESSAGES: loadMessages() started'
    );

    this.loading = true;

    this.message = '';

    this.errorMessage = '';


    console.log(
      'MESSAGES: calling ContactsService.getMessages()'
    );


    this.contactsService
      .getMessages()
      .subscribe({

        next: (data) => {

          console.log(
            'MESSAGES: Firestore returned data:',
            data
          );


          this.zone.run(() => {

            this.messages = data;

            this.loading = false;

            this.changeDetector.markForCheck();


            console.log(
              'MESSAGES: messages:',
              this.messages
            );

            console.log(
              'MESSAGES: messages count:',
              this.messages.length
            );

            console.log(
              'MESSAGES: loading:',
              this.loading
            );

          });

        },


        error: (error) => {

          console.error(
            'MESSAGES: Firestore error:',
            error
          );


          this.zone.run(() => {

            this.errorMessage =
              'Unable to load messages.';

            this.loading = false;

            this.changeDetector.markForCheck();

          });

        }

      });


    // =========================================
    // SAFETY TIMEOUT
    // =========================================

    setTimeout(() => {

      if (this.loading) {

        console.warn(
          'MESSAGES: Loading timed out.'
        );


        this.zone.run(() => {

          this.loading = false;

          this.errorMessage =
            'Unable to load messages. Please check your connection and try again.';

          this.changeDetector.markForCheck();

        });

      }

    }, 10000);

  }


  // =========================================
  // DELETE MESSAGE
  // =========================================

  deleteMessage(
    item: ContactMessage
  ) {

    if (!item.id) {

      console.warn(
        'MESSAGES: Message has no ID.'
      );

      return;

    }


    const confirmed =
      confirm(
        'Are you sure you want to delete this message?'
      );


    if (!confirmed) {

      return;

    }


    this.message = '';

    this.errorMessage = '';


    console.log(
      'MESSAGES: Deleting message:',
      item.id
    );


    this.contactsService
      .deleteMessage(item.id)

      .then(() => {

        console.log(
          'MESSAGES: Message deleted successfully.'
        );


        this.zone.run(() => {

          this.message =
            'Message deleted successfully.';

        });

      })


      .catch((error) => {

        console.error(
          'MESSAGES: Delete error:',
          error
        );


        this.zone.run(() => {

          this.errorMessage =
            'Unable to load messages.';

        });

      });

  }

}