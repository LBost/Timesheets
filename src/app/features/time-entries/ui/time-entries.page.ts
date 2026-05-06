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
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { ToastService } from '../../../core/feedback/toast.service';
import { activeLookup } from '../../../shared/components/combobox-selection/combobox-selection.util';
import { resolveClientAccentHex } from '../../../shared/components/client-accent/client-accent.util';
import { CrudSheetFooterComponent } from '../../../shared/components/crud-sheet-footer/crud-sheet-footer.component';
import { ClientsRepository } from '../../clients/data/clients.repository';
import { OrdersRepository } from '../../orders/data/orders.repository';
import { ProjectsRepository } from '../../projects/data/projects.repository';
import { TimeEntryCreateInput, TimeEntryUpdateInput } from '../models/time-entry.model';
import { TimeEntriesStore } from '../state/time-entries.store';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLayers, lucidePlus } from '@ng-icons/lucide';
import { HlmIcon } from '@spartan-ng/helm/icon';

type ClientOption = { id: number; label: string };
type ProjectOption = { id: number; clientId: number; label: string; useOrders: boolean };
type OrderOption = { id: number; projectId: number; label: string };

type CalendarDay = {
  date: string | null;
  dayNumber: number;
  inCurrentMonth: boolean;
};

@Component({
  selector: 'app-time-entries-page',
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmComboboxImports,
    HlmInputImports,
    HlmSeparatorImports,
    HlmSheetImports,
    HlmSkeletonImports,
    HlmDialogImports,
    NgIcon,
    HlmIcon,
    CrudSheetFooterComponent,
  ],
  providers: [provideIcons({ lucidePlus, lucideLayers })],
  template: `
    <hlm-sheet>
      <section class="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 class="text-2xl font-semibold">Time Entries</h1>
            <p class="text-sm text-muted-foreground">
              Plan monthly entries and register multiple time entries per day.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button hlmBtn variant="outline" type="button" (click)="previousMonth()">&lt;</button>
            <input
              hlmInput
              type="month"
              class="w-44"
              [value]="selectedMonthValue()"
              (change)="onMonthInputChange($event)"
            />
            <button hlmBtn variant="outline" type="button" (click)="nextMonth()">&gt;</button>
            <button
              hlmBtn
              type="button"
              size="icon"
              variant="outline"
              class="cursor-pointer"
              [attr.aria-label]="'Add entry for ' + todayIso()"
              (click)="openAddForDate(todayIso())"
            >
              <ng-icon hlm size="sm" name="lucidePlus" />
            </button>
          </div>
        </header>

        <div hlmSeparator></div>

        @if (store.error()) {
          <p
            class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {{ store.error() }}
          </p>
        }

        <div class="flex items-center justify-between text-sm">
          <div class="font-medium">{{ monthLabel() }}</div>
          <div class="text-muted-foreground">
            Total hours: {{ store.monthTotalHours().toFixed(2) }}
          </div>
        </div>

        @if (store.isLoading()) {
          <div class="grid gap-2 rounded-lg border border-border p-4">
            <div hlmSkeleton class="h-5 w-1/4"></div>
            <div hlmSkeleton class="h-4 w-full"></div>
            <div hlmSkeleton class="h-4 w-full"></div>
          </div>
        }

        <div class="overflow-hidden rounded-lg border border-border">
          <div
            class="grid grid-cols-7 border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wide"
          >
            @for (label of weekdayLabels; track label) {
              <div class="border-r border-border p-2 last:border-r-0">{{ label }}</div>
            }
          </div>

          <div class="grid grid-cols-7">
            @for (day of calendarDays(); track day.date ?? $index) {
              <div
                class="relative min-h-32 border-r border-b border-border p-2 last:border-r-0"
                [class.bg-muted/20]="!day.inCurrentMonth"
              >
                <div class="mb-2 flex items-center justify-between text-xs">
                  <span class="font-medium">{{ day.dayNumber }}</span>
                  @if (day.date) {
                    <button
                      hlmBtn
                      variant="ghost"
                      size="icon"
                      type="button"
                      class="cursor-pointer"
                      (click)="openAddForDate(day.date)"
                    >
                      <ng-icon hlm name="lucidePlus" size="sm" aria-hidden="true" />
                    </button>
                  }
                </div>

                @if (day.date) {
                  @let entries = entriesForDate(day.date);
                  <div class="mb-1 text-xs text-muted-foreground">
                    {{ dayTotal(day.date).toFixed(2) }} h
                  </div>
                  @if (entries.length === 1) {
                    @let entry = entries[0];
                    <button
                      type="button"
                      class="w-full rounded border border-border/50 border-l-[3px] bg-card px-2 py-1 text-left text-[11px] leading-tight hover:bg-accent cursor-pointer"
                      [style.border-left-color]="entryClientAccent(entry)"
                      (click)="editEntry(entry.id)"
                    >
                      <div class="font-medium">
                        {{ entry.projectCode }}{{ entry.orderCode ? ' / ' + entry.orderCode : '' }}
                      </div>
                      <div class="text-muted-foreground">
                        {{ entry.hours.toFixed(2) }}h · {{ entry.clientName }}
                      </div>
                    </button>
                  } @else if (entries.length > 1) {
                    <button
                      type="button"
                      class="relative mt-0.5 w-full touch-manipulation text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      (click)="openDayEntriesPicker(day.date)"
                      [attr.aria-label]="
                        'View ' + entries.length + ' entries on ' + formatDayHeading(day.date)
                      "
                    >
                      <span
                        class="pointer-events-none absolute inset-x-3 top-0 z-0 h-9 rounded-md border border-border/50 bg-muted/30 shadow-sm"
                        aria-hidden="true"
                      ></span>
                      <span
                        class="pointer-events-none absolute inset-x-1.5 top-1.5 z-10 h-9 rounded-md border border-border/60 bg-card/90 shadow-sm"
                        aria-hidden="true"
                      ></span>
                      <span
                        class="relative z-20 flex h-10 items-center justify-between gap-2 rounded-md border border-border bg-card px-2 py-1 text-[11px] shadow-sm"
                      >
                        <span class="flex min-w-0 flex-1 items-center gap-1.5 font-medium">
                          @for (accent of entryAccentsForDate(day.date); track accent.key) {
                            <span
                              class="size-2 shrink-0 rounded-full ring-1 ring-border/50"
                              [style.background-color]="accent.hex"
                              [attr.title]="accent.label"
                            ></span>
                          }
                          <ng-icon
                            hlm
                            name="lucideLayers"
                            size="sm"
                            class="size-3.5 shrink-0 opacity-80"
                            aria-hidden="true"
                          />
                          <span class="truncate">{{ entries.length }} entries</span>
                        </span>
                        <span class="shrink-0 text-muted-foreground">
                          {{ dayTotal(day.date).toFixed(2) }} h
                        </span>
                      </span>
                    </button>
                  }
                }
              </div>
            }
          </div>
        </div>

        <button #sheetOpenButton class="hidden" hlmSheetTrigger side="right" type="button"></button>
        <ng-template hlmSheetPortal>
          <hlm-sheet-content class="w-full border-border/40 sm:max-w-xl">
            <div hlmSheetHeader>
              <h2 hlmSheetTitle>{{ isEditing() ? 'Edit time entry' : 'Add time entry' }}</h2>
            </div>
            <form
              class="flex h-full flex-col gap-4 p-4"
              [formGroup]="entryForm"
              (ngSubmit)="submitEntry()"
            >
              <label class="grid gap-1 text-sm">
                <span>Client *</span>
                <div
                  hlmCombobox
                  [value]="selectedClientOption()"
                  [itemToString]="optionToLabel"
                  [isItemEqualToValue]="isSameOption"
                  (valueChange)="onClientChange($event)"
                >
                  <hlm-combobox-trigger class="w-full justify-between">
                    <span>{{ selectedClientOption()?.label ?? 'Select client' }}</span>
                  </hlm-combobox-trigger>
                  <ng-template hlmComboboxPortal>
                    <div hlmComboboxContent>
                      <div hlmComboboxList>
                        @for (option of clientOptions(); track option.id) {
                          <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
                        }
                      </div>
                    </div>
                  </ng-template>
                </div>
              </label>

              <label class="grid gap-1 text-sm">
                <span>Project *</span>
                <div
                  hlmCombobox
                  [value]="selectedProjectOption()"
                  [itemToString]="optionToLabel"
                  [isItemEqualToValue]="isSameOption"
                  (valueChange)="onProjectChange($event)"
                >
                  <hlm-combobox-trigger class="w-full justify-between">
                    <span>{{ selectedProjectOption()?.label ?? 'Select project' }}</span>
                  </hlm-combobox-trigger>
                  <ng-template hlmComboboxPortal>
                    <div hlmComboboxContent>
                      <div hlmComboboxList>
                        @for (option of filteredProjectOptions(); track option.id) {
                          <hlm-combobox-item [value]="option">{{ option.label }}</hlm-combobox-item>
                        }
                      </div>
                    </div>
                  </ng-template>
                </div>
              </label>

              @if (selectedProjectRequiresOrder()) {
                <label class="grid gap-1 text-sm">
                  <span>Order *</span>
                  <div
                    hlmCombobox
                    [value]="selectedOrderOption()"
                    [itemToString]="optionToLabel"
                    [isItemEqualToValue]="isSameOption"
                    (valueChange)="onOrderChange($event)"
                  >
                    <hlm-combobox-trigger class="w-full justify-between">
                      <span>{{ selectedOrderOption()?.label ?? 'Select order' }}</span>
                    </hlm-combobox-trigger>
                    <ng-template hlmComboboxPortal>
                      <div hlmComboboxContent>
                        <div hlmComboboxList>
                          @for (option of filteredOrderOptions(); track option.id) {
                            <hlm-combobox-item [value]="option">{{
                              option.label
                            }}</hlm-combobox-item>
                          }
                        </div>
                      </div>
                    </ng-template>
                  </div>
                </label>
              }

              <div class="grid grid-cols-2 gap-3">
                <label class="grid gap-1 text-sm">
                  <span>Date *</span>
                  <input hlmInput type="date" formControlName="date" />
                </label>
                <label class="grid gap-1 text-sm">
                  <span>Hours *</span>
                  <input hlmInput type="number" min="0.25" step="0.25" formControlName="hours" />
                </label>
              </div>

              <label class="grid gap-1 text-sm">
                <span>Description</span>
                <input
                  hlmInput
                  type="text"
                  formControlName="description"
                  placeholder="Daily work summary"
                />
              </label>

              @if (entryForm.invalid && (entryForm.touched || entryForm.dirty)) {
                <p class="text-sm text-destructive">
                  Please complete all required fields correctly.
                </p>
              }

              <div
                class="mt-auto flex items-center justify-between gap-2 border-t border-border/40 pt-3"
              >
                <app-crud-sheet-footer
                  [isEditing]="isEditing()"
                  [isLoading]="store.isLoading()"
                  [isValid]="entryForm.valid && cascadeIsValid()"
                  createLabel="Create entry"
                  updateLabel="Save changes"
                  (clearRequested)="resetForm(entryForm.controls.date.value || todayIso())"
                  (cancelRequested)="cancelSheet()"
                />
                @if (isEditing()) {
                  <button
                    hlmBtn
                    variant="outline"
                    type="button"
                    class="cursor-pointer"
                    (click)="deleteEditingEntry()"
                  >
                    Delete
                  </button>
                }
              </div>
              <button #sheetCloseButton class="hidden" hlmSheetClose type="button"></button>
            </form>
          </hlm-sheet-content>
        </ng-template>

        <hlm-dialog
          [state]="dayPickerDialogState()"
          [ariaLabel]="dayPickerDialogAriaLabel()"
          [ariaModal]="true"
          (closed)="closeDayEntriesPicker()"
        >
          <ng-template hlmDialogPortal>
            <hlm-dialog-content
              [showCloseButton]="true"
              class="max-h-[min(70vh,520px)] gap-0 overflow-hidden p-0 sm:max-w-md"
            >
              @if (dayEntriesPickerDate(); as pickerDate) {
                <hlm-dialog-header
                  class="border-b border-border/40 px-4 pb-3 pe-14 pt-4 text-start"
                >
                  <h2 hlmDialogTitle class="text-base">{{ formatDayHeading(pickerDate) }}</h2>
                  <p hlmDialogDescription class="text-xs">
                    {{ entriesForDate(pickerDate).length }} entries ·
                    {{ dayTotal(pickerDate).toFixed(2) }} h total
                  </p>
                </hlm-dialog-header>
                <div class="max-h-[min(55vh,400px)] overflow-y-auto p-2">
                  @for (entry of entriesForDate(pickerDate); track entry.id) {
                    <button
                      type="button"
                      class="mb-2 w-full rounded-md border border-border/50 border-l-[3px] bg-card px-3 py-2 text-left text-sm last:mb-0 hover:bg-accent"
                      [style.border-left-color]="entryClientAccent(entry)"
                      (click)="pickEntryFromDayPicker(entry.id)"
                    >
                      <div class="font-medium">
                        {{ entry.projectCode }}{{ entry.orderCode ? ' / ' + entry.orderCode : '' }}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {{ entry.hours.toFixed(2) }}h · {{ entry.clientName }}
                      </div>
                    </button>
                  }
                </div>
              }
            </hlm-dialog-content>
          </ng-template>
        </hlm-dialog>
      </section>
    </hlm-sheet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntriesPage implements OnInit {
  protected readonly store = inject(TimeEntriesStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly clientsRepository = inject(ClientsRepository);
  private readonly projectsRepository = inject(ProjectsRepository);
  private readonly ordersRepository = inject(OrdersRepository);
  private readonly toast = inject(ToastService);

  @ViewChild('sheetOpenButton', { read: ElementRef })
  private readonly sheetOpenButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('sheetCloseButton', { read: ElementRef })
  private readonly sheetCloseButton?: ElementRef<HTMLButtonElement>;

  protected readonly clientOptions = signal<ClientOption[]>([]);
  protected readonly projectOptions = signal<ProjectOption[]>([]);
  protected readonly orderOptions = signal<OrderOption[]>([]);
  /** When set, a dialog lists every entry for that calendar day (multi-entry days). */
  protected readonly dayEntriesPickerDate = signal<string | null>(null);
  protected readonly dayPickerDialogState = computed(() =>
    this.dayEntriesPickerDate() !== null ? ('open' as const) : ('closed' as const),
  );
  protected readonly dayPickerDialogAriaLabel = computed(() => {
    const d = this.dayEntriesPickerDate();
    return d ? `Entries for ${this.formatDayHeading(d)}` : '';
  });
  protected readonly weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  protected readonly entryForm = this.formBuilder.group({
    clientId: [null as number | null, [Validators.required]],
    projectId: [null as number | null, [Validators.required]],
    orderId: [null as number | null],
    date: [this.todayIso(), [Validators.required]],
    hours: [1, [Validators.required, Validators.min(0.25)]],
    description: [''],
  });

  protected readonly isEditing = computed(() => this.store.editingEntryId() !== null);
  protected readonly selectedMonthValue = computed(() => {
    const month = this.store.selectedMonth();
    return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  });
  protected readonly monthLabel = computed(() =>
    this.store.selectedMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  );

  protected readonly calendarDays = computed<CalendarDay[]>(() => {
    const month = this.store.selectedMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstOfMonth = new Date(year, monthIndex, 1);
    const startDayOffset = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i += 1) {
      const dayNumber = i - startDayOffset + 1;
      const date = new Date(year, monthIndex, dayNumber);
      const inCurrentMonth = date.getMonth() === monthIndex;
      days.push({
        date: inCurrentMonth ? this.toIsoDate(date) : null,
        dayNumber: date.getDate(),
        inCurrentMonth,
      });
    }
    return days;
  });

  async ngOnInit(): Promise<void> {
    const [clients, projects, orders] = await Promise.all([
      this.clientsRepository.listClients(),
      this.projectsRepository.listProjects(),
      this.ordersRepository.listOrders(),
    ]);

    this.clientOptions.set(
      activeLookup(clients).map((client) => ({ id: client.id, label: client.name })),
    );
    this.projectOptions.set(
      activeLookup(projects).map((project) => ({
        id: project.id,
        clientId: project.clientId,
        label: `${project.code} - ${project.name}`,
        useOrders: project.useOrders,
      })),
    );
    this.orderOptions.set(
      activeLookup(orders).map((order) => ({
        id: order.id,
        projectId: order.projectId,
        label: `${order.code} - ${order.title}`,
      })),
    );

    await this.store.loadMonthEntries();
  }

  protected formatDayHeading(isoDate: string): string {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  protected openDayEntriesPicker(date: string): void {
    this.dayEntriesPickerDate.set(date);
  }

  protected closeDayEntriesPicker(): void {
    this.dayEntriesPickerDate.set(null);
  }

  protected pickEntryFromDayPicker(entryId: number): void {
    this.closeDayEntriesPicker();
    this.editEntry(entryId);
  }

  protected entriesForDate(date: string): Array<ReturnType<typeof this.store.entries>[number]> {
    return this.store.entriesByDate()[date] ?? [];
  }

  protected entryClientAccent(entry: {
    clientId: number;
    clientAccentColor: string | null;
  }): string {
    return resolveClientAccentHex(entry.clientAccentColor, entry.clientId);
  }

  /** Distinct client accent colors for the multi-entry deck (one dot per hue, first-seen order, max 6). */
  protected entryAccentsForDate(date: string): Array<{ key: string; hex: string; label: string }> {
    const seenHex = new Set<string>();
    const acc: Array<{ key: string; hex: string; label: string }> = [];

    for (const entry of this.entriesForDate(date)) {
      const hex = this.entryClientAccent(entry);
      if (seenHex.has(hex)) {
        continue;
      }
      seenHex.add(hex);
      acc.push({ key: hex, hex, label: entry.clientName });
      if (acc.length >= 6) {
        break;
      }
    }

    return acc;
  }

  protected dayTotal(date: string): number {
    return this.store.dayTotals()[date] ?? 0;
  }

  protected previousMonth(): void {
    this.closeDayEntriesPicker();
    void this.store.goToPreviousMonth();
  }

  protected nextMonth(): void {
    this.closeDayEntriesPicker();
    void this.store.goToNextMonth();
  }

  protected onMonthInputChange(event: Event): void {
    this.closeDayEntriesPicker();
    const value = (event.target as HTMLInputElement).value;
    if (!value) {
      return;
    }
    const [yearText, monthText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!Number.isFinite(year) || !Number.isFinite(month)) {
      return;
    }
    void this.store.setSelectedMonth(new Date(year, month - 1, 1));
  }

  protected openAddForDate(date: string): void {
    this.closeDayEntriesPicker();
    this.store.openAddForDate(date);
    this.resetForm(date);
    this.openSheet();
  }

  protected editEntry(entryId: number): void {
    this.store.openEdit(entryId);
    const entry = this.store.entries().find((item) => item.id === entryId);
    if (!entry) {
      return;
    }
    this.entryForm.setValue({
      clientId: entry.clientId,
      projectId: entry.projectId,
      orderId: entry.orderId,
      date: entry.date,
      hours: entry.hours,
      description: entry.description,
    });
    this.openSheet();
  }

  protected async submitEntry(): Promise<void> {
    if (this.entryForm.invalid || !this.cascadeIsValid()) {
      this.entryForm.markAllAsTouched();
      return;
    }

    const payload = this.formValue();
    const editingId = this.store.editingEntryId();

    if (editingId === null) {
      await this.store.createEntry(payload as TimeEntryCreateInput);
      if (!this.store.error()) {
        this.toast.show('Time entry created.', 'success');
      }
    } else {
      await this.store.updateEntry(editingId, payload as TimeEntryUpdateInput);
      if (!this.store.error()) {
        this.toast.show('Time entry updated.', 'success');
      }
    }

    if (!this.store.error()) {
      this.cancelSheet();
    }
  }

  protected async deleteEditingEntry(): Promise<void> {
    const editingId = this.store.editingEntryId();
    if (editingId === null) {
      return;
    }

    await this.store.deleteEntry(editingId);
    if (!this.store.error()) {
      this.toast.show('Time entry deleted.', 'success');
      this.cancelSheet();
    }
  }

  protected onClientChange(option: ClientOption | null): void {
    this.entryForm.controls.clientId.setValue(option?.id ?? null);
    this.entryForm.controls.projectId.setValue(null);
    this.entryForm.controls.orderId.setValue(null);
  }

  protected onProjectChange(option: ProjectOption | null): void {
    this.entryForm.controls.projectId.setValue(option?.id ?? null);
    this.entryForm.controls.orderId.setValue(null);
  }

  protected onOrderChange(option: OrderOption | null): void {
    this.entryForm.controls.orderId.setValue(option?.id ?? null);
  }

  protected selectedClientOption(): ClientOption | null {
    const id = this.entryForm.controls.clientId.value;
    return this.clientOptions().find((item) => item.id === id) ?? null;
  }

  protected selectedProjectOption(): ProjectOption | null {
    const id = this.entryForm.controls.projectId.value;
    return this.filteredProjectOptions().find((item) => item.id === id) ?? null;
  }

  protected selectedOrderOption(): OrderOption | null {
    const id = this.entryForm.controls.orderId.value;
    return this.filteredOrderOptions().find((item) => item.id === id) ?? null;
  }

  protected filteredProjectOptions(): ProjectOption[] {
    const clientId = this.entryForm.controls.clientId.value;
    if (clientId === null) {
      return [];
    }
    return this.projectOptions().filter((project) => project.clientId === clientId);
  }

  protected selectedProjectRequiresOrder(): boolean {
    const projectId = this.entryForm.controls.projectId.value;
    const project = this.projectOptions().find((item) => item.id === projectId);
    return project?.useOrders ?? false;
  }

  protected filteredOrderOptions(): OrderOption[] {
    const projectId = this.entryForm.controls.projectId.value;
    if (projectId === null) {
      return [];
    }
    return this.orderOptions().filter((order) => order.projectId === projectId);
  }

  protected readonly optionToLabel = (option: { id: number; label: string } | null): string =>
    option?.label ?? '';

  protected readonly isSameOption = (
    left: { id: number; label: string } | null,
    right: { id: number; label: string } | null,
  ): boolean => left?.id === right?.id;

  protected cascadeIsValid(): boolean {
    const clientId = this.entryForm.controls.clientId.value;
    const projectId = this.entryForm.controls.projectId.value;
    if (clientId === null || projectId === null) {
      return false;
    }

    const project = this.projectOptions().find((item) => item.id === projectId);
    if (!project || project.clientId !== clientId) {
      return false;
    }

    if (!project.useOrders) {
      return this.entryForm.controls.orderId.value === null;
    }

    const orderId = this.entryForm.controls.orderId.value;
    if (orderId === null) {
      return false;
    }
    return this.orderOptions().some((item) => item.id === orderId && item.projectId === projectId);
  }

  protected resetForm(date: string): void {
    this.entryForm.reset({
      clientId: null,
      projectId: null,
      orderId: null,
      date,
      hours: 1,
      description: '',
    });
  }

  protected cancelSheet(): void {
    this.store.closeSheet();
    this.resetForm(this.todayIso());
    this.closeSheet();
  }

  protected todayIso(): string {
    return this.toIsoDate(new Date());
  }

  private formValue(): TimeEntryCreateInput {
    const raw = this.entryForm.getRawValue();
    const selectedProject = this.projectOptions().find((item) => item.id === raw.projectId);
    return {
      clientId: raw.clientId ?? 0,
      projectId: raw.projectId ?? 0,
      orderId: selectedProject?.useOrders ? raw.orderId : null,
      date: raw.date ?? this.todayIso(),
      hours: Number(raw.hours ?? 0),
      description: raw.description ?? '',
    };
  }

  private openSheet(): void {
    this.sheetOpenButton?.nativeElement.click();
  }

  private closeSheet(): void {
    this.sheetCloseButton?.nativeElement.click();
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
