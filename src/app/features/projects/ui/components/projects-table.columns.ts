import { flexRenderComponent } from '@tanstack/angular-table';
import type { ColumnDef } from '@tanstack/table-core';
import { DataTableSortHeaderComponent } from '../../../../shared/components/entity-data-table/data-table-sort-header.component';
import type { EntityTableRow } from '../../../../shared/components/entity-data-table/entity-table-row.model';
import { ProjectVM } from '../../models/project.vm';
import {
  ProjectBillingCellComponent,
  ProjectClientCellComponent,
  ProjectTitleCellComponent,
} from './project-table-cells.component';

export function createProjectColumns(): ColumnDef<ProjectVM>[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      meta: { headerLabel: 'Project', columnMenuLabel: 'Project' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: () => flexRenderComponent(ProjectTitleCellComponent),
      enableSorting: true,
    },
    {
      id: 'client',
      accessorFn: (row) => `${row.clientName} ${row.clientId}`,
      meta: { headerLabel: 'Client', columnMenuLabel: 'Client' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: () => flexRenderComponent(ProjectClientCellComponent),
      enableSorting: true,
    },
    {
      id: 'billing',
      accessorFn: (row) => [row.billingModel, row.isActive ? 'active' : 'inactive'].join(' '),
      meta: { headerLabel: 'Billing', columnMenuLabel: 'Billing' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: () => flexRenderComponent(ProjectBillingCellComponent),
      enableSorting: false,
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

export function projectGlobalFilterText(row: EntityTableRow): string {
  const p = row as ProjectVM;
  return [
    p.name,
    p.code,
    p.clientName,
    String(p.clientId),
    p.billingModel ?? '',
    p.currency,
    String(p.unitRate),
    p.unit,
    p.isActive ? 'active' : 'inactive',
    p.useOrders ? 'orders required' : 'orders optional',
    String(p.timeEntryCount),
  ]
    .filter(Boolean)
    .join(' ');
}
