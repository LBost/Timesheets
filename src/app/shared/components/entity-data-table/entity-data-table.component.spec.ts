import { TestBed } from '@angular/core/testing';
import { flexRenderComponent } from '@tanstack/angular-table';
import type { ColumnDef } from '@tanstack/table-core';
import { DataTableSortHeaderComponent } from './data-table-sort-header.component';
import { EntityDataTableComponent } from './entity-data-table.component';
import type { EntityTableRow } from './entity-table-row.model';

type DemoRow = EntityTableRow & { name: string };

describe('EntityDataTableComponent', () => {
  const columns: ColumnDef<DemoRow>[] = [
    {
      accessorKey: 'name',
      id: 'name',
      meta: { headerLabel: 'Name', columnMenuLabel: 'Name' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => String(info.getValue()),
      enableSorting: true,
    },
  ];

  const data: DemoRow[] = [
    { id: 1, name: 'Alpha' },
    { id: 2, name: 'Beta' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDataTableComponent],
    }).compileComponents();
  });

  it('renders rows and selection summary', () => {
    const fixture = TestBed.createComponent(EntityDataTableComponent);
    fixture.componentRef.setInput('data', data);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('globalFilterRowText', (row: EntityTableRow) => (row as DemoRow).name);
    fixture.detectChanges();

    const bodyRows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(bodyRows.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('0 of 2 row(s) selected');
    expect(fixture.nativeElement.textContent).toContain('Alpha');
    expect(fixture.nativeElement.textContent).toContain('Beta');
  });

  it('filters rows by global filter', () => {
    const fixture = TestBed.createComponent(EntityDataTableComponent);
    fixture.componentRef.setInput('data', data);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('globalFilterRowText', (row: EntityTableRow) => (row as DemoRow).name);
    fixture.detectChanges();

    const filterEl = fixture.nativeElement.querySelector('input') as HTMLInputElement | null;
    expect(filterEl).toBeTruthy();
    filterEl!.value = 'Beta';
    filterEl!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const bodyRows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(bodyRows.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Beta');
    expect(fixture.nativeElement.textContent).not.toContain('Alpha');
  });
});
