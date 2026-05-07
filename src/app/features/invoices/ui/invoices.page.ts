import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { ToastService } from '../../../core/feedback/toast.service';
import { activeLookup } from '../../../shared/components/combobox-selection/combobox-selection.util';
import { ClientsStore } from '../../clients/state/clients.store';
import { BillingModel } from '../../projects/models/project.model';
import {
  InvoiceGenerateMode,
  InvoiceGenerateInput,
  InvoiceStatus,
  InvoiceStatusUpdateInput,
} from '../models/invoice.model';
import { InvoicesStore } from '../state/invoices.store';

@Component({
  selector: 'app-invoices-page',
  imports: [ReactiveFormsModule, HlmButtonImports, HlmInputImports, HlmSeparatorImports, HlmComboboxImports],
  template: `
    <section class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p class="text-sm text-muted-foreground">
          Generate invoices from eligible time entries by client and billing period.
        </p>
      </header>

      <div hlmSeparator></div>

      <form class="grid gap-3 rounded-lg border border-border p-4" [formGroup]="generationForm" (ngSubmit)="generate()">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label class="grid gap-1 text-sm">
            <span>Client *</span>
            <div
              hlmCombobox
              [value]="selectedClientOption()"
              [itemToString]="optionToLabel"
              [isItemEqualToValue]="isSameIdOption"
              (valueChange)="onClientValueChange($event)"
            >
              <hlm-combobox-trigger class="w-full justify-between">
                <span>{{ selectedClientOption()?.label ?? 'Select client' }}</span>
              </hlm-combobox-trigger>
              <ng-template hlmComboboxPortal>
                <div hlmComboboxContent><div hlmComboboxList>
                  @for (client of clientOptions(); track client.id) {
                    <hlm-combobox-item [value]="client">{{ client.label }}</hlm-combobox-item>
                  }
                </div></div>
              </ng-template>
            </div>
          </label>
          <label class="grid gap-1 text-sm">
            <span>Billing model *</span>
            <div
              hlmCombobox
              [value]="selectedBillingModelOption()"
              [itemToString]="optionToLabel"
              [isItemEqualToValue]="isSameValueOption"
              (valueChange)="onBillingModelValueChange($event)"
            >
              <hlm-combobox-trigger class="w-full justify-between">
                <span>{{ selectedBillingModelOption()?.label ?? 'Select billing model' }}</span>
              </hlm-combobox-trigger>
              <ng-template hlmComboboxPortal>
                <div hlmComboboxContent><div hlmComboboxList>
                  @for (option of billingModelOptions; track option.value) {
                    <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
                  }
                </div></div>
              </ng-template>
            </div>
          </label>
          <label class="grid gap-1 text-sm">
            <span>Tax rate *</span>
            <div
              hlmCombobox
              [value]="selectedTaxRateOption()"
              [itemToString]="optionToLabel"
              [isItemEqualToValue]="isSameIdOption"
              (valueChange)="onTaxRateValueChange($event)"
            >
              <hlm-combobox-trigger class="w-full justify-between">
                <span>{{ selectedTaxRateOption()?.label ?? 'Select tax rate' }}</span>
              </hlm-combobox-trigger>
              <ng-template hlmComboboxPortal>
                <div hlmComboboxContent><div hlmComboboxList>
                  @for (taxRate of taxRateOptions(); track taxRate.id) {
                    <hlm-combobox-item [value]="taxRate">{{ taxRate.label }}</hlm-combobox-item>
                  }
                </div></div>
              </ng-template>
            </div>
          </label>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label class="grid gap-1 text-sm">
            <span>Period start *</span>
            <input hlmInput type="date" formControlName="periodStart" />
          </label>
          <label class="grid gap-1 text-sm">
            <span>Period end *</span>
            <input hlmInput type="date" formControlName="periodEnd" />
          </label>
          <label class="grid gap-1 text-sm">
            <span>Initial status *</span>
            <div
              hlmCombobox
              [value]="selectedInitialStatusOption()"
              [itemToString]="optionToLabel"
              [isItemEqualToValue]="isSameValueOption"
              (valueChange)="onInitialStatusValueChange($event)"
            >
              <hlm-combobox-trigger class="w-full justify-between">
                <span>{{ selectedInitialStatusOption()?.label ?? 'Select status' }}</span>
              </hlm-combobox-trigger>
              <ng-template hlmComboboxPortal>
                <div hlmComboboxContent><div hlmComboboxList>
                  @for (status of initialStatusOptions; track status.value) {
                    <hlm-combobox-item [value]="status">{{ status.label }}</hlm-combobox-item>
                  }
                </div></div>
              </ng-template>
            </div>
          </label>
          <label class="grid gap-1 text-sm">
            <span>Mode *</span>
            <div
              hlmCombobox
              [value]="selectedModeOption()"
              [itemToString]="optionToLabel"
              [isItemEqualToValue]="isSameValueOption"
              (valueChange)="onModeValueChange($event)"
            >
              <hlm-combobox-trigger class="w-full justify-between">
                <span>{{ selectedModeOption()?.label ?? 'Select mode' }}</span>
              </hlm-combobox-trigger>
              <ng-template hlmComboboxPortal>
                <div hlmComboboxContent><div hlmComboboxList>
                  @for (mode of modeOptions; track mode.value) {
                    <hlm-combobox-item [value]="mode">{{ mode.label }}</hlm-combobox-item>
                  }
                </div></div>
              </ng-template>
            </div>
          </label>
        </div>
        <div class="flex items-center justify-end gap-2">
          <button hlmBtn type="button" variant="outline" (click)="applySuggestedPeriod()">Suggest period</button>
          <button hlmBtn type="submit" [disabled]="generationForm.invalid || store.isLoading()">
            Generate invoice(s)
          </button>
        </div>
      </form>

      @if (store.error()) {
        <p class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {{ store.error() }}
        </p>
      }

      <div class="grid gap-3">
        @for (invoice of store.invoices(); track invoice.id) {
          <article
            class="rounded-lg border border-border p-4"
            [class.border-primary]="invoice.id === store.selectedInvoiceId()"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="font-semibold">{{ invoice.invoiceNumber }} · {{ invoice.clientName }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ invoice.periodStart }} - {{ invoice.periodEnd }} · {{ invoice.status }} · {{ invoice.lineItemCount }}
                  lines
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button hlmBtn type="button" variant="outline" size="sm" (click)="selectInvoice(invoice.id)">
                  Details
                </button>
                <button
                  hlmBtn
                  type="button"
                  variant="secondary"
                  size="sm"
                  [disabled]="invoice.status !== invoiceStatus.CONCEPT && invoice.status !== invoiceStatus.PROFORMA"
                  (click)="setStatus(invoice.id, invoiceStatus.OPEN)"
                >
                  Open
                </button>
                <button
                  hlmBtn
                  type="button"
                  variant="secondary"
                  size="sm"
                  [disabled]="invoice.status !== invoiceStatus.OPEN"
                  (click)="setStatus(invoice.id, invoiceStatus.PAID)"
                >
                  Paid
                </button>
                <button
                  hlmBtn
                  type="button"
                  variant="destructive"
                  size="sm"
                  [disabled]="invoice.status === invoiceStatus.CREDITED"
                  (click)="setStatus(invoice.id, invoiceStatus.CREDITED)"
                >
                  Credited
                </button>
              </div>
            </div>
            @if (invoice.id === store.selectedInvoiceId()) {
              <div class="mt-3 space-y-1 border-t border-border pt-3">
                @for (line of store.selectedLineItems(); track line.id) {
                  <p class="text-sm text-muted-foreground">
                    {{ line.workDate }} · {{ line.projectCode }} · {{ line.description || '-' }} · net
                    {{ line.lineNet }} · tax {{ line.taxCodeSnapshot }} ({{ formatTax(line.taxPercentageSnapshot) }})
                  </p>
                }
              </div>
            }
          </article>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesPage implements OnInit {
  protected readonly store = inject(InvoicesStore);
  private readonly clientsStore = inject(ClientsStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  protected readonly invoiceStatus = InvoiceStatus;
  protected readonly billingModelOptions = [
    { label: 'Week', value: BillingModel.WEEK },
    { label: 'Month', value: BillingModel.MONTH },
    { label: 'Year', value: BillingModel.YEAR },
  ] as const;
  protected readonly initialStatusOptions = [
    { label: 'Concept', value: InvoiceStatus.CONCEPT },
    { label: 'Proforma', value: InvoiceStatus.PROFORMA },
  ] as const;
  protected readonly modeOptions = [
    { label: 'Per project', value: 'per_project' as InvoiceGenerateMode },
    { label: 'Combined client invoice', value: 'combined' as InvoiceGenerateMode },
  ] as const;
  protected readonly clientOptions = computed(() =>
    activeLookup(this.clientsStore.clients()).map((client) => ({ id: client.id, label: client.name })),
  );
  protected readonly taxRateOptions = computed(() =>
    this.store.taxRates().map((taxRate) => ({
      id: taxRate.id,
      label: `${taxRate.code} - ${taxRate.label} (${this.formatTax(taxRate.percentage)})`,
    })),
  );
  private readonly periodWasSuggested = signal(false);

  protected readonly generationForm = this.formBuilder.group({
    clientId: [0, [Validators.required, Validators.min(1)]],
    billingModel: [BillingModel.MONTH, [Validators.required]],
    periodStart: ['', [Validators.required]],
    periodEnd: ['', [Validators.required]],
    status: [InvoiceStatus.CONCEPT as InvoiceStatus.CONCEPT | InvoiceStatus.PROFORMA, [Validators.required]],
    mode: ['per_project' as InvoiceGenerateMode, [Validators.required]],
    taxRateId: [0, [Validators.required, Validators.min(1)]],
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.clientsStore.loadClientsIfNeeded(), this.store.loadInvoicesIfNeeded()]);
    const firstClientId = this.clientOptions()[0]?.id ?? 0;
    const firstTaxId = this.store.taxRates()[0]?.id ?? 0;
    this.generationForm.patchValue({ clientId: firstClientId, taxRateId: firstTaxId });
    this.applySuggestedPeriod();
  }

  protected async generate(): Promise<void> {
    if (this.generationForm.invalid) {
      this.generationForm.markAllAsTouched();
      return;
    }
    const raw = this.generationForm.getRawValue();
    const payload: InvoiceGenerateInput = {
      clientId: Number(raw.clientId ?? 0),
      billingModel: raw.billingModel ?? BillingModel.MONTH,
      periodStart: raw.periodStart ?? '',
      periodEnd: raw.periodEnd ?? '',
      status: raw.status ?? InvoiceStatus.CONCEPT,
      mode: raw.mode ?? 'per_project',
      taxRateId: Number(raw.taxRateId ?? 0),
    };
    await this.store.generateInvoices(payload);
    if (!this.store.error()) {
      this.toast.show('Invoice generation completed.', 'success');
    }
  }

  protected async setStatus(invoiceId: number, status: InvoiceStatus.OPEN | InvoiceStatus.PAID | InvoiceStatus.CREDITED): Promise<void> {
    const payload: InvoiceStatusUpdateInput = { status };
    await this.store.updateStatus(invoiceId, payload);
    if (!this.store.error()) {
      this.toast.show(`Invoice status updated to ${status}.`, 'success');
    }
  }

  protected async selectInvoice(invoiceId: number): Promise<void> {
    await this.store.selectInvoice(invoiceId);
  }

  protected applySuggestedPeriod(): void {
    const model = this.generationForm.controls.billingModel.value ?? BillingModel.MONTH;
    const now = new Date();
    const { start, end } = getPeriodBounds(model, now);
    this.generationForm.patchValue({ periodStart: start, periodEnd: end });
    this.periodWasSuggested.set(true);
  }

  protected formatTax(percentage: number): string {
    return `${(percentage / 100).toFixed(2)}%`;
  }

  protected readonly optionToLabel = (option: { label: string } | null): string => option?.label ?? '';

  protected readonly isSameIdOption = (
    left: { id: number; label: string } | null,
    right: { id: number; label: string } | null,
  ): boolean => left?.id === right?.id;

  protected readonly isSameValueOption = (
    left: { label: string; value: string } | null,
    right: { label: string; value: string } | null,
  ): boolean => left?.value === right?.value;

  protected selectedClientOption(): { id: number; label: string } | null {
    const value = Number(this.generationForm.controls.clientId.value ?? 0);
    return this.clientOptions().find((option) => option.id === value) ?? null;
  }

  protected selectedBillingModelOption(): { label: string; value: BillingModel } | null {
    const value = this.generationForm.controls.billingModel.value;
    return this.billingModelOptions.find((option) => option.value === value) ?? null;
  }

  protected selectedTaxRateOption(): { id: number; label: string } | null {
    const value = Number(this.generationForm.controls.taxRateId.value ?? 0);
    return this.taxRateOptions().find((option) => option.id === value) ?? null;
  }

  protected selectedInitialStatusOption():
    | { label: string; value: InvoiceStatus.CONCEPT | InvoiceStatus.PROFORMA }
    | null {
    const value = this.generationForm.controls.status.value;
    return this.initialStatusOptions.find((option) => option.value === value) ?? null;
  }

  protected selectedModeOption(): { label: string; value: InvoiceGenerateMode } | null {
    const value = this.generationForm.controls.mode.value;
    return this.modeOptions.find((option) => option.value === value) ?? null;
  }

  protected onClientValueChange(option: { id: number; label: string } | null): void {
    this.generationForm.controls.clientId.setValue(option?.id ?? 0);
  }

  protected onBillingModelValueChange(option: { label: string; value: BillingModel } | null): void {
    this.generationForm.controls.billingModel.setValue(option?.value ?? BillingModel.MONTH);
  }

  protected onTaxRateValueChange(option: { id: number; label: string } | null): void {
    this.generationForm.controls.taxRateId.setValue(option?.id ?? 0);
  }

  protected onInitialStatusValueChange(
    option: { label: string; value: InvoiceStatus.CONCEPT | InvoiceStatus.PROFORMA } | null,
  ): void {
    this.generationForm.controls.status.setValue(option?.value ?? InvoiceStatus.CONCEPT);
  }

  protected onModeValueChange(option: { label: string; value: InvoiceGenerateMode } | null): void {
    this.generationForm.controls.mode.setValue(option?.value ?? 'per_project');
  }
}

function getPeriodBounds(model: BillingModel, anchor: Date): { start: string; end: string } {
  if (model === BillingModel.WEEK) {
    const day = anchor.getDay();
    const distance = day === 0 ? 6 : day - 1;
    const startDate = new Date(anchor);
    startDate.setDate(anchor.getDate() - distance);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    return { start: isoDate(startDate), end: isoDate(endDate) };
  }

  if (model === BillingModel.YEAR) {
    const year = anchor.getFullYear();
    return {
      start: `${year}-01-01`,
      end: `${year + 1}-01-01`,
    };
  }

  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  return {
    start: isoDate(new Date(year, month, 1)),
    end: isoDate(new Date(year, month + 1, 1)),
  };
}

function isoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
