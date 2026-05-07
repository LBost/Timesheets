import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';

@Component({
  selector: 'app-dropdown-menu-surface',
  imports: [HlmDropdownMenuImports],
  template: `
    <div hlmDropdownMenu [class]="menuClasses()">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownMenuSurfaceComponent {
  readonly className = input('');

  protected readonly menuClasses = computed(() => {
    const extra = this.className().trim();
    const base = 'border border-border/50 bg-card/95 shadow-lg shadow-black/20 backdrop-blur-sm';
    return extra ? `${base} ${extra}` : base;
  });
}
