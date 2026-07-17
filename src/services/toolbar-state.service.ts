import { Injectable, signal } from '@angular/core';
import { ToolbarItem } from '../models/toolbar.model';

@Injectable({
  providedIn: 'root',
})
export class ToolbarStateService {
  generatedItems = signal<ToolbarItem[] | null>(null);
}
