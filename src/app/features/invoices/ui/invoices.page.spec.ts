import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ToastService } from '../../../core/feedback/toast.service';
import { ClientsStore } from '../../clients/state/clients.store';
import { InvoicesStore } from '../state/invoices.store';
import { InvoiceStatus } from '../models/invoice.model';
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
      availablePeriods: signal([{ key: '2026-05', label: 'May 2026', periodStart: '2026-05-01', periodEnd: '2026-06-01' }]),
      invoicePreviews: signal([]),
      selectedInvoice: signal(null),
      selectedInvoiceId: signal<number | null>(null),
      selectedLineItems: signal([]),
      isLoading: signal(false),
      error: signal<string | null>(null),
      loadInvoicesIfNeeded: vi.fn().mockResolvedValue(undefined),
      loadAvailablePeriods: vi.fn().mockResolvedValue(undefined),
      loadInvoicePreviews: vi.fn().mockResolvedValue(undefined),
      clearInvoicePreviews: vi.fn(),
      generateInvoices: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      deleteInvoice: vi.fn().mockResolvedValue(true),
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

  it('asks confirmation before opening an invoice', async () => {
    const clientsStoreMock = {
      clients: signal([{ id: 1, name: 'Acme', isActive: true }]),
      loadClientsIfNeeded: vi.fn().mockResolvedValue(undefined),
    };
    const invoicesStoreMock = {
      invoices: signal([]),
      taxRates: signal([{ id: 1, code: 'VAT19', label: 'VAT 19%', percentage: 1900, isActive: true }]),
      availablePeriods: signal([{ key: '2026-05', label: 'May 2026', periodStart: '2026-05-01', periodEnd: '2026-06-01' }]),
      invoicePreviews: signal([]),
      selectedInvoice: signal(null),
      selectedInvoiceId: signal<number | null>(null),
      selectedLineItems: signal([]),
      isLoading: signal(false),
      error: signal<string | null>(null),
      loadInvoicesIfNeeded: vi.fn().mockResolvedValue(undefined),
      loadAvailablePeriods: vi.fn().mockResolvedValue(undefined),
      loadInvoicePreviews: vi.fn().mockResolvedValue(undefined),
      clearInvoicePreviews: vi.fn(),
      generateInvoices: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      deleteInvoice: vi.fn().mockResolvedValue(true),
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
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    await (fixture.componentInstance as any).setStatus(1, InvoiceStatus.OPEN);

    expect(confirmSpy).toHaveBeenCalled();
    expect(invoicesStoreMock.updateStatus).not.toHaveBeenCalled();
  });

  it('opens invoice editing and saves a status change', async () => {
    const invoice = {
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
    };
    const clientsStoreMock = {
      clients: signal([{ id: 1, name: 'Acme', isActive: true }]),
      loadClientsIfNeeded: vi.fn().mockResolvedValue(undefined),
    };
    const invoicesStoreMock = {
      invoices: signal([invoice]),
      taxRates: signal([{ id: 1, code: 'VAT19', label: 'VAT 19%', percentage: 1900, isActive: true }]),
      availablePeriods: signal([{ key: '2026-05', label: 'May 2026', periodStart: '2026-05-01', periodEnd: '2026-06-01' }]),
      invoicePreviews: signal([]),
      selectedInvoice: signal(invoice),
      selectedInvoiceId: signal<number | null>(1),
      selectedLineItems: signal([]),
      isLoading: signal(false),
      error: signal<string | null>(null),
      loadInvoicesIfNeeded: vi.fn().mockResolvedValue(undefined),
      loadAvailablePeriods: vi.fn().mockResolvedValue(undefined),
      loadInvoicePreviews: vi.fn().mockResolvedValue(undefined),
      clearInvoicePreviews: vi.fn(),
      generateInvoices: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      deleteInvoice: vi.fn().mockResolvedValue(true),
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

    await (fixture.componentInstance as any).openEditInvoice(1);
    (fixture.componentInstance as any).editForm.controls.status.setValue(InvoiceStatus.PROFORMA);
    await (fixture.componentInstance as any).saveInvoiceEdit();

    expect(invoicesStoreMock.selectInvoice).toHaveBeenCalledWith(1);
    expect(invoicesStoreMock.updateStatus).toHaveBeenCalledWith(1, { status: InvoiceStatus.PROFORMA });
    expect(toastMock.show).toHaveBeenCalledWith('Invoice status updated to proforma.', 'success');
  });
});
