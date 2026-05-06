import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-time-entries-month-summary',
  template: `
    <div class="flex items-center justify-between text-sm">
      <div class="font-medium">{{ monthLabel() }}</div>
      <div class="text-muted-foreground">Total hours: {{ monthTotalHours().toFixed(2) }}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntriesMonthSummaryComponent {
  readonly monthLabel = input.required<string>();
  readonly monthTotalHours = input.required<number>();
}
