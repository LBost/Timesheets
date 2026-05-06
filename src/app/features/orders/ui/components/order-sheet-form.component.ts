import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { CrudSheetFooterComponent } from '../../../../shared/components/crud-sheet-footer/crud-sheet-footer.component';

@Component({
  selector: 'app-order-sheet-form',
  imports: [ReactiveFormsModule, HlmInputImports, HlmComboboxImports, CrudSheetFooterComponent],
  template: `
    <form class="flex h-full flex-col gap-4 p-4" [formGroup]="form()" (ngSubmit)="submitted.emit()" autocomplete="off">
      <label class="grid gap-1 text-sm">
        <span>Order Nr *</span>
        <input hlmInput type="text" formControlName="code" placeholder="PO-2026-001" />
      </label>

      <label class="grid gap-1 text-sm">
        <span>Order Description *</span>
        <input hlmInput type="text" formControlName="title" placeholder="Q3 Retainer extension" />
      </label>

      <label class="grid gap-1 text-sm">
        <span>Project (useOrders enabled) *</span>
        <div
          hlmCombobox
          [value]="selectedProjectOption()"
          [search]="form().controls['projectQuery'].value ?? ''"
          [itemToString]="optionToLabel()"
          [isItemEqualToValue]="isSameOption()"
          (searchChange)="projectSearchChanged.emit($event)"
          (valueChange)="projectValueChanged.emit($event)"
        >
          <hlm-combobox-input placeholder="Select a project" />
          <ng-template hlmComboboxPortal>
            <div hlmComboboxContent>
              <div hlmComboboxList>
                @for (project of projectOptions(); track project.id) {
                  <hlm-combobox-item [value]="project">{{ project.label }}</hlm-combobox-item>
                }
                <div hlmComboboxEmpty>No matching projects found.</div>
              </div>
            </div>
          </ng-template>
        </div>
      </label>

      <label class="grid gap-1 text-sm">
        <span>Status</span>
        <div
          hlmCombobox
          [value]="selectedStatusOption()"
          [itemToString]="statusItemToLabel()"
          [isItemEqualToValue]="isSameStatusOption()"
          (valueChange)="statusValueChanged.emit($event)"
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

      <app-crud-sheet-footer
        [isEditing]="isEditing()"
        [isLoading]="isLoading()"
        [isValid]="isValid()"
        createLabel="Create order"
        updateLabel="Save changes"
        (clearRequested)="clearRequested.emit()"
        (cancelRequested)="cancelRequested.emit()"
      />
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSheetFormComponent {
  readonly form = input.required<FormGroup<any>>();
  readonly isEditing = input.required<boolean>();
  readonly isLoading = input.required<boolean>();
  readonly isValid = input.required<boolean>();
  readonly projectOptions = input.required<Array<{ id: number; label: string }>>();
  readonly statusOptions = input.required<ReadonlyArray<{ label: string; value: boolean }>>();
  readonly selectedProjectOption = input.required<{ id: number; label: string } | null>();
  readonly selectedStatusOption = input.required<{ label: string; value: boolean } | null>();
  readonly optionToLabel = input.required<(option: { id: number; label: string } | null) => string>();
  readonly isSameOption = input.required<
    (left: { id: number; label: string } | null, right: { id: number; label: string } | null) => boolean
  >();
  readonly statusItemToLabel = input.required<(option: { label: string; value: boolean } | null) => string>();
  readonly isSameStatusOption = input.required<
    (left: { label: string; value: boolean } | null, right: { label: string; value: boolean } | null) => boolean
  >();

  readonly submitted = output<void>();
  readonly projectSearchChanged = output<string>();
  readonly projectValueChanged = output<{ id: number; label: string } | null>();
  readonly statusValueChanged = output<{ label: string; value: boolean } | null>();
  readonly clearRequested = output<void>();
  readonly cancelRequested = output<void>();
}
