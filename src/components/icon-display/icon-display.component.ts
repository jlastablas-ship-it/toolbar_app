
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../../services/database.service';
import { UserImage } from '../../models/toolbar.model';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-icon-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (iconType() === 'fa') {
      <i [class]="iconCode()" [class.text-base]="size() === 'md'" [class.text-lg]="size() === 'lg'" [class.text-xl]="size() === 'xl'"></i>
    } @else if (iconType() === 'user' && userImage()) {
      <img [src]="userImage()?.data" class="object-contain" 
        [class.h-4]="size() === 'md'" [class.h-5]="size() === 'lg'" [class.h-6]="size() === 'xl'"
        alt="User Icon" />
    } @else {
      <i class="fas fa-question-circle text-gray-500"></i>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconDisplayComponent {
  private dbService = inject(DatabaseService);

  iconType = input.required<'fa' | 'user'>();
  iconCode = input.required<string>();
  size = input<'md' | 'lg' | 'xl'>('md');
  
  private userImageId = computed(() => {
    if (this.iconType() === 'user' && this.iconCode()) {
      return parseInt(this.iconCode(), 10);
    }
    return null;
  });

  private userImage$ = toObservable(this.userImageId).pipe(
    filter((id): id is number => id !== null),
    switchMap(id => this.dbService.getImageById(id))
  );

  userImage = toSignal(this.userImage$);
}
