import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { ToastService } from '../../../core/feedback/toast.service';
import { SettingsStore } from '../state/settings.store';

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, HlmButtonImports, HlmInputImports, HlmSeparatorImports],
  template: `
    <section class="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header class="space-y-2">
        <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
        <p class="text-sm text-muted-foreground">
          Configure app-wide defaults used across bookkeeping and invoice flows.
        </p>
      </header>

      <div hlmSeparator></div>

      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div class="mb-6 space-y-1">
          <h2 class="text-lg font-semibold">Invoicing</h2>
          <p class="text-sm text-muted-foreground">
            Set the next invoice number. This value is used as the next number to assign.
          </p>
        </div>

        <form class="grid gap-4" [formGroup]="settingsForm" (ngSubmit)="save()">
          <label class="grid gap-1.5 text-sm">
            <span class="font-medium">Next invoice nr *</span>
            <input
              hlmInput
              type="text"
              formControlName="nextInvoiceNumber"
              placeholder="INV-20260001"
              autocomplete="off"
              class="font-mono"
            />
            <span class="text-xs text-muted-foreground">
              Example format: prefix + year + sequence, e.g. INV-20260001
            </span>
          </label>

          <div class="grid gap-1.5 text-sm">
            <span class="font-medium">Default time entries view *</span>
            <div class="inline-flex w-fit items-center rounded-md border border-border p-1">
              <button
                hlmBtn
                type="button"
                size="sm"
                variant="ghost"
                [class.bg-accent]="settingsForm.controls.preferredTimeEntriesView.value === 'month'"
                (click)="setPreferredTimeEntriesView('month')"
              >
                Month
              </button>
              <button
                hlmBtn
                type="button"
                size="sm"
                variant="ghost"
                [class.bg-accent]="settingsForm.controls.preferredTimeEntriesView.value === 'week'"
                (click)="setPreferredTimeEntriesView('week')"
              >
                Week
              </button>
            </div>
            <span class="text-xs text-muted-foreground">Sets the default Time Entries page view.</span>
          </div>

          @if (nextInvoiceNumberControl.touched && nextInvoiceNumberControl.invalid) {
            <p class="text-sm text-destructive">Enter a value like INV-20260001.</p>
          }

          @if (store.error()) {
            <p
              class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {{ store.error() }}
            </p>
          }

          <div class="mt-2 flex items-center justify-end gap-2">
            <button hlmBtn type="button" variant="outline" (click)="resetToStored()">Reset</button>
            <button
              hlmBtn
              type="submit"
              [disabled]="settingsForm.invalid || store.isSaving() || settingsForm.pristine"
            >
              Save settings
            </button>
          </div>
        </form>
      </div>

      <div class="rounded-lg border border-border/60 bg-muted/20 p-4">
        <h3 class="text-sm font-semibold">Planned behavior</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          On invoice creation, the current next invoice number should be used and then incremented.
          Implementation steps are documented in the settings feature notes.
        </p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage implements OnInit {
  protected readonly store = inject(SettingsStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  protected readonly settingsForm = this.formBuilder.group({
    nextInvoiceNumber: [
      '',
      [Validators.required, Validators.pattern(/^[A-Z]{2,10}-\d{8}$/), Validators.maxLength(20)],
    ],
    preferredTimeEntriesView: ['month' as 'month' | 'week', [Validators.required]],
  });

  protected readonly isBusy = computed(() => this.store.isLoading() || this.store.isSaving());

  protected get nextInvoiceNumberControl() {
    return this.settingsForm.controls.nextInvoiceNumber;
  }

  async ngOnInit(): Promise<void> {
    await this.store.loadSettings();
    this.resetToStored();
  }

  protected resetToStored(): void {
    this.settingsForm.reset(
      {
        nextInvoiceNumber: this.store.nextInvoiceNumber(),
        preferredTimeEntriesView: this.store.preferredTimeEntriesView(),
      },
      { emitEvent: false },
    );
  }

  protected async save(): Promise<void> {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    const nextInvoiceNumber = this.settingsForm.controls.nextInvoiceNumber.value ?? '';
    const preferredTimeEntriesView =
      this.settingsForm.controls.preferredTimeEntriesView.value ?? 'month';
    const saved = await this.store.saveSettings(nextInvoiceNumber, preferredTimeEntriesView);
    if (!saved) {
      return;
    }

    this.resetToStored();
    this.toast.show('Settings saved.', 'success');
  }

  protected setPreferredTimeEntriesView(view: 'month' | 'week'): void {
    const control = this.settingsForm.controls.preferredTimeEntriesView;
    if (control.value === view) {
      return;
    }
    control.setValue(view);
    control.markAsDirty();
    this.settingsForm.markAsDirty();
  }
}
