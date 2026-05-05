import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideBuilding2,
  lucideClipboardList,
  lucideClock,
  lucideFolderKanban,
  lucideLayoutDashboard,
  lucideMonitor,
  lucideMoon,
  lucideReceipt,
  lucideSettings,
  lucideSun
} from '@ng-icons/lucide';

import { routes } from './app.routes';
import { ThemeService } from './core/theme/theme.service';
import { provideStore } from '@ngrx/store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIcons({
        lucideLayoutDashboard,
        lucideClock,
        lucideBuilding2,
        lucideClipboardList,
        lucideFolderKanban,
        lucideReceipt,
        lucideSun,
        lucideMoon,
        lucideMonitor,
        lucideBell,
        lucideSettings
    }),
    provideRouter(routes),
    provideAppInitializer(() => {
        void inject(ThemeService);
    }),
    provideStore()
]
};
