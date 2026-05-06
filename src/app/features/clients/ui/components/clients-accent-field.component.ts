import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';

@Component({
  selector: 'app-clients-accent-field',
  imports: [ReactiveFormsModule, HlmButtonImports, HlmInputImports],
  template: `
    <div class="grid gap-2 text-sm">
      <span>Calendar accent</span>
      <p class="text-xs text-muted-foreground">
        Used on the time entries calendar. Choose a preset, the color picker, or type a hex value.
      </p>
      <div class="flex flex-wrap gap-2">
        @for (hex of accentPresets(); track hex) {
          <button
            type="button"
            class="size-9 rounded-md border-2 shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            [class.border-foreground]="accentControl().value === hex"
            [class.border-transparent]="accentControl().value !== hex"
            [style.background-color]="hex"
            [attr.aria-label]="'Accent ' + hex"
            [attr.aria-pressed]="accentControl().value === hex"
            (click)="presetSelected.emit(hex)"
          ></button>
        }
      </div>
      <div class="grid gap-1">
        <span class="text-xs text-muted-foreground">Custom</span>
        <div class="flex flex-wrap items-center gap-2">
          <input
            type="color"
            class="h-9 w-14 cursor-pointer rounded border border-border bg-transparent p-0.5"
            [value]="pickerValue()"
            (input)="pickerChanged.emit($event)"
          />
          <input
            hlmInput
            type="text"
            class="min-w-0 flex-1 font-mono text-sm"
            [formControl]="accentControl()"
            placeholder="#6366f1"
            maxlength="7"
            autocomplete="off"
          />
          <button hlmBtn variant="outline" size="sm" type="button" (click)="clearRequested.emit()">
            Clear
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsAccentFieldComponent {
  readonly accentPresets = input.required<readonly string[]>();
  readonly pickerValue = input.required<string>();
  readonly accentControl = input.required<any>();

  readonly presetSelected = output<string>();
  readonly pickerChanged = output<Event>();
  readonly clearRequested = output<void>();
}
