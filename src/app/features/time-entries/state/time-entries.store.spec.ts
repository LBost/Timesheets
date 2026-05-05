import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TimeEntriesRepository } from '../data/time-entries.repository';
import { TimeEntriesStore } from './time-entries.store';

describe('TimeEntriesStore', () => {
  const repositoryMock = {
    listEntriesForMonth: vi.fn(),
    createEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
  };

  beforeEach(() => {
    repositoryMock.listEntriesForMonth.mockResolvedValue([]);
    repositoryMock.createEntry.mockResolvedValue({});
    repositoryMock.updateEntry.mockResolvedValue({});
    repositoryMock.deleteEntry.mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        TimeEntriesStore,
        { provide: TimeEntriesRepository, useValue: repositoryMock },
      ],
    });
  });

  it('loads month entries', async () => {
    const store = TestBed.inject(TimeEntriesStore);
    await store.loadMonthEntries(2026, 4);
    expect(repositoryMock.listEntriesForMonth).toHaveBeenCalledWith(2026, 4);
  });

  it('opens add sheet for date', () => {
    const store = TestBed.inject(TimeEntriesStore);
    store.openAddForDate('2026-05-01');
    expect(store.isSheetOpen()).toBe(true);
    expect(store.selectedDate()).toBe('2026-05-01');
  });
});
