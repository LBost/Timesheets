import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { ToastService } from '../../../core/feedback/toast.service';
import { activeLookup } from '../../../shared/components/combobox-selection/combobox-selection.util';
import { FeatureHeaderActionsComponent } from '../../../shared/components/feature-header-actions/feature-header-actions.component';
import { ClientsStore } from '../../clients/state/clients.store';
import { formatInvoicePeriodLabel } from '../data/invoice-period.util';
import {
  InvoiceGenerateMode,
  InvoiceGenerateInput,
  InvoiceStatus,
  InvoiceStatusUpdateInput,
} from '../models/invoice.model';
import { InvoicesStore } from '../state/invoices.store';
import { InvoicesGenerateSheetFormComponent } from './components/invoices-generate-sheet-form.component';
import { InvoicesStateMessagesComponent } from './components/invoices-state-messages.component';
import { InvoicesTableComponent } from './components/invoices-table.component';

@Component({
  selector: 'app-invoices-page',
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmSeparatorImports,
    HlmComboboxImports,
    HlmDialogImports,
    HlmSheetImports,
    FeatureHeaderActionsComponent,
    InvoicesGenerateSheetFormComponent,
    InvoicesStateMessagesComponent,
    InvoicesTableComponent,
  ],
  template: `
    <section class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <hlm-sheet>
        <app-feature-header-actions
          title="Invoices"
          subtitle="Generate invoices and manage transitions."
          addAriaLabel="Generate invoice"
          [showRefresh]="true"
          refreshAriaLabel="Refresh invoices"
          (addRequested)="openGenerateSheet()"
          (refreshRequested)="refreshInvoices()"
        />
        <button #sheetOpenButton class="hidden" hlmSheetTrigger side="right" type="button"></button>
        <ng-template hlmSheetPortal>
          <hlm-sheet-content class="w-full border-border/40 sm:max-w-xl">
            <div hlmSheetHeader>
              <h2 hlmSheetTitle>Generate invoice(s)</h2>
            </div>
            <app-invoices-generate-sheet-form
              [form]="generationForm"
              [isLoading]="store.isLoading()"
              [isValid]="generationForm.valid"
              [clientOptions]="clientOptions()"
              [taxRateOptions]="taxRateOptions()"
              [periodOptions]="periodOptions()"
              [modeOptions]="modeOptions"
              [selectedClientOption]="selectedClientOption()"
              [selectedTaxRateOption]="selectedTaxRateOption()"
              [selectedPeriodOption]="selectedPeriodOption()"
              [selectedModeOption]="selectedModeOption()"
              [optionToLabel]="optionToLabel"
              [isSameIdOption]="isSameIdOption"
              [isSameValueOption]="isSameValueOption"
              (submitted)="generate()"
              (clientChanged)="onClientValueChange($event)"
              (taxRateChanged)="onTaxRateValueChange($event)"
              (periodChanged)="onPeriodValueChange($event)"
              (modeChanged)="onModeValueChange($event)"
              (cancelRequested)="cancelGenerateSheet()"
            />
            <button #sheetCloseButton class="hidden" hlmSheetClose type="button"></button>
          </hlm-sheet-content>
        </ng-template>
      </hlm-sheet>

      <hlm-sheet>
        <button
          #editSheetOpenButton
          class="hidden"
          hlmSheetTrigger
          side="right"
          type="button"
        ></button>
        <ng-template hlmSheetPortal>
          <hlm-sheet-content class="w-full border-border/40 sm:max-w-5xl">
            <div hlmSheetHeader>
              <h2 hlmSheetTitle>Edit invoice</h2>
            </div>
            @if (store.selectedInvoice(); as invoice) {
              <form
                class="flex h-full flex-col gap-5 py-4"
                [formGroup]="editForm"
                (ngSubmit)="saveInvoiceEdit()"
              >
                <div class="grid gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <p class="text-muted-foreground">Invoice</p>
                    <p class="font-medium">{{ invoice.invoiceNumber }}</p>
                  </div>
                  <div>
                    <p class="text-muted-foreground">Client</p>
                    <p class="font-medium">{{ invoice.clientName }}</p>
                  </div>
                  <div>
                    <p class="text-muted-foreground">Period</p>
                    <p class="font-medium">
                      {{ formatInvoicePeriod(invoice.periodStart, invoice.periodEnd) }}
                    </p>
                  </div>
                  <label class="grid gap-1">
                    <span>Status *</span>
                    <div
                      hlmCombobox
                      [value]="selectedEditStatusOption()"
                      [itemToString]="optionToLabel"
                      [isItemEqualToValue]="isSameValueOption"
                      (valueChange)="onEditStatusValueChange($event)"
                    >
                      <hlm-combobox-trigger class="w-full justify-between">
                        <span>{{ selectedEditStatusOption()?.label ?? 'Select status' }}</span>
                      </hlm-combobox-trigger>
                      <ng-template hlmComboboxPortal>
                        <div hlmComboboxContent>
                          <div hlmComboboxList>
                            @for (status of statusOptions; track status.value) {
                              <hlm-combobox-item [value]="status">{{
                                status.label
                              }}</hlm-combobox-item>
                            }
                          </div>
                        </div>
                      </ng-template>
                    </div>
                  </label>
                </div>

                <div class="min-h-0 flex-1 rounded-md border border-border p-3">
                  <p class="text-sm font-semibold">Line items</p>
                  <p class="text-xs text-muted-foreground">
                    {{ invoice.lineItemCount }} linked line item(s)
                  </p>
                  <div class="mt-2 overflow-auto rounded-md border border-border">
                    <table class="w-full min-w-[980px] table-fixed text-sm">
                      <colgroup>
                        <col class="w-[16%]" />
                        <col class="w-[44%]" />
                        <col class="w-[10%]" />
                        <col class="w-[10%]" />
                        <col class="w-[10%]" />
                        <col class="w-[10%]" />
                      </colgroup>
                      <thead
                        class="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        <tr>
                          <th class="px-3 py-2 font-medium">Period</th>
                          <th class="px-3 py-2 font-medium">Project / Order</th>
                          <th class="px-3 py-2 text-right font-medium">Hours</th>
                          <th class="px-3 py-2 text-right font-medium">Net</th>
                          <th class="px-3 py-2 text-right font-medium">VAT</th>
                          <th class="px-3 py-2 text-right font-medium">Gross</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (line of store.selectedLineItems(); track line.id) {
                          <tr class="border-t border-border/60">
                            <td class="px-3 py-2 align-top whitespace-nowrap">
                              {{ line.workDate }}
                            </td>
                            <td class="px-3 py-2 align-top">{{ invoiceLineProjectLabel(line) }}</td>
                            <td
                              class="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap"
                            >
                              {{ formatHours(line.hours) }}
                            </td>
                            <td
                              class="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap"
                            >
                              {{ formatMoney(line.lineNet) }}
                            </td>
                            <td
                              class="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap"
                            >
                              {{ formatMoney(line.taxAmount) }}
                            </td>
                            <td
                              class="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap"
                            >
                              {{ formatMoney(line.lineGross) }}
                            </td>
                          </tr>
                        } @empty {
                          <tr class="border-t border-border/60">
                            <td class="px-3 py-8 text-center text-muted-foreground" colspan="6">
                              No line items linked to this invoice.
                            </td>
                          </tr>
                        }
                      </tbody>
                      <tfoot class="border-t border-border bg-muted/20">
                        <tr>
                          <td
                            class="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground"
                            colspan="2"
                          >
                            Totals
                          </td>
                          <td
                            class="px-3 py-2 text-right font-semibold tabular-nums whitespace-nowrap"
                          >
                            {{ formatHours(selectedLineTotals().hours) }}
                          </td>
                          <td
                            class="px-3 py-2 text-right font-semibold tabular-nums whitespace-nowrap"
                          >
                            {{ formatMoney(selectedLineTotals().net) }}
                          </td>
                          <td
                            class="px-3 py-2 text-right font-semibold tabular-nums whitespace-nowrap"
                          >
                            {{ formatMoney(selectedLineTotals().tax) }}
                          </td>
                          <td
                            class="px-3 py-2 text-right font-semibold tabular-nums whitespace-nowrap"
                          >
                            {{ formatMoney(selectedLineTotals().gross) }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div class="mt-auto flex flex-wrap justify-start gap-2 border-t border-border pt-4">
                  <button hlmBtn type="submit" [disabled]="store.isLoading() || editForm.invalid">
                    Save
                  </button>
                  <button hlmBtn type="button" variant="secondary" (click)="resetEditForm()">
                    Reset
                  </button>
                  <button hlmBtn type="button" variant="outline" (click)="cancelEditSheet()">
                    Cancel
                  </button>
                </div>
              </form>
            } @else {
              <p class="py-4 text-sm text-muted-foreground">Select an invoice to edit.</p>
            }
            <button #editSheetCloseButton class="hidden" hlmSheetClose type="button"></button>
          </hlm-sheet-content>
        </ng-template>
      </hlm-sheet>

      <!-- <div hlmSeparator></div> -->
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <app-invoices-state-messages [storeError]="store.error()" />

        <app-invoices-table
          [invoices]="store.invoices()"
          (addRequested)="openGenerateSheet()"
          (editRequested)="openEditInvoice($event)"
          (deleteRequested)="deleteInvoice($event)"
        />

        <hlm-dialog
          [state]="previewDialogState()"
          ariaLabel="Invoice preview dialog"
          [ariaModal]="true"
          (closed)="closePreviewDialog()"
        >
          <ng-template hlmDialogPortal>
            <hlm-dialog-content
              [showCloseButton]="true"
              class="left-0! top-0! mx-0! h-screen! w-screen! max-h-screen! max-w-none! translate-x-0! translate-y-0! overflow-hidden! rounded-none! border-0! p-0! shadow-none!"
            >
              <div class="flex h-full flex-col">
                <hlm-dialog-header class="border-b border-border px-6 py-4 text-start">
                  <h2 hlmDialogTitle>Confirm invoice generation</h2>
                  <p hlmDialogDescription>
                    Select status and review line items before creating invoices.
                  </p>
                </hlm-dialog-header>
                <div class="flex flex-1 flex-col gap-3 overflow-auto px-6 py-4">
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
                                <hlm-combobox-item [value]="status">{{
                                  status.label
                                }}</hlm-combobox-item>
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
                                <hlm-combobox-item [value]="view">{{
                                  view.label
                                }}</hlm-combobox-item>
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
                      <div class="mt-2 overflow-x-auto rounded-md border border-border">
                        <table class="w-full min-w-[980px] table-fixed text-sm">
                          <colgroup>
                            <col class="w-[16%]" />
                            <col class="w-[44%]" />
                            <col class="w-[10%]" />
                            <col class="w-[10%]" />
                            <col class="w-[10%]" />
                            <col class="w-[10%]" />
                          </colgroup>
                          <thead
                            class="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"
                          >
                            <tr>
                              <th class="px-3 py-2 font-medium">Period</th>
                              <th class="px-3 py-2 font-medium">Project / Order</th>
                              <th class="px-3 py-2 text-right font-medium">Hours</th>
                              <th class="px-3 py-2 text-right font-medium">Net</th>
                              <th class="px-3 py-2 text-right font-medium">VAT</th>
                              <th class="px-3 py-2 text-right font-medium">Gross</th>
                            </tr>
                          </thead>
                          <tbody>
                            @if (selectedPreviewLineView() === 'detailed') {
                              @for (line of preview.lineItems; track line.timeEntryId) {
                                <tr class="border-t border-border/60">
                                  <td class="px-3 py-2 align-top whitespace-nowrap">
                                    {{ line.workDate }}
                                  </td>
                                  <td class="px-3 py-2 align-top">
                                    {{ previewLineProjectLabel(line) }}
                                  </td>
                                  <td
                                    class="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap"
                                  >
                                    {{ formatHours(line.hours) }}
                                  </td>
                                  <td
                                    class="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap"
                                  >
                                    {{ formatMoney(line.lineNet) }}
                                  </td>
                                  <td
                                    class="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap"
                                  >
                                    {{ formatMoney(line.taxAmount) }}
                                  </td>
                                  <td
                                    class="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap"
                                  >
                                    {{ formatMoney(line.lineGross) }}
                                  </td>
                                </tr>
                              }
                            } @else {
                              @for (
                                summaryLine of summarizePreviewByProject(preview.lineItems);
                                track summaryLine.projectId
                              ) {
                                <tr class="border-t border-border/60">
                                  <td class="px-3 py-2 align-top whitespace-nowrap">
                                    {{ previewPeriodLabel() }}
                                  </td>
                                  <td class="px-3 py-2 align-top">
                                    {{ summaryLine.projectLabel }}
                                  </td>
                                  <td
                                    class="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap"
                                  >
                                    {{ formatHours(summaryLine.hours) }}
                                  </td>
                                  <td
                                    class="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap"
                                  >
                                    {{ formatMoney(summaryLine.lineNet) }}
                                  </td>
                                  <td
                                    class="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap"
                                  >
                                    {{ formatMoney(summaryLine.taxAmount) }}
                                  </td>
                                  <td
                                    class="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap"
                                  >
                                    {{ formatMoney(summaryLine.lineGross) }}
                                  </td>
                                </tr>
                              }
                            }
                          </tbody>
                          <tfoot class="border-t border-border bg-muted/20">
                            <tr>
                              <td
                                class="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground"
                                colspan="3"
                              >
                                Totals
                              </td>
                              <td
                                class="px-3 py-2 text-right font-semibold tabular-nums whitespace-nowrap"
                              >
                                {{ formatMoney(preview.subtotalNet) }}
                              </td>
                              <td
                                class="px-3 py-2 text-right font-semibold tabular-nums whitespace-nowrap"
                              >
                                {{ formatMoney(preview.totalTax) }}
                              </td>
                              <td
                                class="px-3 py-2 text-right font-semibold tabular-nums whitespace-nowrap"
                              >
                                {{ formatMoney(preview.totalGross) }}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  }
                </div>
                <hlm-dialog-footer class="justify-end gap-2 border-t border-border px-6 py-4">
                  <button hlmBtn type="button" variant="outline" hlmDialogClose>Cancel</button>
                  <button
                    hlmBtn
                    type="button"
                    [disabled]="store.isLoading()"
                    (click)="confirmGenerateFromPreview()"
                  >
                    Confirm generate
                  </button>
                </hlm-dialog-footer>
              </div>
            </hlm-dialog-content>
          </ng-template>
        </hlm-dialog>
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
  @ViewChild('sheetOpenButton', { read: ElementRef })
  private readonly sheetOpenButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('sheetCloseButton', { read: ElementRef })
  private readonly sheetCloseButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('editSheetOpenButton', { read: ElementRef })
  private readonly editSheetOpenButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('editSheetCloseButton', { read: ElementRef })
  private readonly editSheetCloseButton?: ElementRef<HTMLButtonElement>;
  protected readonly invoiceStatus = InvoiceStatus;
  protected readonly statusOptions = [
    { label: 'Concept', value: InvoiceStatus.CONCEPT },
    { label: 'Proforma', value: InvoiceStatus.PROFORMA },
    { label: 'Open', value: InvoiceStatus.OPEN },
    { label: 'Paid', value: InvoiceStatus.PAID },
    { label: 'Credited', value: InvoiceStatus.CREDITED },
  ] as const;
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
  protected readonly selectedLineTotals = computed(() =>
    this.store.selectedLineItems().reduce(
      (totals, line) => ({
        hours: totals.hours + line.hours,
        net: totals.net + line.lineNet,
        tax: totals.tax + line.taxAmount,
        gross: totals.gross + line.lineGross,
      }),
      { hours: 0, net: 0, tax: 0, gross: 0 },
    ),
  );
  protected readonly previewDialogState = signal<'open' | 'closed'>('closed');
  private readonly editingInvoiceId = signal<number | null>(null);
  private readonly selectedPreviewStatus = signal<
    InvoiceStatus.CONCEPT | InvoiceStatus.PROFORMA | InvoiceStatus.OPEN
  >(InvoiceStatus.CONCEPT);
  protected readonly selectedPreviewLineView = signal<'detailed' | 'summary'>('detailed');

  protected readonly generationForm = this.formBuilder.group({
    clientId: [0, [Validators.required, Validators.min(1)]],
    periodKey: ['', [Validators.required]],
    mode: ['per_project' as InvoiceGenerateMode, [Validators.required]],
    taxRateId: [0, [Validators.required, Validators.min(1)]],
  });
  protected readonly editForm = this.formBuilder.group({
    status: [InvoiceStatus.CONCEPT as InvoiceStatusUpdateInput['status'], [Validators.required]],
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.clientsStore.loadClientsIfNeeded(), this.store.loadInvoicesIfNeeded()]);
    const firstClientId = this.clientOptions()[0]?.id ?? 0;
    const firstTaxId = this.store.taxRates()[0]?.id ?? 0;
    this.generationForm.patchValue({ clientId: firstClientId, taxRateId: firstTaxId });
    await this.refreshPeriods();
  }

  protected openGenerateSheet(): void {
    this.sheetOpenButton?.nativeElement.click();
  }

  protected cancelGenerateSheet(): void {
    this.closeGenerateSheet();
  }

  protected async refreshInvoices(): Promise<void> {
    await Promise.all([this.clientsStore.loadClientsIfNeeded(), this.store.loadInvoices()]);
    await this.refreshPeriods();
    if (!this.store.error()) {
      this.toast.show('Invoices refreshed.', 'success');
    }
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
      this.closeGenerateSheet();
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
  ): Promise<boolean> {
    const currentStatus =
      this.store.invoices().find((invoice) => invoice.id === invoiceId)?.status ??
      this.store.selectedInvoice()?.status;
    const confirmationMessage = this.statusConfirmationMessage(status, currentStatus);
    if (confirmationMessage && !window.confirm(confirmationMessage)) {
      return false;
    }

    const payload: InvoiceStatusUpdateInput = { status };
    await this.store.updateStatus(invoiceId, payload);
    if (!this.store.error()) {
      this.toast.show(`Invoice status updated to ${status}.`, 'success');
      return true;
    }
    return false;
  }

  protected async selectInvoice(invoiceId: number): Promise<void> {
    await this.store.selectInvoice(invoiceId);
  }

  protected async openEditInvoice(invoiceId: number): Promise<void> {
    await this.store.selectInvoice(invoiceId);
    const invoice = this.store.selectedInvoice();
    if (!invoice) {
      this.toast.show('Invoice not found.', 'info');
      return;
    }

    this.editingInvoiceId.set(invoiceId);
    this.editForm.controls.status.setValue(invoice.status);
    this.editSheetOpenButton?.nativeElement.click();
  }

  protected async saveInvoiceEdit(): Promise<void> {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const invoiceId = this.editingInvoiceId();
    const status = this.editForm.controls.status.value;
    const currentStatus = this.store.selectedInvoice()?.status;
    if (invoiceId === null || !status) {
      return;
    }
    if (status === currentStatus) {
      this.cancelEditSheet();
      return;
    }

    const updated = await this.setStatus(invoiceId, status);
    if (updated) {
      this.cancelEditSheet();
    }
  }

  protected resetEditForm(): void {
    const invoice = this.store.selectedInvoice();
    if (invoice) {
      this.editForm.controls.status.setValue(invoice.status);
    }
  }

  protected cancelEditSheet(): void {
    this.editingInvoiceId.set(null);
    this.editSheetCloseButton?.nativeElement.click();
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

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  protected formatHours(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
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

  protected selectedEditStatusOption(): {
    label: string;
    value: InvoiceStatusUpdateInput['status'];
  } | null {
    const value = this.editForm.controls.status.value;
    return this.statusOptions.find((option) => option.value === value) ?? null;
  }

  protected onEditStatusValueChange(
    option: { label: string; value: InvoiceStatusUpdateInput['status'] } | null,
  ): void {
    this.editForm.controls.status.setValue(option?.value ?? InvoiceStatus.CONCEPT);
  }

  protected selectedPreviewStatusOption(): {
    label: string;
    value: InvoiceStatus.CONCEPT | InvoiceStatus.PROFORMA | InvoiceStatus.OPEN;
  } | null {
    return (
      this.initialStatusOptions.find((option) => option.value === this.selectedPreviewStatus()) ??
      null
    );
  }

  protected onPreviewStatusValueChange(
    option: {
      label: string;
      value: InvoiceStatus.CONCEPT | InvoiceStatus.PROFORMA | InvoiceStatus.OPEN;
    } | null,
  ): void {
    this.selectedPreviewStatus.set(option?.value ?? InvoiceStatus.CONCEPT);
  }

  protected selectedPreviewLineViewOption(): {
    label: string;
    value: 'detailed' | 'summary';
  } | null {
    return (
      this.previewLineViewOptions.find(
        (option) => option.value === this.selectedPreviewLineView(),
      ) ?? null
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
      this.openGenerateSheet();
    }
  }

  private statusConfirmationMessage(
    status:
      | InvoiceStatus.CONCEPT
      | InvoiceStatus.PROFORMA
      | InvoiceStatus.OPEN
      | InvoiceStatus.PAID
      | InvoiceStatus.CREDITED,
    currentStatus?: InvoiceStatus,
  ): string {
    if (status === currentStatus) {
      return '';
    }
    switch (status) {
      case InvoiceStatus.OPEN:
        return 'Open this invoice now? This locks linked time entries.';
      case InvoiceStatus.CONCEPT:
        return currentStatus === InvoiceStatus.OPEN
          ? 'Revert this invoice to concept? This will unlock linked time entries.'
          : '';
      case InvoiceStatus.PROFORMA:
        return currentStatus === InvoiceStatus.OPEN
          ? 'Revert this invoice to proforma? This will unlock linked time entries.'
          : '';
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

  private closeGenerateSheet(): void {
    this.sheetCloseButton?.nativeElement.click();
  }

  protected previewPeriodLabel(): string {
    return this.selectedPeriodOption()?.label ?? '-';
  }

  protected invoiceLineProjectLabel(line: {
    projectCode: string;
    projectName: string;
    orderCode: string | null;
    orderTitle: string | null;
  }): string {
    if (line.orderCode && line.orderTitle) {
      return `${line.orderCode} - ${line.orderTitle}`;
    }
    return `${line.projectCode} - ${line.projectName}`;
  }

  protected formatInvoicePeriod(periodStart: string, periodEnd: string): string {
    return formatInvoicePeriodLabel(periodStart, periodEnd);
  }

  protected previewLineProjectLabel(line: {
    projectCode: string;
    projectName: string;
    orderCode: string | null;
    orderTitle: string | null;
  }): string {
    if (line.orderCode && line.orderTitle) {
      return `${line.orderCode} - ${line.orderTitle}`;
    }
    return `${line.projectCode} - ${line.projectName}`;
  }

  protected summarizePreviewByProject(
    lines: ReadonlyArray<{
      projectId: number;
      projectCode: string;
      projectName: string;
      orderCode: string | null;
      orderTitle: string | null;
      hours: number;
      lineNet: number;
      taxAmount: number;
      lineGross: number;
    }>,
  ): Array<{
    projectId: number;
    projectLabel: string;
    entryCount: number;
    hours: number;
    lineNet: number;
    taxAmount: number;
    lineGross: number;
  }> {
    const grouped = new Map<
      number,
      {
        projectLabel: string;
        entryCount: number;
        hours: number;
        lineNet: number;
        taxAmount: number;
        lineGross: number;
      }
    >();

    for (const line of lines) {
      const next = grouped.get(line.projectId) ?? {
        projectLabel: this.previewLineProjectLabel(line),
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
