import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ToastService } from '../../../core/feedback/toast.service';
import { ClientsStore } from '../../clients/state/clients.store';
import { OrdersStore } from '../../orders/state/orders.store';
import { ProjectsStore } from '../../projects/state/projects.store';
import { SettingsStore } from '../../settings/state/settings.store';
import { ActivityLogWriter } from '../../activity-logs/data/activity-log.writer';
import { TimeEntriesStore } from '../state/time-entries.store';
import { TimeEntriesPage } from './time-entries.page';

describe('TimeEntriesPage', () => {
  const storeMock = {
    entries: vi.fn(),
    entriesByDate: vi.fn(),
    selectedEntry: vi.fn(),
    dayTotals: vi.fn(),
    monthTotalHours: vi.fn(),
    selectedMonth: vi.fn(),
    selectedDate: vi.fn(),
    editingEntryId: vi.fn(),
    isSheetOpen: vi.fn(),
    isLoading: vi.fn(),
    error: vi.fn(),
    loadMonthEntries: vi.fn(),
    loadMonthEntriesIfNeeded: vi.fn(),
    goToPreviousMonth: vi.fn(),
    goToNextMonth: vi.fn(),
    setSelectedMonth: vi.fn(),
    openAddForDate: vi.fn(),
    openEdit: vi.fn(),
    closeSheet: vi.fn(),
    createEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
  };

  const clientsStoreMock = {
    clients: vi.fn(),
    loadClients: vi.fn(),
    loadClientsIfNeeded: vi.fn(),
  };
  const projectsStoreMock = {
    projects: vi.fn(),
    loadProjects: vi.fn(),
    loadProjectsIfNeeded: vi.fn(),
  };
  const ordersStoreMock = {
    orders: vi.fn(),
    loadOrders: vi.fn(),
    loadOrdersIfNeeded: vi.fn(),
  };
  const settingsStoreMock = {
    preferredTimeEntriesView: vi.fn(),
    loadSettings: vi.fn(),
    loadSettingsIfNeeded: vi.fn(),
    savePreferredTimeEntriesView: vi.fn(),
  };

  const toastMock = {
    show: vi.fn(),
  };

  const activityLogWriter = {
    logEmailDraftOpened: vi.fn(),
  };

  beforeEach(async () => {
    storeMock.entries.mockReturnValue([]);
    storeMock.entriesByDate.mockReturnValue({});
    storeMock.selectedEntry.mockReturnValue(null);
    storeMock.dayTotals.mockReturnValue({});
    storeMock.monthTotalHours.mockReturnValue(0);
    storeMock.selectedMonth.mockReturnValue(new Date(2026, 4, 1));
    storeMock.selectedDate.mockReturnValue(null);
    storeMock.editingEntryId.mockReturnValue(null);
    storeMock.isSheetOpen.mockReturnValue(false);
    storeMock.isLoading.mockReturnValue(false);
    storeMock.error.mockReturnValue(null);
    storeMock.loadMonthEntries.mockResolvedValue(undefined);
    storeMock.loadMonthEntriesIfNeeded.mockResolvedValue(undefined);
    storeMock.goToPreviousMonth.mockResolvedValue(undefined);
    storeMock.goToNextMonth.mockResolvedValue(undefined);
    storeMock.setSelectedMonth.mockResolvedValue(undefined);
    storeMock.createEntry.mockResolvedValue(undefined);
    storeMock.updateEntry.mockResolvedValue(undefined);
    storeMock.deleteEntry.mockResolvedValue(undefined);

    clientsStoreMock.clients.mockReturnValue([]);
    clientsStoreMock.loadClients.mockResolvedValue(undefined);
    clientsStoreMock.loadClientsIfNeeded.mockResolvedValue(undefined);
    projectsStoreMock.projects.mockReturnValue([]);
    projectsStoreMock.loadProjects.mockResolvedValue(undefined);
    projectsStoreMock.loadProjectsIfNeeded.mockResolvedValue(undefined);
    ordersStoreMock.orders.mockReturnValue([]);
    ordersStoreMock.loadOrders.mockResolvedValue(undefined);
    ordersStoreMock.loadOrdersIfNeeded.mockResolvedValue(undefined);
    settingsStoreMock.preferredTimeEntriesView.mockReturnValue('month');
    settingsStoreMock.loadSettings.mockResolvedValue(undefined);
    settingsStoreMock.loadSettingsIfNeeded.mockResolvedValue(undefined);
    settingsStoreMock.savePreferredTimeEntriesView.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [TimeEntriesPage],
      providers: [
        { provide: TimeEntriesStore, useValue: storeMock },
        { provide: ClientsStore, useValue: clientsStoreMock },
        { provide: ProjectsStore, useValue: projectsStoreMock },
        { provide: OrdersStore, useValue: ordersStoreMock },
        { provide: SettingsStore, useValue: settingsStoreMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ActivityLogWriter, useValue: activityLogWriter },
      ],
    }).compileComponents();
    vi.clearAllMocks();
  });

  it('creates the page', () => {
    const fixture = TestBed.createComponent(TimeEntriesPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads option sources and month entries on init', async () => {
    const fixture = TestBed.createComponent(TimeEntriesPage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(clientsStoreMock.loadClientsIfNeeded).toHaveBeenCalled();
    expect(projectsStoreMock.loadProjectsIfNeeded).toHaveBeenCalled();
    expect(ordersStoreMock.loadOrdersIfNeeded).toHaveBeenCalled();
    expect(settingsStoreMock.loadSettingsIfNeeded).toHaveBeenCalled();
  });

  it('entryInvoicedSummary reports none, partial, and all states', () => {
    const fixture = TestBed.createComponent(TimeEntriesPage);
    const page = fixture.componentInstance as TimeEntriesPage & {
      entryInvoicedSummary: (d: string) => { state: string };
    };

    storeMock.entriesByDate.mockReturnValue({
      '2026-05-01': [
        {
          id: 1,
          lockedByInvoiceId: null,
        },
      ],
    } as any);
    expect(page.entryInvoicedSummary('2026-05-01').state).toBe('none');

    storeMock.entriesByDate.mockReturnValue({
      '2026-05-02': [
        { id: 1, lockedByInvoiceId: 9 },
        { id: 2, lockedByInvoiceId: null },
      ],
    } as any);
    expect(page.entryInvoicedSummary('2026-05-02').state).toBe('partial');

    storeMock.entriesByDate.mockReturnValue({
      '2026-05-03': [
        { id: 1, lockedByInvoiceId: 9 },
        { id: 2, lockedByInvoiceId: 8 },
      ],
    } as any);
    expect(page.entryInvoicedSummary('2026-05-03').state).toBe('all');
  });

  it('does not call update or delete store methods when entry is invoice-locked', async () => {
    storeMock.editingEntryId.mockReturnValue(1);
    storeMock.selectedEntry.mockReturnValue({
      id: 1,
      lockedByInvoiceId: 42,
      clientId: 1,
      projectId: 1,
      orderId: null,
      date: '2026-05-04',
      hours: 4,
      description: '',
      lockedAt: new Date(),
      createdAt: new Date(),
      clientName: 'C',
      clientEmail: 'c@example.com',
      clientAccentColor: null,
      projectCode: 'P',
      projectName: 'N',
      orderCode: null,
      orderName: null,
    } as any);

    const fixture = TestBed.createComponent(TimeEntriesPage);
    const page = fixture.componentInstance as TimeEntriesPage & {
      submitEntry: () => Promise<void>;
      deleteEditingEntry: () => Promise<void>;
    };

    fixture.detectChanges();
    await page.submitEntry();
    await page.deleteEditingEntry();

    expect(storeMock.updateEntry).not.toHaveBeenCalled();
    expect(storeMock.deleteEntry).not.toHaveBeenCalled();
  });

  it('computeEmailClientChoices groups entries by client', () => {
    const fixture = TestBed.createComponent(TimeEntriesPage);
    const page = fixture.componentInstance as any;

    expect(
      page.computeEmailClientChoices([
        { clientId: 2, clientName: 'Beta', clientEmail: null },
        { clientId: 1, clientName: 'Acme', clientEmail: 'acme@example.com' },
        { clientId: 1, clientName: 'Acme', clientEmail: null },
      ]),
    ).toEqual([
      { clientId: 1, clientName: 'Acme', clientEmail: 'acme@example.com', entryCount: 2 },
      { clientId: 2, clientName: 'Beta', clientEmail: null, entryCount: 1 },
    ]);
  });

  it('buildEmailBody includes date for aggregated email and omits empty optional fields', () => {
    const fixture = TestBed.createComponent(TimeEntriesPage);
    const page = fixture.componentInstance as any;

    const body = page.buildEmailBody(
      [
        {
          id: 1,
          date: '2026-05-05',
          projectCode: 'PRJ',
          projectName: 'Project',
          orderCode: null,
          orderName: null,
          hours: 2,
          description: '',
        },
      ],
      true,
    );

    expect(body).toContain('- Date:');
    expect(body).toContain('- Project code: PRJ');
    expect(body).toContain('- Project name: Project');
    expect(body).toContain('- Hours: 2.00');
    expect(body).not.toContain('- Order code:');
    expect(body).not.toContain('- Description:');
  });

  it('emails day entries with day subject and no date line in rows', () => {
    const fixture = TestBed.createComponent(TimeEntriesPage);
    const page = fixture.componentInstance as any;

    const openEmailDraftSpy = vi.spyOn(page as any, 'openEmailDraft').mockImplementation(() => undefined);
    storeMock.entriesByDate.mockReturnValue({
      '2026-05-07': [
        {
          id: 1,
          date: '2026-05-07',
          clientEmail: 'team@example.com',
          projectCode: 'PRJ',
          projectName: 'Project',
          orderCode: null,
          orderName: null,
          hours: 2,
          description: '',
        },
      ],
    } as any);

    page.emailDayEntries('2026-05-07');

    expect(openEmailDraftSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 1 })]),
      expect.stringContaining('Time entries -'),
      false,
    );
  });

  it('emails current period and includes date line when in week view', () => {
    const fixture = TestBed.createComponent(TimeEntriesPage);
    const page = fixture.componentInstance as any;

    const openEmailDraftSpy = vi.spyOn(page as any, 'openEmailDraft').mockImplementation(() => undefined);
    page.viewMode.set('week');
    page.selectedWeekStart.set(new Date(2026, 4, 4));
    storeMock.entriesByDate.mockReturnValue({
      '2026-05-04': [
        {
          id: 10,
          date: '2026-05-04',
          clientEmail: 'team@example.com',
          projectCode: 'PRJ',
          projectName: 'Project',
          orderCode: null,
          orderName: null,
          hours: 8,
          description: 'Work',
        },
      ],
    } as any);

    page.emailCurrentPeriod();

    expect(openEmailDraftSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 10 })]),
      expect.stringContaining('Time entries - WK'),
      true,
    );
  });

  it('asks client selection before drafting when multiple clients are present', () => {
    const fixture = TestBed.createComponent(TimeEntriesPage);
    const page = fixture.componentInstance as any;
    const launchSpy = vi.spyOn(page as any, 'launchEmailDraft').mockImplementation(() => undefined);

    page.openEmailDraft(
      [
        { id: 1, clientId: 1, clientName: 'Acme', clientEmail: 'acme@example.com' },
        { id: 2, clientId: 2, clientName: 'Beta', clientEmail: 'beta@example.com' },
      ],
      'Time entries - Test',
      false,
    );

    expect(page.pendingEmailDraft()).toBeTruthy();
    expect(launchSpy).not.toHaveBeenCalled();
  });

  it('continues draft with selected client entries after picker selection', () => {
    const fixture = TestBed.createComponent(TimeEntriesPage);
    const page = fixture.componentInstance as any;
    const launchSpy = vi.spyOn(page as any, 'launchEmailDraft').mockImplementation(() => undefined);

    page.pendingEmailDraft.set({
      entries: [
        { id: 1, clientId: 1, clientName: 'Acme', clientEmail: 'acme@example.com' },
        { id: 2, clientId: 2, clientName: 'Beta', clientEmail: 'beta@example.com' },
      ],
      subject: 'Time entries - Test',
      includeDate: true,
    });

    page.chooseEmailClient(2);

    expect(launchSpy).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 2, clientId: 2 })],
      'Time entries - Test',
      true,
    );
    expect(page.pendingEmailDraft()).toBeNull();
  });

  it('logs activity when email draft is launched', () => {
    const fixture = TestBed.createComponent(TimeEntriesPage);
    const page = fixture.componentInstance as any;

    page.launchEmailDraft(
      [
        {
          id: 1,
          clientId: 1,
          clientName: 'Acme',
          clientEmail: 'acme@example.com',
          projectCode: 'PRJ',
          projectName: 'Project',
          orderCode: null,
          orderName: null,
          date: '2026-05-07',
          hours: 2,
          description: '',
        },
      ],
      'Time entries - Test',
      true,
    );

    expect(activityLogWriter.logEmailDraftOpened).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 1,
        clientName: 'Acme',
        entryCount: 1,
        subject: 'Time entries - Test',
        scope: 'period',
      }),
    );
  });
});
