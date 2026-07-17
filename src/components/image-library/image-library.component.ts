
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../../services/database.service';
import { UserImage } from '../../models/toolbar.model';

@Component({
  selector: 'app-image-library',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-library.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageLibraryComponent implements OnInit {
  private dbService = inject(DatabaseService);
  images = signal<UserImage[]>([]);
  isLoading = signal(true);
  isUploading = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadImages();
  }

  async loadImages(): Promise<void> {
    this.isLoading.set(true);
    const data = await this.dbService.getAllImages();
    this.images.set(data);
    this.isLoading.set(false);
  }

  triggerUpload(): void {
    document.getElementById('image-upload-input')?.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    this.isUploading.set(true);
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      const newImage: UserImage = {
        name: file.name,
        data: base64Data,
        created_at: new Date(),
      };
      await this.dbService.addImage(newImage);
      await this.loadImages();
      this.isUploading.set(false);
    };
    reader.readAsDataURL(file);
  }

  async deleteImage(id: number | undefined): Promise<void> {
    if (id && confirm('Are you sure you want to delete this image?')) {
      await this.dbService.deleteImage(id);
      await this.loadImages();
    }
  }
}
