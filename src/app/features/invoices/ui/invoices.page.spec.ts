import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ToastService } from '../../../core/feedback/toast.service';
import { ClientsStore } from '../../clients/state/clients.store';
import { InvoicesStore } from '../state/invoices.store';
import { InvoicesPage } from './invoices.page';

describe('InvoicesPage', () => {
  it('creates component', async () => {
    const clientsStoreMock = {
      clients: signal([{ id: 1, name: 'Acme', isActive: true }]),
      loadClientsIfNeeded: vi.fn().mockResolvedValue(undefined),
    };
    const invoicesStoreMock = {
      invoices: signal([]),
      taxRates: signal([{ id: 1, code: 'VAT19', label: 'VAT 19%', percentage: 1900, isActive: true }]),
      selectedInvoiceId: signal<number | null>(null),
      selectedLineItems: signal([]),
      isLoading: signal(false),
      error: signal<string | null>(null),
      loadInvoicesIfNeeded: vi.fn().mockResolvedValue(undefined),
      generateInvoices: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      selectInvoice: vi.fn().mockResolvedValue(undefined),
    };
    const toastMock = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [InvoicesPage],
      providers: [
        { provide: ClientsStore, useValue: clientsStoreMock },
        { provide: InvoicesStore, useValue: invoicesStoreMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(InvoicesPage);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
