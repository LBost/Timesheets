import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { VatRatesPage } from './vat-rates.page';
import { VatRatesStore } from '../state/vat-rates.store';

describe('VatRatesPage', () => {
  const vatRatesStoreMock = {
    vatRates: vi.fn(),
    selectedVatRateId: vi.fn(),
    isLoading: vi.fn(),
    error: vi.fn(),
    loadVatRates: vi.fn(),
    loadVatRatesIfNeeded: vi.fn(),
    createVatRate: vi.fn(),
    updateVatRate: vi.fn(),
    archiveVatRate: vi.fn(),
  };

  beforeEach(async () => {
    vatRatesStoreMock.vatRates.mockReturnValue([]);
    vatRatesStoreMock.selectedVatRateId.mockReturnValue(null);
    vatRatesStoreMock.isLoading.mockReturnValue(false);
    vatRatesStoreMock.error.mockReturnValue(null);
    vatRatesStoreMock.loadVatRates.mockResolvedValue(undefined);
    vatRatesStoreMock.loadVatRatesIfNeeded.mockResolvedValue(undefined);
    vatRatesStoreMock.createVatRate.mockResolvedValue(undefined);
    vatRatesStoreMock.updateVatRate.mockResolvedValue(undefined);
    vatRatesStoreMock.archiveVatRate.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [VatRatesPage],
      providers: [{ provide: VatRatesStore, useValue: vatRatesStoreMock }],
    }).compileComponents();
  });

  it('creates the page', () => {
    const fixture = TestBed.createComponent(VatRatesPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads vat rates on init', async () => {
    const fixture = TestBed.createComponent(VatRatesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(vatRatesStoreMock.loadVatRatesIfNeeded).toHaveBeenCalled();
  });
});
