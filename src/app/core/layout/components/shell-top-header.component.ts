import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSidebarTrigger } from '@spartan-ng/helm/sidebar';

@Component({
  selector: 'app-shell-top-header',
  imports: [NgIcon, HlmButtonImports, HlmSidebarTrigger],
  template: `
    <header class="flex h-16 items-center justify-between border-b border-border bg-card px-4">
      <div class="flex items-center gap-3">
        <button
          hlmSidebarTrigger
          type="button"
          size="icon"
          variant="ghost"
          class="cursor-pointer"
          aria-label="Toggle navigation sidebar"
        >
          <span class="sr-only">Toggle navigation sidebar</span>
        </button>
        <div
          class="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
        >
          TS
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          hlmBtn
          type="button"
          size="icon"
          variant="ghost"
          class="cursor-pointer"
          (click)="themeToggle.emit()"
          [attr.aria-label]="themeToggleAriaLabel()"
        >
          <ng-icon [name]="themeIconName()" hlm class="size-4" aria-hidden="true" />
        </button>
        <button
          hlmBtn
          type="button"
          size="icon"
          variant="ghost"
          class="cursor-pointer"
          aria-label="Notifications"
        >
          <ng-icon name="lucideBell" hlm class="size-4" aria-hidden="true" />
        </button>
        <button
          hlmBtn
          type="button"
          size="icon"
          variant="ghost"
          class="cursor-pointer"
          aria-label="Open settings"
        >
          <ng-icon name="lucideSettings" hlm class="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellTopHeaderComponent {
  readonly themeIconName = input.required<'lucideSun' | 'lucideMoon' | 'lucideMonitor'>();
  readonly themeToggleAriaLabel = input.required<string>();
  readonly themeToggle = output<void>();
}
