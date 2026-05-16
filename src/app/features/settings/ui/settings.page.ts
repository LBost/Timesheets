import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { ToastService } from '../../../core/feedback/toast.service';
import { SettingsStore } from '../state/settings.store';
import {
  assertValidSettingsBackupPayload,
  SettingsBackupPayload,
} from '../models/settings-backup.model';

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, HlmButtonImports, HlmInputImports, HlmSeparatorImports],
  template: `
    <section class="flex flex-col gap-6">
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
            <h2 class="text-lg font-semibold">Time entries</h2>
            <p class="text-sm text-muted-foreground">
              Set the default view for the time entries page.
            </p>
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

      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div class="mb-4 space-y-1">
          <h2 class="text-lg font-semibold">Backup & Restore</h2>
          <p class="text-sm text-muted-foreground">
            Export all app data for your account to a local file and restore it later if needed.
          </p>
        </div>

        <div class="space-y-4">
          <div class="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p class="text-sm text-muted-foreground">
              Restore replaces your current data with the backup file contents.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              hlmBtn
              type="button"
              variant="outline"
              [disabled]="isBusy()"
              (click)="createBackupFile()"
            >
              Create backup
            </button>
            <button
              hlmBtn
              type="button"
              variant="destructive"
              [disabled]="isBusy()"
              (click)="openRestoreFilePicker()"
            >
              Restore backup
            </button>
            <input
              #restoreInput
              type="file"
              accept="application/json,.json"
              class="hidden"
              (change)="onRestoreFileSelected($event)"
            />
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage implements OnInit {
  protected readonly store = inject(SettingsStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  @ViewChild('restoreInput') private restoreInput?: ElementRef<HTMLInputElement>;

  protected readonly settingsForm = this.formBuilder.group({
    nextInvoiceNumber: [
      '',
      [Validators.required, Validators.pattern(/^[A-Z]{2,10}-\d{8}$/), Validators.maxLength(20)],
    ],
    preferredTimeEntriesView: ['month' as 'month' | 'week', [Validators.required]],
  });

  protected readonly isBusy = computed(
    () =>
      this.store.isLoading() ||
      this.store.isSaving() ||
      this.store.isBackingUp() ||
      this.store.isRestoring(),
  );

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

  protected async createBackupFile(): Promise<void> {
    const payload = await this.store.createBackup();
    if (!payload) {
      return;
    }

    const fileName = `timesheets-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    this.downloadBackup(payload, fileName);
    this.toast.show('Backup downloaded.', 'success');
  }

  protected openRestoreFilePicker(): void {
    this.restoreInput?.nativeElement.click();
  }

  protected async onRestoreFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const payload = JSON.parse(text) as unknown;
      assertValidSettingsBackupPayload(payload);
      if (!this.confirmRestore(payload)) {
        return;
      }
      const restored = await this.store.restoreBackup(payload);
      if (!restored) {
        return;
      }
      this.resetToStored();
      this.toast.show('Backup restored.', 'success');
    } catch (error) {
      if (error instanceof Error && error.message.includes('backup')) {
        this.toast.show(error.message, 'info');
      } else {
        this.toast.show('Backup file could not be read.', 'info');
      }
    } finally {
      input.value = '';
    }
  }

  private confirmRestore(payload: SettingsBackupPayload): boolean {
    const firstConfirm = window.confirm(this.buildRestoreSummary(payload));
    if (!firstConfirm) {
      return false;
    }

    const confirmation = window.prompt('Type RESTORE to confirm this destructive action.');
    if (confirmation !== 'RESTORE') {
      this.toast.show('Restore cancelled.', 'info');
      return false;
    }
    return true;
  }

  private buildRestoreSummary(payload: SettingsBackupPayload): string {
    const exportedAtUtc = this.formatUtcTimestamp(payload.meta.exportedAt);
    const summaryLines = [
      'Restore will permanently replace your current data for this account.',
      '',
      'Backup preview:',
      `- Exported at (UTC): ${exportedAtUtc}`,
      `- Clients: ${payload.data.clients.length}`,
      `- Projects: ${payload.data.projects.length}`,
      `- Orders: ${payload.data.orders.length}`,
      `- Time entries: ${payload.data.time_entries.length}`,
      `- Tax rates: ${payload.data.tax_rates.length}`,
      `- Invoices: ${payload.data.invoices.length}`,
      `- Invoice line items: ${payload.data.invoice_line_items.length}`,
      '',
      'Continue?',
    ];
    return summaryLines.join('\n');
  }

  private formatUtcTimestamp(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  }

  private downloadBackup(payload: SettingsBackupPayload, fileName: string): void {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
