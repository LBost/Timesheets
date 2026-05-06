import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ClientsStore } from '../../clients/state/clients.store';
import { OrdersStore } from '../../orders/state/orders.store';
import { ProjectsStore } from '../../projects/state/projects.store';
import { SettingsStore } from '../../settings/state/settings.store';
import { TimeEntriesStore } from '../state/time-entries.store';
import { TimeEntriesPage } from './time-entries.page';

describe('TimeEntriesPage', () => {
  const storeMock = {
    entries: vi.fn(),
    entriesByDate: vi.fn(),
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

  beforeEach(async () => {
    storeMock.entries.mockReturnValue([]);
    storeMock.entriesByDate.mockReturnValue({});
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
      ],
    }).compileComponents();
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
});
