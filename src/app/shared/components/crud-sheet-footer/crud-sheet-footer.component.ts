import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-crud-sheet-footer',
  imports: [HlmButtonImports],
  template: `
    <div
      hlmSheetFooter
      class="mt-auto flex w-full items-center justify-start gap-2 border-t border-border/40 p-0 pt-4 sm:flex-row"
    >
      <button
        hlmBtn
        size="default"
        type="submit"
        class="cursor-pointer"
        [disabled]="isLoading() || !isValid()"
        (click)="submitRequested.emit()"
      >
        {{ submitLabel() }}
      </button>
      <button
        hlmBtn
        variant="outline"
        type="button"
        class="cursor-pointer"
        (click)="clearRequested.emit()"
      >
        Clear
      </button>
      <button
        hlmBtn
        variant="outline"
        type="button"
        class="cursor-pointer"
        (click)="cancelRequested.emit()"
      >
        Cancel
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrudSheetFooterComponent {
  readonly isEditing = input(false);
  readonly isLoading = input(false);
  readonly isValid = input(true);
  readonly createLabel = input('Create');
  readonly updateLabel = input('Save changes');

  readonly submitRequested = output<void>();
  readonly clearRequested = output<void>();
  readonly cancelRequested = output<void>();

  readonly submitLabel = computed(() =>
    this.isEditing() ? this.updateLabel() : this.createLabel(),
  );
}
