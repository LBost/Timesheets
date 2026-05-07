import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { InvoiceGenerateMode } from '../../models/invoice.model';

@Component({
  selector: 'app-invoices-generate-sheet-form',
  imports: [ReactiveFormsModule, HlmButtonImports, HlmComboboxImports],
  template: `
    <form class="grid gap-3 pt-4" [formGroup]="form()" (ngSubmit)="submitted.emit()">
      <label class="grid gap-1 text-sm">
        <span>Client *</span>
        <div
          hlmCombobox
          [value]="selectedClientOption()"
          [itemToString]="optionToLabel()"
          [isItemEqualToValue]="isSameIdOption()"
          (valueChange)="clientChanged.emit($event)"
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
          [itemToString]="optionToLabel()"
          [isItemEqualToValue]="isSameIdOption()"
          (valueChange)="taxRateChanged.emit($event)"
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

      <label class="grid gap-1 text-sm">
        <span>Period *</span>
        <div
          hlmCombobox
          [value]="selectedPeriodOption()"
          [itemToString]="optionToLabel()"
          [isItemEqualToValue]="isSameValueOption()"
          (valueChange)="periodChanged.emit($event)"
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
          [itemToString]="optionToLabel()"
          [isItemEqualToValue]="isSameValueOption()"
          (valueChange)="modeChanged.emit($event)"
        >
          <hlm-combobox-trigger class="w-full justify-between">
            <span>{{ selectedModeOption()?.label ?? 'Select mode' }}</span>
          </hlm-combobox-trigger>
          <ng-template hlmComboboxPortal>
            <div hlmComboboxContent>
              <div hlmComboboxList>
                @for (mode of modeOptions(); track mode.value) {
                  <hlm-combobox-item [value]="mode">{{ mode.label }}</hlm-combobox-item>
                }
              </div>
            </div>
          </ng-template>
        </div>
      </label>

      <div class="flex items-center justify-start gap-2 pt-2">
        <button hlmBtn type="submit" [disabled]="isLoading() || !isValid()">Preview generate</button>
        <button hlmBtn type="button" variant="outline" (click)="cancelRequested.emit()">Cancel</button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesGenerateSheetFormComponent {
  readonly form = input.required<any>();
  readonly isLoading = input(false);
  readonly isValid = input(true);
  readonly clientOptions = input.required<Array<{ id: number; label: string }>>();
  readonly taxRateOptions = input.required<Array<{ id: number; label: string }>>();
  readonly periodOptions = input.required<Array<{ label: string; value: string }>>();
  readonly modeOptions = input.required<ReadonlyArray<{ label: string; value: InvoiceGenerateMode }>>();
  readonly selectedClientOption = input<{ id: number; label: string } | null>(null);
  readonly selectedTaxRateOption = input<{ id: number; label: string } | null>(null);
  readonly selectedPeriodOption = input<{ label: string; value: string } | null>(null);
  readonly selectedModeOption = input<{ label: string; value: InvoiceGenerateMode } | null>(null);
  readonly optionToLabel = input.required<(option: { label: string } | null) => string>();
  readonly isSameIdOption = input.required<
    (left: { id: number; label: string } | null, right: { id: number; label: string } | null) => boolean
  >();
  readonly isSameValueOption = input.required<
    (left: { label: string; value: string } | null, right: { label: string; value: string } | null) => boolean
  >();

  readonly submitted = output<void>();
  readonly clientChanged = output<{ id: number; label: string } | null>();
  readonly taxRateChanged = output<{ id: number; label: string } | null>();
  readonly periodChanged = output<{ label: string; value: string } | null>();
  readonly modeChanged = output<{ label: string; value: InvoiceGenerateMode } | null>();
  readonly cancelRequested = output<void>();
}
