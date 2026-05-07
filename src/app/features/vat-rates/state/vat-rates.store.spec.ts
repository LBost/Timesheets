import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { VatRatesRepository } from '../data/vat-rates.repository';
import { VatRatesStore } from './vat-rates.store';

describe('VatRatesStore', () => {
  const repositoryMock = {
    listVatRates: vi.fn(),
    createVatRate: vi.fn(),
    updateVatRate: vi.fn(),
    archiveVatRate: vi.fn(),
  };

  beforeEach(() => {
    repositoryMock.listVatRates.mockReset();
    repositoryMock.createVatRate.mockReset();
    repositoryMock.updateVatRate.mockReset();
    repositoryMock.archiveVatRate.mockReset();

    TestBed.configureTestingModule({
      providers: [{ provide: VatRatesRepository, useValue: repositoryMock }],
    });
  });

  it('loads vat rates into state', async () => {
    repositoryMock.listVatRates.mockResolvedValue([
      {
        id: 1,
        code: 'VAT19',
        label: 'VAT 19%',
        percentage: 1900,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        invoiceLineItemCount: 0,
      },
    ]);

    const store = TestBed.inject(VatRatesStore);
    await store.loadVatRates();

    expect(store.vatRates().length).toBe(1);
    expect(store.hasLoaded()).toBe(true);
    expect(store.error()).toBeNull();
  });

  it('skips list request when rates are already loaded', async () => {
    repositoryMock.listVatRates.mockResolvedValue([]);
    const store = TestBed.inject(VatRatesStore);

    await store.loadVatRatesIfNeeded();
    await store.loadVatRatesIfNeeded();

    expect(repositoryMock.listVatRates).toHaveBeenCalledTimes(1);
  });

  it('creates and appends a vat rate', async () => {
    repositoryMock.createVatRate.mockResolvedValue({
      id: 2,
      code: 'VAT7',
      label: 'VAT 7%',
      percentage: 700,
      isActive: true,
      createdAt: new Date('2026-01-01'),
      invoiceLineItemCount: 0,
    });

    const store = TestBed.inject(VatRatesStore);
    await store.createVatRate({ code: 'VAT7', label: 'VAT 7%', percentage: 700 });

    expect(store.vatRates().map((rate) => rate.code)).toContain('VAT7');
    expect(store.selectedVatRateId()).toBe(2);
  });
});
