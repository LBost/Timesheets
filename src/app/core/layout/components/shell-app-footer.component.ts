import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-shell-app-footer',
  template: `
    <footer class="flex justify-between border-t border-border bg-card px-4 py-3 text-sm text-muted-foreground">
      <span>© {{ year() }} {{ productName() }}</span>
      <span>{{ statusText() }}</span>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellAppFooterComponent {
  readonly year = input.required<number>();
  readonly statusText = input.required<string>();
  readonly productName = input('Timesheets');
}
