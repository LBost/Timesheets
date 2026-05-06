import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '../theme/theme.service';
import { ToastService } from '../feedback/toast.service';
import { APP_NAVIGATION, APP_NAVIGATION_FOOTER } from './navigation.config';
import { HlmCollapsibleImports } from '@spartan-ng/helm/collapsible';
import { ShellAppFooterComponent } from './components/shell-app-footer.component';
import { ShellSidebarNavComponent } from './components/shell-sidebar-nav.component';
import { ShellTopHeaderComponent } from './components/shell-top-header.component';
import { ShellToastComponent } from './components/shell-toast.component';
import {
  HlmSidebarInset,
  HlmSidebarWrapper,
} from '@spartan-ng/helm/sidebar';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    HlmSidebarInset,
    HlmSidebarWrapper,
    HlmCollapsibleImports,
    ShellSidebarNavComponent,
    ShellAppFooterComponent,
    ShellTopHeaderComponent,
    ShellToastComponent,
  ],
  templateUrl: './app-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly navSections = APP_NAVIGATION;
  protected readonly navFooterItems = APP_NAVIGATION_FOOTER;
  protected readonly theme = inject(ThemeService);
  protected readonly toast = inject(ToastService);

  protected themeIconName(): 'lucideSun' | 'lucideMoon' | 'lucideMonitor' {
    switch (this.theme.mode()) {
      case 'light':
        return 'lucideSun';
      case 'dark':
        return 'lucideMoon';
      default:
        return 'lucideMonitor';
    }
  }

  protected themeToggleAriaLabel(): string {
    return `Color theme: ${this.theme.mode()}. Activate to use ${this.theme.peekNextMode()} theme.`;
  }
}
