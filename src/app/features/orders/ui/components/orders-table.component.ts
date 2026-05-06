import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { RowContextMenuComponent } from '../../../../shared/components/row-context-menu/row-context-menu.component';
import { OrderVM } from '../../models/order.vm';

@Component({
  selector: 'app-orders-table',
  imports: [HlmTableImports, HlmContextMenuImports, RowContextMenuComponent],
  template: `
    <div hlmTableContainer class="rounded-lg border border-border">
      <table hlmTable>
        <thead hlmTHead>
          <tr hlmTr>
            <th hlmTh>Order</th>
            <th hlmTh>Project</th>
            <th hlmTh>Status</th>
            <th hlmTh>Entries</th>
          </tr>
        </thead>
        <tbody hlmTBody>
          @for (order of orders(); track order.id) {
            <tr hlmTr [hlmContextMenuTrigger]="rowMenu" [hlmContextMenuTriggerData]="{ orderId: order.id }">
              <td hlmTd>
                <div class="font-medium">{{ order.code }}</div>
                <div class="text-xs text-muted-foreground">{{ order.title }}</div>
              </td>
              <td hlmTd>
                <div>{{ order.projectName }}</div>
                <div class="text-xs text-muted-foreground">{{ order.projectCode }}</div>
              </td>
              <td hlmTd>{{ order.isActive ? 'Active' : 'Inactive' }}</td>
              <td hlmTd>{{ order.timeEntryCount }}</td>
            </tr>
          } @empty {
            <tr hlmTr>
              <td hlmTd colspan="4" class="text-muted-foreground">No orders yet.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <ng-template #rowMenu let-orderId="orderId">
      <app-row-context-menu
        [entityId]="orderId"
        (addRequested)="addRequested.emit()"
        (editRequested)="editRequested.emit($event)"
        (deleteRequested)="deleteRequested.emit($event)"
        (archiveRequested)="archiveRequested.emit($event)"
      />
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersTableComponent {
  readonly orders = input.required<OrderVM[]>();
  readonly addRequested = output<void>();
  readonly editRequested = output<number>();
  readonly deleteRequested = output<number>();
  readonly archiveRequested = output<number>();
}
