import { ChangeDetectionStrategy, Component, effect, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { UserImage } from '../../models/toolbar.model';
import { FA_ICONS } from './fa-icons';

type IconSource = 'fa' | 'user';

interface Icon {
  type: IconSource;
  code: string;
}

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './icon-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconPickerComponent implements OnInit {
  @Output() iconSelected = new EventEmitter<{ type: IconSource; code: string }>();
  @Output() closeModal = new EventEmitter<void>();
  
  private dbService = inject(DatabaseService);

  activeTab = signal<IconSource>('fa');
  searchQuery = signal('');
  
  allFaIcons = signal<string[]>(FA_ICONS);
  allUserImages = signal<UserImage[]>([]);
  
  filteredIcons = signal<Icon[]>([]);
  
  isLoading = signal(true);
  
  constructor() {
    effect(() => {
      this.filterIcons();
    });
  }

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    const userImages = await this.dbService.getAllImages();
    this.allUserImages.set(userImages);
    this.filterIcons(); // initial filter
    this.isLoading.set(false);
  }
  
  setTab(tab: IconSource): void {
    this.activeTab.set(tab);
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  filterIcons(): void {
      const query = this.searchQuery().toLowerCase();
      if (this.activeTab() === 'fa') {
          const filtered = this.allFaIcons().filter(icon => icon.includes(query)).slice(0, 100); // Paginate to 100
          this.filteredIcons.set(filtered.map(code => ({ type: 'fa', code: `fas ${code}` })));
      } else {
          const filtered = this.allUserImages().filter(img => img.name.toLowerCase().includes(query));
          this.filteredIcons.set(filtered.map(img => ({ type: 'user', code: String(img.id) })));
      }
  }

  selectIcon(icon: Icon): void {
    this.iconSelected.emit(icon);
  }

  close(): void {
    this.closeModal.emit();
  }

  getUserImage(id: string): UserImage | undefined {
    return this.allUserImages().find(img => String(img.id) === id);
  }
}
