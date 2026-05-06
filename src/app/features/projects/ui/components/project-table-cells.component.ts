import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { injectFlexRenderContext } from '@tanstack/angular-table';
import type { CellContext } from '@tanstack/table-core';
import { ProjectVM } from '../../models/project.vm';

@Component({
  selector: 'app-project-title-cell',
  template: `
    <div class="font-medium">{{ project().name }}</div>
    <div class="text-xs text-muted-foreground">
      {{ project().code }} · {{ project().currency }} {{ project().unitRate }}/{{ project().unit }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTitleCellComponent {
  private readonly ctx = injectFlexRenderContext<CellContext<ProjectVM, unknown>>();
  protected readonly project = computed(() => this.ctx.row.original);
}

@Component({
  selector: 'app-project-client-cell',
  template: `
    <div>{{ project().clientName }}</div>
    <div class="text-xs text-muted-foreground">Client #{{ project().clientId }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectClientCellComponent {
  private readonly ctx = injectFlexRenderContext<CellContext<ProjectVM, unknown>>();
  protected readonly project = computed(() => this.ctx.row.original);
}

@Component({
  selector: 'app-project-billing-cell',
  template: `
    <div>{{ project().billingModel || 'None' }}</div>
    <div class="text-xs text-muted-foreground">{{ project().isActive ? 'Active' : 'Inactive' }}</div>
    <div class="text-xs text-muted-foreground">
      {{ project().useOrders ? 'Orders required' : 'Orders optional' }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectBillingCellComponent {
  private readonly ctx = injectFlexRenderContext<CellContext<ProjectVM, unknown>>();
  protected readonly project = computed(() => this.ctx.row.original);
}
