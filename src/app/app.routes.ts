import { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell.component';
import { ClientsPage } from './features/clients/ui/clients.page';
import { DashboardPage } from './features/dashboard/dashboard.page';
import { OrdersPage } from './features/orders/ui/orders.page';
import { ProjectsPage } from './features/projects/ui/projects.page';
import { TimeEntriesPage } from './features/time-entries/ui/time-entries.page';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', component: DashboardPage },
      { path: 'time-entries', component: TimeEntriesPage },
      { path: 'clients', component: ClientsPage },
      { path: 'projects', component: ProjectsPage },
      { path: 'orders', component: OrdersPage }
    ]
  }
];
