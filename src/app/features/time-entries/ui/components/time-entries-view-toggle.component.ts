import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-time-entries-view-toggle',
  imports: [HlmButtonImports],
  template: `
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntriesViewToggleComponent {
  readonly viewMode = input.required<'month' | 'week'>();
  readonly viewModeChange = output<'month' | 'week'>();
}
