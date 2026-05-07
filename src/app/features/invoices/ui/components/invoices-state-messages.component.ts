import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-invoices-state-messages',
  template: `
    @if (storeError()) {
      <p class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
        {{ storeError() }}
      </p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesStateMessagesComponent {
  readonly storeError = input<string | null>(null);
}
