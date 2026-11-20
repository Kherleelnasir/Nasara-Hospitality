import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ServicesService,
  ServiceItem
} from '../../core/services/services';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './services.html',
  styleUrl: './services.css'
})
export class Services implements OnDestroy {

  private servicesService = inject(ServicesService);
  private changeDetector = inject(ChangeDetectorRef);
  private readonly cloudName = 'ttlnuq35';
  private readonly uploadPreset = 'team_photos';

  services: ServiceItem[] = [];
  filteredServices: ServiceItem[] = [];

  title = '';
  description = '';
  imageUrl = '';
  imagePreview = '';
  selectedImage: File | null = null;

  status: 'active' | 'inactive' = 'active';

  searchText = '';
  editingId: string | null = null;

  showForm = false;
  loading = true;
  uploadingImage = false;
  saving = false;

  message = '';
  errorMessage = '';

  constructor() {
    this.loadServices();
  }

  ngOnDestroy(): void {
    this.releaseImagePreview();
  }

  private releaseImagePreview(): void {
    if (this.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }
  }

  // Load services from Firestore.
  loadServices(): void {
    this.loading = true;

    this.servicesService.getServices().subscribe({
      next: (data: ServiceItem[]) => {
        console.log('Services loaded:', data);

        this.services = data;
        this.searchServices();
        this.loading = false;

        this.changeDetector.markForCheck();
      },

      error: (error: unknown) => {
        console.error('Unable to load services:', error);

        this.errorMessage = 'Unable to load services.';
        this.loading = false;

        this.changeDetector.markForCheck();
      }
    });
  }

  // Search services by title or description.
  searchServices(): void {
    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      this.filteredServices = [...this.services];
      return;
    }

    this.filteredServices = this.services.filter(service => {
      const title = service.title ?? '';
      const description = service.description ?? '';

      return (
        title.toLowerCase().includes(search) ||
        description.toLowerCase().includes(search)
      );
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.message = '';
    this.errorMessage = '';

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Choose a JPG, PNG, WebP, or GIF image.';
      input.value = '';
      this.changeDetector.markForCheck();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'The image must not exceed 5 MB.';
      input.value = '';
      this.changeDetector.markForCheck();
      return;
    }

    this.releaseImagePreview();
    this.selectedImage = file;
    this.imagePreview = URL.createObjectURL(file);
    input.value = '';
    this.changeDetector.markForCheck();
  }

  private async uploadImage(file: File): Promise<string> {
    const endpoint =
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'hospitality/services');

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Cloudinary upload error:', result);
      throw new Error(
        result?.error?.message ||
        'Cloudinary could not upload the image.'
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

  // Open the Add Service form.
  openAddForm(): void {
    this.clearForm();

    this.showForm = true;
    this.message = '';
    this.errorMessage = '';
  }

  // Save a new service or update an existing one.
  async saveService(): Promise<void> {
    this.message = '';
    this.errorMessage = '';

    if (this.saving) {
      return;
    }

    if (!this.title.trim()) {
      this.errorMessage = 'Service title is required.';
      return;
    }

    if (!this.description.trim()) {
      this.errorMessage = 'Service description is required.';
      return;
    }

    if (!this.selectedImage && this.imageUrl.startsWith('data:image/')) {
      this.errorMessage =
        'Please select the image again and upload it.';
      return;
    }

    this.saving = true;
    this.uploadingImage = Boolean(this.selectedImage);

    try {
      if (this.selectedImage) {
        this.imageUrl = await this.uploadImage(this.selectedImage);
      }

      const serviceData: ServiceItem = {
        title: this.title.trim(),
        description: this.description.trim(),
        imageUrl: this.imageUrl.trim(),
        status: this.status
      };

      if (this.editingId) {
        await this.servicesService.updateService(
          this.editingId,
          serviceData
        );

        this.message = 'Service updated successfully.';

      } else {
        await this.servicesService.addService(serviceData);

        this.message = 'Service added successfully.';
      }

      this.clearForm();
      this.showForm = false;

      // Refresh the list after saving.
      this.loadServices();

    } catch (error: unknown) {
      console.error('Unable to save service:', error);

      this.errorMessage = error instanceof Error
        ? error.message
        : this.editingId
          ? 'Unable to update service.'
          : 'Unable to add service.';

    } finally {
      this.uploadingImage = false;
      this.saving = false;
      this.changeDetector.markForCheck();
    }
  }

  // Edit an existing service.
  editService(service: ServiceItem): void {
    this.releaseImagePreview();
    this.editingId = service.id ?? null;

    this.title = service.title ?? '';
    this.description = service.description ?? '';
    this.imageUrl = service.imageUrl ?? '';
    this.imagePreview = this.imageUrl;
    this.selectedImage = null;

    this.status = service.status ?? 'active';

    this.showForm = true;
    this.message = '';
    this.errorMessage = '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Delete a service.
  async deleteService(id: string): Promise<void> {
    const confirmed = confirm(
      'Are you sure you want to delete this service?'
    );

    if (!confirmed) {
      return;
    }

    this.message = '';
    this.errorMessage = '';

    try {
      await this.servicesService.deleteService(id);

      this.message = 'Service deleted successfully.';

      this.loadServices();

    } catch (error: unknown) {
      console.error('Unable to delete service:', error);

      this.errorMessage = 'Unable to delete service.';

    } finally {
      this.changeDetector.markForCheck();
    }
  }

  // Reset the form fields.
  clearForm(): void {
    this.releaseImagePreview();
    this.title = '';
    this.description = '';
    this.imageUrl = '';
    this.imagePreview = '';
    this.selectedImage = null;
    this.status = 'active';
    this.editingId = null;
  }

  // Cancel the form.
  cancelForm(): void {
    this.clearForm();

    this.showForm = false;
    this.message = '';
    this.errorMessage = '';
  }
}
