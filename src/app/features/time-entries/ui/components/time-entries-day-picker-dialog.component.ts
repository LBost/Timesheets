import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';

@Component({
  selector: 'app-time-entries-day-picker-dialog',
  imports: [HlmDialogImports],
  template: `
    <hlm-dialog
      [state]="state()"
      [ariaLabel]="ariaLabel()"
      [ariaModal]="true"
      (closed)="closed.emit()"
    >
      <ng-template hlmDialogPortal>
        <hlm-dialog-content
          [showCloseButton]="true"
          class="max-h-[min(70vh,520px)] gap-0 overflow-hidden border-border p-0 shadow-sm sm:max-w-md"
        >
          @if (pickerDate(); as pickerDateValue) {
            <hlm-dialog-header class="border-b border-border px-4 pb-3 pe-14 pt-4 text-start">
              <h2 hlmDialogTitle class="text-base">{{ formatDayHeading()(pickerDateValue) }}</h2>
              <p hlmDialogDescription class="text-xs">
                {{ entries().length }} entries · {{ dayTotal().toFixed(2) }} h total
              </p>
            </hlm-dialog-header>
            <div class="max-h-[min(55vh,400px)] overflow-y-auto p-2">
              @for (entry of entries(); track entry.id) {
                <button
                  type="button"
                  class="relative mb-2 w-full rounded-md border border-border border-l-[3px] bg-card px-3 py-2 text-left text-sm last:mb-0 hover:bg-accent/70"
                  [style.border-left-color]="entryClientAccent()(entry)"
                  (click)="entryPicked.emit(entry.id)"
                >
                  <div class="font-medium">{{ entry.projectCode }}{{ entry.orderCode ? ' / ' + entry.orderCode : '' }}</div>
                  <div class="text-xs text-muted-foreground">{{ entry.hours.toFixed(2) }}h · {{ entry.clientName }}</div>
                  @if (entry.lockedByInvoiceId !== null) {
                    <span
                      class="pointer-events-none absolute right-2 top-2 inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500/70"
                      aria-hidden="true"
                    ></span>
                  }
                </button>
              }
            </div>
          }
        </hlm-dialog-content>
      </ng-template>
    </hlm-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntriesDayPickerDialogComponent {
  readonly state = input.required<'open' | 'closed'>();
  readonly ariaLabel = input.required<string>();
  readonly pickerDate = input<string | null>(null);
  readonly entries = input.required<any[]>();
  readonly dayTotal = input.required<number>();
  readonly formatDayHeading = input.required<(isoDate: string) => string>();
  readonly entryClientAccent = input.required<(entry: any) => string>();

  readonly closed = output<void>();
  readonly entryPicked = output<number>();
}
