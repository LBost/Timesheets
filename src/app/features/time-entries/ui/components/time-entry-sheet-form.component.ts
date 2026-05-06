import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { CrudSheetFooterComponent } from '../../../../shared/components/crud-sheet-footer/crud-sheet-footer.component';

@Component({
  selector: 'app-time-entry-sheet-form',
  imports: [ReactiveFormsModule, HlmInputImports, HlmComboboxImports, HlmButtonImports, CrudSheetFooterComponent],
  template: `
    <form class="flex h-full flex-col gap-4 p-4" [formGroup]="form()" (ngSubmit)="submitted.emit()">
      <label class="grid gap-1 text-sm">
        <span>Client *</span>
        <div hlmCombobox [value]="selectedClientOption()" [itemToString]="optionToLabel()" [isItemEqualToValue]="isSameOption()" (valueChange)="clientChanged.emit($event)">
          <hlm-combobox-trigger class="w-full justify-between"><span>{{ selectedClientOption()?.label ?? 'Select client' }}</span></hlm-combobox-trigger>
          <ng-template hlmComboboxPortal><div hlmComboboxContent><div hlmComboboxList>
            @for (option of clientOptions(); track option.id) {
              <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
            }
          </div></div></ng-template>
        </div>
      </label>

      <label class="grid gap-1 text-sm">
        <span>Project *</span>
        <div hlmCombobox [value]="selectedProjectOption()" [itemToString]="optionToLabel()" [isItemEqualToValue]="isSameOption()" (valueChange)="projectChanged.emit($event)">
          <hlm-combobox-trigger class="w-full justify-between"><span>{{ selectedProjectOption()?.label ?? 'Select project' }}</span></hlm-combobox-trigger>
          <ng-template hlmComboboxPortal><div hlmComboboxContent><div hlmComboboxList>
            @for (option of filteredProjectOptions(); track option.id) {
              <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
            }
          </div></div></ng-template>
        </div>
      </label>

      @if (selectedProjectRequiresOrder()) {
        <label class="grid gap-1 text-sm">
          <span>Order *</span>
          <div hlmCombobox [value]="selectedOrderOption()" [itemToString]="optionToLabel()" [isItemEqualToValue]="isSameOption()" (valueChange)="orderChanged.emit($event)">
            <hlm-combobox-trigger class="w-full justify-between"><span>{{ selectedOrderOption()?.label ?? 'Select order' }}</span></hlm-combobox-trigger>
            <ng-template hlmComboboxPortal><div hlmComboboxContent><div hlmComboboxList>
              @for (option of filteredOrderOptions(); track option.id) {
                <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
              }
            </div></div></ng-template>
          </div>
        </label>
      }

      <div class="grid grid-cols-2 gap-3">
        <label class="grid gap-1 text-sm">
          <span>Date *</span>
          <input hlmInput type="date" formControlName="date" />
        </label>
        <label class="grid gap-1 text-sm">
          <span>Hours *</span>
          <input hlmInput type="number" min="0.25" step="0.25" formControlName="hours" />
        </label>
      </div>

      <label class="grid gap-1 text-sm">
        <span>Description</span>
        <input hlmInput type="text" formControlName="description" placeholder="Daily work summary" />
      </label>

      @if (form().invalid && (form().touched || form().dirty)) {
        <p class="text-sm text-destructive">Please complete all required fields correctly.</p>
      }

      <div class="mt-auto flex items-center justify-between gap-2 border-t border-border/40 pt-3">
        <app-crud-sheet-footer
          [isEditing]="isEditing()"
          [isLoading]="isLoading()"
          [isValid]="isValid()"
          createLabel="Create entry"
          updateLabel="Save changes"
          (clearRequested)="clearRequested.emit()"
          (cancelRequested)="cancelRequested.emit()"
        />
        @if (isEditing()) {
          <button hlmBtn variant="outline" type="button" class="cursor-pointer" (click)="deleteRequested.emit()">
            Delete
          </button>
        }
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntrySheetFormComponent {
  readonly form = input.required<FormGroup<any>>();
  readonly isEditing = input.required<boolean>();
  readonly isLoading = input.required<boolean>();
  readonly isValid = input.required<boolean>();
  readonly clientOptions = input.required<Array<{ id: number; label: string }>>();
  readonly filteredProjectOptions = input.required<Array<{ id: number; label: string }>>();
  readonly filteredOrderOptions = input.required<Array<{ id: number; label: string }>>();
  readonly selectedClientOption = input.required<{ id: number; label: string } | null>();
  readonly selectedProjectOption = input.required<{ id: number; label: string } | null>();
  readonly selectedOrderOption = input.required<{ id: number; label: string } | null>();
  readonly selectedProjectRequiresOrder = input.required<boolean>();
  readonly optionToLabel = input.required<(option: { id: number; label: string } | null) => string>();
  readonly isSameOption = input.required<
    (left: { id: number; label: string } | null, right: { id: number; label: string } | null) => boolean
  >();

  readonly submitted = output<void>();
  readonly clientChanged = output<{ id: number; label: string } | null>();
  readonly projectChanged = output<any>();
  readonly orderChanged = output<any>();
  readonly clearRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly deleteRequested = output<void>();
}
