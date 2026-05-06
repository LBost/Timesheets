import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { RowContextMenuComponent } from '../../../../shared/components/row-context-menu/row-context-menu.component';
import { ProjectVM } from '../../models/project.vm';

@Component({
  selector: 'app-projects-table',
  imports: [HlmTableImports, HlmContextMenuImports, RowContextMenuComponent],
  template: `
    <div hlmTableContainer class="rounded-lg border border-border">
      <table hlmTable>
        <thead hlmTHead>
          <tr hlmTr>
            <th hlmTh>Project</th>
            <th hlmTh>Client</th>
            <th hlmTh>Billing</th>
            <th hlmTh>Entries</th>
          </tr>
        </thead>
        <tbody hlmTBody>
          @for (project of projects(); track project.id) {
            <tr hlmTr [hlmContextMenuTrigger]="rowMenu" [hlmContextMenuTriggerData]="{ projectId: project.id }">
              <td hlmTd>
                <div class="font-medium">{{ project.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ project.code }} · {{ project.currency }} {{ project.unitRate }}/{{ project.unit }}
                </div>
              </td>
              <td hlmTd>
                <div>{{ project.clientName }}</div>
                <div class="text-xs text-muted-foreground">Client #{{ project.clientId }}</div>
              </td>
              <td hlmTd>
                <div>{{ project.billingModel || 'None' }}</div>
                <div class="text-xs text-muted-foreground">{{ project.isActive ? 'Active' : 'Inactive' }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ project.useOrders ? 'Orders required' : 'Orders optional' }}
                </div>
              </td>
              <td hlmTd>{{ project.timeEntryCount }}</td>
            </tr>
          } @empty {
            <tr hlmTr>
              <td hlmTd colspan="4" class="text-muted-foreground">No projects yet.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <ng-template #rowMenu let-projectId="projectId">
      <app-row-context-menu
        [entityId]="projectId"
        (addRequested)="addRequested.emit()"
        (editRequested)="editRequested.emit($event)"
        (deleteRequested)="deleteRequested.emit($event)"
        (archiveRequested)="archiveRequested.emit($event)"
      />
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsTableComponent {
  readonly projects = input.required<ProjectVM[]>();
  readonly addRequested = output<void>();
  readonly editRequested = output<number>();
  readonly deleteRequested = output<number>();
  readonly archiveRequested = output<number>();
}
