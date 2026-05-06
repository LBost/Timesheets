import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ColumnDef } from '@tanstack/table-core';
import { EntityDataTableComponent } from '../../../../shared/components/entity-data-table/entity-data-table.component';
import type { EntityTableRow } from '../../../../shared/components/entity-data-table/entity-table-row.model';
import { ProjectVM } from '../../models/project.vm';
import { createProjectColumns, projectGlobalFilterText } from './projects-table.columns';

@Component({
  selector: 'app-projects-table',
  imports: [EntityDataTableComponent],
  template: `
    <app-entity-data-table
      [data]="projects()"
      [columns]="columns"
      [globalFilterRowText]="globalFilterRowTextFn"
      filterPlaceholder="Filter projects…"
      emptyMessage="No projects yet."
      (addRequested)="addRequested.emit()"
      (editRequested)="editRequested.emit($event)"
      (deleteRequested)="deleteRequested.emit($event)"
      (archiveRequested)="archiveRequested.emit($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsTableComponent {
  readonly projects = input.required<ProjectVM[]>();

  readonly addRequested = output<void>();
  readonly editRequested = output<number>();
  readonly deleteRequested = output<number>();
  readonly archiveRequested = output<number>();

  protected readonly columns = createProjectColumns() as ColumnDef<EntityTableRow>[];
  protected readonly globalFilterRowTextFn = projectGlobalFilterText;
}
