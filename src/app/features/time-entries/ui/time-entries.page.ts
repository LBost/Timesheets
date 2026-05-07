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
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { ToastService } from '../../../core/feedback/toast.service';
import { activeLookup } from '../../../shared/components/combobox-selection/combobox-selection.util';
import { resolveClientAccentHex } from '../../../shared/components/client-accent/client-accent.util';
import { ClientsStore } from '../../clients/state/clients.store';
import { OrdersStore } from '../../orders/state/orders.store';
import { ProjectsStore } from '../../projects/state/projects.store';
import { SettingsStore } from '../../settings/state/settings.store';
import { TimeEntryCreateInput, TimeEntryUpdateInput } from '../models/time-entry.model';
import { TimeEntriesStore } from '../state/time-entries.store';
import { provideIcons } from '@ng-icons/core';
import {
  lucideCalendar,
  lucideEllipsis,
  lucideLayers,
  lucideMail,
  lucidePlus,
  lucideRefreshCw,
} from '@ng-icons/lucide';
import { TimeEntriesCalendarToolbarComponent } from './components/time-entries-calendar-toolbar.component';
import { TimeEntriesMonthSummaryComponent } from './components/time-entries-month-summary.component';
import { TimeEntriesCalendarGridComponent } from './components/time-entries-calendar-grid.component';
import { TimeEntriesDayPickerDialogComponent } from './components/time-entries-day-picker-dialog.component';
import { TimeEntrySheetFormComponent } from './components/time-entry-sheet-form.component';
import { TimeEntriesWeekGridComponent } from './components/time-entries-week-grid.component';

type ClientOption = { id: number; label: string };
type ProjectOption = { id: number; clientId: number; label: string; useOrders: boolean };
type OrderOption = { id: number; projectId: number; label: string };

type CalendarDay = {
  date: string | null;
  dayNumber: number;
  inCurrentMonth: boolean;
};

type WeekDay = {
  date: string;
  dayNumber: number;
};

type EmailClientChoice = {
  clientId: number;
  clientName: string;
  clientEmail: string | null;
  entryCount: number;
};

type PendingEmailDraft = {
  entries: Array<ReturnType<TimeEntriesPage['store']['entries']>[number]>;
  subject: string;
  includeDate: boolean;
};

export type EntryInvoicedSummary = {
  state: 'none' | 'partial' | 'all';
  invoiced: number;
  total: number;
};

@Component({
  selector: 'app-time-entries-page',
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmDialogImports,
    HlmSeparatorImports,
    HlmSheetImports,
    HlmSpinnerImports,
    TimeEntriesCalendarToolbarComponent,
    TimeEntriesMonthSummaryComponent,
    TimeEntriesCalendarGridComponent,
    TimeEntriesWeekGridComponent,
    TimeEntriesDayPickerDialogComponent,
    TimeEntrySheetFormComponent,
  ],
  providers: [
    provideIcons({
      lucidePlus,
      lucideLayers,
      lucideCalendar,
      lucideRefreshCw,
      lucideEllipsis,
      lucideMail,
    }),
  ],
  template: `
    <hlm-sheet>
      <section class="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <app-time-entries-calendar-toolbar
          [viewMode]="viewMode()"
          [selectedMonthValue]="selectedMonthValue()"
          [selectedWeekValue]="selectedWeekValue()"
          [todayIso]="todayIso()"
          (previousPeriod)="previousPeriod()"
          (nextPeriod)="nextPeriod()"
          (monthInputChange)="onMonthInputChange($event)"
          (weekInputChange)="onWeekInputChange($event)"
          (addToday)="openAddForDate(todayIso())"
          (refreshRequested)="refreshCurrentPeriod()"
          (emailToRequested)="emailCurrentPeriod()"
          (viewModeChange)="onViewModeChange($event)"
        />

        <div hlmSeparator></div>

        @if (store.error()) {
          <p
            class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {{ store.error() }}
          </p>
        }

        <app-time-entries-month-summary [monthLabel]="periodLabel()" [monthTotalHours]="periodTotalHours()" />

        @if (showLoadingSpinner()) {
          <div class="flex items-center justify-center rounded-lg border border-border p-6">
            <hlm-spinner aria-label="Loading time entries" class="text-muted-foreground"></hlm-spinner>
          </div>
        }

        @if (viewMode() === 'month') {
          <app-time-entries-calendar-grid
            [weekdayLabels]="weekdayLabels"
            [calendarDays]="calendarDays()"
            [entriesForDate]="entriesForDateFn"
            [dayTotal]="dayTotalFn"
            [entryClientAccent]="entryClientAccentFn"
            [entryAccentsForDate]="entryAccentsForDateFn"
            [entryInvoicedSummary]="entryInvoicedSummaryFn"
            [formatDayHeading]="formatDayHeadingFn"
            (addForDate)="openAddForDate($event)"
            (emailToRequested)="emailDayEntries($event)"
            (editEntry)="editEntry($event)"
            (openDayEntriesPicker)="openDayEntriesPicker($event)"
          />
        } @else {
          <app-time-entries-week-grid
            [weekDays]="weekDays()"
            [entriesForDate]="entriesForDateFn"
            [dayTotal]="dayTotalFn"
            [entryClientAccent]="entryClientAccentFn"
            [formatDayHeading]="formatDayHeadingFn"
            (addForDate)="openAddForDate($event)"
            (emailToRequested)="emailDayEntries($event)"
            (editEntry)="editEntry($event)"
          />
        }

        <button #sheetOpenButton class="hidden" hlmSheetTrigger side="right" type="button"></button>
        <ng-template hlmSheetPortal>
          <hlm-sheet-content class="w-full border-border/40 sm:max-w-xl">
            <div hlmSheetHeader>
              <h2 hlmSheetTitle>{{ sheetTitle() }}</h2>
            </div>
            <app-time-entry-sheet-form
              [form]="entryForm"
              [isEditing]="isEditing()"
              [isReadOnly]="isEditingLocked()"
              [lockedByInvoiceId]="store.selectedEntry()?.lockedByInvoiceId ?? null"
              [isLoading]="store.isLoading()"
              [isValid]="entryForm.valid && cascadeIsValid()"
              [clientOptions]="clientOptions()"
              [filteredProjectOptions]="filteredProjectOptions()"
              [filteredOrderOptions]="filteredOrderOptions()"
              [selectedClientOption]="selectedClientOption()"
              [selectedProjectOption]="selectedProjectOption()"
              [selectedOrderOption]="selectedOrderOption()"
              [selectedProjectRequiresOrder]="selectedProjectRequiresOrder()"
              [optionToLabel]="optionToLabel"
              [isSameOption]="isSameOption"
              (submitted)="submitEntry()"
              (clientChanged)="onClientChange($event)"
              (projectChanged)="onProjectChange($event)"
              (orderChanged)="onOrderChange($event)"
              (clearRequested)="resetForm(entryForm.controls.date.value || todayIso())"
              (cancelRequested)="cancelSheet()"
              (deleteRequested)="deleteEditingEntry()"
            />
            <button #sheetCloseButton class="hidden" hlmSheetClose type="button"></button>
          </hlm-sheet-content>
        </ng-template>
        <app-time-entries-day-picker-dialog
          [state]="dayPickerDialogState()"
          [ariaLabel]="dayPickerDialogAriaLabel()"
          [pickerDate]="dayEntriesPickerDate()"
          [entries]="dayEntriesPickerDate() ? entriesForDate(dayEntriesPickerDate()!) : []"
          [dayTotal]="dayEntriesPickerDate() ? dayTotal(dayEntriesPickerDate()!) : 0"
          [formatDayHeading]="formatDayHeadingFn"
          [entryClientAccent]="entryClientAccentFn"
          (closed)="closeDayEntriesPicker()"
          (entryPicked)="pickEntryFromDayPicker($event)"
        />
        <hlm-dialog
          [state]="emailClientPickerState()"
          ariaLabel="Choose client for email"
          [ariaModal]="true"
          (closed)="closeEmailClientPicker()"
        >
          <ng-template hlmDialogPortal>
            <hlm-dialog-content
              [showCloseButton]="true"
              class="max-h-[min(70vh,520px)] gap-0 overflow-hidden border-border p-0 shadow-sm sm:max-w-md"
            >
              <hlm-dialog-header class="border-b border-border px-4 pb-3 pe-14 pt-4 text-start">
                <h2 hlmDialogTitle class="text-base">Choose a client</h2>
                <p hlmDialogDescription class="text-xs">
                  This selection contains entries for multiple clients.
                </p>
              </hlm-dialog-header>
              <div class="max-h-[min(55vh,400px)] overflow-y-auto p-2">
                @for (choice of emailClientChoices(); track choice.clientId) {
                  <button
                    hlmBtn
                    variant="outline"
                    type="button"
                    class="mb-2 h-auto w-full justify-start px-3 py-2 text-left last:mb-0"
                    (click)="chooseEmailClient(choice.clientId)"
                  >
                    <span class="flex flex-col items-start text-sm leading-tight">
                      <span class="font-medium">{{ choice.clientName }}</span>
                      <span class="text-xs text-muted-foreground">
                        {{ choice.entryCount }} entries
                        @if (choice.clientEmail) {
                          · {{ choice.clientEmail }}
                        } @else {
                          · no email on client
                        }
                      </span>
                    </span>
                  </button>
                }
              </div>
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
  private readonly clientsStore = inject(ClientsStore);
  private readonly projectsStore = inject(ProjectsStore);
  private readonly ordersStore = inject(OrdersStore);
  private readonly settingsStore = inject(SettingsStore);
  private readonly toast = inject(ToastService);

  @ViewChild('sheetOpenButton', { read: ElementRef })
  private readonly sheetOpenButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('sheetCloseButton', { read: ElementRef })
  private readonly sheetCloseButton?: ElementRef<HTMLButtonElement>;

  protected readonly clientOptions = computed<ClientOption[]>(() =>
    activeLookup(this.clientsStore.clients()).map((client) => ({ id: client.id, label: client.name })),
  );
  protected readonly projectOptions = computed<ProjectOption[]>(() =>
    activeLookup(this.projectsStore.projects()).map((project) => ({
      id: project.id,
      clientId: project.clientId,
      label: `${project.code} - ${project.name}`,
      useOrders: project.useOrders,
    })),
  );
  protected readonly orderOptions = computed<OrderOption[]>(() =>
    activeLookup(this.ordersStore.orders()).map((order) => ({
      id: order.id,
      projectId: order.projectId,
      label: `${order.code} - ${order.title}`,
    })),
  );
  /** When set, a dialog lists every entry for that calendar day (multi-entry days). */
  protected readonly dayEntriesPickerDate = signal<string | null>(null);
  protected readonly dayPickerDialogState = computed(() =>
    this.dayEntriesPickerDate() !== null ? ('open' as const) : ('closed' as const),
  );
  protected readonly dayPickerDialogAriaLabel = computed(() => {
    const d = this.dayEntriesPickerDate();
    return d ? `Entries for ${this.formatDayHeading(d)}` : '';
  });
  protected readonly pendingEmailDraft = signal<PendingEmailDraft | null>(null);
  protected readonly emailClientPickerState = computed(() =>
    this.pendingEmailDraft() ? ('open' as const) : ('closed' as const),
  );
  protected readonly emailClientChoices = computed<EmailClientChoice[]>(() =>
    this.computeEmailClientChoices(this.pendingEmailDraft()?.entries ?? []),
  );
  protected readonly weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  protected readonly viewMode = signal<'month' | 'week'>('month');
  private readonly hasInitialLoadCompleted = signal(false);
  protected readonly showLoadingSpinner = computed(
    () => !this.hasInitialLoadCompleted() && this.store.isLoading(),
  );
  protected readonly selectedWeekStart = signal(this.startOfWeek(new Date()));
  protected readonly entriesForDateFn = (date: string) => this.entriesForDate(date);
  protected readonly dayTotalFn = (date: string) => this.dayTotal(date);
  protected readonly entryClientAccentFn = (entry: { clientId: number; clientAccentColor: string | null }) =>
    this.entryClientAccent(entry);
  protected readonly entryAccentsForDateFn = (date: string) => this.entryAccentsForDate(date);
  protected readonly entryInvoicedSummaryFn = (date: string) => this.entryInvoicedSummary(date);
  protected readonly formatDayHeadingFn = (isoDate: string) => this.formatDayHeading(isoDate);

  protected readonly isEditingLocked = computed(() => {
    const editing = this.store.selectedEntry();
    return editing?.lockedByInvoiceId != null;
  });

  protected readonly sheetTitle = computed(() => {
    if (!this.isEditing()) {
      return 'Add time entry';
    }
    if (this.isEditingLocked()) {
      return 'View time entry';
    }
    return 'Edit time entry';
  });

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
  protected readonly periodLabel = computed(() =>
    this.viewMode() === 'month' ? this.monthLabel() : this.selectedWeekLabel(),
  );
  protected readonly periodTotalHours = computed(() => {
    if (this.viewMode() === 'month') {
      return this.store.monthTotalHours();
    }
    return this.weekDays().reduce((total, day) => total + this.dayTotal(day.date), 0);
  });
  protected readonly selectedWeekValue = computed(() => this.toWeekInputValue(this.selectedWeekStart()));
  protected readonly selectedWeekLabel = computed(() => {
    const weekStart = this.selectedWeekStart();
    const weekNumber = this.isoWeekNumber(weekStart);
    const isoYear = this.isoWeekYear(weekStart);
    return `WK${String(weekNumber).padStart(2, '0')} ${isoYear}`;
  });
  protected readonly weekDays = computed<WeekDay[]>(() => {
    const start = this.selectedWeekStart();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { date: this.toIsoDate(date), dayNumber: date.getDate() };
    });
  });

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
    try {
      await Promise.all([
        this.clientsStore.loadClientsIfNeeded(),
        this.projectsStore.loadProjectsIfNeeded(),
        this.ordersStore.loadOrdersIfNeeded(),
        this.settingsStore.loadSettingsIfNeeded(),
      ]);
      this.viewMode.set(this.settingsStore.preferredTimeEntriesView());
      this.autoSelectSingleCascadeOptions();
      if (this.viewMode() === 'week') {
        await this.store.setSelectedMonth(this.monthAnchorForWeek());
      } else {
        await this.store.loadMonthEntriesIfNeeded();
      }
    } finally {
      this.hasInitialLoadCompleted.set(true);
    }
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

  protected entryInvoicedSummary(date: string): EntryInvoicedSummary {
    const entries = this.entriesForDate(date);
    const invoiced = entries.filter((e) => e.lockedByInvoiceId !== null).length;
    const total = entries.length;
    if (invoiced === 0) {
      return { state: 'none', invoiced, total };
    }
    if (invoiced === total) {
      return { state: 'all', invoiced, total };
    }
    return { state: 'partial', invoiced, total };
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

  protected previousPeriod(): void {
    this.closeDayEntriesPicker();
    if (this.viewMode() === 'month') {
      void this.store.goToPreviousMonth();
      return;
    }
    const current = this.selectedWeekStart();
    const previous = new Date(current);
    previous.setDate(current.getDate() - 7);
    this.selectedWeekStart.set(this.startOfWeek(previous));
    void this.store.setSelectedMonth(this.monthAnchorForWeek());
  }

  protected nextPeriod(): void {
    this.closeDayEntriesPicker();
    if (this.viewMode() === 'month') {
      void this.store.goToNextMonth();
      return;
    }
    const current = this.selectedWeekStart();
    const next = new Date(current);
    next.setDate(current.getDate() + 7);
    this.selectedWeekStart.set(this.startOfWeek(next));
    void this.store.setSelectedMonth(this.monthAnchorForWeek());
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

  protected onWeekInputChange(event: Event): void {
    this.closeDayEntriesPicker();
    const value = (event.target as HTMLInputElement).value;
    const parsed = this.fromWeekInputValue(value);
    if (!parsed) {
      return;
    }
    this.selectedWeekStart.set(parsed);
    void this.store.setSelectedMonth(this.monthAnchorForWeek());
  }

  protected onViewModeChange(mode: 'month' | 'week'): void {
    this.viewMode.set(mode);
    void this.settingsStore.savePreferredTimeEntriesView(mode);
    this.closeDayEntriesPicker();
    if (mode === 'week') {
      const monthAnchor = this.store.selectedMonth();
      this.selectedWeekStart.set(this.startOfWeek(monthAnchor));
      void this.store.setSelectedMonth(this.monthAnchorForWeek());
    }
  }

  protected async refreshCurrentPeriod(): Promise<void> {
    await Promise.all([
      this.clientsStore.loadClients(),
      this.projectsStore.loadProjects(),
      this.ordersStore.loadOrders(),
      this.settingsStore.loadSettings(),
    ]);
    if (this.viewMode() === 'week') {
      await this.store.setSelectedMonth(this.monthAnchorForWeek());
    } else {
      const month = this.store.selectedMonth();
      await this.store.loadMonthEntries(month.getFullYear(), month.getMonth());
    }
    if (!this.store.error()) {
      this.toast.show('Time entries refreshed.', 'success');
    }
  }

  protected emailDayEntries(date: string): void {
    const entries = this.entriesForDate(date);
    this.openEmailDraft(entries, `Time entries - ${this.formatDayHeading(date)}`, false);
  }

  protected emailCurrentPeriod(): void {
    const entries = this.entriesForCurrentPeriod();
    this.openEmailDraft(entries, `Time entries - ${this.periodLabel()}`, true);
  }

  protected closeEmailClientPicker(): void {
    this.pendingEmailDraft.set(null);
  }

  protected chooseEmailClient(clientId: number): void {
    const pending = this.pendingEmailDraft();
    if (!pending) {
      return;
    }
    const selectedEntries = pending.entries.filter((entry) => entry.clientId === clientId);
    this.pendingEmailDraft.set(null);
    this.launchEmailDraft(selectedEntries, pending.subject, pending.includeDate);
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
    if (this.isEditingLocked()) {
      return;
    }
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
    if (this.isEditingLocked()) {
      return;
    }
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
    this.autoSelectSingleCascadeOptions();
  }

  protected onProjectChange(option: ProjectOption | null): void {
    this.entryForm.controls.projectId.setValue(option?.id ?? null);
    this.entryForm.controls.orderId.setValue(null);
    this.autoSelectSingleCascadeOptions();
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
    this.autoSelectSingleCascadeOptions();
  }

  protected cancelSheet(): void {
    this.store.closeSheet();
    this.resetForm(this.todayIso());
    this.closeSheet();
  }

  protected todayIso(): string {
    return this.toIsoDate(new Date());
  }

  private entriesForCurrentPeriod(): Array<ReturnType<typeof this.store.entries>[number]> {
    if (this.viewMode() === 'month') {
      return this.store.entries();
    }
    return this.weekDays().flatMap((day) => this.entriesForDate(day.date));
  }

  private openEmailDraft(
    entries: Array<ReturnType<typeof this.store.entries>[number]>,
    subject: string,
    includeDate: boolean,
  ): void {
    if (entries.length === 0) {
      this.toast.show('No time entries available for email.', 'info');
      return;
    }

    const clientChoices = this.computeEmailClientChoices(entries);
    if (clientChoices.length > 1) {
      this.pendingEmailDraft.set({ entries, subject, includeDate });
      return;
    }

    this.launchEmailDraft(entries, subject, includeDate);
  }

  private launchEmailDraft(
    entries: Array<ReturnType<typeof this.store.entries>[number]>,
    subject: string,
    includeDate: boolean,
  ): void {
    const to = entries[0]?.clientEmail?.trim() ?? '';
    const body = this.buildEmailBody(entries, includeDate);
    const toPart = to ? encodeURIComponent(to) : '';
    const url = `mailto:${toPart}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  private computeEmailClientChoices(
    entries: Array<ReturnType<typeof this.store.entries>[number]>,
  ): EmailClientChoice[] {
    const byClient = new Map<number, EmailClientChoice>();
    for (const entry of entries) {
      const existing = byClient.get(entry.clientId);
      const normalizedEmail = entry.clientEmail?.trim() || null;
      if (!existing) {
        byClient.set(entry.clientId, {
          clientId: entry.clientId,
          clientName: entry.clientName,
          clientEmail: normalizedEmail,
          entryCount: 1,
        });
        continue;
      }
      existing.entryCount += 1;
      if (!existing.clientEmail && normalizedEmail) {
        existing.clientEmail = normalizedEmail;
      }
    }
    return [...byClient.values()].sort((left, right) => left.clientName.localeCompare(right.clientName));
  }

  private buildEmailBody(
    entries: Array<ReturnType<typeof this.store.entries>[number]>,
    includeDate: boolean,
  ): string {
    const sorted = [...entries].sort((left, right) => left.date.localeCompare(right.date) || left.id - right.id);
    return sorted
      .map((entry, index) => {
        const lines = [
          `Entry ${index + 1}`,
          ...(includeDate ? [`- Date: ${this.formatDayHeading(entry.date)}`] : []),
          `- Project code: ${entry.projectCode}`,
          `- Project name: ${entry.projectName}`,
          ...(entry.orderCode ? [`- Order code: ${entry.orderCode}`] : []),
          ...(entry.orderName ? [`- Order name: ${entry.orderName}`] : []),
          `- Hours: ${entry.hours.toFixed(2)}`,
          ...(entry.description.trim() ? [`- Description: ${entry.description.trim()}`] : []),
        ];
        return lines.join('\n');
      })
      .join('\n\n');
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

  private monthAnchorForWeek(): Date {
    const weekStart = this.selectedWeekStart();
    return new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
  }

  private startOfWeek(date: Date): Date {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOfWeek = (next.getDay() + 6) % 7;
    next.setDate(next.getDate() - dayOfWeek);
    return next;
  }

  private toWeekInputValue(date: Date): string {
    const isoYear = this.isoWeekYear(date);
    const week = this.isoWeekNumber(date);
    return `${isoYear}-W${String(week).padStart(2, '0')}`;
  }

  private fromWeekInputValue(value: string): Date | null {
    const match = /^(\d{4})-W(\d{2})$/.exec(value);
    if (!match) {
      return null;
    }
    const year = Number(match[1]);
    const week = Number(match[2]);
    if (!Number.isFinite(year) || !Number.isFinite(week) || week < 1 || week > 53) {
      return null;
    }
    const jan4 = new Date(year, 0, 4);
    const week1Start = this.startOfWeek(jan4);
    const result = new Date(week1Start);
    result.setDate(week1Start.getDate() + (week - 1) * 7);
    return result;
  }

  private isoWeekYear(date: Date): number {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    return d.getFullYear();
  }

  private isoWeekNumber(date: Date): number {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const firstThursday = new Date(d.getFullYear(), 0, 4);
    const firstThursdayAdjusted = new Date(firstThursday);
    firstThursdayAdjusted.setDate(
      firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7),
    );
    const diffMs = d.getTime() - firstThursdayAdjusted.getTime();
    return 1 + Math.round(diffMs / 604800000);
  }

  private autoSelectSingleCascadeOptions(): void {
    if (this.clientOptions().length === 1) {
      this.entryForm.controls.clientId.setValue(this.clientOptions()[0]?.id ?? null);
    }

    const currentClientId = this.entryForm.controls.clientId.value;
    const projects = currentClientId === null
      ? []
      : this.projectOptions().filter((project) => project.clientId === currentClientId);
    if (projects.length === 1) {
      this.entryForm.controls.projectId.setValue(projects[0]?.id ?? null);
    }

    const currentProjectId = this.entryForm.controls.projectId.value;
    const selectedProject = this.projectOptions().find((project) => project.id === currentProjectId);
    if (!selectedProject?.useOrders) {
      this.entryForm.controls.orderId.setValue(null);
      return;
    }

    const orders = this.orderOptions().filter((order) => order.projectId === selectedProject.id);
    if (orders.length === 1) {
      this.entryForm.controls.orderId.setValue(orders[0]?.id ?? null);
    }
  }
}
