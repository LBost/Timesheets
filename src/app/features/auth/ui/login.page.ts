import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';

import { AuthService } from '../data/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, HlmButtonImports, HlmInputImports],
  template: `
    <main
      class="grid min-h-dvh place-items-center bg-background p-6 text-foreground"
    >
      <section
        class="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm"
      >
        <header class="space-y-1">
          <h1 class="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p class="text-sm text-muted-foreground">
            Enter your Supabase account credentials to continue.
          </p>
        </header>

        <form class="grid gap-4" [formGroup]="loginForm" (ngSubmit)="submit()">
          <label class="grid gap-1.5 text-sm">
            <span class="font-medium">Email</span>
            <input
              hlmInput
              type="email"
              formControlName="email"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </label>

          <label class="grid gap-1.5 text-sm">
            <span class="font-medium">Password</span>
            <input
              hlmInput
              type="password"
              formControlName="password"
              autocomplete="current-password"
              required
            />
          </label>

          @if (errorMessage()) {
            <p
              class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {{ errorMessage() }}
            </p>
          }

          <button hlmBtn type="submit" [disabled]="loginForm.invalid || isSubmitting()">
            @if (isSubmitting()) {
              Signing in...
            } @else {
              Sign in
            }
          </button>
        </form>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected async submit(): Promise<void> {
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.auth.signIn(email, password);
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Sign-in failed. Try again.'
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
