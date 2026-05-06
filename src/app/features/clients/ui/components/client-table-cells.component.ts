import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { injectFlexRenderContext } from '@tanstack/angular-table';
import type { CellContext } from '@tanstack/table-core';
import { ClientVM } from '../../models/client.vm';

type AccentMeta = {
  accentSwatchResolver: (accent: string | null | undefined, clientId: number) => string;
};

@Component({
  selector: 'app-client-name-cell',
  imports: [DatePipe],
  template: `
    <div class="font-medium">{{ client().name }}</div>
    <div class="text-xs text-muted-foreground">
      Created {{ client().createdAt | date: 'mediumDate' }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientNameCellComponent {
  private readonly ctx = injectFlexRenderContext<CellContext<ClientVM, unknown>>();
  protected readonly client = computed(() => this.ctx.row.original);
}

@Component({
  selector: 'app-client-accent-cell',
  template: `
    <span
      class="inline-block size-4 rounded-full ring-1 ring-border"
      [style.background-color]="swatchColor()"
      aria-hidden="true"
    ></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientAccentCellComponent {
  private readonly ctx = injectFlexRenderContext<CellContext<ClientVM, unknown>>();
  private readonly client = computed(() => this.ctx.row.original);

  protected readonly swatchColor = computed(() => {
    const meta = this.ctx.column.columnDef.meta as AccentMeta | undefined;
    const resolve = meta?.accentSwatchResolver;
    const c = this.client();
    return resolve ? resolve(c.accentColor, c.id) : 'transparent';
  });
}

@Component({
  selector: 'app-client-contact-cell',
  template: `
    <div class="text-muted-foreground">
      <div>{{ client().email || 'No email' }}</div>
      <div>{{ client().phone || 'No phone' }}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientContactCellComponent {
  private readonly ctx = injectFlexRenderContext<CellContext<ClientVM, unknown>>();
  protected readonly client = computed(() => this.ctx.row.original);
}
