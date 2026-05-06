import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ColumnDef } from '@tanstack/table-core';
import { EntityDataTableComponent } from '../../../../shared/components/entity-data-table/entity-data-table.component';
import type { EntityTableRow } from '../../../../shared/components/entity-data-table/entity-table-row.model';
import { ClientVM } from '../../models/client.vm';
import { clientGlobalFilterText, createClientColumns } from './clients-table.columns';

@Component({
  selector: 'app-clients-table',
  imports: [EntityDataTableComponent],
  template: `
    <app-entity-data-table
      [data]="clients()"
      [columns]="columns()"
      [globalFilterRowText]="globalFilterRowTextFn"
      filterPlaceholder="Filter clients…"
      emptyMessage="No clients yet."
      (addRequested)="addRequested.emit()"
      (editRequested)="editRequested.emit($event)"
      (deleteRequested)="deleteRequested.emit($event)"
      (archiveRequested)="archiveRequested.emit($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsTableComponent {
  readonly clients = input.required<ClientVM[]>();
  readonly accentSwatchResolver = input.required<
    (accent: string | null | undefined, clientId: number) => string
  >();

  readonly addRequested = output<void>();
  readonly editRequested = output<number>();
  readonly deleteRequested = output<number>();
  readonly archiveRequested = output<number>();

  protected readonly globalFilterRowTextFn = clientGlobalFilterText;

  protected readonly columns = computed(
    () => createClientColumns(this.accentSwatchResolver()) as ColumnDef<EntityTableRow>[],
  );
}
