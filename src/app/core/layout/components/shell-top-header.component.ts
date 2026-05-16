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
        <div class="grid size-8 place-items-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="bg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4F46E5" />
                <stop offset="1" stop-color="#06B6D4" />
              </linearGradient>
            </defs>

            <!-- Background -->
            <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#bg)" />

            <!-- Clock Face -->
            <circle cx="16" cy="16" r="8" fill="white" fill-opacity="0.95" />

            <!-- Clock Hands -->
            <path
              d="M16 11V16L19.5 18"
              stroke="#4F46E5"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Checklist Lines -->
            <rect x="8" y="8" width="3" height="3" rx="1" fill="white" fill-opacity="0.9" />
            <rect x="8" y="21" width="3" height="3" rx="1" fill="white" fill-opacity="0.9" />
            <path
              d="M12.5 9.5H18"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              opacity="0.9"
            />
            <path
              d="M12.5 22.5H18"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              opacity="0.9"
            />
          </svg>
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
        @if (currentUserEmail()) {
          <span class="hidden text-xs text-muted-foreground sm:inline">
            {{ currentUserEmail() }}
          </span>
        }
        <button
          hlmBtn
          type="button"
          size="icon"
          variant="ghost"
          class="cursor-pointer"
          aria-label="Sign out"
          (click)="signOut.emit()"
        >
          <ng-icon name="lucideLogOut" hlm class="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellTopHeaderComponent {
  readonly themeIconName = input.required<'lucideSun' | 'lucideMoon' | 'lucideMonitor'>();
  readonly themeToggleAriaLabel = input.required<string>();
  readonly currentUserEmail = input<string | null>(null);
  readonly themeToggle = output<void>();
  readonly signOut = output<void>();
}
