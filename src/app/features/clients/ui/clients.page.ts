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
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { ToastService } from '../../../core/feedback/toast.service';
import { CrudSheetFooterComponent } from '../../../shared/components/crud-sheet-footer/crud-sheet-footer.component';
import { FeatureHeaderActionsComponent } from '../../../shared/components/feature-header-actions/feature-header-actions.component';
import { RowContextMenuComponent } from '../../../shared/components/row-context-menu/row-context-menu.component';
import {
  CLIENT_ACCENT_PRESETS,
  normalizeClientAccentHex,
  resolveClientAccentHex as resolveStoredClientAccent,
} from '../../../shared/components/client-accent/client-accent.util';
import { ClientsStore } from '../state/clients.store';
import { ClientCreateInput, ClientUpdateInput } from '../models/client.model';

@Component({
  selector: 'app-clients-page',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    HlmButtonImports,
    HlmComboboxImports,
    HlmContextMenuImports,
    HlmInputImports,
    HlmSeparatorImports,
    HlmSheetImports,
    HlmSkeletonImports,
    HlmTableImports,
    FeatureHeaderActionsComponent,
    CrudSheetFooterComponent,
    RowContextMenuComponent,
  ],
  template: `
    <section class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <hlm-sheet>
        <app-feature-header-actions
          title="Clients"
          subtitle="Manage client contacts and activation status."
          addAriaLabel="Add client"
          (addRequested)="openAddMode()"
        />
          <button #sheetOpenButton class="hidden" hlmSheetTrigger side="right" type="button"></button>
          <ng-template hlmSheetPortal>
            <hlm-sheet-content class="w-full border-border/40 sm:max-w-xl">
              <div hlmSheetHeader>
                <h2 hlmSheetTitle>{{ isEditing() ? 'Edit client' : 'Add client' }}</h2>
              </div>
              <form class="flex h-full flex-col gap-4 p-4" [formGroup]="clientForm" (ngSubmit)="submitClient()">
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

                <div class="grid gap-2 text-sm">
                  <span>Calendar accent</span>
                  <p class="text-xs text-muted-foreground">
                    Used on the time entries calendar. Choose a preset, the color picker, or type a
                    hex value.
                  </p>
                  <div class="flex flex-wrap gap-2">
                    @for (hex of accentPresets; track hex) {
                      <button
                        type="button"
                        class="size-9 rounded-md border-2 shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                        [class.border-foreground]="clientForm.controls.accentColor.value === hex"
                        [class.border-transparent]="clientForm.controls.accentColor.value !== hex"
                        [style.background-color]="hex"
                        [attr.aria-label]="'Accent ' + hex"
                        [attr.aria-pressed]="clientForm.controls.accentColor.value === hex"
                        (click)="selectAccentPreset(hex)"
                      ></button>
                    }
                  </div>
                  <div class="grid gap-1">
                    <span class="text-xs text-muted-foreground">Custom</span>
                    <div class="flex flex-wrap items-center gap-2">
                      <input
                        type="color"
                        class="h-9 w-14 cursor-pointer rounded border border-border bg-transparent p-0.5"
                        [value]="accentColorPickerSyncValue()"
                        (input)="onAccentColorPicker($event)"
                      />
                      <input
                        hlmInput
                        type="text"
                        class="min-w-0 flex-1 font-mono text-sm"
                        formControlName="accentColor"
                        placeholder="#6366f1"
                        maxlength="7"
                        autocomplete="off"
                      />
                      <button hlmBtn variant="outline" size="sm" type="button" (click)="clearAccentColor()">
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                <label class="grid gap-1 text-sm">
                  <span>Status</span>
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
                          @for (option of statusOptions; track option.label) {
                            <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
                          }
                        </div>
                      </div>
                    </ng-template>
                  </div>
                </label>

                @if (nameControl.touched && nameControl.invalid) {
                  <p class="text-sm text-destructive">Name is required (max 120 chars).</p>
                }
                @if (emailControl.touched && emailControl.invalid) {
                  <p class="text-sm text-destructive">Email format is invalid.</p>
                }

                <app-crud-sheet-footer
                  [isEditing]="isEditing()"
                  [isLoading]="store.isLoading()"
                  [isValid]="clientForm.valid"
                  createLabel="Create client"
                  updateLabel="Save changes"
                  (clearRequested)="resetForm()"
                  (cancelRequested)="cancelSheet()"
                />
                <button #sheetCloseButton class="hidden" hlmSheetClose type="button"></button>
              </form>
            </hlm-sheet-content>
          </ng-template>
      </hlm-sheet>
      <div hlmSeparator></div>

      @if (store.error()) {
        <p
          class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {{ store.error() }}
        </p>
      }

      @if (store.isLoading()) {
        <div class="grid gap-2 rounded-lg border border-border p-4">
          <div hlmSkeleton class="h-5 w-1/3"></div>
          <div hlmSkeleton class="h-4 w-full"></div>
          <div hlmSkeleton class="h-4 w-5/6"></div>
        </div>
      }

      <div hlmTableContainer class="rounded-lg border border-border">
        <table hlmTable>
          <thead hlmTHead>
            <tr hlmTr>
              <th hlmTh>Client</th>
              <th hlmTh class="w-12 text-center">Accent</th>
              <th hlmTh>Contact</th>
              <th hlmTh>Projects</th>
              <th hlmTh>Status</th>
            </tr>
          </thead>
          <tbody hlmTBody>
            @for (client of store.clients(); track client.id) {
              <tr hlmTr [hlmContextMenuTrigger]="rowMenu" [hlmContextMenuTriggerData]="{ clientId: client.id }">
                <td hlmTd>
                  <div class="font-medium">{{ client.name }}</div>
                  <div class="text-xs text-muted-foreground">
                    Created {{ client.createdAt | date: 'mediumDate' }}
                  </div>
                </td>
                <td hlmTd class="text-center">
                  <span
                    class="inline-block size-4 rounded-full ring-1 ring-border"
                    [style.background-color]="clientAccentSwatch(client.accentColor, client.id)"
                    aria-hidden="true"
                  ></span>
                </td>
                <td hlmTd class="text-muted-foreground">
                  <div>{{ client.email || 'No email' }}</div>
                  <div>{{ client.phone || 'No phone' }}</div>
                </td>
                <td hlmTd>{{ client.projectCount }}</td>
                <td hlmTd>{{ client.isActive ? 'Active' : 'Inactive' }}</td>
              </tr>
            } @empty {
              <tr hlmTr>
                <td hlmTd class="py-4 text-muted-foreground" colspan="5">No clients yet.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <ng-template #rowMenu let-clientId="clientId">
        <app-row-context-menu
          [entityId]="clientId"
          (addRequested)="openAddMode()"
          (editRequested)="editClient($event)"
          (deleteRequested)="deleteClient($event)"
          (archiveRequested)="archiveClient($event)"
        />
      </ng-template>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsPage implements OnInit {
  protected readonly store = inject(ClientsStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  protected readonly accentPresets = CLIENT_ACCENT_PRESETS;
  @ViewChild('sheetOpenButton', { read: ElementRef }) private readonly sheetOpenButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('sheetCloseButton', { read: ElementRef })
  private readonly sheetCloseButton?: ElementRef<HTMLButtonElement>;
  protected readonly selectedId = signal<number | null>(null);
  protected readonly isEditing = computed(() => this.selectedId() !== null);
  protected readonly statusOptions: ReadonlyArray<{ label: string; value: boolean }> = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  protected readonly clientForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.email, Validators.maxLength(160)]],
    phone: ['', [Validators.maxLength(60)]],
    accentColor: ['', [Validators.maxLength(7)]],
    isActive: [true, [Validators.required]],
  });

  protected get nameControl() {
    return this.clientForm.controls.name;
  }

  protected get emailControl() {
    return this.clientForm.controls.email;
  }

  protected selectedStatusOption(): { label: string; value: boolean } | null {
    const value = this.clientForm.controls.isActive.value;
    return this.statusOptions.find((option) => option.value === value) ?? null;
  }

  async ngOnInit(): Promise<void> {
    await this.store.loadClients();
  }

  protected async submitClient(): Promise<void> {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const payload = this.formValue();
    const selectedId = this.selectedId();
    if (selectedId === null) {
      await this.store.createClient(payload as ClientCreateInput);
      this.resetForm();
      this.closeSheet();
      return;
    }

    await this.store.updateClient(selectedId, payload as ClientUpdateInput);
    this.resetForm();
    this.closeSheet();
  }

  protected editClient(clientId: number): void {
    const client = this.store.clients().find((item) => item.id === clientId);
    if (!client) {
      return;
    }

    this.selectedId.set(client.id);
    this.clientForm.setValue({
      name: client.name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      accentColor: client.accentColor ?? '',
      isActive: client.isActive,
    });
    this.openSheet();
  }

  protected async archiveClient(clientId: number): Promise<void> {
    await this.store.archiveClient(clientId);
    if (this.selectedId() === clientId) {
      this.resetForm();
    }
    if (!this.store.error()) {
      this.toast.show('Client archived.', 'success');
    }
  }

  protected async deleteClient(clientId: number): Promise<void> {
    const mode = await this.store.deleteClient(clientId);
    if (this.selectedId() === clientId) {
      this.resetForm();
    }
    if (mode === 'deleted') {
      this.toast.show('Client deleted.', 'success');
    } else if (mode === 'archived') {
      this.toast.show('Client has linked projects, so it was archived instead.', 'info');
    }
  }

  protected openAddMode(): void {
    this.resetForm();
    this.openSheet();
  }

  protected resetForm(): void {
    this.selectedId.set(null);
    this.clientForm.reset({ name: '', email: '', phone: '', accentColor: '', isActive: true });
  }

  protected cancelSheet(): void {
    this.resetForm();
    this.closeSheet();
  }

  private openSheet(): void {
    this.sheetOpenButton?.nativeElement.click();
  }

  private closeSheet(): void {
    this.sheetCloseButton?.nativeElement.click();
  }

  protected onStatusValueChange(option: { label: string; value: boolean } | null): void {
    this.clientForm.controls.isActive.setValue(option?.value ?? true);
  }

  protected readonly statusItemToLabel = (option: { label: string; value: boolean } | null): string =>
    option?.label ?? '';

  protected readonly isSameStatusOption = (
    left: { label: string; value: boolean } | null,
    right: { label: string; value: boolean } | null
  ): boolean => left?.value === right?.value;

  protected accentColorPickerSyncValue(): string {
    const normalized = normalizeClientAccentHex(this.clientForm.controls.accentColor.value ?? '');
    return normalized ?? CLIENT_ACCENT_PRESETS[0] ?? '#6366f1';
  }

  protected onAccentColorPicker(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.clientForm.controls.accentColor.setValue(value);
  }

  protected selectAccentPreset(hex: string): void {
    this.clientForm.controls.accentColor.setValue(hex);
  }

  protected clearAccentColor(): void {
    this.clientForm.controls.accentColor.setValue('');
  }

  protected clientAccentSwatch(accent: string | null | undefined, clientId: number): string {
    return resolveStoredClientAccent(accent ?? null, clientId);
  }

  private formValue(): ClientCreateInput {
    const raw = this.clientForm.getRawValue();
    return {
      name: raw.name ?? '',
      email: raw.email ?? null,
      phone: raw.phone ?? null,
      accentColor: normalizeClientAccentHex(raw.accentColor),
      isActive: raw.isActive ?? true,
    };
  }
}
