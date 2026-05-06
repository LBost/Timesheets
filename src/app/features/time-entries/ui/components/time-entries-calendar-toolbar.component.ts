import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { NgIcon } from '@ng-icons/core';
import { HlmIcon } from '@spartan-ng/helm/icon';

@Component({
  selector: 'app-time-entries-calendar-toolbar',
  imports: [HlmButtonImports, HlmInputImports, NgIcon, HlmIcon],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">Time Entries</h1>
        <p class="text-sm text-muted-foreground">
          Plan monthly entries and register multiple time entries per day.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div class="inline-flex items-center rounded-md border border-border p-1">
          <button
            hlmBtn
            type="button"
            size="sm"
            variant="ghost"
            [class.bg-accent]="viewMode() === 'month'"
            (click)="viewModeChange.emit('month')"
          >
            Month
          </button>
          <button
            hlmBtn
            type="button"
            size="sm"
            variant="ghost"
            [class.bg-accent]="viewMode() === 'week'"
            (click)="viewModeChange.emit('week')"
          >
            Week
          </button>
        </div>
        <button
          hlmBtn
          variant="outline"
          type="button"
          class="cursor-pointer"
          (click)="previousPeriod.emit()"
        >
          &lt;
        </button>
        @if (viewMode() === 'month') {
          <input
            hlmInput
            type="month"
            [value]="selectedMonthValue()"
            (change)="monthInputChange.emit($event)"
          />
        } @else {
          <input
            hlmInput
            type="week"
            class="[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-90"
            [value]="selectedWeekValue()"
            (change)="weekInputChange.emit($event)"
          />
        }
        <button
          hlmBtn
          variant="outline"
          type="button"
          class="cursor-pointer"
          (click)="nextPeriod.emit()"
        >
          &gt;
        </button>
        <button
          hlmBtn
          type="button"
          size="icon"
          variant="outline"
          class="cursor-pointer"
          [attr.aria-label]="'Add entry for ' + todayIso()"
          (click)="addToday.emit()"
        >
          <ng-icon hlm size="sm" name="lucidePlus" />
        </button>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntriesCalendarToolbarComponent {
  readonly viewMode = input.required<'month' | 'week'>();
  readonly selectedMonthValue = input.required<string>();
  readonly selectedWeekValue = input.required<string>();
  readonly todayIso = input.required<string>();
  readonly previousPeriod = output<void>();
  readonly nextPeriod = output<void>();
  readonly monthInputChange = output<Event>();
  readonly weekInputChange = output<Event>();
  readonly addToday = output<void>();
  readonly viewModeChange = output<'month' | 'week'>();
}
