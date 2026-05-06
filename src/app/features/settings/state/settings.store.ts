import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { SettingsRepository } from '../data/settings.repository';

type SettingsState = {
  nextInvoiceNumber: string;
  preferredTimeEntriesView: 'month' | 'week';
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
};

const initialState: SettingsState = {
  nextInvoiceNumber: '',
  preferredTimeEntriesView: 'month',
  isLoading: false,
  isSaving: false,
  error: null,
};

export const SettingsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, repository = inject(SettingsRepository)) => ({
    async loadSettings(): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const settings = await repository.getSettings();
        patchState(store, {
          nextInvoiceNumber: settings.nextInvoiceNumber,
          preferredTimeEntriesView: settings.preferredTimeEntriesView,
          isLoading: false,
        });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load settings.',
        });
      }
    },
    async saveSettings(nextInvoiceNumber: string, preferredTimeEntriesView: 'month' | 'week'): Promise<boolean> {
      patchState(store, { isSaving: true, error: null });
      try {
        const settings = await repository.saveSettings({ nextInvoiceNumber, preferredTimeEntriesView });
        patchState(store, {
          nextInvoiceNumber: settings.nextInvoiceNumber,
          preferredTimeEntriesView: settings.preferredTimeEntriesView,
          isSaving: false,
        });
        return true;
      } catch (error) {
        patchState(store, {
          isSaving: false,
          error: error instanceof Error ? error.message : 'Failed to save settings.',
        });
        return false;
      }
    },
  })),
);
