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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { ToastService } from '../../../core/feedback/toast.service';
import { FeatureHeaderActionsComponent } from '../../../shared/components/feature-header-actions/feature-header-actions.component';
import {
  CLIENT_ACCENT_PRESETS,
  normalizeClientAccentHex,
  resolveClientAccentHex as resolveStoredClientAccent,
} from '../../../shared/components/client-accent/client-accent.util';
import { ClientsStore } from '../state/clients.store';
import { ClientCreateInput, ClientUpdateInput } from '../models/client.model';
import { ClientsSheetFormComponent } from './components/clients-sheet-form.component';
import { ClientsTableComponent } from './components/clients-table.component';

@Component({
  selector: 'app-clients-page',
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmSeparatorImports,
    HlmSheetImports,
    HlmSkeletonImports,
    FeatureHeaderActionsComponent,
    ClientsSheetFormComponent,
    ClientsTableComponent,
  ],
  template: `
    <section class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <hlm-sheet>
        <app-feature-header-actions
          title="Clients"
          subtitle="Manage client contacts and activation status."
          addAriaLabel="Add client"
          [showRefresh]="true"
          refreshAriaLabel="Refresh clients"
          (addRequested)="openAddMode()"
          (refreshRequested)="refreshClients()"
        />
        <button #sheetOpenButton class="hidden" hlmSheetTrigger side="right" type="button"></button>
        <ng-template hlmSheetPortal>
          <hlm-sheet-content class="w-full border-border/40 sm:max-w-xl">
            <div hlmSheetHeader>
              <h2 hlmSheetTitle>{{ isEditing() ? 'Edit client' : 'Add client' }}</h2>
            </div>
            <app-clients-sheet-form
              [form]="clientForm"
              [isEditing]="isEditing()"
              [isLoading]="store.isLoading()"
              [accentPresets]="accentPresets"
              [accentPickerValue]="accentColorPickerSyncValue()"
              [statusOptions]="statusOptions"
              [selectedStatusOption]="selectedStatusOption()"
              [statusItemToLabel]="statusItemToLabel"
              [isSameStatusOption]="isSameStatusOption"
              (submitted)="submitClient()"
              (statusChanged)="onStatusValueChange($event)"
              (accentPresetSelected)="selectAccentPreset($event)"
              (accentPickerChanged)="onAccentColorPicker($event)"
              (accentClearRequested)="clearAccentColor()"
              (clearRequested)="resetForm()"
              (cancelRequested)="cancelSheet()"
            />
            <button #sheetCloseButton class="hidden" hlmSheetClose type="button"></button>
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

      @if (showLoadingSkeleton()) {
        <div class="grid gap-2 rounded-lg border border-border p-4">
          <div hlmSkeleton class="h-5 w-1/3"></div>
          <div hlmSkeleton class="h-4 w-full"></div>
          <div hlmSkeleton class="h-4 w-5/6"></div>
        </div>
      }

      <app-clients-table
        [clients]="store.clients()"
        [accentSwatchResolver]="clientAccentSwatch"
        (addRequested)="openAddMode()"
        (editRequested)="editClient($event)"
        (deleteRequested)="deleteClient($event)"
        (archiveRequested)="archiveClient($event)"
      />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsPage implements OnInit {
  protected readonly store = inject(ClientsStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  protected readonly accentPresets = CLIENT_ACCENT_PRESETS;
  @ViewChild('sheetOpenButton', { read: ElementRef })
  private readonly sheetOpenButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('sheetCloseButton', { read: ElementRef })
  private readonly sheetCloseButton?: ElementRef<HTMLButtonElement>;
  protected readonly selectedId = signal<number | null>(null);
  protected readonly isEditing = computed(() => this.selectedId() !== null);
  protected readonly statusOptions: ReadonlyArray<{ label: string; value: boolean }> = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];
  private readonly hasInitialLoadCompleted = signal(false);
  protected readonly showLoadingSkeleton = computed(
    () => !this.hasInitialLoadCompleted() && this.store.isLoading(),
  );

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
    try {
      await this.store.loadClientsIfNeeded();
    } finally {
      this.hasInitialLoadCompleted.set(true);
    }
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

  protected async refreshClients(): Promise<void> {
    await this.store.loadClients();
    if (!this.store.error()) {
      this.toast.show('Clients refreshed.', 'success');
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

  protected readonly statusItemToLabel = (
    option: { label: string; value: boolean } | null,
  ): string => option?.label ?? '';

  protected readonly isSameStatusOption = (
    left: { label: string; value: boolean } | null,
    right: { label: string; value: boolean } | null,
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
