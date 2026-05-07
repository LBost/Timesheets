import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis, lucideMail, lucidePlus } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { DropdownMenuSurfaceComponent } from '../../../../shared/components/dropdown-menu-surface/dropdown-menu-surface.component';

type WeekDay = {
  date: string;
  dayNumber: number;
};

@Component({
  selector: 'app-time-entries-week-grid',
  imports: [HlmButtonImports, HlmDropdownMenuImports, NgIcon, HlmIcon, DropdownMenuSurfaceComponent],
  providers: [provideIcons({ lucidePlus, lucideEllipsis, lucideMail })],
  template: `
    <div class="overflow-hidden rounded-lg border border-border">
      <div class="grid grid-cols-7 border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wide">
        @for (day of weekDays(); track day.date) {
          <div class="border-r border-border p-2 last:border-r-0">{{ formatWeekHeader(day.date) }}</div>
        }
      </div>

      <div class="grid grid-cols-7">
        @for (day of weekDays(); track day.date) {
          <div class="min-h-40 border-r border-b border-border p-2 last:border-r-0">
            <div class="mb-2 flex items-center justify-between text-xs">
              <span class="font-medium">{{ dayTotal()(day.date).toFixed(2) }} h</span>
              <div class="flex items-center gap-1">
                <button hlmBtn size="icon-sm" variant="ghost" type="button" class="cursor-pointer" [hlmDropdownMenuTrigger]="dayMenu">
                  <ng-icon hlm name="lucideEllipsis" size="sm" aria-hidden="true" />
                </button>
                <ng-template #dayMenu>
                  <app-dropdown-menu-surface>
                    <button hlmDropdownMenuItem (triggered)="emailToRequested.emit(day.date)">
                      <ng-icon hlm name="lucideMail" size="sm" aria-hidden="true" />
                      Email to
                    </button>
                  </app-dropdown-menu-surface>
                </ng-template>
                <button hlmBtn variant="ghost" size="icon" type="button" class="cursor-pointer" (click)="addForDate.emit(day.date)">
                  <ng-icon hlm name="lucidePlus" size="sm" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              @for (entry of entriesForDate()(day.date); track entry.id) {
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
                      class="pointer-events-none absolute right-1 top-1 inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500/70"
                      aria-hidden="true"
                    ></span>
                  }
                </button>
              } @empty {
                <div class="text-[11px] text-muted-foreground">No entries</div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntriesWeekGridComponent {
  readonly weekDays = input.required<WeekDay[]>();
  readonly entriesForDate = input.required<(date: string) => any[]>();
  readonly dayTotal = input.required<(date: string) => number>();
  readonly entryClientAccent = input.required<(entry: any) => string>();
  readonly formatDayHeading = input.required<(isoDate: string) => string>();

  readonly addForDate = output<string>();
  readonly emailToRequested = output<string>();
  readonly editEntry = output<number>();

  protected formatWeekHeader(isoDate: string): string {
    const date = new Date(`${isoDate}T12:00:00`);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    return `${weekday} ${day} ${month}`;
  }
}
