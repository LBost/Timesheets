import { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell.component';
import { authGuard, guestGuard } from './features/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/ui/login.page').then((module) => module.LoginPage),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((module) => module.DashboardPage),
      },
      {
        path: 'time-entries',
        loadComponent: () =>
          import('./features/time-entries/ui/time-entries.page').then((module) => module.TimeEntriesPage),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/clients/ui/clients.page').then((module) => module.ClientsPage),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/ui/projects.page').then((module) => module.ProjectsPage),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/ui/orders.page').then((module) => module.OrdersPage),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/ui/invoices.page').then((module) => module.InvoicesPage),
      },
      {
        path: 'vat-rates',
        loadComponent: () =>
          import('./features/vat-rates/ui/vat-rates.page').then((module) => module.VatRatesPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/ui/settings.page').then((module) => module.SettingsPage),
      },
    ]
  }
];
