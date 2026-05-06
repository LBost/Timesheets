import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowDown, lucideArrowUp, lucideArrowUpDown } from '@ng-icons/lucide';
import { injectFlexRenderContext } from '@tanstack/angular-table';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import type { HeaderContext, RowData } from '@tanstack/table-core';

type ColumnMeta = { headerLabel?: string };

@Component({
  selector: 'app-data-table-sort-header',
  imports: [HlmButtonImports, NgIcon, HlmIcon],
  providers: [provideIcons({ lucideArrowUpDown, lucideArrowUp, lucideArrowDown })],
  template: `
    @if (ctx.header.column.getCanSort()) {
      <button
        type="button"
        hlmBtn
        variant="ghost"
        class="-ms-2 h-8 gap-1 px-2 font-medium"
        (click)="ctx.header.column.getToggleSortingHandler()?.($event)"
      >
        {{ title() }}
        @switch (ctx.header.column.getIsSorted()) {
          @case ('asc') {
            <ng-icon hlm name="lucideArrowUp" size="sm" aria-hidden="true" />
          }
          @case ('desc') {
            <ng-icon hlm name="lucideArrowDown" size="sm" aria-hidden="true" />
          }
          @default {
            <ng-icon hlm name="lucideArrowUpDown" size="sm" class="opacity-50" aria-hidden="true" />
          }
        }
      </button>
    } @else {
      <span class="px-2 font-medium">{{ title() }}</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableSortHeaderComponent {
  protected readonly ctx = injectFlexRenderContext<HeaderContext<RowData, unknown>>();

  protected readonly title = computed(() => {
    const meta = this.ctx.header.column.columnDef.meta as ColumnMeta | undefined;
    return meta?.headerLabel ?? this.ctx.header.column.id;
  });
}
