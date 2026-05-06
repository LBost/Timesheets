import { flexRenderComponent } from '@tanstack/angular-table';
import type { ColumnDef } from '@tanstack/table-core';
import { DataTableSortHeaderComponent } from '../../../../shared/components/entity-data-table/data-table-sort-header.component';
import type { EntityTableRow } from '../../../../shared/components/entity-data-table/entity-table-row.model';
import { ClientVM } from '../../models/client.vm';
import {
  ClientAccentCellComponent,
  ClientContactCellComponent,
  ClientNameCellComponent,
} from './client-table-cells.component';

export function createClientColumns(
  accentSwatchResolver: (accent: string | null | undefined, clientId: number) => string,
): ColumnDef<ClientVM>[] {
  return [
    {
      accessorKey: 'name',
      id: 'name',
      meta: { headerLabel: 'Client', columnMenuLabel: 'Client' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: () => flexRenderComponent(ClientNameCellComponent),
      enableSorting: true,
    },
    {
      id: 'accent',
      accessorFn: (row) => row.accentColor ?? '',
      meta: { headerLabel: 'Accent', columnMenuLabel: 'Accent', accentSwatchResolver },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: () => flexRenderComponent(ClientAccentCellComponent),
      enableSorting: false,
    },
    {
      id: 'contact',
      accessorFn: (row) => [row.email, row.phone].filter(Boolean).join(' '),
      meta: { headerLabel: 'Contact', columnMenuLabel: 'Contact' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: () => flexRenderComponent(ClientContactCellComponent),
      enableSorting: true,
    },
    {
      accessorKey: 'projectCount',
      id: 'projectCount',
      meta: { headerLabel: 'Projects', columnMenuLabel: 'Projects' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => String(info.getValue()),
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
  ];
}

export function clientGlobalFilterText(row: EntityTableRow): string {
  const c = row as ClientVM;
  return [
    c.name,
    c.email,
    c.phone,
    c.isActive ? 'active' : 'inactive',
    String(c.projectCount),
    c.accentColor ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}
