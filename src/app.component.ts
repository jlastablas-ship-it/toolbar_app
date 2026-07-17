
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
})
export class AppComponent {
  isSidebarOpen = signal(true);

  toggleSidebar() {
    this.isSidebarOpen.update(value => !value);
  }

  goBack() {
    history.back();
  }

  goForward() {
    history.forward();
  }
  
  refresh() {
    location.reload();
  }
}
