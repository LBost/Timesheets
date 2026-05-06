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
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { ToastService } from '../../../core/feedback/toast.service';
import { activeLookup, selectionFromValueChange } from '../../../shared/components/combobox-selection/combobox-selection.util';
import { FeatureHeaderActionsComponent } from '../../../shared/components/feature-header-actions/feature-header-actions.component';
import { ClientsStore } from '../../clients/state/clients.store';
import { BillingModel, ProjectCreateInput, ProjectUpdateInput } from '../models/project.model';
import { ProjectsStore } from '../state/projects.store';
import { ProjectsFeedbackStateComponent } from './components/projects-feedback-state.component';
import { ProjectsSheetFormComponent } from './components/projects-sheet-form.component';
import { ProjectsTableComponent } from './components/projects-table.component';

@Component({
  selector: 'app-projects-page',
  imports: [
    ReactiveFormsModule,
    HlmSeparatorImports,
    HlmSheetImports,
    FeatureHeaderActionsComponent,
    ProjectsSheetFormComponent,
    ProjectsFeedbackStateComponent,
    ProjectsTableComponent,
  ],
  template: `
    <section class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <hlm-sheet>
        <app-feature-header-actions
          title="Projects"
          subtitle="Configure project billing, ownership, and status."
          addAriaLabel="Add project"
          [showRefresh]="true"
          refreshAriaLabel="Refresh projects"
          (addRequested)="openAddMode()"
          (refreshRequested)="refreshProjects()"
        />
          <button #sheetOpenButton class="hidden" hlmSheetTrigger side="right" type="button"></button>
          <ng-template hlmSheetPortal>
            <hlm-sheet-content class="w-full border-border/40 sm:max-w-xl">
              <div hlmSheetHeader>
                <h2 hlmSheetTitle>{{ isEditing() ? 'Edit project' : 'Add project' }}</h2>
              </div>
              <app-projects-sheet-form
                [form]="projectForm"
                [isEditing]="isEditing()"
                [isLoading]="store.isLoading()"
                [isValid]="projectForm.valid && hasSelectedClient()"
                [clientOptions]="clientOptions()"
                [selectedClientOption]="selectedClientOption()"
                [billingModelDropdownOptions]="billingModelDropdownOptions"
                [statusDropdownOptions]="statusDropdownOptions"
                [useOrdersDropdownOptions]="useOrdersDropdownOptions"
                [selectedBillingOption]="selectedBillingOption()"
                [selectedStatusOption]="selectedStatusOption()"
                [selectedUseOrdersOption]="selectedUseOrdersOption()"
                [optionToLabel]="optionToLabel"
                [isSameOption]="isSameOption"
                [comboboxItemToLabel]="comboboxItemToLabel"
                [isSameLabeledOption]="isSameLabeledOption"
                (submitted)="submitProject()"
                (clientSearchChanged)="onClientSearchChange($event)"
                (clientValueChanged)="onClientValueChange($event)"
                (billingValueChanged)="onBillingValueChange($event)"
                (statusValueChanged)="onStatusValueChange($event)"
                (useOrdersValueChanged)="onUseOrdersValueChange($event)"
                (clearRequested)="resetForm()"
                (cancelRequested)="cancelSheet()"
              />
              <button #sheetCloseButton class="hidden" hlmSheetClose type="button"></button>
            </hlm-sheet-content>
          </ng-template>
      </hlm-sheet>
      <div hlmSeparator></div>
      <app-projects-feedback-state
        [clientLookupError]="clientLookupError()"
        [storeError]="store.error()"
        [isLoading]="showLoadingSkeleton()"
      />
      <app-projects-table
        [projects]="store.projects()"
        (addRequested)="openAddMode()"
        (editRequested)="editProject($event)"
        (deleteRequested)="deleteProject($event)"
        (archiveRequested)="archiveProject($event)"
      />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage implements OnInit {
  protected readonly store = inject(ProjectsStore);
  private readonly clientsStore = inject(ClientsStore);
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
  protected readonly clientOptions = computed<Array<{ id: number; label: string }>>(() =>
    activeLookup(this.clientsStore.clients()).map((client) => ({
      id: client.id,
      label: this.clientLabel(client.id, client.name),
    })),
  );
  protected readonly clientLookupError = signal<string | null>(null);
  protected readonly selectedClientOption = signal<{ id: number; label: string } | null>(null);
  private readonly hasInitialLoadCompleted = signal(false);
  protected readonly showLoadingSkeleton = computed(
    () => !this.hasInitialLoadCompleted() && this.store.isLoading(),
  );

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
    try {
      await Promise.all([
        this.clientsStore.loadClientsIfNeeded(),
        this.store.loadProjectsIfNeeded(),
      ]);
    } finally {
      this.hasInitialLoadCompleted.set(true);
    }
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

  protected async refreshProjects(): Promise<void> {
    await Promise.all([this.clientsStore.loadClients(), this.store.loadProjects()]);
    if (!this.store.error() && !this.clientsStore.error()) {
      this.toast.show('Projects refreshed.', 'success');
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
