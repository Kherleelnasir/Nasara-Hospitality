
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

import { db } from '../../firebase';

interface TeamMember {
  id?: string;
  fullName: string;
  position: string;
  biography: string;
  photoUrl: string;
  displayOrder: number;
  published: boolean;
}

@Component({
  selector: 'app-manage-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-team.html',
  styleUrl: './manage-team.css'
})
export class ManageTeam implements OnDestroy {
  private changeDetector = inject(ChangeDetectorRef);

  // Cloudinary configuration
  private readonly cloudName = 'ttlnuq35';
  private readonly uploadPreset = 'team_photos';

  loading = false;
  saving = false;
  successMessage = '';
  errorMessage = '';

  teamMembers: TeamMember[] = [];
  editingId: string | null = null;

  selectedPhoto: File | null = null;
  photoPreview = '';

  member: TeamMember = this.emptyMember();

  private emptyMember(): TeamMember {
    return {
      fullName: '',
      position: '',
      biography: '',
      photoUrl: '',
      displayOrder: 1,
      published: true
    };
  }

  constructor() {
    void this.loadTeamMembers();
  }

  ngOnDestroy(): void {
    this.releasePhotoPreview();
  }

  private releasePhotoPreview(): void {
    if (this.photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.photoPreview);
    }
  }

  async loadTeamMembers(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const membersRef = collection(db, 'teamMembers');
      const membersQuery = query(
        membersRef,
        orderBy('displayOrder', 'asc')
      );

      const snapshot = await getDocs(membersQuery);

      this.teamMembers = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      } as TeamMember));
    } catch (error) {
      console.error('Error loading team members:', error);
      this.errorMessage =
        'Unable to load team members. Check your Firestore security rules and connection.';
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.errorMessage = '';
    this.successMessage = '';

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage =
        'Choose a JPG, PNG, WebP, or GIF image.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage =
        'The photo must not exceed 5 MB.';
      input.value = '';
      return;
    }

    this.releasePhotoPreview();

    this.selectedPhoto = file;
    this.photoPreview = URL.createObjectURL(file);
    this.changeDetector.markForCheck();
  }

  private async uploadPhoto(file: File): Promise<string> {
    const endpoint =
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'hospitality/team');

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Cloudinary upload error:', result);

      throw new Error(
        result?.error?.message ||
        'Cloudinary could not upload the photo.'
      );
    }

    if (
      typeof result.secure_url !== 'string' ||
      !result.secure_url.startsWith('https://')
    ) {
      throw new Error(
        'Cloudinary did not return a valid secure image URL.'
      );
    }

    return result.secure_url;
  }

  editMember(member: TeamMember): void {
    this.resetForm();

    this.editingId = member.id ?? null;

    this.member = {
      fullName: member.fullName ?? '',
      position: member.position ?? '',
      biography: member.biography ?? '',
      photoUrl: member.photoUrl ?? '',
      displayOrder: member.displayOrder ?? 1,
      published: member.published ?? true
    };

    this.photoPreview = this.member.photoUrl;
    this.successMessage = '';
    this.errorMessage = '';
  }

  async saveMember(): Promise<void> {
    this.successMessage = '';
    this.errorMessage = '';

    if (
      !this.member.fullName.trim() ||
      !this.member.position.trim()
    ) {
      this.errorMessage =
        'Please enter the team member’s name and position.';
      return;
    }

    const displayOrder = Number(this.member.displayOrder);

    if (
      !Number.isInteger(displayOrder) ||
      displayOrder < 1
    ) {
      this.errorMessage =
        'Display order must be a positive whole number.';
      return;
    }

    this.saving = true;

    try {
      let photoUrl = this.member.photoUrl;

      // Upload a new photo only when one has been selected.
      if (this.selectedPhoto) {
        this.successMessage = 'Uploading photo to Cloudinary...';
        this.changeDetector.markForCheck();

        photoUrl = await this.uploadPhoto(this.selectedPhoto);
      }

      const data = {
        fullName: this.member.fullName.trim(),
        position: this.member.position.trim(),
        biography: this.member.biography.trim(),
        photoUrl,
        displayOrder,
        published: this.member.published,
        updatedAt: serverTimestamp()
      };

      if (this.editingId) {
        await updateDoc(
          doc(db, 'teamMembers', this.editingId),
          data
        );

        this.successMessage =
          'Team member updated successfully.';
      } else {
        await addDoc(
          collection(db, 'teamMembers'),
          {
            ...data,
            createdAt: serverTimestamp()
          }
        );

        this.successMessage =
          'Team member added successfully.';
      }

      this.resetForm();
      await this.loadTeamMembers();

      this.changeDetector.markForCheck();
    } catch (error) {
      console.error('Error saving team member:', error);

      this.errorMessage = error instanceof Error
        ? error.message
        : 'Unable to save team member. Check Cloudinary and Firestore settings.';
    } finally {
      this.saving = false;
      this.changeDetector.markForCheck();
    }
  }

  async togglePublished(member: TeamMember): Promise<void> {
    if (!member.id) return;

    this.errorMessage = '';
    this.successMessage = '';

    try {
      await updateDoc(
        doc(db, 'teamMembers', member.id),
        {
          published: !member.published,
          updatedAt: serverTimestamp()
        }
      );

      this.successMessage = 'Publication status updated.';
      await this.loadTeamMembers();
    } catch (error) {
      console.error('Error updating publication status:', error);

      this.errorMessage =
        'Unable to update publication status. Check Firestore permissions.';
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  async deleteMember(member: TeamMember): Promise<void> {
    if (!member.id) return;

    const confirmed = window.confirm(
      `Delete ${member.fullName} from the team?`
    );

    if (!confirmed) return;

    this.errorMessage = '';
    this.successMessage = '';

    try {
      await deleteDoc(
        doc(db, 'teamMembers', member.id)
      );

      if (this.editingId === member.id) {
        this.resetForm();
      }

      this.successMessage =
        'Team member deleted successfully.';

      await this.loadTeamMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);

      this.errorMessage =
        'Unable to delete team member. Check Firestore permissions.';
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  resetForm(): void {
    this.releasePhotoPreview();

    this.member = this.emptyMember();
    this.editingId = null;
    this.selectedPhoto = null;
    this.photoPreview = '';
  }
}