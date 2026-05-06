import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectFlexRenderContext } from '@tanstack/angular-table';
import type { CellContext, RowData } from '@tanstack/table-core';

@Component({
  selector: 'app-data-table-select-cell',
  template: `
    <input
      type="checkbox"
      class="border-input text-primary focus-visible:ring-ring size-4 shrink-0 rounded border shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      [checked]="ctx.row.getIsSelected()"
      [disabled]="!ctx.row.getCanSelect()"
      (change)="ctx.row.getToggleSelectedHandler()($event)"
      [attr.aria-label]="'Select row'"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableSelectCellComponent {
  protected readonly ctx = injectFlexRenderContext<CellContext<RowData, unknown>>();
}
