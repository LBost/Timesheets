import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  template: `
    <section>
      <h1>Dashboard</h1>
      <p>Overview widgets and quick stats will live here.</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage {}
