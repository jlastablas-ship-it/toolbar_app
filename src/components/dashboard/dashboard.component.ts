import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { GeminiService } from '../../services/gemini.service';
import { ToolbarStateService } from '../../services/toolbar-state.service';
import { SvgExportService } from '../../services/svg-export.service';
import { Toolbar, ToolbarItem } from '../../models/toolbar.model';
import { IconDisplayComponent } from '../icon-display/icon-display.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconDisplayComponent, FormsModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private dbService = inject(DatabaseService);
  // FIX: Explicitly type the injected Router to resolve type inference issue.
  private router: Router = inject(Router);
  private geminiService = inject(GeminiService);
  private toolbarStateService = inject(ToolbarStateService);
  private svgExportService = inject(SvgExportService);

  toolbars = signal<Toolbar[]>([]);
  viewMode = signal<'grid' | 'table'>('table');
  isLoading = signal(true);

  // AI Generation State
  isAiModalOpen = signal(false);
  isGenerating = signal(false);
  aiPrompt = signal('a rich text editor');
  generatedItems = signal<ToolbarItem[] | null>(null);
  generationError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadToolbars();
  }

  async loadToolbars(): Promise<void> {
    this.isLoading.set(true);
    const data = await this.dbService.getAllToolbars();
    this.toolbars.set(data);
    this.isLoading.set(false);
  }

  setViewMode(mode: 'grid' | 'table'): void {
    this.viewMode.set(mode);
  }

  editToolbar(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/editor', id]);
    }
  }

  async deleteToolbar(id: number | undefined): Promise<void> {
    if (id && confirm('Are you sure you want to delete this toolbar?')) {
      await this.dbService.deleteToolbar(id);
      await this.loadToolbars();
    }
  }

  exportToolbarJson(toolbar: Toolbar): void {
    const dataStr = JSON.stringify(toolbar, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${toolbar.name.replace(/\s+/g, '_')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  async exportToolbarSvg(toolbar: Toolbar): Promise<void> {
    try {
      const svgString = await this.svgExportService.generateSvg(toolbar);
      this.svgExportService.downloadSvgFile(toolbar, svgString);
    } catch (error) {
      console.error('Error generating SVG:', error);
      alert('Failed to generate SVG representation of the toolbar.');
    }
  }
  
  importToolbars(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const toolbarData = JSON.parse(content) as Toolbar;
        // Basic validation
        if (toolbarData.name && Array.isArray(toolbarData.items)) {
          delete toolbarData.id; // remove id to create a new one
          toolbarData.created_at = new Date();
          await this.dbService.addToolbar(toolbarData);
          await this.loadToolbars();
        } else {
          alert('Invalid toolbar JSON format.');
        }
      } catch (error) {
        console.error('Error importing toolbar:', error);
        alert('Failed to parse or import the JSON file.');
      }
    };
    reader.readAsText(file);
  }

  triggerImport(): void {
    document.getElementById('import-input')?.click();
  }

  // AI Modal Methods
  openAiModal(): void {
    this.generatedItems.set(null);
    this.generationError.set(null);
    this.isAiModalOpen.set(true);
  }

  closeAiModal(): void {
    this.isAiModalOpen.set(false);
  }

  async handleGenerate(): Promise<void> {
    if (!this.aiPrompt().trim()) return;
    this.isGenerating.set(true);
    this.generatedItems.set(null);
    this.generationError.set(null);
    try {
      const items = await this.geminiService.generateToolbarItems(this.aiPrompt());
      this.generatedItems.set(items);
    } catch (error: any) {
        this.generationError.set(error.message || 'An unexpected error occurred.');
    } finally {
      this.isGenerating.set(false);
    }
  }

  createFromAi(): void {
    const items = this.generatedItems();
    if (items) {
      this.toolbarStateService.generatedItems.set(items);
      this.router.navigate(['/editor']);
      this.closeAiModal();
    }
  }
}
