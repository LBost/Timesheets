import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronsLeft,
  lucideChevronsRight,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import {
  type ColumnDef,
  type ColumnFiltersState,
  createAngularTable,
  FlexRenderDirective,
  flexRenderComponent,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  type PaginationState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/angular-table';
import type { EntityTableRow } from './entity-table-row.model';
export type { EntityTableRow } from './entity-table-row.model';
import { RowContextMenuComponent } from '../row-context-menu/row-context-menu.component';
import { DataTableSelectCellComponent } from './data-table-select-cell.component';
import { DataTableSelectHeadComponent } from './data-table-select-head.component';

interface PageSizeOption {
  readonly label: string;
  readonly value: number;
}

const PAGE_SIZE_OPTIONS: readonly PageSizeOption[] = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
];

export interface EntityDataTableFilterOption {
  readonly label: string;
  readonly value: string;
}

export interface EntityDataTableColumnFilter {
  readonly columnId: string;
  readonly label: string;
  readonly options: readonly EntityDataTableFilterOption[];
}

function defaultGlobalFilterRowText(row: EntityTableRow): string {
  return String(row.id);
}

@Component({
  selector: 'app-entity-data-table',
  imports: [
    FlexRenderDirective,
    HlmButtonImports,
    HlmComboboxImports,
    HlmContextMenuImports,
    HlmDropdownMenuImports,
    HlmIcon,
    HlmInputImports,
    HlmTableImports,
    NgIcon,
    RowContextMenuComponent,
  ],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideChevronLeft,
      lucideChevronRight,
      lucideChevronsLeft,
      lucideChevronsRight,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 items-center gap-2 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3">
      <input
        hlmInput
        class="w-full md:w-80"
        [placeholder]="filterPlaceholder()"
        [value]="globalFilter()"
        (input)="onGlobalFilterInput($event)"
      />
      <div class="flex min-h-9 w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
        @for (config of columnFiltersConfig(); track config.columnId) {
          <div
            hlmCombobox
            [value]="selectedFilterOption(config.columnId, config.options)"
            [itemToString]="filterOptionToString"
            [isItemEqualToValue]="isSameFilterOption"
            (valueChange)="onColumnFilterChange(config.columnId, $event)"
          >
            <hlm-combobox-trigger class="h-9 min-w-36 justify-between">
              <span>
                {{ selectedFilterOption(config.columnId, config.options)?.label ?? 'All ' + config.label }}
              </span>
            </hlm-combobox-trigger>
            <ng-template hlmComboboxPortal>
              <div hlmComboboxContent>
                <div hlmComboboxList>
                  <hlm-combobox-item [value]="null">All {{ config.label }}</hlm-combobox-item>
                  @for (option of config.options; track option.value) {
                    <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
                  }
                </div>
              </div>
            </ng-template>
          </div>
        }

        <button hlmBtn variant="outline" class="shrink-0" align="end" [hlmDropdownMenuTrigger]="colMenu">
          Columns
          <ng-icon hlm name="lucideChevronDown" class="ms-2" size="sm" />
        </button>
        <ng-template #colMenu>
          <hlm-dropdown-menu class="w-40">
            @for (column of hidableColumns(); track column.id) {
              <button
                hlmDropdownMenuCheckbox
                class="capitalize"
                [checked]="column.getIsVisible()"
                (triggered)="column.toggleVisibility()"
              >
                <hlm-dropdown-menu-checkbox-indicator />
                {{ columnMenuLabel(column) }}
              </button>
            }
          </hlm-dropdown-menu>
        </ng-template>
      </div>
    </div>

    <div class="overflow-hidden rounded-lg border border-border">
      <div hlmTableContainer>
        <table hlmTable>
          <thead hlmTableHeader>
            @for (headerGroup of table.getHeaderGroups(); track headerGroup.id) {
              <tr hlmTableRow>
                @for (header of headerGroup.headers; track header.id) {
                  <th hlmTableHead [attr.colSpan]="header.colSpan">
                    @if (!header.isPlaceholder) {
                      <ng-template
                        [flexRender]="header.column.columnDef.header"
                        [flexRenderProps]="header.getContext()"
                        let-primitive="$implicit"
                      >
                        <span>{{ primitive }}</span>
                      </ng-template>
                    }
                  </th>
                }
              </tr>
            }
          </thead>
          <tbody hlmTableBody>
            @for (row of table.getRowModel().rows; track row.id) {
              <tr
                hlmTableRow
                [hlmContextMenuTrigger]="rowMenu"
                [hlmContextMenuTriggerData]="{ entityId: row.original.id }"
                [attr.data-state]="row.getIsSelected() ? 'selected' : null"
              >
                @for (cell of row.getVisibleCells(); track cell.id) {
                  <td hlmTableCell>
                    <ng-template
                      [flexRender]="cell.column.columnDef.cell"
                      [flexRenderProps]="cell.getContext()"
                      let-primitive="$implicit"
                    >
                      <span>{{ primitive }}</span>
                    </ng-template>
                  </td>
                }
              </tr>
            } @empty {
              <tr hlmTableRow>
                <td
                  hlmTableCell
                  class="text-muted-foreground h-24 text-center"
                  [attr.colspan]="totalColumnCount()"
                >
                  {{ emptyBodyMessage() }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="text-muted-foreground flex flex-col justify-between gap-2 py-4 text-sm sm:flex-row sm:items-center">
      @if (table.getRowCount() > 0) {
        <div>
          {{ table.getSelectedRowModel().rows.length }} of {{ table.getRowCount() }} row(s) selected
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap">Rows per page</span>
            <div
              hlmCombobox
              [value]="selectedPageSizeOption()"
              [itemToString]="pageSizeOptionToString"
              [isItemEqualToValue]="isSamePageSizeOption"
              (valueChange)="onPageSizeOptionChange($event)"
            >
              <hlm-combobox-trigger class="h-9 min-w-20 justify-between">
                <span>{{ selectedPageSizeOption().label }}</span>
              </hlm-combobox-trigger>
              <ng-template hlmComboboxPortal>
                <div hlmComboboxContent>
                  <div hlmComboboxList>
                    @for (option of pageSizeOptions; track option.value) {
                      <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
                    }
                  </div>
                </div>
              </ng-template>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              hlmBtn
              variant="outline"
              size="icon-sm"
              type="button"
              [disabled]="!table.getCanPreviousPage()"
              (click)="goToFirstPage()"
            >
              <ng-icon hlm name="lucideChevronsLeft" size="sm" />
            </button>
            <button
              hlmBtn
              variant="outline"
              size="icon-sm"
              type="button"
              [disabled]="!table.getCanPreviousPage()"
              (click)="table.previousPage()"
            >
              <ng-icon hlm name="lucideChevronLeft" size="sm" />
            </button>
            <span class="text-muted-foreground whitespace-nowrap">
              Page {{ table.getState().pagination.pageIndex + 1 }} of {{ pageCount() }}
            </span>
            <button
              hlmBtn
              variant="outline"
              size="icon-sm"
              type="button"
              [disabled]="!table.getCanNextPage()"
              (click)="table.nextPage()"
            >
              <ng-icon hlm name="lucideChevronRight" size="sm" />
            </button>
            <button
              hlmBtn
              variant="outline"
              size="icon-sm"
              type="button"
              [disabled]="!table.getCanNextPage()"
              (click)="goToLastPage()"
            >
              <ng-icon hlm name="lucideChevronsRight" size="sm" />
            </button>
          </div>
        </div>
      }
    </div>

    <ng-template #rowMenu let-entityId="entityId">
      <app-row-context-menu
        [entityId]="entityId"
        [canArchive]="canArchive()"
        (addRequested)="addRequested.emit()"
        (editRequested)="editRequested.emit($event)"
        (deleteRequested)="deleteRequested.emit($event)"
        (archiveRequested)="archiveRequested.emit($event)"
      />
    </ng-template>
  `,
})
export class EntityDataTableComponent {
  /** Defaults avoid TanStack init reading inputs before the first bind (e.g. in tests). Parents still pass real values. */
  readonly data = input<readonly EntityTableRow[]>([]);
  readonly columns = input<ColumnDef<EntityTableRow>[]>([]);
  readonly globalFilterRowText = input<(row: EntityTableRow) => string>(defaultGlobalFilterRowText);
  readonly columnFiltersConfig = input<readonly EntityDataTableColumnFilter[]>([]);
  readonly filterPlaceholder = input('Filter…');
  readonly emptyMessage = input('No rows yet.');
  readonly canArchive = input(true);

  readonly addRequested = output<void>();
  readonly editRequested = output<number>();
  readonly deleteRequested = output<number>();
  readonly archiveRequested = output<number>();

  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  private readonly sorting = signal<SortingState>([]);
  private readonly columnFilters = signal<ColumnFiltersState>([]);
  private readonly rowSelection = signal<RowSelectionState>({});
  private readonly columnVisibility = signal<VisibilityState>({});
  protected readonly globalFilter = signal('');
  protected readonly pagination = signal<PaginationState>({ pageIndex: 0, pageSize: 10 });

  private readonly selectColumnDef: ColumnDef<EntityTableRow> = {
    id: 'select',
    header: () => flexRenderComponent(DataTableSelectHeadComponent),
    cell: () => flexRenderComponent(DataTableSelectCellComponent),
    enableSorting: false,
    enableHiding: false,
    enableGlobalFilter: false,
  };

  private readonly fullColumns = computed((): ColumnDef<EntityTableRow>[] => [
    this.selectColumnDef,
    ...this.columns(),
  ]);

  protected readonly totalColumnCount = computed(() => this.fullColumns().length);

  protected readonly emptyBodyMessage = computed(() =>
    this.data().length === 0 ? this.emptyMessage() : 'No matching rows.',
  );

  protected readonly table = createAngularTable<EntityTableRow>(() => ({
    data: [...this.data()],
    columns: this.fullColumns(),
    getRowId: (originalRow) => String(originalRow.id),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    enableSortingRemoval: true,
    enableGlobalFilter: true,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? '')
        .trim()
        .toLowerCase();
      if (!q) {
        return true;
      }
      return this.globalFilterRowText()(row.original).toLowerCase().includes(q);
    },
    onSortingChange: (updater) => {
      this.sorting.update((prev) =>
        typeof updater === 'function' ? updater(prev) : updater,
      );
    },
    onColumnFiltersChange: (updater) => {
      this.columnFilters.update((prev) =>
        typeof updater === 'function' ? updater(prev) : updater,
      );
    },
    onRowSelectionChange: (updater) => {
      this.rowSelection.update((prev) =>
        typeof updater === 'function' ? updater(prev) : updater,
      );
    },
    onColumnVisibilityChange: (updater) => {
      this.columnVisibility.update((prev) =>
        typeof updater === 'function' ? updater(prev) : updater,
      );
    },
    onGlobalFilterChange: (updater) => {
      this.globalFilter.update((prev) =>
        typeof updater === 'function' ? updater(prev) : updater,
      );
    },
    onPaginationChange: (updater) => {
      this.pagination.update((prev) =>
        typeof updater === 'function' ? updater(prev) : updater,
      );
    },
    state: {
      sorting: this.sorting(),
      columnFilters: this.columnFilters(),
      rowSelection: this.rowSelection(),
      columnVisibility: this.columnVisibility(),
      globalFilter: this.globalFilter(),
      pagination: this.pagination(),
    },
  }));

  protected readonly hidableColumns = computed(() =>
    this.table.getAllColumns().filter((column) => column.getCanHide()),
  );

  protected readonly pageCount = computed(() => Math.max(1, this.table.getPageCount()));

  protected columnMenuLabel(column: { id: string; columnDef: ColumnDef<EntityTableRow> }): string {
    const meta = column.columnDef.meta as { columnMenuLabel?: string } | undefined;
    return meta?.columnMenuLabel ?? column.id;
  }

  protected onGlobalFilterInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.table.setGlobalFilter(value);
  }

  protected readonly selectedPageSizeOption = computed(() => {
    const pageSize = this.pagination().pageSize;
    return this.pageSizeOptions.find((option) => option.value === pageSize) ?? this.pageSizeOptions[0] ?? null;
  });

  protected onPageSizeOptionChange(option: PageSizeOption | null): void {
    this.table.setPageSize(option?.value ?? 10);
  }

  protected selectedFilterOption(
    columnId: string,
    options: readonly EntityDataTableFilterOption[],
  ): EntityDataTableFilterOption | null {
    const value = (this.table.getColumn(columnId)?.getFilterValue() as string | undefined) ?? '';
    return options.find((opt) => opt.value === value) ?? null;
  }

  protected onColumnFilterChange(
    columnId: string,
    option: EntityDataTableFilterOption | null,
  ): void {
    this.table.getColumn(columnId)?.setFilterValue(option?.value || undefined);
    this.table.setPageIndex(0);
  }

  protected readonly filterOptionToString = (option: EntityDataTableFilterOption | null): string =>
    option?.label ?? '';

  protected readonly isSameFilterOption = (
    left: EntityDataTableFilterOption | null,
    right: EntityDataTableFilterOption | null,
  ): boolean => left?.value === right?.value;

  protected readonly pageSizeOptionToString = (option: PageSizeOption | null): string => option?.label ?? '';

  protected readonly isSamePageSizeOption = (
    left: PageSizeOption | null,
    right: PageSizeOption | null,
  ): boolean => left?.value === right?.value;

  protected goToFirstPage(): void {
    this.table.setPageIndex(0);
  }

  protected goToLastPage(): void {
    this.table.setPageIndex(Math.max(0, this.pageCount() - 1));
  }
}
