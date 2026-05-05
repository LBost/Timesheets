import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArchive, lucidePencil, lucidePlus, lucideTrash2 } from '@ng-icons/lucide';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmIcon } from '@spartan-ng/helm/icon';

@Component({
  selector: 'app-row-context-menu',
  imports: [HlmDropdownMenuImports, HlmIcon, NgIcon],
  providers: [provideIcons({ lucidePlus, lucidePencil, lucideTrash2, lucideArchive })],
  template: `
    <div
      hlmDropdownMenu
      class="border-border/40 bg-card/95 shadow-lg shadow-black/20 backdrop-blur-sm"
    >
      <button hlmDropdownMenuItem (triggered)="addRequested.emit()">
        <ng-icon hlm name="lucidePlus" size="sm" aria-hidden="true" />
        Add
      </button>
      <button hlmDropdownMenuItem (triggered)="editRequested.emit(entityId())">
        <ng-icon hlm name="lucidePencil" size="sm" aria-hidden="true" />
        Edit
      </button>
      <button
        variant="destructive"
        hlmDropdownMenuItem
        (triggered)="deleteRequested.emit(entityId())"
      >
        <ng-icon hlm name="lucideTrash2" size="sm" aria-hidden="true" />
        Delete
      </button>
      @if (canArchive()) {
        <button hlmDropdownMenuItem (triggered)="archiveRequested.emit(entityId())">
          <ng-icon hlm name="lucideArchive" size="sm" aria-hidden="true" />
          Archive
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowContextMenuComponent {
  readonly entityId = input.required<number>();
  readonly canArchive = input(true);

  readonly addRequested = output<void>();
  readonly editRequested = output<number>();
  readonly deleteRequested = output<number>();
  readonly archiveRequested = output<number>();
}
