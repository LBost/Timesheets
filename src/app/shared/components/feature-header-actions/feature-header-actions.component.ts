import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideRefreshCw } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';

@Component({
  selector: 'app-feature-header-actions',
  imports: [HlmButtonImports, HlmIcon, NgIcon],
  providers: [provideIcons({ lucidePlus, lucideRefreshCw })],
  template: `
    <header class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold">{{ title() }}</h1>
        <p class="text-sm text-muted-foreground">{{ subtitle() }}</p>
      </div>
      <div class="flex items-center gap-2">
        @if (showRefresh()) {
          <button
            hlmBtn
            type="button"
            size="icon"
            variant="outline"
            class="cursor-pointer"
            [attr.aria-label]="refreshAriaLabel()"
            (click)="refreshRequested.emit()"
          >
            <ng-icon hlm size="sm" name="lucideRefreshCw" />
          </button>
        }
        <button
          hlmBtn
          type="button"
          size="icon"
          variant="outline"
          class="cursor-pointer"
          [attr.aria-label]="addAriaLabel()"
          (click)="addRequested.emit()"
        >
          <ng-icon hlm size="sm" name="lucidePlus" />
        </button>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureHeaderActionsComponent {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly addAriaLabel = input<string>('Add');
  readonly showRefresh = input<boolean>(false);
  readonly refreshAriaLabel = input<string>('Refresh');
  readonly addRequested = output<void>();
  readonly refreshRequested = output<void>();
}
