import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { injectFlexRenderContext } from '@tanstack/angular-table';
import type { CellContext } from '@tanstack/table-core';
import { OrderVM } from '../../models/order.vm';

@Component({
  selector: 'app-order-code-cell',
  template: `
    <div class="font-medium">{{ order().code }}</div>
    <div class="text-xs text-muted-foreground">{{ order().title }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderCodeCellComponent {
  private readonly ctx = injectFlexRenderContext<CellContext<OrderVM, unknown>>();
  protected readonly order = computed(() => this.ctx.row.original);
}

@Component({
  selector: 'app-order-project-cell',
  template: `
    <div>{{ order().projectName }}</div>
    <div class="text-xs text-muted-foreground">{{ order().projectCode }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderProjectCellComponent {
  private readonly ctx = injectFlexRenderContext<CellContext<OrderVM, unknown>>();
  protected readonly order = computed(() => this.ctx.row.original);
}
