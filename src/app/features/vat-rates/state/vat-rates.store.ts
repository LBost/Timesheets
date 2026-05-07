import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { VatRateCreateInput, VatRateUpdateInput } from '../models/vat-rate.model';
import { VatRateVM } from '../models/vat-rate.vm';
import { VatRatesRepository } from '../data/vat-rates.repository';

type VatRatesState = {
  vatRates: VatRateVM[];
  selectedVatRateId: number | null;
  isLoading: boolean;
  hasLoaded: boolean;
  lastLoadedAt: number | null;
  error: string | null;
};

const initialState: VatRatesState = {
  vatRates: [],
  selectedVatRateId: null,
  isLoading: false,
  hasLoaded: false,
  lastLoadedAt: null,
  error: null,
};

export const VatRatesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    selectedVatRate: computed(
      () => store.vatRates().find((rate) => rate.id === store.selectedVatRateId()) ?? null,
    ),
  })),
  withMethods((store, repository = inject(VatRatesRepository)) => {
    const loadVatRates = async (): Promise<void> => {
      patchState(store, { isLoading: true, error: null });
      try {
        const vatRates = await repository.listVatRates();
        patchState(store, {
          vatRates,
          isLoading: false,
          hasLoaded: true,
          lastLoadedAt: Date.now(),
        });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load VAT rates.',
        });
      }
    };

    return {
      async loadVatRates(): Promise<void> {
        await loadVatRates();
      },
      async loadVatRatesIfNeeded(): Promise<void> {
        if (store.hasLoaded()) {
          return;
        }
        await loadVatRates();
      },
      selectVatRate(id: number | null): void {
        patchState(store, { selectedVatRateId: id });
      },
      async createVatRate(input: VatRateCreateInput): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const vatRate = await repository.createVatRate(input);
          patchState(store, (state) => ({
            vatRates: [...state.vatRates, vatRate].sort((a, b) => a.code.localeCompare(b.code)),
            selectedVatRateId: vatRate.id,
            isLoading: false,
          }));
        } catch (error) {
          patchState(store, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to create VAT rate.',
          });
        }
      },
      async updateVatRate(id: number, input: VatRateUpdateInput): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const updated = await repository.updateVatRate(id, input);
          if (!updated) {
            patchState(store, { isLoading: false, error: 'VAT rate not found.' });
            return;
          }

          patchState(store, (state) => ({
            vatRates: state.vatRates
              .map((rate) => (rate.id === id ? updated : rate))
              .sort((a, b) => a.code.localeCompare(b.code)),
            isLoading: false,
          }));
        } catch (error) {
          patchState(store, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update VAT rate.',
          });
        }
      },
      async archiveVatRate(id: number): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const archived = await repository.archiveVatRate(id);
          if (!archived) {
            patchState(store, { isLoading: false, error: 'VAT rate not found.' });
            return;
          }

          patchState(store, (state) => ({
            vatRates: state.vatRates.map((rate) => (rate.id === id ? archived : rate)),
            isLoading: false,
          }));
        } catch (error) {
          patchState(store, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to archive VAT rate.',
          });
        }
      },
      async deleteVatRate(id: number): Promise<'deleted' | 'archived' | null> {
        patchState(store, { isLoading: true, error: null });
        try {
          const result = await repository.deleteVatRate(id);
          if (result.mode === 'archived' && !result.vatRate) {
            patchState(store, { isLoading: false, error: 'VAT rate not found.' });
            return null;
          }
          patchState(store, (state) => ({
            vatRates:
              result.mode === 'deleted'
                ? state.vatRates.filter((rate) => rate.id !== id)
                : state.vatRates.map((rate) => (rate.id === id ? result.vatRate ?? rate : rate)),
            selectedVatRateId: state.selectedVatRateId === id ? null : state.selectedVatRateId,
            isLoading: false,
          }));
          return result.mode;
        } catch (error) {
          patchState(store, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to delete VAT rate.',
          });
          return null;
        }
      },
    };
  }),
);
