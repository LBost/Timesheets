import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'app-projects-feedback-state',
  imports: [HlmSkeletonImports],
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
      <div class="grid gap-2 rounded-lg border border-border p-4">
        <div hlmSkeleton class="h-5 w-1/3"></div>
        <div hlmSkeleton class="h-4 w-full"></div>
        <div hlmSkeleton class="h-4 w-5/6"></div>
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
