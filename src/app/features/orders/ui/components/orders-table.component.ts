import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ColumnDef } from '@tanstack/table-core';
import { EntityDataTableComponent } from '../../../../shared/components/entity-data-table/entity-data-table.component';
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
}
