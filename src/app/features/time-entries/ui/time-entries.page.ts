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
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { ToastService } from '../../../core/feedback/toast.service';
import { activeLookup } from '../../../shared/components/combobox-selection/combobox-selection.util';
import { resolveClientAccentHex } from '../../../shared/components/client-accent/client-accent.util';
import { ClientsRepository } from '../../clients/data/clients.repository';
import { OrdersRepository } from '../../orders/data/orders.repository';
import { ProjectsRepository } from '../../projects/data/projects.repository';
import { TimeEntryCreateInput, TimeEntryUpdateInput } from '../models/time-entry.model';
import { TimeEntriesStore } from '../state/time-entries.store';
import { provideIcons } from '@ng-icons/core';
import { lucideLayers, lucidePlus } from '@ng-icons/lucide';
import { TimeEntriesCalendarToolbarComponent } from './components/time-entries-calendar-toolbar.component';
import { TimeEntriesMonthSummaryComponent } from './components/time-entries-month-summary.component';
import { TimeEntriesCalendarGridComponent } from './components/time-entries-calendar-grid.component';
import { TimeEntriesDayPickerDialogComponent } from './components/time-entries-day-picker-dialog.component';
import { TimeEntrySheetFormComponent } from './components/time-entry-sheet-form.component';

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
    HlmSeparatorImports,
    HlmSheetImports,
    HlmSkeletonImports,
    TimeEntriesCalendarToolbarComponent,
    TimeEntriesMonthSummaryComponent,
    TimeEntriesCalendarGridComponent,
    TimeEntriesDayPickerDialogComponent,
    TimeEntrySheetFormComponent,
  ],
  providers: [provideIcons({ lucidePlus, lucideLayers })],
  template: `
    <hlm-sheet>
      <section class="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <app-time-entries-calendar-toolbar
          [selectedMonthValue]="selectedMonthValue()"
          [todayIso]="todayIso()"
          (previousMonth)="previousMonth()"
          (nextMonth)="nextMonth()"
          (monthInputChange)="onMonthInputChange($event)"
          (addToday)="openAddForDate(todayIso())"
        />

        <div hlmSeparator></div>

        @if (store.error()) {
          <p
            class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {{ store.error() }}
          </p>
        }

        <app-time-entries-month-summary [monthLabel]="monthLabel()" [monthTotalHours]="store.monthTotalHours()" />

        @if (store.isLoading()) {
          <div class="grid gap-2 rounded-lg border border-border p-4">
            <div hlmSkeleton class="h-5 w-1/4"></div>
            <div hlmSkeleton class="h-4 w-full"></div>
            <div hlmSkeleton class="h-4 w-full"></div>
          </div>
        }

        <app-time-entries-calendar-grid
          [weekdayLabels]="weekdayLabels"
          [calendarDays]="calendarDays()"
          [entriesForDate]="entriesForDateFn"
          [dayTotal]="dayTotalFn"
          [entryClientAccent]="entryClientAccentFn"
          [entryAccentsForDate]="entryAccentsForDateFn"
          [formatDayHeading]="formatDayHeadingFn"
          (addForDate)="openAddForDate($event)"
          (editEntry)="editEntry($event)"
          (openDayEntriesPicker)="openDayEntriesPicker($event)"
        />

        <button #sheetOpenButton class="hidden" hlmSheetTrigger side="right" type="button"></button>
        <ng-template hlmSheetPortal>
          <hlm-sheet-content class="w-full border-border/40 sm:max-w-xl">
            <div hlmSheetHeader>
              <h2 hlmSheetTitle>{{ isEditing() ? 'Edit time entry' : 'Add time entry' }}</h2>
            </div>
            <app-time-entry-sheet-form
              [form]="entryForm"
              [isEditing]="isEditing()"
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
  protected readonly entriesForDateFn = (date: string) => this.entriesForDate(date);
  protected readonly dayTotalFn = (date: string) => this.dayTotal(date);
  protected readonly entryClientAccentFn = (entry: { clientId: number; clientAccentColor: string | null }) =>
    this.entryClientAccent(entry);
  protected readonly entryAccentsForDateFn = (date: string) => this.entryAccentsForDate(date);
  protected readonly formatDayHeadingFn = (isoDate: string) => this.formatDayHeading(isoDate);

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
