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
import {
  activeLookup,
  selectionFromValueChange,
} from '../../../shared/components/combobox-selection/combobox-selection.util';
import { FeatureHeaderActionsComponent } from '../../../shared/components/feature-header-actions/feature-header-actions.component';
import { ProjectsStore } from '../../projects/state/projects.store';
import { OrderCreateInput, OrderUpdateInput } from '../models/order.model';
import { OrdersStore } from '../state/orders.store';
import { OrderSheetFormComponent } from './components/order-sheet-form.component';
import { OrdersStateMessagesComponent } from './components/orders-state-messages.component';
import { OrdersTableComponent } from './components/orders-table.component';

@Component({
  selector: 'app-orders-page',
  imports: [
    ReactiveFormsModule,
    HlmSeparatorImports,
    HlmSheetImports,
    FeatureHeaderActionsComponent,
    OrderSheetFormComponent,
    OrdersStateMessagesComponent,
    OrdersTableComponent,
  ],
  template: `
    <section class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <hlm-sheet>
        <app-feature-header-actions
          title="Orders"
          subtitle="Optional booking layer between projects and time entries."
          addAriaLabel="Add order"
          [showRefresh]="true"
          refreshAriaLabel="Refresh orders"
          (addRequested)="openAddMode()"
          (refreshRequested)="refreshOrders()"
        />
        <button
          #sheetOpenButton
          class="hidden"
          hlmSheetTrigger
          side="right"
          type="button"
          size="icon"
        ></button>
        <ng-template hlmSheetPortal>
          <hlm-sheet-content class="w-full border-border/40 sm:max-w-xl">
            <div hlmSheetHeader>
              <h2 hlmSheetTitle>{{ isEditing() ? 'Edit order' : 'Add order' }}</h2>
            </div>
            <app-order-sheet-form
              [form]="orderForm"
              [isEditing]="isEditing()"
              [isLoading]="store.isLoading()"
              [isValid]="orderForm.valid && hasSelectedProject()"
              [projectOptions]="projectOptions()"
              [statusOptions]="statusOptions"
              [selectedProjectOption]="selectedProjectOption()"
              [selectedStatusOption]="selectedStatusOption()"
              [optionToLabel]="optionToLabel"
              [isSameOption]="isSameOption"
              [statusItemToLabel]="statusItemToLabel"
              [isSameStatusOption]="isSameStatusOption"
              (submitted)="submitOrder()"
              (projectSearchChanged)="onProjectSearchChange($event)"
              (projectValueChanged)="onProjectValueChange($event)"
              (statusValueChanged)="onStatusValueChange($event)"
              (clearRequested)="resetForm()"
              (cancelRequested)="cancelSheet()"
            />
            <button #sheetCloseButton class="hidden" hlmSheetClose type="button"></button>
          </hlm-sheet-content>
        </ng-template>
      </hlm-sheet>
      <!-- <div hlmSeparator></div> -->
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <app-orders-state-messages
          [projectLookupError]="projectLookupError()"
          [storeError]="store.error()"
          [isLoading]="showLoadingSpinner()"
        />
        <app-orders-table
          [orders]="store.orders()"
          (addRequested)="openAddMode()"
          (editRequested)="editOrder($event)"
          (deleteRequested)="deleteOrder($event)"
          (archiveRequested)="archiveOrder($event)"
        />
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  protected readonly store = inject(OrdersStore);
  private readonly projectsStore = inject(ProjectsStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  @ViewChild('sheetOpenButton', { read: ElementRef })
  private readonly sheetOpenButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('sheetCloseButton', { read: ElementRef })
  private readonly sheetCloseButton?: ElementRef<HTMLButtonElement>;
  protected readonly selectedId = signal<number | null>(null);
  protected readonly isEditing = computed(() => this.selectedId() !== null);
  protected readonly projectOptions = computed<Array<{ id: number; label: string }>>(() =>
    activeLookup(this.projectsStore.projects())
      .filter((project) => project.useOrders)
      .map((project) => ({
        id: project.id,
        label: `${project.code} · ${project.name}`,
      })),
  );
  protected readonly statusOptions: ReadonlyArray<{ label: string; value: boolean }> = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];
  protected readonly projectLookupError = signal<string | null>(null);
  protected readonly selectedProjectOption = signal<{ id: number; label: string } | null>(null);
  private readonly hasInitialLoadCompleted = signal(false);
  protected readonly showLoadingSpinner = computed(
    () => !this.hasInitialLoadCompleted() && this.store.isLoading(),
  );
  private selectedProjectId: number | null = null;

  protected readonly orderForm = this.formBuilder.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    title: ['', [Validators.required, Validators.maxLength(160)]],
    projectQuery: [''],
    isActive: [true, [Validators.required]],
  });

  async ngOnInit(): Promise<void> {
    try {
      await Promise.all([
        this.projectsStore.loadProjectsIfNeeded(),
        this.store.loadOrdersIfNeeded(),
      ]);
    } finally {
      this.hasInitialLoadCompleted.set(true);
    }
  }

  protected async submitOrder(): Promise<void> {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }
    if (this.selectedProjectId === null) {
      this.projectLookupError.set('Please select a valid project from the list.');
      return;
    }

    const payload = this.formValue();
    const selectedId = this.selectedId();
    if (selectedId === null) {
      await this.store.createOrder(payload as OrderCreateInput);
      this.resetForm();
      this.closeSheet();
      return;
    }

    await this.store.updateOrder(selectedId, payload as OrderUpdateInput);
    this.resetForm();
    this.closeSheet();
  }

  protected editOrder(orderId: number): void {
    const order = this.store.orders().find((item) => item.id === orderId);
    if (!order) {
      return;
    }

    this.selectedId.set(order.id);
    this.selectedProjectId = order.projectId;
    this.selectedProjectOption.set(
      this.projectOptions().find((option) => option.id === order.projectId) ?? null,
    );
    this.orderForm.setValue({
      code: order.code,
      title: order.title,
      projectQuery: `${order.projectCode} · ${order.projectName}`,
      isActive: order.isActive,
    });
    this.projectLookupError.set(null);
    this.openSheet();
  }

  protected async archiveOrder(orderId: number): Promise<void> {
    await this.store.archiveOrder(orderId);
    if (this.selectedId() === orderId) {
      this.resetForm();
    }
    if (!this.store.error()) {
      this.toast.show('Order archived.', 'success');
    }
  }

  protected async deleteOrder(orderId: number): Promise<void> {
    const deleted = await this.store.deleteOrder(orderId);
    if (this.selectedId() === orderId) {
      this.resetForm();
    }
    if (deleted) {
      this.toast.show('Order deleted.', 'success');
    }
  }

  protected async refreshOrders(): Promise<void> {
    await Promise.all([this.projectsStore.loadProjects(), this.store.loadOrders()]);
    if (!this.store.error() && !this.projectsStore.error()) {
      this.toast.show('Orders refreshed.', 'success');
    }
  }

  protected openAddMode(): void {
    this.resetForm();
    this.openSheet();
  }

  protected resetForm(): void {
    this.selectedId.set(null);
    this.selectedProjectId = null;
    this.selectedProjectOption.set(null);
    this.orderForm.reset({
      code: '',
      title: '',
      projectQuery: '',
      isActive: true,
    });
    this.projectLookupError.set(null);
  }

  protected cancelSheet(): void {
    this.resetForm();
    this.closeSheet();
  }

  protected onProjectSearchChange(value: string): void {
    this.orderForm.controls.projectQuery.setValue(value);
    this.projectLookupError.set(null);
  }

  protected onProjectValueChange(option: { id: number; label: string } | null): void {
    const next = selectionFromValueChange(
      option,
      {
        selectedId: this.selectedProjectId,
        selectedOption: this.selectedProjectOption(),
        query: this.orderForm.controls.projectQuery.value ?? '',
      },
      { preserveOnNull: true },
    );
    this.orderForm.controls.projectQuery.setValue(next.query);
    this.selectedProjectId = next.selectedId;
    this.selectedProjectOption.set(next.selectedOption);
    this.projectLookupError.set(null);
  }

  protected readonly optionToLabel = (option: { id: number; label: string } | null): string =>
    option?.label ?? '';

  protected readonly isSameOption = (
    left: { id: number; label: string } | null,
    right: { id: number; label: string } | null,
  ): boolean => left?.id === right?.id;

  protected selectedStatusOption(): { label: string; value: boolean } | null {
    const value = this.orderForm.controls.isActive.value;
    return this.statusOptions.find((option) => option.value === value) ?? null;
  }

  protected onStatusValueChange(option: { label: string; value: boolean } | null): void {
    this.orderForm.controls.isActive.setValue(option?.value ?? true);
  }

  protected readonly statusItemToLabel = (
    option: { label: string; value: boolean } | null,
  ): string => option?.label ?? '';

  protected readonly isSameStatusOption = (
    left: { label: string; value: boolean } | null,
    right: { label: string; value: boolean } | null,
  ): boolean => left?.value === right?.value;

  protected hasSelectedProject(): boolean {
    return this.selectedProjectId !== null;
  }

  private formValue(): OrderCreateInput {
    const raw = this.orderForm.getRawValue();
    return {
      code: raw.code ?? '',
      title: raw.title ?? '',
      projectId: this.selectedProjectId ?? 0,
      isActive: raw.isActive ?? true,
    };
  }

  private openSheet(): void {
    this.sheetOpenButton?.nativeElement.click();
  }

  private closeSheet(): void {
    this.sheetCloseButton?.nativeElement.click();
  }
}
