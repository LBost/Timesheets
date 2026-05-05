import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ClientsRepository } from '../../clients/data/clients.repository';
import { OrdersRepository } from '../../orders/data/orders.repository';
import { ProjectsRepository } from '../../projects/data/projects.repository';
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

  const clientsRepositoryMock = { listClients: vi.fn() };
  const projectsRepositoryMock = { listProjects: vi.fn() };
  const ordersRepositoryMock = { listOrders: vi.fn() };

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
    storeMock.goToPreviousMonth.mockResolvedValue(undefined);
    storeMock.goToNextMonth.mockResolvedValue(undefined);
    storeMock.setSelectedMonth.mockResolvedValue(undefined);
    storeMock.createEntry.mockResolvedValue(undefined);
    storeMock.updateEntry.mockResolvedValue(undefined);
    storeMock.deleteEntry.mockResolvedValue(undefined);

    clientsRepositoryMock.listClients.mockResolvedValue([]);
    projectsRepositoryMock.listProjects.mockResolvedValue([]);
    ordersRepositoryMock.listOrders.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [TimeEntriesPage],
      providers: [
        { provide: TimeEntriesStore, useValue: storeMock },
        { provide: ClientsRepository, useValue: clientsRepositoryMock },
        { provide: ProjectsRepository, useValue: projectsRepositoryMock },
        { provide: OrdersRepository, useValue: ordersRepositoryMock },
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

    expect(clientsRepositoryMock.listClients).toHaveBeenCalled();
    expect(projectsRepositoryMock.listProjects).toHaveBeenCalled();
    expect(ordersRepositoryMock.listOrders).toHaveBeenCalled();
  });
});
