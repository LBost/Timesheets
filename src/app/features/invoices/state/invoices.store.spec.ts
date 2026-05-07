import { TestBed } from '@angular/core/testing';
import { InvoicesRepository } from '../data/invoices.repository';
import { InvoiceStatus } from '../models/invoice.model';
import { InvoicesStore } from './invoices.store';

describe('InvoicesStore', () => {
  it('loads invoices and tax rates', async () => {
    const repository = {
      listInvoices: vi.fn().mockResolvedValue([
        {
          id: 1,
          clientId: 1,
          clientName: 'Acme',
          invoiceNumber: 'INV-20260001',
          status: InvoiceStatus.CONCEPT,
          periodStart: '2026-05-01',
          periodEnd: '2026-06-01',
          issueDate: '2026-05-31',
          subtotalNet: 100,
          totalTax: 19,
          totalGross: 119,
          createdAt: new Date(),
          openedAt: null,
          paidAt: null,
          creditedAt: null,
          lineItemCount: 1,
        },
      ]),
      listTaxRates: vi.fn().mockResolvedValue([
        {
          id: 1,
          code: 'VAT19',
          label: 'VAT 19%',
          percentage: 1900,
          isActive: true,
          createdAt: new Date(),
        },
      ]),
      generateInvoices: vi.fn(),
      updateStatus: vi.fn(),
      deleteInvoice: vi.fn(),
      listLineItems: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: InvoicesRepository, useValue: repository }],
    });
    const store = TestBed.inject(InvoicesStore);

    await store.loadInvoices();

    expect(store.invoices()).toHaveLength(1);
    expect(store.taxRates()).toHaveLength(1);
  });
});
