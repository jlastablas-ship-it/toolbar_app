import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

import { DatabaseService } from '../../services/database.service';
import { ToolbarStateService } from '../../services/toolbar-state.service';
import { SvgExportService } from '../../services/svg-export.service';
import { Toolbar, ToolbarItem } from '../../models/toolbar.model';
import { IconPickerComponent } from '../icon-picker/icon-picker.component';
import { IconDisplayComponent } from '../icon-display/icon-display.component';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, IconPickerComponent, CdkDropList, CdkDrag, IconDisplayComponent],
  templateUrl: './editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements OnInit {
  private dbService = inject(DatabaseService);
  // FIX: Explicitly type the injected Router and ActivatedRoute to resolve type inference issues.
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private toolbarStateService = inject(ToolbarStateService);
  private svgExportService = inject(SvgExportService);

  toolbarId: number | null = null;
  toolbarName = signal('');
  toolbarDesc = signal('');
  toolbarItems: WritableSignal<ToolbarItem[]> = signal([]);
  
  isPickerOpen = signal(false);
  editingItem: WritableSignal<ToolbarItem | null> = signal(null);

  isLoading = signal(true);
  isSaving = signal(false);

  jsonPreview = computed(() => {
    const toolbar: Partial<Toolbar> = {
      name: this.toolbarName(),
      description: this.toolbarDesc(),
      items: this.toolbarItems(),
    };
    return JSON.stringify(toolbar, null, 2);
  });

  constructor() {
    effect(() => {
      // When a new item is being edited, open the picker
      if(this.editingItem()) {
        this.isPickerOpen.set(true);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    
    // Check for AI-generated items first
    const generatedItems = this.toolbarStateService.generatedItems();
    if (generatedItems) {
      this.toolbarName.set('AI Generated Toolbar');
      this.toolbarDesc.set('Toolbar created with the help of Gemini AI.');
      this.toolbarItems.set(generatedItems);
      this.toolbarStateService.generatedItems.set(null); // Clear state
    } else {
      // If not, check for an ID in the route params for editing
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.toolbarId = +id;
        const toolbar = await this.dbService.getToolbarById(this.toolbarId);
        if (toolbar) {
          this.toolbarName.set(toolbar.name);
          this.toolbarDesc.set(toolbar.description);
          this.toolbarItems.set(toolbar.items);
        }
      }
    }
    this.isLoading.set(false);
  }

  addNewItem(): void {
    const newItem: ToolbarItem = {
      id: crypto.randomUUID(),
      iconType: 'fa',
      iconCode: 'fa-star',
      tooltip: 'New Item',
      action: ''
    };
    this.toolbarItems.update(items => [...items, newItem]);
  }

  editItem(item: ToolbarItem): void {
     // This just sets the item being edited, effect will open picker
    this.editingItem.set(item);
  }
  
  removeItem(id: string): void {
    this.toolbarItems.update(items => items.filter(item => item.id !== id));
  }
  
  drop(event: CdkDragDrop<string[]>) {
    this.toolbarItems.update(items => {
        const newItems = [...items];
        moveItemInArray(newItems, event.previousIndex, event.currentIndex);
        return newItems;
    });
  }

  onIconSelected(icon: { type: 'fa' | 'user'; code: string }): void {
    const currentItem = this.editingItem();
    if (currentItem) {
      this.toolbarItems.update(items =>
        items.map(item =>
          item.id === currentItem.id
            ? { ...item, iconType: icon.type, iconCode: icon.code }
            : item
        )
      );
    }
    this.closePicker();
  }

  closePicker(): void {
    this.isPickerOpen.set(false);
    this.editingItem.set(null);
  }

  async saveToolbar(): Promise<void> {
    if (!this.toolbarName()) {
      alert('Toolbar name is required.');
      return;
    }

    this.isSaving.set(true);
    const toolbarData: Toolbar = {
      name: this.toolbarName(),
      description: this.toolbarDesc(),
      items: this.toolbarItems(),
      created_at: new Date(),
    };

    if (this.toolbarId) {
      await this.dbService.updateToolbar(this.toolbarId, toolbarData);
    } else {
      await this.dbService.addToolbar(toolbarData);
    }
    
    this.isSaving.set(false);
    this.router.navigate(['/dashboard']);
  }

  downloadJson(): void {
    const toolbarData: Toolbar = {
      name: this.toolbarName() || 'unnamed_toolbar',
      description: this.toolbarDesc(),
      items: this.toolbarItems(),
      created_at: new Date(),
    };
    const dataStr = JSON.stringify(toolbarData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `${(this.toolbarName() || 'unnamed_toolbar').replace(/\s+/g, '_')}.json`;

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
  }

  async downloadSvg(): Promise<void> {
    try {
      const toolbarData: Toolbar = {
        name: this.toolbarName() || 'unnamed_toolbar',
        description: this.toolbarDesc(),
        items: this.toolbarItems(),
        created_at: new Date(),
      };
      const svgString = await this.svgExportService.generateSvg(toolbarData);
      this.svgExportService.downloadSvgFile(toolbarData, svgString);
    } catch (error) {
      console.error('Error generating SVG:', error);
      alert('Failed to generate SVG representation of the toolbar.');
    }
  }
}
