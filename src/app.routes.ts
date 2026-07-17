
import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent)
  },
  {
    path: 'editor',
    loadComponent: () => import('./components/editor/editor.component').then(c => c.EditorComponent)
  },
  {
    path: 'editor/:id',
    loadComponent: () => import('./components/editor/editor.component').then(c => c.EditorComponent)
  },
  {
    path: 'images',
    loadComponent: () => import('./components/image-library/image-library.component').then(c => c.ImageLibraryComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
