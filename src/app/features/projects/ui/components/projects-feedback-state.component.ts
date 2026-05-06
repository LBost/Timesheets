import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';

@Component({
  selector: 'app-projects-feedback-state',
  imports: [HlmSpinnerImports],
  template: `
    @if (clientLookupError()) {
      <p class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
        {{ clientLookupError() }}
      </p>
    }

    @if (storeError()) {
      <p class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
        {{ storeError() }}
      </p>
    }

    @if (isLoading()) {
      <div class="flex items-center justify-center rounded-lg border border-border p-6">
        <hlm-spinner aria-label="Loading projects" class="text-muted-foreground"></hlm-spinner>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsFeedbackStateComponent {
  readonly clientLookupError = input<string | null>(null);
  readonly storeError = input<string | null>(null);
  readonly isLoading = input(false);
}
