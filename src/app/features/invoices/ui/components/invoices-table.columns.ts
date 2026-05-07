import { flexRenderComponent } from '@tanstack/angular-table';
import type { ColumnDef } from '@tanstack/table-core';
import { DataTableSortHeaderComponent } from '../../../../shared/components/entity-data-table/data-table-sort-header.component';
import type { EntityTableRow } from '../../../../shared/components/entity-data-table/entity-table-row.model';
import { formatInvoicePeriodLabel } from '../../data/invoice-period.util';
import { InvoiceVM } from '../../models/invoice.vm';

export function createInvoiceColumns(): ColumnDef<InvoiceVM>[] {
  return [
    {
      id: 'number',
      accessorKey: 'invoiceNumber',
      meta: { headerLabel: 'Invoice', columnMenuLabel: 'Invoice' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => info.getValue<string>(),
      enableSorting: true,
    },
    {
      id: 'client',
      accessorKey: 'clientName',
      meta: { headerLabel: 'Client', columnMenuLabel: 'Client' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => info.getValue<string>(),
      enableSorting: true,
      filterFn: (row, columnId, filterValue) => !filterValue || row.getValue<string>(columnId) === filterValue,
    },
    {
      id: 'period',
      accessorFn: (row) => formatInvoicePeriodLabel(row.periodStart, row.periodEnd),
      meta: { headerLabel: 'Period', columnMenuLabel: 'Period' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => info.getValue<string>(),
      enableSorting: true,
      sortingFn: (rowA, rowB) =>
        (rowA.original as InvoiceVM).periodStart.localeCompare(
          (rowB.original as InvoiceVM).periodStart,
        ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      meta: { headerLabel: 'Status', columnMenuLabel: 'Status' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => String(info.getValue<string>()).toUpperCase(),
      enableSorting: true,
      filterFn: (row, columnId, filterValue) => !filterValue || row.getValue<string>(columnId) === filterValue,
    },
    {
      id: 'gross',
      accessorKey: 'totalGross',
      meta: { headerLabel: 'Gross', columnMenuLabel: 'Gross' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => Number(info.getValue<number>()).toLocaleString(),
      enableSorting: true,
    },
    {
      id: 'lines',
      accessorKey: 'lineItemCount',
      meta: { headerLabel: 'Lines', columnMenuLabel: 'Lines' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => String(info.getValue<number>()),
      enableSorting: true,
    },
  ];
}

export function invoiceGlobalFilterText(row: EntityTableRow): string {
  const invoice = row as InvoiceVM;
  return [
    invoice.invoiceNumber,
    invoice.clientName,
    invoice.status,
    invoice.periodStart,
    invoice.periodEnd,
    formatInvoicePeriodLabel(invoice.periodStart, invoice.periodEnd),
    String(invoice.totalGross),
    String(invoice.lineItemCount),
  ]
    .filter(Boolean)
    .join(' ');
}
