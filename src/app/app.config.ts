import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
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
  lucideLogOut,
  lucideMonitor,
  lucideMoon,
  lucideReceipt,
  lucideSettings,
  lucideSun,
} from '@ng-icons/lucide';

import { routes } from './app.routes';
import { ThemeService } from './core/theme/theme.service';
import { provideSupabase } from './core/supabase/supabase.client';

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
      lucideSettings,
      lucideLogOut,
    }),
    provideRouter(routes),
    provideAppInitializer(() => {
      void inject(ThemeService);
    }),
    provideSupabase(),
  ],
};
