import { flexRenderComponent } from '@tanstack/angular-table';
import type { ColumnDef } from '@tanstack/table-core';
import { DataTableSortHeaderComponent } from '../../../../shared/components/entity-data-table/data-table-sort-header.component';
import type { EntityTableRow } from '../../../../shared/components/entity-data-table/entity-table-row.model';
import { OrderVM } from '../../models/order.vm';
import { OrderCodeCellComponent, OrderProjectCellComponent } from './order-table-cells.component';

export function createOrderColumns(): ColumnDef<OrderVM>[] {
  return [
    {
      id: 'order',
      accessorKey: 'code',
      meta: { headerLabel: 'Order', columnMenuLabel: 'Order' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: () => flexRenderComponent(OrderCodeCellComponent),
      enableSorting: true,
    },
    {
      id: 'project',
      accessorFn: (row) => `${row.projectName} ${row.projectCode}`,
      meta: { headerLabel: 'Project', columnMenuLabel: 'Project' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: () => flexRenderComponent(OrderProjectCellComponent),
      enableSorting: true,
    },
    {
      accessorKey: 'isActive',
      id: 'status',
      meta: { headerLabel: 'Status', columnMenuLabel: 'Status' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => (info.getValue<boolean>() ? 'Active' : 'Inactive'),
      enableSorting: true,
    },
    {
      accessorKey: 'timeEntryCount',
      id: 'entries',
      meta: { headerLabel: 'Entries', columnMenuLabel: 'Entries' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => String(info.getValue()),
      enableSorting: true,
    },
  ];
}

export function orderGlobalFilterText(row: EntityTableRow): string {
  const o = row as OrderVM;
  return [
    o.code,
    o.title,
    o.projectName,
    o.projectCode,
    o.isActive ? 'active' : 'inactive',
    String(o.timeEntryCount),
  ]
    .filter(Boolean)
    .join(' ');
}
