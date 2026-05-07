import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ColumnDef } from '@tanstack/table-core';
import {
  type EntityDataTableColumnFilter,
  EntityDataTableComponent,
} from '../../../../shared/components/entity-data-table/entity-data-table.component';
import type { EntityTableRow } from '../../../../shared/components/entity-data-table/entity-table-row.model';
import { InvoiceVM } from '../../models/invoice.vm';
import { createInvoiceColumns, invoiceGlobalFilterText } from './invoices-table.columns';

@Component({
  selector: 'app-invoices-table',
  imports: [EntityDataTableComponent],
  template: `
    <app-entity-data-table
      [data]="invoices()"
      [columns]="columns"
      [globalFilterRowText]="globalFilterRowTextFn"
      [columnFiltersConfig]="columnFilters()"
      filterPlaceholder="Filter invoices..."
      emptyMessage="No invoices yet."
      [canArchive]="false"
      (addRequested)="addRequested.emit()"
      (editRequested)="editRequested.emit($event)"
      (deleteRequested)="deleteRequested.emit($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesTableComponent {
  readonly invoices = input.required<InvoiceVM[]>();

  readonly addRequested = output<void>();
  readonly editRequested = output<number>();
  readonly deleteRequested = output<number>();

  protected readonly columns = createInvoiceColumns() as ColumnDef<EntityTableRow>[];
  protected readonly globalFilterRowTextFn = invoiceGlobalFilterText;
  protected readonly columnFilters = computed<readonly EntityDataTableColumnFilter[]>(() => {
    const clients = [...new Set(this.invoices().map((i) => i.clientName))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const statuses = [...new Set(this.invoices().map((i) => i.status))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return [
      {
        columnId: 'client',
        label: 'Clients',
        options: clients.map((name) => ({ label: name, value: name })),
      },
      {
        columnId: 'status',
        label: 'Statuses',
        options: statuses.map((status) => ({ label: status.toUpperCase(), value: status })),
      },
    ];
  });
}
