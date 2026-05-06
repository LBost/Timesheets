import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { TimeEntryCreateInput, TimeEntryUpdateInput } from '../models/time-entry.model';
import { TimeEntryVM } from '../models/time-entry.vm';
import { TimeEntriesRepository } from '../data/time-entries.repository';

type TimeEntriesState = {
  entries: TimeEntryVM[];
  selectedMonth: Date;
  selectedDate: string | null;
  editingEntryId: number | null;
  isSheetOpen: boolean;
  isLoading: boolean;
  hasLoaded: boolean;
  lastLoadedAt: number | null;
  error: string | null;
};

const now = new Date();

const initialState: TimeEntriesState = {
  entries: [],
  selectedMonth: new Date(now.getFullYear(), now.getMonth(), 1),
  selectedDate: null,
  editingEntryId: null,
  isSheetOpen: false,
  isLoading: false,
  hasLoaded: false,
  lastLoadedAt: null,
  error: null,
};

export const TimeEntriesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    selectedEntry: computed(
      () => store.entries().find((entry) => entry.id === store.editingEntryId()) ?? null,
    ),
    entriesByDate: computed(() =>
      store.entries().reduce<Record<string, TimeEntryVM[]>>((acc, entry) => {
        const current = acc[entry.date] ?? [];
        acc[entry.date] = [...current, entry];
        return acc;
      }, {}),
    ),
    dayTotals: computed(() =>
      store.entries().reduce<Record<string, number>>((acc, entry) => {
        acc[entry.date] = (acc[entry.date] ?? 0) + entry.hours;
        return acc;
      }, {}),
    ),
    monthTotalHours: computed(() =>
      store.entries().reduce((total, entry) => total + entry.hours, 0),
    ),
  })),
  withMethods((store, repository = inject(TimeEntriesRepository)) => {
    const loadMonthEntries = async (
      year = store.selectedMonth().getFullYear(),
      month = store.selectedMonth().getMonth(),
    ): Promise<void> => {
      patchState(store, { isLoading: true, error: null });
      try {
        const entries = await repository.listEntriesForMonth(year, month);
        patchState(store, { entries, isLoading: false, hasLoaded: true, lastLoadedAt: Date.now() });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load time entries.',
        });
      }
    };

    return {
    async loadMonthEntries(year = store.selectedMonth().getFullYear(), month = store.selectedMonth().getMonth()): Promise<void> {
      await loadMonthEntries(year, month);
    },
    async loadMonthEntriesIfNeeded(
      year = store.selectedMonth().getFullYear(),
      month = store.selectedMonth().getMonth(),
    ): Promise<void> {
      if (store.hasLoaded()) {
        return;
      }
      await loadMonthEntries(year, month);
    },
    async goToPreviousMonth(): Promise<void> {
      const current = store.selectedMonth();
      const next = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      patchState(store, { selectedMonth: next, isLoading: true, error: null });
      try {
        const entries = await repository.listEntriesForMonth(next.getFullYear(), next.getMonth());
        patchState(store, { entries, isLoading: false, hasLoaded: true, lastLoadedAt: Date.now() });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load time entries.',
        });
      }
    },
    async goToNextMonth(): Promise<void> {
      const current = store.selectedMonth();
      const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      patchState(store, { selectedMonth: next, isLoading: true, error: null });
      try {
        const entries = await repository.listEntriesForMonth(next.getFullYear(), next.getMonth());
        patchState(store, { entries, isLoading: false, hasLoaded: true, lastLoadedAt: Date.now() });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load time entries.',
        });
      }
    },
    async setSelectedMonth(month: Date): Promise<void> {
      const normalized = new Date(month.getFullYear(), month.getMonth(), 1);
      patchState(store, { selectedMonth: normalized, isLoading: true, error: null });
      try {
        const entries = await repository.listEntriesForMonth(
          normalized.getFullYear(),
          normalized.getMonth(),
        );
        patchState(store, { entries, isLoading: false, hasLoaded: true, lastLoadedAt: Date.now() });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load time entries.',
        });
      }
    },
    openAddForDate(date: string): void {
      patchState(store, {
        selectedDate: date,
        editingEntryId: null,
        isSheetOpen: true,
        error: null,
      });
    },
    openEdit(entryId: number): void {
      const entry = store.entries().find((item) => item.id === entryId);
      patchState(store, {
        editingEntryId: entryId,
        selectedDate: entry?.date ?? null,
        isSheetOpen: true,
        error: null,
      });
    },
    closeSheet(): void {
      patchState(store, { isSheetOpen: false, editingEntryId: null, selectedDate: null, error: null });
    },
    async createEntry(input: TimeEntryCreateInput): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        await repository.createEntry(input);
        const month = store.selectedMonth();
        const entries = await repository.listEntriesForMonth(month.getFullYear(), month.getMonth());
        patchState(store, { entries, isLoading: false, hasLoaded: true, lastLoadedAt: Date.now() });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to create entry.',
        });
      }
    },
    async updateEntry(id: number, input: TimeEntryUpdateInput): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const updated = await repository.updateEntry(id, input);
        if (!updated) {
          patchState(store, { isLoading: false, error: 'Time entry not found.' });
          return;
        }
        const month = store.selectedMonth();
        const entries = await repository.listEntriesForMonth(month.getFullYear(), month.getMonth());
        patchState(store, { entries, isLoading: false, hasLoaded: true, lastLoadedAt: Date.now() });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to update entry.',
        });
      }
    },
    async deleteEntry(id: number): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const deleted = await repository.deleteEntry(id);
        if (!deleted) {
          patchState(store, { isLoading: false, error: 'Time entry not found.' });
          return;
        }
        patchState(store, (state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
          isLoading: false,
        }));
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to delete entry.',
        });
      }
    },
  };
  }),
);
