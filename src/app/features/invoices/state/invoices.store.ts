import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { InvoicesRepository } from '../data/invoices.repository';
import { InvoiceGenerateInput, InvoiceStatusUpdateInput } from '../models/invoice.model';
import { InvoiceLineItemVM, InvoiceVM } from '../models/invoice.vm';
import { TaxRateModel } from '../models/tax-rate.model';

type InvoicesState = {
  invoices: InvoiceVM[];
  taxRates: TaxRateModel[];
  selectedInvoiceId: number | null;
  selectedLineItems: InvoiceLineItemVM[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
};

const initialState: InvoicesState = {
  invoices: [],
  taxRates: [],
  selectedInvoiceId: null,
  selectedLineItems: [],
  isLoading: false,
  hasLoaded: false,
  error: null,
};

export const InvoicesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    selectedInvoice: computed(
      () => store.invoices().find((invoice) => invoice.id === store.selectedInvoiceId()) ?? null,
    ),
  })),
  withMethods((store, repository = inject(InvoicesRepository)) => ({
    async loadInvoices(): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const [invoices, taxRates] = await Promise.all([repository.listInvoices(), repository.listTaxRates()]);
        patchState(store, { invoices, taxRates, isLoading: false, hasLoaded: true });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load invoices.',
        });
      }
    },
    async loadInvoicesIfNeeded(): Promise<void> {
      if (store.hasLoaded()) {
        return;
      }
      await this.loadInvoices();
    },
    async generateInvoices(input: InvoiceGenerateInput): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const created = await repository.generateInvoices(input);
        patchState(store, (state) => ({
          invoices: [...created, ...state.invoices].sort((a, b) => b.id - a.id),
          isLoading: false,
        }));
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to generate invoices.',
        });
      }
    },
    async updateStatus(invoiceId: number, input: InvoiceStatusUpdateInput): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const updated = await repository.updateStatus(invoiceId, input);
        if (!updated) {
          patchState(store, { isLoading: false, error: 'Invoice not found.' });
          return;
        }
        patchState(store, (state) => ({
          invoices: state.invoices.map((invoice) => (invoice.id === invoiceId ? updated : invoice)),
          isLoading: false,
        }));
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to update invoice status.',
        });
      }
    },
    async deleteInvoice(invoiceId: number): Promise<boolean> {
      patchState(store, { isLoading: true, error: null });
      try {
        const deleted = await repository.deleteInvoice(invoiceId);
        if (!deleted) {
          patchState(store, { isLoading: false, error: 'Invoice not found.' });
          return false;
        }
        patchState(store, (state) => ({
          invoices: state.invoices.filter((invoice) => invoice.id !== invoiceId),
          selectedInvoiceId: state.selectedInvoiceId === invoiceId ? null : state.selectedInvoiceId,
          selectedLineItems: state.selectedInvoiceId === invoiceId ? [] : state.selectedLineItems,
          isLoading: false,
        }));
        return true;
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to delete invoice.',
        });
        return false;
      }
    },
    async selectInvoice(invoiceId: number | null): Promise<void> {
      patchState(store, { selectedInvoiceId: invoiceId, selectedLineItems: [] });
      if (invoiceId === null) {
        return;
      }
      try {
        const lineItems = await repository.listLineItems(invoiceId);
        patchState(store, { selectedLineItems: lineItems });
      } catch (error) {
        patchState(store, {
          error: error instanceof Error ? error.message : 'Failed to load invoice line items.',
        });
      }
    },
  })),
);
