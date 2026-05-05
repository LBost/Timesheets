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
import { ProjectsRepository } from '../../projects/data/projects.repository';
import { OrderCreateInput, OrderUpdateInput } from '../models/order.model';
import { OrdersStore } from '../state/orders.store';

@Component({
  selector: 'app-orders-page',
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
          title="Orders"
          subtitle="Optional booking layer between projects and time entries."
          addAriaLabel="Add order"
          (addRequested)="openAddMode()"
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
              <form
                class="flex h-full flex-col gap-4 p-4"
                [formGroup]="orderForm"
                (ngSubmit)="submitOrder()"
                autocomplete="off"
              >
                <label class="grid gap-1 text-sm">
                  <span>Order Nr *</span>
                  <input hlmInput type="text" formControlName="code" placeholder="PO-2026-001" />
                </label>

                <label class="grid gap-1 text-sm">
                  <span>Order Description *</span>
                  <input
                    hlmInput
                    type="text"
                    formControlName="title"
                    placeholder="Q3 Retainer extension"
                  />
                </label>

                <label class="grid gap-1 text-sm">
                  <span>Project (useOrders enabled) *</span>
                  <div
                    hlmCombobox
                    [value]="selectedProjectOption()"
                    [search]="orderForm.controls.projectQuery.value ?? ''"
                    [itemToString]="optionToLabel"
                    [isItemEqualToValue]="isSameOption"
                    (searchChange)="onProjectSearchChange($event)"
                    (valueChange)="onProjectValueChange($event)"
                  >
                    <hlm-combobox-input placeholder="Select a project" />
                    <ng-template hlmComboboxPortal>
                      <div hlmComboboxContent>
                        <div hlmComboboxList>
                          @for (project of projectOptions(); track project.id) {
                            <hlm-combobox-item [value]="project">{{
                              project.label
                            }}</hlm-combobox-item>
                          }
                          <div hlmComboboxEmpty>No matching projects found.</div>
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
                            <hlm-combobox-item [value]="option">{{
                              option.label
                            }}</hlm-combobox-item>
                          }
                        </div>
                      </div>
                    </ng-template>
                  </div>
                </label>

                <app-crud-sheet-footer
                  [isEditing]="isEditing()"
                  [isLoading]="store.isLoading()"
                  [isValid]="orderForm.valid && hasSelectedProject()"
                  createLabel="Create order"
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

      @if (projectLookupError()) {
        <p
          class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {{ projectLookupError() }}
        </p>
      }

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
              <th hlmTh>Order</th>
              <th hlmTh>Project</th>
              <th hlmTh>Status</th>
              <th hlmTh>Entries</th>
            </tr>
          </thead>
          <tbody hlmTBody>
            @for (order of store.orders(); track order.id) {
              <tr
                hlmTr
                [hlmContextMenuTrigger]="rowMenu"
                [hlmContextMenuTriggerData]="{ orderId: order.id }"
              >
                <td hlmTd>
                  <div class="font-medium">{{ order.code }}</div>
                  <div class="text-xs text-muted-foreground">{{ order.title }}</div>
                </td>
                <td hlmTd>
                  <div>{{ order.projectName }}</div>
                  <div class="text-xs text-muted-foreground">{{ order.projectCode }}</div>
                </td>
                <td hlmTd>{{ order.isActive ? 'Active' : 'Inactive' }}</td>
                <td hlmTd>{{ order.timeEntryCount }}</td>
              </tr>
            } @empty {
              <tr hlmTr>
                <td hlmTd colspan="4" class="text-muted-foreground">No orders yet.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <ng-template #rowMenu let-orderId="orderId">
        <app-row-context-menu
          [entityId]="orderId"
          (addRequested)="openAddMode()"
          (editRequested)="editOrder($event)"
          (deleteRequested)="deleteOrder($event)"
          (archiveRequested)="archiveOrder($event)"
        />
      </ng-template>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  protected readonly store = inject(OrdersStore);
  private readonly projectsRepository = inject(ProjectsRepository);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  @ViewChild('sheetOpenButton', { read: ElementRef })
  private readonly sheetOpenButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('sheetCloseButton', { read: ElementRef })
  private readonly sheetCloseButton?: ElementRef<HTMLButtonElement>;
  protected readonly selectedId = signal<number | null>(null);
  protected readonly isEditing = computed(() => this.selectedId() !== null);
  protected readonly projectOptions = signal<Array<{ id: number; label: string }>>([]);
  protected readonly statusOptions: ReadonlyArray<{ label: string; value: boolean }> = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];
  protected readonly projectLookupError = signal<string | null>(null);
  protected readonly selectedProjectOption = signal<{ id: number; label: string } | null>(null);
  private selectedProjectId: number | null = null;

  protected readonly orderForm = this.formBuilder.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    title: ['', [Validators.required, Validators.maxLength(160)]],
    projectQuery: [''],
    isActive: [true, [Validators.required]],
  });

  async ngOnInit(): Promise<void> {
    const projects = await this.projectsRepository.listProjects();
    this.projectOptions.set(
      activeLookup(projects)
        .filter((project) => project.useOrders)
        .map((project) => ({
          id: project.id,
          label: `${project.code} · ${project.name}`,
        })),
    );
    await this.store.loadOrders();
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
