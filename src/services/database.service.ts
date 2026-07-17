import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Toolbar, UserImage } from '../models/toolbar.model';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService extends Dexie {
  toolbars!: Table<Toolbar, number>;
  user_images!: Table<UserImage, number>;

  constructor() {
    super('ToolbarGenDB_v8');
    // FIX: Cast 'this' to Dexie to resolve TypeScript error where 'version' is not found on the extended class.
    (this as Dexie).version(1).stores({
      toolbars: '++id, name, description, created_at',
      user_images: '++id, name, data, created_at',
    });
  }

  // Toolbar Methods
  async getAllToolbars(): Promise<Toolbar[]> {
    return this.toolbars.orderBy('created_at').reverse().toArray();
  }

  async getToolbarById(id: number): Promise<Toolbar | undefined> {
    return this.toolbars.get(id);
  }

  async addToolbar(toolbar: Toolbar): Promise<number> {
    return this.toolbars.add(toolbar);
  }

  async updateToolbar(id: number, toolbar: Partial<Toolbar>): Promise<number> {
    return this.toolbars.update(id, toolbar);
  }

  async deleteToolbar(id: number): Promise<void> {
    return this.toolbars.delete(id);
  }
  
  // User Image Methods
  async getAllImages(): Promise<UserImage[]> {
    return this.user_images.orderBy('created_at').reverse().toArray();
  }

  async addImage(image: UserImage): Promise<number> {
    return this.user_images.add(image);
  }

  async deleteImage(id: number): Promise<void> {
    return this.user_images.delete(id);
  }
  
  async getImageById(id: number): Promise<UserImage | undefined> {
    return this.user_images.get(id);
  }
}
