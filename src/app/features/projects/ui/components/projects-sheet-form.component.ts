import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { CrudSheetFooterComponent } from '../../../../shared/components/crud-sheet-footer/crud-sheet-footer.component';
import { BillingModel } from '../../models/project.model';

@Component({
  selector: 'app-projects-sheet-form',
  imports: [ReactiveFormsModule, HlmInputImports, HlmComboboxImports, CrudSheetFooterComponent],
  template: `
    <form class="flex h-full flex-col gap-4 p-4" [formGroup]="form()" (ngSubmit)="submitted.emit()" autocomplete="off">
      <label class="grid gap-1 text-sm">
        <span>Name *</span>
        <input hlmInput type="text" formControlName="name" placeholder="Website redesign" />
      </label>

      <label class="grid gap-1 text-sm">
        <span>Code *</span>
        <input hlmInput type="text" formControlName="code" placeholder="WR-001" />
      </label>

      <label class="grid gap-1 text-sm">
        <span>Client *</span>
        <div
          hlmCombobox
          [value]="selectedClientOption()"
          [search]="form().controls['clientQuery'].value ?? ''"
          [itemToString]="optionToLabel()"
          [isItemEqualToValue]="isSameOption()"
          (searchChange)="clientSearchChanged.emit($event)"
          (valueChange)="clientValueChanged.emit($event)"
        >
          <hlm-combobox-input placeholder="Search and select a client" />
          <ng-template hlmComboboxPortal>
            <div hlmComboboxContent>
              <div hlmComboboxList>
                @for (client of clientOptions(); track client.id) {
                  <hlm-combobox-item [value]="client">{{ client.label }}</hlm-combobox-item>
                }
                <div hlmComboboxEmpty>No matching clients found.</div>
              </div>
            </div>
          </ng-template>
        </div>
      </label>

      <label class="grid gap-1 text-sm">
        <span>Unit rate *</span>
        <input hlmInput type="number" formControlName="unitRate" min="0" />
      </label>
      <label class="grid gap-1 text-sm">
        <span>Unit</span>
        <input hlmInput type="text" formControlName="unit" placeholder="hours" />
      </label>
      <label class="grid gap-1 text-sm">
        <span>Currency</span>
        <input hlmInput type="text" formControlName="currency" placeholder="EUR" />
      </label>

      <label class="grid gap-1 text-sm">
        <span>Billing model</span>
        <div
          hlmCombobox
          [value]="selectedBillingOption()"
          [itemToString]="comboboxItemToLabel()"
          [isItemEqualToValue]="isSameLabeledOption()"
          (valueChange)="billingValueChanged.emit($event)"
        >
          <hlm-combobox-trigger class="w-full justify-between">
            <span>{{ selectedBillingOption()?.label ?? 'Select billing model' }}</span>
          </hlm-combobox-trigger>
          <ng-template hlmComboboxPortal>
            <div hlmComboboxContent><div hlmComboboxList>
              @for (option of billingModelDropdownOptions(); track option.label) {
                <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
              }
            </div></div>
          </ng-template>
        </div>
      </label>

      <label class="grid gap-1 text-sm">
        <span>Status</span>
        <div
          hlmCombobox
          [value]="selectedStatusOption()"
          [itemToString]="comboboxItemToLabel()"
          [isItemEqualToValue]="isSameLabeledOption()"
          (valueChange)="statusValueChanged.emit($event)"
        >
          <hlm-combobox-trigger class="w-full justify-between">
            <span>{{ selectedStatusOption()?.label ?? 'Select status' }}</span>
          </hlm-combobox-trigger>
          <ng-template hlmComboboxPortal>
            <div hlmComboboxContent><div hlmComboboxList>
              @for (option of statusDropdownOptions(); track option.label) {
                <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
              }
            </div></div>
          </ng-template>
        </div>
      </label>

      <label class="grid gap-1 text-sm">
        <span>Orders</span>
        <div
          hlmCombobox
          [value]="selectedUseOrdersOption()"
          [itemToString]="comboboxItemToLabel()"
          [isItemEqualToValue]="isSameLabeledOption()"
          (valueChange)="useOrdersValueChanged.emit($event)"
        >
          <hlm-combobox-trigger class="w-full justify-between">
            <span>{{ selectedUseOrdersOption()?.label ?? 'Select order mode' }}</span>
          </hlm-combobox-trigger>
          <ng-template hlmComboboxPortal>
            <div hlmComboboxContent><div hlmComboboxList>
              @for (option of useOrdersDropdownOptions(); track option.label) {
                <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
              }
            </div></div>
          </ng-template>
        </div>
      </label>

      <app-crud-sheet-footer
        [isEditing]="isEditing()"
        [isLoading]="isLoading()"
        [isValid]="isValid()"
        createLabel="Create project"
        updateLabel="Save changes"
        (clearRequested)="clearRequested.emit()"
        (cancelRequested)="cancelRequested.emit()"
      />
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSheetFormComponent {
  readonly form = input.required<FormGroup<any>>();
  readonly isEditing = input.required<boolean>();
  readonly isLoading = input.required<boolean>();
  readonly isValid = input.required<boolean>();
  readonly clientOptions = input.required<Array<{ id: number; label: string }>>();
  readonly selectedClientOption = input.required<{ id: number; label: string } | null>();
  readonly billingModelDropdownOptions = input.required<ReadonlyArray<{ label: string; value: BillingModel | null }>>();
  readonly statusDropdownOptions = input.required<ReadonlyArray<{ label: string; value: boolean }>>();
  readonly useOrdersDropdownOptions = input.required<ReadonlyArray<{ label: string; value: boolean }>>();
  readonly selectedBillingOption = input.required<{ label: string; value: BillingModel | null } | null>();
  readonly selectedStatusOption = input.required<{ label: string; value: boolean } | null>();
  readonly selectedUseOrdersOption = input.required<{ label: string; value: boolean } | null>();
  readonly optionToLabel = input.required<(option: { id: number; label: string } | null) => string>();
  readonly isSameOption = input.required<
    (left: { id: number; label: string } | null, right: { id: number; label: string } | null) => boolean
  >();
  readonly comboboxItemToLabel = input.required<
    (option: { label: string; value: boolean | BillingModel | null } | null) => string
  >();
  readonly isSameLabeledOption = input.required<
    (
      left: { label: string; value: boolean | BillingModel | null } | null,
      right: { label: string; value: boolean | BillingModel | null } | null
    ) => boolean
  >();

  readonly submitted = output<void>();
  readonly clientSearchChanged = output<string>();
  readonly clientValueChanged = output<{ id: number; label: string } | null>();
  readonly billingValueChanged = output<{ label: string; value: BillingModel | null } | null>();
  readonly statusValueChanged = output<{ label: string; value: boolean } | null>();
  readonly useOrdersValueChanged = output<{ label: string; value: boolean } | null>();
  readonly clearRequested = output<void>();
  readonly cancelRequested = output<void>();
}
