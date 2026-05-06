import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ToastMessage } from '../../feedback/toast.service';

@Component({
  selector: 'app-shell-toast',
  template: `
    @if (message(); as value) {
      <div class="pointer-events-none fixed inset-e-4 top-4 z-60">
        <div
          class="pointer-events-auto min-w-72 rounded-md border bg-card p-3 text-sm shadow-lg"
          [class.border-emerald-500/40]="value.tone === 'success'"
          [class.text-emerald-700]="value.tone === 'success'"
          [class.border-border]="value.tone !== 'success'"
          [class.text-foreground]="value.tone !== 'success'"
        >
          {{ value.text }}
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellToastComponent {
  readonly message = input<ToastMessage | null>(null);
}
