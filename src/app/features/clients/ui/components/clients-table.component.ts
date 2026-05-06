import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { RowContextMenuComponent } from '../../../../shared/components/row-context-menu/row-context-menu.component';
import { ClientVM } from '../../models/client.vm';

@Component({
  selector: 'app-clients-table',
  imports: [DatePipe, HlmTableImports, HlmContextMenuImports, RowContextMenuComponent],
  template: `
    <div hlmTableContainer class="rounded-lg border border-border">
      <table hlmTable>
        <thead hlmTableHeader>
          <tr hlmTableRow>
            <th hlmTableHead>Client</th>
            <th hlmTableHead class="w-12 text-center">Accent</th>
            <th hlmTableHead>Contact</th>
            <th hlmTableHead>Projects</th>
            <th hlmTableHead>Status</th>
          </tr>
        </thead>
        <tbody hlmTableBody>
          @for (client of clients(); track client.id) {
            <tr
              hlmTableRow
              [hlmContextMenuTrigger]="rowMenu"
              [hlmContextMenuTriggerData]="{ clientId: client.id }"
            >
              <td hlmTableCell>
                <div class="font-medium">{{ client.name }}</div>
                <div class="text-xs text-muted-foreground">
                  Created {{ client.createdAt | date: 'mediumDate' }}
                </div>
              </td>
              <td hlmTableCell class="text-center">
                <span
                  class="inline-block size-4 rounded-full ring-1 ring-border"
                  [style.background-color]="accentSwatchResolver()(client.accentColor, client.id)"
                  aria-hidden="true"
                ></span>
              </td>
              <td hlmTableCell class="text-muted-foreground">
                <div>{{ client.email || 'No email' }}</div>
                <div>{{ client.phone || 'No phone' }}</div>
              </td>
              <td hlmTableCell>{{ client.projectCount }}</td>
              <td hlmTableCell>{{ client.isActive ? 'Active' : 'Inactive' }}</td>
            </tr>
          } @empty {
            <tr hlmTableRow>
              <td hlmTableCell class="py-4 text-muted-foreground" colspan="5">No clients yet.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <ng-template #rowMenu let-clientId="clientId">
      <app-row-context-menu
        [entityId]="clientId"
        (addRequested)="addRequested.emit()"
        (editRequested)="editRequested.emit($event)"
        (deleteRequested)="deleteRequested.emit($event)"
        (archiveRequested)="archiveRequested.emit($event)"
      />
    </ng-template>
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
}
