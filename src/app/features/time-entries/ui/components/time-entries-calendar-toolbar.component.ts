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
        <button
          hlmBtn
          variant="outline"
          type="button"
          class="cursor-pointer"
          (click)="previousMonth.emit()"
        >
          &lt;
        </button>
        <input
          hlmInput
          type="month"
          [value]="selectedMonthValue()"
          (change)="monthInputChange.emit($event)"
        />
        <button
          hlmBtn
          variant="outline"
          type="button"
          class="cursor-pointer"
          (click)="nextMonth.emit()"
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
  readonly selectedMonthValue = input.required<string>();
  readonly todayIso = input.required<string>();
  readonly previousMonth = output<void>();
  readonly nextMonth = output<void>();
  readonly monthInputChange = output<Event>();
  readonly addToday = output<void>();
}
