import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ColumnDef } from '@tanstack/table-core';
import {
  type EntityDataTableColumnFilter,
  EntityDataTableComponent,
} from '../../../../shared/components/entity-data-table/entity-data-table.component';
import type { EntityTableRow } from '../../../../shared/components/entity-data-table/entity-table-row.model';
import { OrderVM } from '../../models/order.vm';
import { createOrderColumns, orderGlobalFilterText } from './orders-table.columns';

@Component({
  selector: 'app-orders-table',
  imports: [EntityDataTableComponent],
  template: `
    <app-entity-data-table
      [data]="orders()"
      [columns]="columns"
      [globalFilterRowText]="globalFilterRowTextFn"
      [columnFiltersConfig]="columnFilters()"
      filterPlaceholder="Filter orders…"
      emptyMessage="No orders yet."
      (addRequested)="addRequested.emit()"
      (editRequested)="editRequested.emit($event)"
      (deleteRequested)="deleteRequested.emit($event)"
      (archiveRequested)="archiveRequested.emit($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersTableComponent {
  readonly orders = input.required<OrderVM[]>();

  readonly addRequested = output<void>();
  readonly editRequested = output<number>();
  readonly deleteRequested = output<number>();
  readonly archiveRequested = output<number>();

  protected readonly columns = createOrderColumns() as ColumnDef<EntityTableRow>[];
  protected readonly globalFilterRowTextFn = orderGlobalFilterText;
  protected readonly columnFilters = computed<readonly EntityDataTableColumnFilter[]>(() => {
    const projectNames = [...new Set(this.orders().map((o) => o.projectName))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return [
      {
        columnId: 'project',
        label: 'Project',
        options: projectNames.map((name) => ({ label: name, value: name })),
      },
      {
        columnId: 'status',
        label: 'Status',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    ];
  });
}
