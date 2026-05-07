import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { createFakeSupabase, FakeTables } from '../../../../testing/supabase-client.fake';
import { BillingModel } from '../../projects/models/project.model';
import { SettingsRepository } from '../../settings/data/settings.repository';
import { InvoiceStatus } from '../models/invoice.model';
import { InvoicesRepository } from './invoices.repository';

const USER_ID = '00000000-0000-0000-0000-000000000001';

function configure(tables: Partial<FakeTables>) {
  const fake = createFakeSupabase(
    {
      clients: [{ id: 1, user_id: USER_ID, name: 'Acme', is_active: true }],
      projects: [
        {
          id: 10,
          user_id: USER_ID,
          client_id: 1,
          code: 'P1',
          name: 'Project A',
          unit_rate: 100,
          billing_model: 'month',
          is_active: true,
        },
      ],
      orders: [],
      time_entries: [],
      settings: [{ user_id: USER_ID, next_invoice_number: 'INV-20260001', preferred_time_entries_view: 'month' }],
      tax_rates: [{ id: 1, user_id: USER_ID, code: 'VAT19', label: 'VAT 19%', percentage: 1900, is_active: true }],
      invoices: [],
      invoice_line_items: [],
      ...tables,
    },
    { userId: USER_ID },
  );
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      InvoicesRepository,
      SettingsRepository,
      { provide: SUPABASE_CLIENT, useValue: fake },
    ],
  });
  return TestBed.inject(InvoicesRepository);
}

describe('InvoicesRepository', () => {
  it('generates invoice and increments settings number', async () => {
    const repository = configure({
      time_entries: [
        {
          id: 100,
          user_id: USER_ID,
          client_id: 1,
          project_id: 10,
          order_id: null,
          date: '2026-05-10',
          hours: 2,
          description: 'Work',
          locked_by_invoice_id: null,
        },
      ],
    });

    const created = await repository.generateInvoices({
      clientId: 1,
      billingModel: BillingModel.MONTH,
      periodStart: '2026-05-01',
      periodEnd: '2026-06-01',
      status: InvoiceStatus.CONCEPT,
      mode: 'combined',
      taxRateId: 1,
    });

    expect(created).toHaveLength(1);
    expect(created[0].invoiceNumber).toBe('INV-20260001');
  });

  it('reverts open invoice to concept and unlocks linked entries', async () => {
    const repository = configure({
      time_entries: [
        {
          id: 100,
          user_id: USER_ID,
          client_id: 1,
          project_id: 10,
          order_id: null,
          date: '2026-05-10',
          hours: 2,
          description: 'Work',
          locked_by_invoice_id: 1,
          locked_at: '2026-05-31T00:00:00Z',
        },
      ],
      invoices: [
        {
          id: 1,
          user_id: USER_ID,
          client_id: 1,
          invoice_number: 'INV-20260001',
          status: InvoiceStatus.OPEN,
          period_start: '2026-05-01',
          period_end: '2026-06-01',
          issue_date: '2026-05-31',
          subtotal_net: 200,
          total_tax: 38,
          total_gross: 238,
          opened_at: '2026-05-31T00:00:00Z',
        },
      ],
      invoice_line_items: [
        {
          id: 500,
          user_id: USER_ID,
          invoice_id: 1,
          time_entry_id: 100,
          project_id: 10,
          order_id: null,
          description: 'Work',
          work_date: '2026-05-10',
          hours: 2,
          unit_rate: 100,
          line_net: 200,
          tax_rate_id: 1,
          tax_code_snapshot: 'VAT19',
          tax_label_snapshot: 'VAT 19%',
          tax_percentage_snapshot: 1900,
          tax_amount: 38,
          line_gross: 238,
        },
      ],
    });

    const reverted = await repository.updateStatus(1, { status: InvoiceStatus.CONCEPT });
    expect(reverted?.status).toBe(InvoiceStatus.CONCEPT);

    const created = await repository.generateInvoices({
      clientId: 1,
      billingModel: BillingModel.MONTH,
      periodStart: '2026-05-01',
      periodEnd: '2026-06-01',
      status: InvoiceStatus.CONCEPT,
      mode: 'combined',
      taxRateId: 1,
    });
    expect(created.length).toBeGreaterThan(0);
  });

  it('deletes open invoice and unlocks linked entries', async () => {
    const repository = configure({
      time_entries: [
        {
          id: 100,
          user_id: USER_ID,
          client_id: 1,
          project_id: 10,
          order_id: null,
          date: '2026-05-10',
          hours: 2,
          description: 'Work',
          locked_by_invoice_id: 1,
          locked_at: '2026-05-31T00:00:00Z',
        },
      ],
      invoices: [
        {
          id: 1,
          user_id: USER_ID,
          client_id: 1,
          invoice_number: 'INV-20260001',
          status: InvoiceStatus.OPEN,
          period_start: '2026-05-01',
          period_end: '2026-06-01',
          issue_date: '2026-05-31',
          subtotal_net: 200,
          total_tax: 38,
          total_gross: 238,
          opened_at: '2026-05-31T00:00:00Z',
        },
      ],
      invoice_line_items: [
        {
          id: 500,
          user_id: USER_ID,
          invoice_id: 1,
          time_entry_id: 100,
          project_id: 10,
          order_id: null,
          description: 'Work',
          work_date: '2026-05-10',
          hours: 2,
          unit_rate: 100,
          line_net: 200,
          tax_rate_id: 1,
          tax_code_snapshot: 'VAT19',
          tax_label_snapshot: 'VAT 19%',
          tax_percentage_snapshot: 1900,
          tax_amount: 38,
          line_gross: 238,
        },
      ],
    });

    const deleted = await repository.deleteInvoice(1);
    expect(deleted).toBe(true);

    const invoices = await repository.listInvoices();
    expect(invoices).toHaveLength(0);

    const created = await repository.generateInvoices({
      clientId: 1,
      billingModel: BillingModel.MONTH,
      periodStart: '2026-05-01',
      periodEnd: '2026-06-01',
      status: InvoiceStatus.CONCEPT,
      mode: 'combined',
      taxRateId: 1,
    });
    expect(created.length).toBeGreaterThan(0);
  });
});
