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
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { ToastService } from '../../../core/feedback/toast.service';
import { activeLookup, selectionFromValueChange } from '../../../shared/components/combobox-selection/combobox-selection.util';
import { CrudSheetFooterComponent } from '../../../shared/components/crud-sheet-footer/crud-sheet-footer.component';
import { FeatureHeaderActionsComponent } from '../../../shared/components/feature-header-actions/feature-header-actions.component';
import { RowContextMenuComponent } from '../../../shared/components/row-context-menu/row-context-menu.component';
import { ClientsRepository } from '../../clients/data/clients.repository';
import { BillingModel, ProjectCreateInput, ProjectUpdateInput } from '../models/project.model';
import { ProjectsStore } from '../state/projects.store';

@Component({
  selector: 'app-projects-page',
  imports: [
    ReactiveFormsModule,
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
          title="Projects"
          subtitle="Configure project billing, ownership, and status."
          addAriaLabel="Add project"
          (addRequested)="openAddMode()"
        />
          <button #sheetOpenButton class="hidden" hlmSheetTrigger side="right" type="button"></button>
          <ng-template hlmSheetPortal>
            <hlm-sheet-content class="w-full border-border/40 sm:max-w-xl">
              <div hlmSheetHeader>
                <h2 hlmSheetTitle>{{ isEditing() ? 'Edit project' : 'Add project' }}</h2>
              </div>
              <form
                class="flex h-full flex-col gap-4 p-4"
                [formGroup]="projectForm"
                (ngSubmit)="submitProject()"
                autocomplete="off"
              >
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
                    [search]="projectForm.controls.clientQuery.value ?? ''"
                    [itemToString]="optionToLabel"
                    [isItemEqualToValue]="isSameOption"
                    (searchChange)="onClientSearchChange($event)"
                    (valueChange)="onClientValueChange($event)"
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
                    [itemToString]="comboboxItemToLabel"
                    [isItemEqualToValue]="isSameLabeledOption"
                    (valueChange)="onBillingValueChange($event)"
                  >
                    <hlm-combobox-trigger class="w-full justify-between">
                      <span>{{ selectedBillingOption()?.label ?? 'Select billing model' }}</span>
                    </hlm-combobox-trigger>
                    <ng-template hlmComboboxPortal>
                      <div hlmComboboxContent>
                        <div hlmComboboxList>
                          @for (option of billingModelDropdownOptions; track option.label) {
                            <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
                          }
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
                    [itemToString]="comboboxItemToLabel"
                    [isItemEqualToValue]="isSameLabeledOption"
                    (valueChange)="onStatusValueChange($event)"
                  >
                    <hlm-combobox-trigger class="w-full justify-between">
                      <span>{{ selectedStatusOption()?.label ?? 'Select status' }}</span>
                    </hlm-combobox-trigger>
                    <ng-template hlmComboboxPortal>
                      <div hlmComboboxContent>
                        <div hlmComboboxList>
                          @for (option of statusDropdownOptions; track option.label) {
                            <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
                          }
                        </div>
                      </div>
                    </ng-template>
                  </div>
                </label>

                <label class="grid gap-1 text-sm">
                  <span>Orders</span>
                  <div
                    hlmCombobox
                    [value]="selectedUseOrdersOption()"
                    [itemToString]="comboboxItemToLabel"
                    [isItemEqualToValue]="isSameLabeledOption"
                    (valueChange)="onUseOrdersValueChange($event)"
                  >
                    <hlm-combobox-trigger class="w-full justify-between">
                      <span>{{ selectedUseOrdersOption()?.label ?? 'Select order mode' }}</span>
                    </hlm-combobox-trigger>
                    <ng-template hlmComboboxPortal>
                      <div hlmComboboxContent>
                        <div hlmComboboxList>
                          @for (option of useOrdersDropdownOptions; track option.label) {
                            <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
                          }
                        </div>
                      </div>
                    </ng-template>
                  </div>
                </label>

                <app-crud-sheet-footer
                  [isEditing]="isEditing()"
                  [isLoading]="store.isLoading()"
                  [isValid]="projectForm.valid && hasSelectedClient()"
                  createLabel="Create project"
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
      @if (clientLookupError()) {
        <p class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {{ clientLookupError() }}
        </p>
      }

      @if (store.error()) {
        <p class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
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
              <th hlmTh>Project</th>
              <th hlmTh>Client</th>
              <th hlmTh>Billing</th>
              <th hlmTh>Entries</th>
            </tr>
          </thead>
          <tbody hlmTBody>
            @for (project of store.projects(); track project.id) {
              <tr hlmTr [hlmContextMenuTrigger]="rowMenu" [hlmContextMenuTriggerData]="{ projectId: project.id }">
                <td hlmTd>
                  <div class="font-medium">{{ project.name }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ project.code }} · {{ project.currency }} {{ project.unitRate }}/{{ project.unit }}
                  </div>
                </td>
                <td hlmTd>
                  <div>{{ project.clientName }}</div>
                  <div class="text-xs text-muted-foreground">Client #{{ project.clientId }}</div>
                </td>
                <td hlmTd>
                  <div>{{ project.billingModel || 'None' }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ project.isActive ? 'Active' : 'Inactive' }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ project.useOrders ? 'Orders required' : 'Orders optional' }}
                  </div>
                </td>
                <td hlmTd>{{ project.timeEntryCount }}</td>
              </tr>
            } @empty {
              <tr hlmTr>
                <td hlmTd colspan="4" class="text-muted-foreground">No projects yet.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <ng-template #rowMenu let-projectId="projectId">
        <app-row-context-menu
          [entityId]="projectId"
          (addRequested)="openAddMode()"
          (editRequested)="editProject($event)"
          (deleteRequested)="deleteProject($event)"
          (archiveRequested)="archiveProject($event)"
        />
      </ng-template>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage implements OnInit {
  protected readonly store = inject(ProjectsStore);
  private readonly clientsRepository = inject(ClientsRepository);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  @ViewChild('sheetOpenButton', { read: ElementRef }) private readonly sheetOpenButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('sheetCloseButton', { read: ElementRef })
  private readonly sheetCloseButton?: ElementRef<HTMLButtonElement>;
  protected readonly selectedId = signal<number | null>(null);
  protected readonly isEditing = computed(() => this.selectedId() !== null);
  protected readonly billingModelDropdownOptions: ReadonlyArray<{
    label: string;
    value: BillingModel | null;
  }> = [{ label: 'None', value: null }, ...Object.values(BillingModel).map((value) => ({ label: value, value }))];
  protected readonly statusDropdownOptions: ReadonlyArray<{ label: string; value: boolean }> = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];
  protected readonly useOrdersDropdownOptions: ReadonlyArray<{ label: string; value: boolean }> = [
    { label: 'Book directly on project', value: false },
    { label: 'Require order selection', value: true },
  ];
  protected readonly clientOptions = signal<Array<{ id: number; label: string }>>([]);
  protected readonly clientLookupError = signal<string | null>(null);
  protected readonly selectedClientOption = signal<{ id: number; label: string } | null>(null);

  protected readonly projectForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    code: ['', [Validators.required, Validators.maxLength(50)]],
    unitRate: [0, [Validators.required, Validators.min(0)]],
    unit: ['hours', [Validators.maxLength(40)]],
    currency: ['EUR', [Validators.maxLength(10)]],
    billingModel: [null as BillingModel | null],
    clientQuery: [''],
    isActive: [true, [Validators.required]],
    useOrders: [false, [Validators.required]],
  });
  private selectedClientId: number | null = null;

  async ngOnInit(): Promise<void> {
    const clients = await this.clientsRepository.listClients();
    this.clientOptions.set(
      activeLookup(clients)
        .map((client) => ({
        id: client.id,
        label: this.clientLabel(client.id, client.name),
      }))
    );
    await this.store.loadProjects();
  }

  protected async submitProject(): Promise<void> {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }
    if (this.selectedClientId === null) {
      this.clientLookupError.set('Please select a valid client from the list.');
      return;
    }

    const payload = this.formValue();
    const selectedId = this.selectedId();
    if (selectedId === null) {
      await this.store.createProject(payload as ProjectCreateInput);
      this.resetForm();
      this.closeSheet();
      return;
    }

    await this.store.updateProject(selectedId, payload as ProjectUpdateInput);
    this.resetForm();
    this.closeSheet();
  }

  protected editProject(projectId: number): void {
    const project = this.store.projects().find((item) => item.id === projectId);
    if (!project) {
      return;
    }

    this.selectedId.set(project.id);
    this.selectedClientId = project.clientId;
    this.selectedClientOption.set(
      this.clientOptions().find((option) => option.id === project.clientId) ?? null
    );
    this.projectForm.setValue({
      name: project.name,
      code: project.code,
      unitRate: project.unitRate,
      unit: project.unit,
      currency: project.currency,
      billingModel: project.billingModel,
      clientQuery: this.clientLabel(project.clientId, project.clientName),
      isActive: project.isActive,
      useOrders: project.useOrders,
    });
    this.clientLookupError.set(null);
    this.openSheet();
  }

  protected async archiveProject(projectId: number): Promise<void> {
    await this.store.archiveProject(projectId);
    if (this.selectedId() === projectId) {
      this.resetForm();
    }
    if (!this.store.error()) {
      this.toast.show('Project archived.', 'success');
    }
  }

  protected async deleteProject(projectId: number): Promise<void> {
    const mode = await this.store.deleteProject(projectId);
    if (this.selectedId() === projectId) {
      this.resetForm();
    }
    if (mode === 'deleted') {
      this.toast.show('Project deleted.', 'success');
    } else if (mode === 'archived') {
      this.toast.show('Project has linked orders or entries, so it was archived instead.', 'info');
    }
  }

  protected openAddMode(): void {
    this.resetForm();
    this.openSheet();
  }

  protected resetForm(): void {
    this.selectedId.set(null);
    this.selectedClientId = null;
    this.selectedClientOption.set(null);
    this.projectForm.reset({
      name: '',
      code: '',
      unitRate: 0,
      unit: 'hours',
      currency: 'EUR',
      billingModel: null,
      clientQuery: '',
      isActive: true,
      useOrders: false,
    });
    this.clientLookupError.set(null);
  }

  protected cancelSheet(): void {
    this.resetForm();
    this.closeSheet();
  }

  private formValue(): ProjectCreateInput {
    const raw = this.projectForm.getRawValue();
    return {
      name: raw.name ?? '',
      code: raw.code ?? '',
      unitRate: Number(raw.unitRate ?? 0),
      unit: raw.unit ?? 'hours',
      currency: raw.currency ?? 'EUR',
      billingModel: raw.billingModel ?? null,
      clientId: this.selectedClientId ?? 0,
      isActive: raw.isActive ?? true,
      useOrders: raw.useOrders ?? false,
    };
  }

  protected readonly optionToLabel = (option: { id: number; label: string } | null): string =>
    option?.label ?? '';

  protected readonly isSameOption = (
    left: { id: number; label: string } | null,
    right: { id: number; label: string } | null
  ): boolean => left?.id === right?.id;

  protected selectedBillingOption(): { label: string; value: BillingModel | null } | null {
    const value = this.projectForm.controls.billingModel.value;
    return this.billingModelDropdownOptions.find((option) => option.value === value) ?? null;
  }

  protected selectedStatusOption(): { label: string; value: boolean } | null {
    const value = this.projectForm.controls.isActive.value;
    return this.statusDropdownOptions.find((option) => option.value === value) ?? null;
  }

  protected selectedUseOrdersOption(): { label: string; value: boolean } | null {
    const value = this.projectForm.controls.useOrders.value;
    return this.useOrdersDropdownOptions.find((option) => option.value === value) ?? null;
  }

  protected onClientSearchChange(value: string): void {
    this.projectForm.controls.clientQuery.setValue(value);
    this.clientLookupError.set(null);
  }

  protected onClientValueChange(option: { id: number; label: string } | null): void {
    const next = selectionFromValueChange(
      option,
      {
        selectedId: this.selectedClientId,
        selectedOption: this.selectedClientOption(),
        query: this.projectForm.controls.clientQuery.value ?? '',
      },
      { preserveOnNull: true },
    );
    this.projectForm.controls.clientQuery.setValue(next.query);
    this.selectedClientId = next.selectedId;
    this.selectedClientOption.set(next.selectedOption);
    this.clientLookupError.set(null);
  }

  protected onBillingValueChange(option: { label: string; value: BillingModel | null } | null): void {
    this.projectForm.controls.billingModel.setValue(option?.value ?? null);
  }

  protected onStatusValueChange(option: { label: string; value: boolean } | null): void {
    this.projectForm.controls.isActive.setValue(option?.value ?? true);
  }

  protected onUseOrdersValueChange(option: { label: string; value: boolean } | null): void {
    this.projectForm.controls.useOrders.setValue(option?.value ?? false);
  }

  protected hasSelectedClient(): boolean {
    return this.selectedClientId !== null;
  }

  protected readonly comboboxItemToLabel = (
    option: { label: string; value: boolean | BillingModel | null } | null
  ): string => option?.label ?? '';

  protected readonly isSameLabeledOption = (
    left: { label: string; value: boolean | BillingModel | null } | null,
    right: { label: string; value: boolean | BillingModel | null } | null
  ): boolean => left?.value === right?.value;

  private clientLabel(clientId: number, clientName: string): string {
    return `${clientName} (#${clientId})`;
  }

  private openSheet(): void {
    this.sheetOpenButton?.nativeElement.click();
  }

  private closeSheet(): void {
    this.sheetCloseButton?.nativeElement.click();
  }
}
