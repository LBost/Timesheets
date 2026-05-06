import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { CrudSheetFooterComponent } from '../../../../shared/components/crud-sheet-footer/crud-sheet-footer.component';
import { ClientsAccentFieldComponent } from './clients-accent-field.component';

@Component({
  selector: 'app-clients-sheet-form',
  imports: [
    ReactiveFormsModule,
    HlmInputImports,
    HlmComboboxImports,
    CrudSheetFooterComponent,
    ClientsAccentFieldComponent,
  ],
  template: `
    <form class="flex h-full flex-col gap-4 p-4" [formGroup]="form()" (ngSubmit)="submitted.emit()">
      <label class="grid gap-1 text-sm">
        <span>Name *</span>
        <input hlmInput type="text" formControlName="name" placeholder="Braggel & Co. BV" />
      </label>

      <label class="grid gap-1 text-sm">
        <span>Email</span>
        <input hlmInput type="email" formControlName="email" placeholder="contact@braggel.nl" />
      </label>

      <label class="grid gap-1 text-sm">
        <span>Phone</span>
        <input hlmInput type="text" formControlName="phone" placeholder="+31 6 12345678" />
      </label>

      <app-clients-accent-field
        [accentPresets]="accentPresets()"
        [pickerValue]="accentPickerValue()"
        [accentControl]="form().controls['accentColor']"
        (presetSelected)="accentPresetSelected.emit($event)"
        (pickerChanged)="accentPickerChanged.emit($event)"
        (clearRequested)="accentClearRequested.emit()"
      />

      <label class="grid gap-1 text-sm">
        <span>Status</span>
        <div
          hlmCombobox
          [value]="selectedStatusOption()"
          [itemToString]="statusItemToLabel()"
          [isItemEqualToValue]="isSameStatusOption()"
          (valueChange)="statusChanged.emit($event)"
        >
          <hlm-combobox-trigger class="w-full justify-between">
            <span>{{ selectedStatusOption()?.label ?? 'Select status' }}</span>
          </hlm-combobox-trigger>
          <ng-template hlmComboboxPortal>
            <div hlmComboboxContent>
              <div hlmComboboxList>
                @for (option of statusOptions(); track option.label) {
                  <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
                }
              </div>
            </div>
          </ng-template>
        </div>
      </label>

      @if (form().controls['name'].touched && form().controls['name'].invalid) {
        <p class="text-sm text-destructive">Name is required (max 120 chars).</p>
      }
      @if (form().controls['email'].touched && form().controls['email'].invalid) {
        <p class="text-sm text-destructive">Email format is invalid.</p>
      }

      <app-crud-sheet-footer
        [isEditing]="isEditing()"
        [isLoading]="isLoading()"
        [isValid]="form().valid"
        createLabel="Create client"
        updateLabel="Save changes"
        (clearRequested)="clearRequested.emit()"
        (cancelRequested)="cancelRequested.emit()"
      />
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsSheetFormComponent {
  readonly form = input.required<FormGroup<any>>();
  readonly isEditing = input.required<boolean>();
  readonly isLoading = input.required<boolean>();
  readonly accentPresets = input.required<readonly string[]>();
  readonly accentPickerValue = input.required<string>();
  readonly statusOptions = input.required<ReadonlyArray<{ label: string; value: boolean }>>();
  readonly selectedStatusOption = input.required<{ label: string; value: boolean } | null>();
  readonly statusItemToLabel = input.required<(option: { label: string; value: boolean } | null) => string>();
  readonly isSameStatusOption = input.required<
    (left: { label: string; value: boolean } | null, right: { label: string; value: boolean } | null) => boolean
  >();

  readonly submitted = output<void>();
  readonly statusChanged = output<{ label: string; value: boolean } | null>();
  readonly accentPresetSelected = output<string>();
  readonly accentPickerChanged = output<Event>();
  readonly accentClearRequested = output<void>();
  readonly clearRequested = output<void>();
  readonly cancelRequested = output<void>();
}
