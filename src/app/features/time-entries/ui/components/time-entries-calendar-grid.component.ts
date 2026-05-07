import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLayers, lucidePlus } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';

export type EntryInvoicedSummaryState = {
  state: 'none' | 'partial' | 'all';
  invoiced: number;
  total: number;
};

type CalendarDay = {
  date: string | null;
  dayNumber: number;
  inCurrentMonth: boolean;
};

@Component({
  selector: 'app-time-entries-calendar-grid',
  imports: [HlmButtonImports, NgIcon, HlmIcon],
  providers: [provideIcons({ lucidePlus, lucideLayers })],
  template: `
    <div class="overflow-hidden rounded-lg border border-border">
      <div class="grid grid-cols-7 border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wide">
        @for (label of weekdayLabels(); track label) {
          <div class="border-r border-border p-2 last:border-r-0">{{ label }}</div>
        }
      </div>

      <div class="grid grid-cols-7">
        @for (day of calendarDays(); track day.date ?? $index) {
          <div
            class="relative min-h-32 border-r border-b border-border p-2 last:border-r-0"
            [class.bg-muted/20]="!day.inCurrentMonth"
          >
            <div class="mb-2 flex items-center justify-between text-xs">
              <span class="font-medium">{{ day.dayNumber }}</span>
              @if (day.date) {
                <button hlmBtn variant="ghost" size="icon" type="button" class="cursor-pointer" (click)="addForDate.emit(day.date)">
                  <ng-icon hlm name="lucidePlus" size="sm" aria-hidden="true" />
                </button>
              }
            </div>

            @if (day.date) {
              @let entries = entriesForDate()(day.date);
              <div class="mb-1 text-xs text-muted-foreground">{{ dayTotal()(day.date).toFixed(2) }} h</div>
              @if (entries.length === 1) {
                @let entry = entries[0];
                <button
                  type="button"
                  class="relative w-full rounded border border-border/50 border-l-[3px] bg-card px-2 py-1 text-left text-[11px] leading-tight hover:bg-accent cursor-pointer"
                  [style.border-left-color]="entryClientAccent()(entry)"
                  (click)="editEntry.emit(entry.id)"
                >
                  <div class="font-medium">{{ entry.projectCode }}{{ entry.orderCode ? ' / ' + entry.orderCode : '' }}</div>
                  <div class="text-muted-foreground">{{ entry.hours.toFixed(2) }}h · {{ entry.clientName }}</div>
                  @if (entry.lockedByInvoiceId !== null) {
                    <span
                      data-testid="invoiced-accent"
                      class="pointer-events-none absolute right-1 top-1 inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500/70"
                      aria-hidden="true"
                    ></span>
                  }
                </button>
              } @else if (entries.length > 1) {
                @let inv = entryInvoicedSummary()(day.date);
                <button
                  type="button"
                  class="relative mt-0.5 w-full touch-manipulation text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  (click)="openDayEntriesPicker.emit(day.date)"
                  [attr.aria-label]="
                    inv.state === 'none'
                      ? 'View ' + entries.length + ' entries on ' + formatDayHeading()(day.date)
                      : 'View ' +
                          entries.length +
                          ' entries on ' +
                          formatDayHeading()(day.date) +
                          ', ' +
                          inv.invoiced +
                          ' of ' +
                          inv.total +
                          ' invoiced'
                  "
                >
                  <span class="pointer-events-none absolute inset-x-3 top-0 z-0 h-9 rounded-md border border-border/50 bg-muted/30 shadow-sm" aria-hidden="true"></span>
                  <span class="pointer-events-none absolute inset-x-1.5 top-1.5 z-10 h-9 rounded-md border border-border/60 bg-card/90 shadow-sm" aria-hidden="true"></span>
                  <span class="relative z-20 flex h-10 items-center justify-between gap-2 rounded-md border border-border bg-card px-2 py-1 text-[11px] shadow-sm">
                    <span class="flex min-w-0 flex-1 items-center gap-1.5 font-medium">
                      @for (accent of entryAccentsForDate()(day.date); track accent.key) {
                        <span
                          class="size-2 shrink-0 rounded-full ring-1 ring-border/50"
                          [style.background-color]="accent.hex"
                          [attr.title]="accent.label"
                        ></span>
                      }
                      <ng-icon hlm name="lucideLayers" size="sm" class="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
                      <span class="truncate">{{ entries.length }} entries</span>
                    </span>
                    <span class="flex shrink-0 items-center gap-1">
                      <span class="text-muted-foreground">{{ dayTotal()(day.date).toFixed(2) }} h</span>
                      @if (inv.state !== 'none') {
                        <span
                          data-testid="invoiced-accent-stacked"
                          class="relative inline-flex h-2 w-3 shrink-0 overflow-hidden rounded-sm"
                          [class.bg-emerald-500/70]="inv.state === 'all'"
                          [class.bg-emerald-500/35]="inv.state === 'partial'"
                          aria-hidden="true"
                        >
                          @if (inv.state === 'partial') {
                            <span
                              data-testid="invoiced-accent-stacked-partial"
                              class="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-emerald-500/80"
                            ></span>
                          }
                        </span>
                      }
                    </span>
                  </span>
                </button>
              }
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntriesCalendarGridComponent {
  readonly weekdayLabels = input.required<string[]>();
  readonly calendarDays = input.required<CalendarDay[]>();
  readonly entriesForDate = input.required<(date: string) => any[]>();
  readonly dayTotal = input.required<(date: string) => number>();
  readonly entryClientAccent = input.required<(entry: any) => string>();
  readonly entryAccentsForDate = input.required<(date: string) => Array<{ key: string; hex: string; label: string }>>();
  readonly entryInvoicedSummary = input.required<(date: string) => EntryInvoicedSummaryState>();
  readonly formatDayHeading = input.required<(isoDate: string) => string>();

  readonly addForDate = output<string>();
  readonly editEntry = output<number>();
  readonly openDayEntriesPicker = output<string>();
}
