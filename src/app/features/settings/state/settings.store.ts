import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { SettingsRepository } from '../data/settings.repository';

type SettingsState = {
  nextInvoiceNumber: string;
  preferredTimeEntriesView: 'month' | 'week';
  isLoading: boolean;
  isSaving: boolean;
  hasLoaded: boolean;
  lastLoadedAt: number | null;
  error: string | null;
};

const initialState: SettingsState = {
  nextInvoiceNumber: '',
  preferredTimeEntriesView: 'month',
  isLoading: false,
  isSaving: false,
  hasLoaded: false,
  lastLoadedAt: null,
  error: null,
};

export const SettingsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, repository = inject(SettingsRepository)) => {
    const loadSettings = async (): Promise<void> => {
      patchState(store, { isLoading: true, error: null });
      try {
        const settings = await repository.getSettings();
        patchState(store, {
          nextInvoiceNumber: settings.nextInvoiceNumber,
          preferredTimeEntriesView: settings.preferredTimeEntriesView,
          isLoading: false,
          hasLoaded: true,
          lastLoadedAt: Date.now(),
        });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load settings.',
        });
      }
    };

    const saveSettings = async (
      nextInvoiceNumber: string,
      preferredTimeEntriesView: 'month' | 'week',
    ): Promise<boolean> => {
      patchState(store, { isSaving: true, error: null });
      try {
        const settings = await repository.saveSettings({ nextInvoiceNumber, preferredTimeEntriesView });
        patchState(store, {
          nextInvoiceNumber: settings.nextInvoiceNumber,
          preferredTimeEntriesView: settings.preferredTimeEntriesView,
          isSaving: false,
          hasLoaded: true,
          lastLoadedAt: Date.now(),
        });
        return true;
      } catch (error) {
        patchState(store, {
          isSaving: false,
          error: error instanceof Error ? error.message : 'Failed to save settings.',
        });
        return false;
      }
    };

    return {
      async loadSettings(): Promise<void> {
        await loadSettings();
      },
      async loadSettingsIfNeeded(): Promise<void> {
        if (store.hasLoaded()) {
          return;
        }
        await loadSettings();
      },
      async saveSettings(
        nextInvoiceNumber: string,
        preferredTimeEntriesView: 'month' | 'week',
      ): Promise<boolean> {
        return saveSettings(nextInvoiceNumber, preferredTimeEntriesView);
      },
      async savePreferredTimeEntriesView(preferredTimeEntriesView: 'month' | 'week'): Promise<boolean> {
        return saveSettings(store.nextInvoiceNumber(), preferredTimeEntriesView);
      },
    };
  }),
);
