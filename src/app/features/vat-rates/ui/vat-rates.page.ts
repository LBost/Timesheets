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
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { type ColumnDef } from '@tanstack/angular-table';
import { flexRenderComponent } from '@tanstack/angular-table';
import { ToastService } from '../../../core/feedback/toast.service';
import { EntityDataTableComponent } from '../../../shared/components/entity-data-table/entity-data-table.component';
import type {
  EntityDataTableColumnFilter,
  EntityTableRow,
} from '../../../shared/components/entity-data-table/entity-data-table.component';
import { DataTableSortHeaderComponent } from '../../../shared/components/entity-data-table/data-table-sort-header.component';
import { FeatureHeaderActionsComponent } from '../../../shared/components/feature-header-actions/feature-header-actions.component';
import { VatRateCreateInput, VatRateUpdateInput } from '../models/vat-rate.model';
import { VatRateVM } from '../models/vat-rate.vm';
import { VatRatesStore } from '../state/vat-rates.store';

@Component({
  selector: 'app-vat-rates-page',
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmComboboxImports,
    HlmInputImports,
    HlmSeparatorImports,
    HlmSheetImports,
    FeatureHeaderActionsComponent,
    EntityDataTableComponent,
  ],
  template: `
    <section class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <hlm-sheet>
        <app-feature-header-actions
          title="VAT Rates"
          subtitle="Maintain reusable tax rates for invoice generation."
          addAriaLabel="Add VAT rate"
          [showRefresh]="true"
          refreshAriaLabel="Refresh VAT rates"
          (addRequested)="openAddMode()"
          (refreshRequested)="refreshVatRates()"
        />
        <button #sheetOpenButton class="hidden" hlmSheetTrigger side="right" type="button"></button>
        <ng-template hlmSheetPortal>
          <hlm-sheet-content class="w-full border-border/40 sm:max-w-xl">
            <div hlmSheetHeader>
              <h2 hlmSheetTitle>{{ isEditing() ? 'Edit VAT rate' : 'Add VAT rate' }}</h2>
            </div>
            <form class="grid gap-4 pt-4" [formGroup]="vatRateForm" (ngSubmit)="submitVatRate()">
              <label class="grid gap-1 text-sm">
                <span>Code *</span>
                <input
                  hlmInput
                  type="text"
                  formControlName="code"
                  placeholder="VAT19"
                  maxlength="40"
                />
              </label>
              <label class="grid gap-1 text-sm">
                <span>Label *</span>
                <input
                  hlmInput
                  type="text"
                  formControlName="label"
                  placeholder="VAT 19%"
                  maxlength="120"
                />
              </label>
              <label class="grid gap-1 text-sm">
                <span>Percentage (%) *</span>
                <input
                  hlmInput
                  type="number"
                  formControlName="percentage"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </label>
              <label class="grid gap-1 text-sm">
                <span>Status *</span>
                <div
                  hlmCombobox
                  [value]="selectedStatusOption()"
                  [itemToString]="statusItemToLabel"
                  [isItemEqualToValue]="isSameStatusOption"
                  (valueChange)="onStatusValueChange($event)"
                >
                  <hlm-combobox-trigger class="w-full justify-between">
                    <span>{{ selectedStatusOption()?.label ?? 'Select status' }}</span>
                  </hlm-combobox-trigger>
                  <ng-template hlmComboboxPortal>
                    <div hlmComboboxContent>
                      <div hlmComboboxList>
                        @for (option of statusOptions; track option.value) {
                          <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
                        }
                      </div>
                    </div>
                  </ng-template>
                </div>
              </label>
              <div class="flex items-center justify-start gap-2 pt-2">
                <button hlmBtn type="submit" [disabled]="vatRateForm.invalid || store.isLoading()">
                  {{ isEditing() ? 'Save changes' : 'Create VAT rate' }}
                </button>
                <button hlmBtn type="button" variant="outline" (click)="resetForm()">Clear</button>
                <button hlmBtn type="button" variant="ghost" (click)="cancelSheet()">Cancel</button>
              </div>
            </form>
            <button #sheetCloseButton class="hidden" hlmSheetClose type="button"></button>
          </hlm-sheet-content>
        </ng-template>
      </hlm-sheet>
      <!-- <div hlmSeparator></div> -->

      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        @if (store.error()) {
          <p
            class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {{ store.error() }}
          </p>
        } @else if (showLoadingSpinner()) {
          <p class="text-sm text-muted-foreground">Loading VAT rates…</p>
        }

        <app-entity-data-table
          [data]="store.vatRates()"
          [columns]="columns"
          [globalFilterRowText]="globalFilterText"
          [columnFiltersConfig]="columnFilters()"
          filterPlaceholder="Filter VAT rates…"
          emptyMessage="No VAT rates yet."
          (addRequested)="openAddMode()"
          (editRequested)="editVatRate($event)"
          (deleteRequested)="deleteVatRate($event)"
          (archiveRequested)="archiveVatRate($event)"
        />
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VatRatesPage implements OnInit {
  protected readonly store = inject(VatRatesStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  @ViewChild('sheetOpenButton', { read: ElementRef })
  private readonly sheetOpenButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('sheetCloseButton', { read: ElementRef })
  private readonly sheetCloseButton?: ElementRef<HTMLButtonElement>;
  protected readonly selectedId = signal<number | null>(null);
  protected readonly isEditing = computed(() => this.selectedId() !== null);
  private readonly hasInitialLoadCompleted = signal(false);
  protected readonly showLoadingSpinner = computed(
    () => !this.hasInitialLoadCompleted() && this.store.isLoading(),
  );
  protected readonly statusOptions: ReadonlyArray<{ label: string; value: boolean }> = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  protected readonly vatRateForm = this.formBuilder.group({
    code: ['', [Validators.required, Validators.maxLength(40)]],
    label: ['', [Validators.required, Validators.maxLength(120)]],
    percentage: [19, [Validators.required, Validators.min(0), Validators.max(100)]],
    isActive: [true, [Validators.required]],
  });

  protected readonly columnFilters = computed<readonly EntityDataTableColumnFilter[]>(() => [
    {
      columnId: 'status',
      label: 'Statuses',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ]);

  protected readonly columns = createVatRateColumns() as ColumnDef<EntityTableRow>[];

  async ngOnInit(): Promise<void> {
    try {
      await this.store.loadVatRatesIfNeeded();
    } finally {
      this.hasInitialLoadCompleted.set(true);
    }
  }

  protected async submitVatRate(): Promise<void> {
    if (this.vatRateForm.invalid) {
      this.vatRateForm.markAllAsTouched();
      return;
    }

    const payload = this.formValue();
    const selectedId = this.selectedId();
    if (selectedId === null) {
      await this.store.createVatRate(payload as VatRateCreateInput);
      if (!this.store.error()) {
        this.toast.show('VAT rate created.', 'success');
      }
      this.resetForm();
      this.closeSheet();
      return;
    }

    await this.store.updateVatRate(selectedId, payload as VatRateUpdateInput);
    if (!this.store.error()) {
      this.toast.show('VAT rate updated.', 'success');
    }
    this.resetForm();
    this.closeSheet();
  }

  protected editVatRate(vatRateId: number): void {
    const vatRate = this.store.vatRates().find((item) => item.id === vatRateId);
    if (!vatRate) {
      return;
    }

    this.selectedId.set(vatRate.id);
    this.vatRateForm.setValue({
      code: vatRate.code,
      label: vatRate.label,
      percentage: vatRate.percentage / 100,
      isActive: vatRate.isActive,
    });
    this.openSheet();
  }

  protected async archiveVatRate(vatRateId: number): Promise<void> {
    await this.store.archiveVatRate(vatRateId);
    if (this.selectedId() === vatRateId) {
      this.resetForm();
    }
    if (!this.store.error()) {
      this.toast.show('VAT rate archived.', 'success');
    }
  }

  protected async deleteVatRate(vatRateId: number): Promise<void> {
    const mode = await this.store.deleteVatRate(vatRateId);
    if (this.selectedId() === vatRateId) {
      this.resetForm();
    }
    if (mode === 'deleted') {
      this.toast.show('VAT rate deleted.', 'success');
    } else if (mode === 'archived') {
      this.toast.show('VAT rate is in use, so it was archived instead.', 'info');
    }
  }

  protected async refreshVatRates(): Promise<void> {
    await this.store.loadVatRates();
    if (!this.store.error()) {
      this.toast.show('VAT rates refreshed.', 'success');
    }
  }

  protected openAddMode(): void {
    this.resetForm();
    this.openSheet();
  }

  protected resetForm(): void {
    this.selectedId.set(null);
    this.vatRateForm.reset({
      code: '',
      label: '',
      percentage: 19,
      isActive: true,
    });
  }

  protected cancelSheet(): void {
    this.resetForm();
    this.closeSheet();
  }

  protected selectedStatusOption(): { label: string; value: boolean } | null {
    const value = this.vatRateForm.controls.isActive.value;
    return this.statusOptions.find((option) => option.value === value) ?? null;
  }

  protected onStatusValueChange(option: { label: string; value: boolean } | null): void {
    this.vatRateForm.controls.isActive.setValue(option?.value ?? true);
  }

  protected readonly statusItemToLabel = (
    option: { label: string; value: boolean } | null,
  ): string => option?.label ?? '';

  protected readonly isSameStatusOption = (
    left: { label: string; value: boolean } | null,
    right: { label: string; value: boolean } | null,
  ): boolean => left?.value === right?.value;

  protected readonly globalFilterText = (row: EntityTableRow): string => {
    const rate = row as VatRateVM;
    return [
      rate.code,
      rate.label,
      formatVatPercentage(rate.percentage),
      rate.isActive ? 'active' : 'inactive',
      String(rate.invoiceLineItemCount),
    ]
      .filter(Boolean)
      .join(' ');
  };

  private formValue(): VatRateCreateInput {
    const raw = this.vatRateForm.getRawValue();
    return {
      code: raw.code ?? '',
      label: raw.label ?? '',
      percentage: Math.round(Number(raw.percentage ?? 0) * 100),
      isActive: raw.isActive ?? true,
    };
  }

  private openSheet(): void {
    this.sheetOpenButton?.nativeElement.click();
  }

  private closeSheet(): void {
    this.sheetCloseButton?.nativeElement.click();
  }
}

function formatVatPercentage(percentage: number): string {
  return `${(percentage / 100).toFixed(2)}%`;
}

function createVatRateColumns(): ColumnDef<VatRateVM>[] {
  return [
    {
      id: 'code',
      accessorKey: 'code',
      meta: { headerLabel: 'Code', columnMenuLabel: 'Code' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => info.getValue<string>(),
      enableSorting: true,
    },
    {
      id: 'label',
      accessorKey: 'label',
      meta: { headerLabel: 'Label', columnMenuLabel: 'Label' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => info.getValue<string>(),
      enableSorting: true,
    },
    {
      id: 'percentage',
      accessorKey: 'percentage',
      meta: { headerLabel: 'VAT', columnMenuLabel: 'VAT' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => formatVatPercentage(Number(info.getValue())),
      enableSorting: true,
    },
    {
      id: 'status',
      accessorFn: (row) => (row.isActive ? 'active' : 'inactive'),
      meta: { headerLabel: 'Status', columnMenuLabel: 'Status' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => (info.getValue<string>() === 'active' ? 'Active' : 'Inactive'),
      enableSorting: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        return row.getValue<string>(columnId) === filterValue;
      },
    },
    {
      id: 'usage',
      accessorKey: 'invoiceLineItemCount',
      meta: { headerLabel: 'Usage', columnMenuLabel: 'Usage' },
      header: () => flexRenderComponent(DataTableSortHeaderComponent),
      cell: (info) => String(info.getValue()),
      enableSorting: true,
    },
  ];
}
