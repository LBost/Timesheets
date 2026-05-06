import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectFlexRenderContext } from '@tanstack/angular-table';
import type { HeaderContext, RowData } from '@tanstack/table-core';

@Component({
  selector: 'app-data-table-select-head',
  template: `
    <input
      type="checkbox"
      class="border-input text-primary focus-visible:ring-ring size-4 shrink-0 rounded border shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      [checked]="ctx.table.getIsAllPageRowsSelected()"
      [indeterminate]="ctx.table.getIsSomePageRowsSelected() && !ctx.table.getIsAllPageRowsSelected()"
      (change)="ctx.table.getToggleAllPageRowsSelectedHandler()($event)"
      [attr.aria-label]="'Select all rows'"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableSelectHeadComponent {
  protected readonly ctx = injectFlexRenderContext<HeaderContext<RowData, unknown>>();
}
