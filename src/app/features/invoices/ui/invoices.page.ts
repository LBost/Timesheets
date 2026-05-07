import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { ToastService } from '../../../core/feedback/toast.service';
import { activeLookup } from '../../../shared/components/combobox-selection/combobox-selection.util';
import { ClientsStore } from '../../clients/state/clients.store';
import {
  InvoiceGenerateMode,
  InvoiceGenerateInput,
  InvoiceStatus,
  InvoiceStatusUpdateInput,
} from '../models/invoice.model';
import { InvoicesStore } from '../state/invoices.store';

@Component({
  selector: 'app-invoices-page',
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmSeparatorImports,
    HlmComboboxImports,
    HlmDialogImports,
  ],
  template: `
    <section class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p class="text-sm text-muted-foreground">
          Generate invoices from eligible time entries by client and billing period.
        </p>
      </header>

      <div hlmSeparator></div>

      <form
        class="grid gap-3 rounded-lg border border-border p-4"
        [formGroup]="generationForm"
        (ngSubmit)="generate()"
      >
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
                <div hlmComboboxContent>
                  <div hlmComboboxList>
                    @for (client of clientOptions(); track client.id) {
                      <hlm-combobox-item [value]="client">{{ client.label }}</hlm-combobox-item>
                    }
                  </div>
                </div>
              </ng-template>
            </div>
          </label>
          <label class="grid gap-1 text-sm">
            <span>VAT rate *</span>
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
                <div hlmComboboxContent>
                  <div hlmComboboxList>
                    @for (taxRate of taxRateOptions(); track taxRate.id) {
                      <hlm-combobox-item [value]="taxRate">{{ taxRate.label }}</hlm-combobox-item>
                    }
                  </div>
                </div>
              </ng-template>
            </div>
          </label>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="grid gap-1 text-sm">
            <span>Period *</span>
            <div
              hlmCombobox
              [value]="selectedPeriodOption()"
              [itemToString]="optionToLabel"
              [isItemEqualToValue]="isSameValueOption"
              (valueChange)="onPeriodValueChange($event)"
            >
              <hlm-combobox-trigger class="w-full justify-between">
                <span>{{ selectedPeriodOption()?.label ?? 'Select period' }}</span>
              </hlm-combobox-trigger>
              <ng-template hlmComboboxPortal>
                <div hlmComboboxContent>
                  <div hlmComboboxList>
                    @for (period of periodOptions(); track period.value) {
                      <hlm-combobox-item [value]="period">{{ period.label }}</hlm-combobox-item>
                    }
                  </div>
                </div>
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
                <div hlmComboboxContent>
                  <div hlmComboboxList>
                    @for (mode of modeOptions; track mode.value) {
                      <hlm-combobox-item [value]="mode">{{ mode.label }}</hlm-combobox-item>
                    }
                  </div>
                </div>
              </ng-template>
            </div>
          </label>
        </div>
        <div class="flex items-center justify-end gap-2">
          <button hlmBtn type="submit" [disabled]="generationForm.invalid || store.isLoading()">
            Generate
          </button>
        </div>
      </form>

      <hlm-dialog
        [state]="previewDialogState()"
        ariaLabel="Invoice preview dialog"
        [ariaModal]="true"
        (closed)="closePreviewDialog()"
      >
        <ng-template hlmDialogPortal>
          <hlm-dialog-content [showCloseButton]="true" class="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
            <hlm-dialog-header class="text-start">
              <h2 hlmDialogTitle>Confirm invoice generation</h2>
              <p hlmDialogDescription>Select status and review line items before creating invoices.</p>
            </hlm-dialog-header>
            <div class="grid gap-3 py-2">
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="grid gap-1 text-sm">
                  <span>Status *</span>
                  <div
                    hlmCombobox
                    [value]="selectedPreviewStatusOption()"
                    [itemToString]="optionToLabel"
                    [isItemEqualToValue]="isSameValueOption"
                    (valueChange)="onPreviewStatusValueChange($event)"
                  >
                    <hlm-combobox-trigger class="w-full justify-between">
                      <span>{{ selectedPreviewStatusOption()?.label ?? 'Select status' }}</span>
                    </hlm-combobox-trigger>
                    <ng-template hlmComboboxPortal>
                      <div hlmComboboxContent>
                        <div hlmComboboxList>
                          @for (status of initialStatusOptions; track status.value) {
                            <hlm-combobox-item [value]="status">{{ status.label }}</hlm-combobox-item>
                          }
                        </div>
                      </div>
                    </ng-template>
                  </div>
                </label>

                <label class="grid gap-1 text-sm">
                  <span>Line view</span>
                  <div
                    hlmCombobox
                    [value]="selectedPreviewLineViewOption()"
                    [itemToString]="optionToLabel"
                    [isItemEqualToValue]="isSameValueOption"
                    (valueChange)="onPreviewLineViewValueChange($event)"
                  >
                    <hlm-combobox-trigger class="w-full justify-between">
                      <span>{{ selectedPreviewLineViewOption()?.label ?? 'Select view' }}</span>
                    </hlm-combobox-trigger>
                    <ng-template hlmComboboxPortal>
                      <div hlmComboboxContent>
                        <div hlmComboboxList>
                          @for (view of previewLineViewOptions; track view.value) {
                            <hlm-combobox-item [value]="view">{{ view.label }}</hlm-combobox-item>
                          }
                        </div>
                      </div>
                    </ng-template>
                  </div>
                </label>
              </div>

              @for (preview of store.invoicePreviews(); track preview.groupKey) {
                <div class="rounded-md border border-border p-3">
                  <p class="text-sm font-semibold">
                    Group {{ preview.groupKey }} · {{ preview.lineItems.length }} lines
                  </p>
                  <p class="text-xs text-muted-foreground">
                    Net {{ preview.subtotalNet }} · Tax {{ preview.totalTax }} · Gross
                    {{ preview.totalGross }}
                  </p>
                  @if (selectedPreviewLineView() === 'detailed') {
                    <div class="mt-2 space-y-1">
                      @for (line of preview.lineItems; track line.timeEntryId) {
                        <p class="text-xs text-muted-foreground">
                          {{ line.workDate }} · {{ line.description || '-' }} · {{ line.hours }}h x
                          {{ line.unitRate }} = {{ line.lineNet }} (tax {{ line.taxAmount }})
                        </p>
                      }
                    </div>
                  } @else {
                    <div class="mt-2 space-y-1">
                      @for (summaryLine of summarizePreviewByProject(preview.lineItems); track summaryLine.projectId) {
                        <p class="text-xs text-muted-foreground">
                          Project #{{ summaryLine.projectId }} · {{ summaryLine.entryCount }} entries ·
                          {{ summaryLine.hours }}h · net {{ summaryLine.lineNet }} · tax
                          {{ summaryLine.taxAmount }} · gross {{ summaryLine.lineGross }}
                        </p>
                      }
                    </div>
                  }
                </div>
              }
            </div>
            <hlm-dialog-footer class="justify-end gap-2">
              <button hlmBtn type="button" variant="outline" hlmDialogClose>Cancel</button>
              <button hlmBtn type="button" [disabled]="store.isLoading()" (click)="confirmGenerateFromPreview()">
                Confirm generate
              </button>
            </hlm-dialog-footer>
          </hlm-dialog-content>
        </ng-template>
      </hlm-dialog>

      @if (store.error()) {
        <p
          class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
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
                  {{ invoice.periodStart }} - {{ invoice.periodEnd }} · {{ invoice.status }} ·
                  {{ invoice.lineItemCount }}
                  lines
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  hlmBtn
                  type="button"
                  variant="outline"
                  size="sm"
                  (click)="selectInvoice(invoice.id)"
                >
                  Details
                </button>
                <button
                  hlmBtn
                  type="button"
                  variant="secondary"
                  size="sm"
                  [disabled]="
                    invoice.status !== invoiceStatus.CONCEPT &&
                    invoice.status !== invoiceStatus.PROFORMA
                  "
                  (click)="setStatus(invoice.id, invoiceStatus.OPEN)"
                >
                  Open
                </button>
                <button
                  hlmBtn
                  type="button"
                  variant="outline"
                  size="sm"
                  [disabled]="invoice.status !== invoiceStatus.OPEN"
                  (click)="setStatus(invoice.id, invoiceStatus.CONCEPT)"
                >
                  Revert
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
                <button
                  hlmBtn
                  type="button"
                  variant="destructive"
                  size="sm"
                  [disabled]="
                    invoice.status === invoiceStatus.PAID || invoice.status === invoiceStatus.CREDITED
                  "
                  (click)="deleteInvoice(invoice.id)"
                >
                  Delete
                </button>
              </div>
            </div>
            @if (invoice.id === store.selectedInvoiceId()) {
              <div class="mt-3 space-y-1 border-t border-border pt-3">
                @for (line of store.selectedLineItems(); track line.id) {
                  <p class="text-sm text-muted-foreground">
                    {{ line.workDate }} · {{ line.projectCode }} · {{ line.description || '-' }} ·
                    net {{ line.lineNet }} · tax {{ line.taxCodeSnapshot }} ({{
                      formatTax(line.taxPercentageSnapshot)
                    }})
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
  protected readonly initialStatusOptions = [
    { label: 'Concept', value: InvoiceStatus.CONCEPT },
    { label: 'Proforma', value: InvoiceStatus.PROFORMA },
    { label: 'Open', value: InvoiceStatus.OPEN },
  ] as const;
  protected readonly modeOptions = [
    { label: 'Per project', value: 'per_project' as InvoiceGenerateMode },
    { label: 'Combined client invoice', value: 'combined' as InvoiceGenerateMode },
  ] as const;
  protected readonly previewLineViewOptions = [
    { label: 'Detailed', value: 'detailed' as const },
    { label: 'Summary', value: 'summary' as const },
  ] as const;
  protected readonly clientOptions = computed(() =>
    activeLookup(this.clientsStore.clients()).map((client) => ({
      id: client.id,
      label: client.name,
    })),
  );
  protected readonly taxRateOptions = computed(() =>
    this.store.taxRates().map((taxRate) => ({
      id: taxRate.id,
      label: `${taxRate.code} - ${taxRate.label} (${this.formatTax(taxRate.percentage)})`,
    })),
  );
  protected readonly periodOptions = computed(() =>
    this.store.availablePeriods().map((period) => ({ label: period.label, value: period.key })),
  );
  protected readonly previewDialogState = signal<'open' | 'closed'>('closed');
  private readonly selectedPreviewStatus = signal<
    InvoiceStatus.CONCEPT | InvoiceStatus.PROFORMA | InvoiceStatus.OPEN
  >(
    InvoiceStatus.CONCEPT,
  );
  protected readonly selectedPreviewLineView = signal<'detailed' | 'summary'>('detailed');

  protected readonly generationForm = this.formBuilder.group({
    clientId: [0, [Validators.required, Validators.min(1)]],
    periodKey: ['', [Validators.required]],
    mode: ['per_project' as InvoiceGenerateMode, [Validators.required]],
    taxRateId: [0, [Validators.required, Validators.min(1)]],
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.clientsStore.loadClientsIfNeeded(), this.store.loadInvoicesIfNeeded()]);
    const firstClientId = this.clientOptions()[0]?.id ?? 0;
    const firstTaxId = this.store.taxRates()[0]?.id ?? 0;
    this.generationForm.patchValue({ clientId: firstClientId, taxRateId: firstTaxId });
    await this.refreshPeriods();
  }

  protected async generate(): Promise<void> {
    if (this.generationForm.invalid) {
      this.generationForm.markAllAsTouched();
      return;
    }
    const raw = this.generationForm.getRawValue();
    const selectedPeriod = this.store
      .availablePeriods()
      .find((period) => period.key === (raw.periodKey ?? ''));
    if (!selectedPeriod) {
      this.toast.show('Please select a period.', 'info');
      return;
    }

    await this.store.loadInvoicePreviews({
      clientId: Number(raw.clientId ?? 0),
      billingModel: selectedPeriod.billingModel,
      periodStart: selectedPeriod.periodStart,
      periodEnd: selectedPeriod.periodEnd,
      mode: raw.mode ?? 'per_project',
      taxRateId: Number(raw.taxRateId ?? 0),
    });
    if (!this.store.error() && this.store.invoicePreviews().length > 0) {
      this.previewDialogState.set('open');
    } else if (!this.store.error()) {
      this.toast.show('No uninvoiced entries found for this period.', 'info');
    }
  }

  protected async setStatus(
    invoiceId: number,
    status:
      | InvoiceStatus.CONCEPT
      | InvoiceStatus.PROFORMA
      | InvoiceStatus.OPEN
      | InvoiceStatus.PAID
      | InvoiceStatus.CREDITED,
  ): Promise<void> {
    const confirmationMessage = this.statusConfirmationMessage(status);
    if (confirmationMessage && !window.confirm(confirmationMessage)) {
      return;
    }

    const payload: InvoiceStatusUpdateInput = { status };
    await this.store.updateStatus(invoiceId, payload);
    if (!this.store.error()) {
      this.toast.show(`Invoice status updated to ${status}.`, 'success');
    }
  }

  protected async selectInvoice(invoiceId: number): Promise<void> {
    await this.store.selectInvoice(invoiceId);
  }

  protected async deleteInvoice(invoiceId: number): Promise<void> {
    if (
      !window.confirm(
        'Delete this invoice? Linked time entries will be unlocked and line items removed.',
      )
    ) {
      return;
    }

    const deleted = await this.store.deleteInvoice(invoiceId);
    if (deleted && !this.store.error()) {
      this.toast.show('Invoice deleted.', 'success');
    }
  }

  protected formatTax(percentage: number): string {
    return `${(percentage / 100).toFixed(2)}%`;
  }

  protected readonly optionToLabel = (option: { label: string } | null): string =>
    option?.label ?? '';

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

  protected selectedTaxRateOption(): { id: number; label: string } | null {
    const value = Number(this.generationForm.controls.taxRateId.value ?? 0);
    return this.taxRateOptions().find((option) => option.id === value) ?? null;
  }

  protected selectedPeriodOption(): { label: string; value: string } | null {
    const value = this.generationForm.controls.periodKey.value;
    return this.periodOptions().find((option) => option.value === value) ?? null;
  }

  protected selectedModeOption(): { label: string; value: InvoiceGenerateMode } | null {
    const value = this.generationForm.controls.mode.value;
    return this.modeOptions.find((option) => option.value === value) ?? null;
  }

  protected onClientValueChange(option: { id: number; label: string } | null): void {
    this.generationForm.controls.clientId.setValue(option?.id ?? 0);
    void this.refreshPeriods();
  }

  protected onTaxRateValueChange(option: { id: number; label: string } | null): void {
    this.generationForm.controls.taxRateId.setValue(option?.id ?? 0);
  }

  protected onPeriodValueChange(option: { label: string; value: string } | null): void {
    this.generationForm.controls.periodKey.setValue(option?.value ?? '');
  }

  protected onModeValueChange(option: { label: string; value: InvoiceGenerateMode } | null): void {
    this.generationForm.controls.mode.setValue(option?.value ?? 'per_project');
  }

  protected selectedPreviewStatusOption():
    | { label: string; value: InvoiceStatus.CONCEPT | InvoiceStatus.PROFORMA | InvoiceStatus.OPEN }
    | null {
    return this.initialStatusOptions.find((option) => option.value === this.selectedPreviewStatus()) ?? null;
  }

  protected onPreviewStatusValueChange(
    option:
      | { label: string; value: InvoiceStatus.CONCEPT | InvoiceStatus.PROFORMA | InvoiceStatus.OPEN }
      | null,
  ): void {
    this.selectedPreviewStatus.set(option?.value ?? InvoiceStatus.CONCEPT);
  }

  protected selectedPreviewLineViewOption():
    | { label: string; value: 'detailed' | 'summary' }
    | null {
    return (
      this.previewLineViewOptions.find((option) => option.value === this.selectedPreviewLineView()) ??
      null
    );
  }

  protected onPreviewLineViewValueChange(
    option: { label: string; value: 'detailed' | 'summary' } | null,
  ): void {
    this.selectedPreviewLineView.set(option?.value ?? 'detailed');
  }

  protected closePreviewDialog(): void {
    this.previewDialogState.set('closed');
    this.store.clearInvoicePreviews();
    this.selectedPreviewLineView.set('detailed');
  }

  protected async confirmGenerateFromPreview(): Promise<void> {
    const raw = this.generationForm.getRawValue();
    const selectedPeriod = this.store
      .availablePeriods()
      .find((period) => period.key === (raw.periodKey ?? ''));
    if (!selectedPeriod) {
      this.toast.show('Please select a period.', 'info');
      return;
    }
    const payload: InvoiceGenerateInput = {
      clientId: Number(raw.clientId ?? 0),
      billingModel: selectedPeriod.billingModel,
      periodStart: selectedPeriod.periodStart,
      periodEnd: selectedPeriod.periodEnd,
      status: this.selectedPreviewStatus(),
      mode: raw.mode ?? 'per_project',
      taxRateId: Number(raw.taxRateId ?? 0),
    };
    await this.store.generateInvoices(payload);
    if (!this.store.error()) {
      this.toast.show('Invoice generation completed.', 'success');
      this.previewDialogState.set('closed');
      this.store.clearInvoicePreviews();
      await this.refreshPeriods();
    }
  }

  private statusConfirmationMessage(
    status:
      | InvoiceStatus.CONCEPT
      | InvoiceStatus.PROFORMA
      | InvoiceStatus.OPEN
      | InvoiceStatus.PAID
      | InvoiceStatus.CREDITED,
  ): string {
    switch (status) {
      case InvoiceStatus.OPEN:
        return 'Open this invoice now? This locks linked time entries and cannot be undone.';
      case InvoiceStatus.CONCEPT:
        return 'Revert this invoice to concept? This will unlock linked time entries.';
      case InvoiceStatus.PROFORMA:
        return 'Revert this invoice to proforma? This will unlock linked time entries.';
      case InvoiceStatus.PAID:
        return 'Mark this invoice as paid?';
      case InvoiceStatus.CREDITED:
        return 'Credit this invoice? Credited invoices are terminal.';
      default:
        return '';
    }
  }
  private async refreshPeriods(): Promise<void> {
    const clientId = Number(this.generationForm.controls.clientId.value ?? 0);
    if (clientId < 1) {
      this.generationForm.controls.periodKey.setValue('');
      return;
    }
    await this.store.loadAvailablePeriods(clientId);
    this.generationForm.controls.periodKey.setValue(this.store.availablePeriods()[0]?.key ?? '');
  }

  protected summarizePreviewByProject(
    lines: ReadonlyArray<{
      projectId: number;
      hours: number;
      lineNet: number;
      taxAmount: number;
      lineGross: number;
    }>,
  ): Array<{
    projectId: number;
    entryCount: number;
    hours: number;
    lineNet: number;
    taxAmount: number;
    lineGross: number;
  }> {
    const grouped = new Map<
      number,
      { entryCount: number; hours: number; lineNet: number; taxAmount: number; lineGross: number }
    >();

    for (const line of lines) {
      const next = grouped.get(line.projectId) ?? {
        entryCount: 0,
        hours: 0,
        lineNet: 0,
        taxAmount: 0,
        lineGross: 0,
      };
      next.entryCount += 1;
      next.hours += line.hours;
      next.lineNet += line.lineNet;
      next.taxAmount += line.taxAmount;
      next.lineGross += line.lineGross;
      grouped.set(line.projectId, next);
    }

    return [...grouped.entries()].map(([projectId, values]) => ({ projectId, ...values }));
  }
}
