import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';

@Component({
  selector: 'app-settings-shell-page',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HlmButtonImports, HlmSeparatorImports],
  template: `
    <section class="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header class="space-y-4">
        <div class="space-y-2">
          <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
          <p class="text-sm text-muted-foreground">
            Configure app defaults and review your account activity.
          </p>
        </div>

        <div class="inline-flex w-fit items-center rounded-md border border-border p-1">
          <a
            hlmBtn
            size="sm"
            variant="ghost"
            routerLink="/settings/general"
            routerLinkActive="bg-accent"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            General
          </a>
          <a
            hlmBtn
            size="sm"
            variant="ghost"
            routerLink="/settings/logs"
            routerLinkActive="bg-accent"
          >
            Activity log
          </a>
        </div>
      </header>

      <div hlmSeparator></div>

      <router-outlet />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsShellPage {}
