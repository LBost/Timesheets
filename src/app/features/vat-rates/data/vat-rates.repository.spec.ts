import { TestBed } from '@angular/core/testing';

import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { createFakeSupabase, FakeTables } from '../../../../testing/supabase-client.fake';
import { VatRatesRepository } from './vat-rates.repository';

const USER_ID = '00000000-0000-0000-0000-000000000001';

function configure(tables: Partial<FakeTables>): VatRatesRepository {
  const fake = createFakeSupabase(
    {
      tax_rates: [],
      invoice_line_items: [],
      ...tables,
    },
    { userId: USER_ID },
  );
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [VatRatesRepository, { provide: SUPABASE_CLIENT, useValue: fake }],
  });
  return TestBed.inject(VatRatesRepository);
}

describe('VatRatesRepository', () => {
  it('lists vat rates with invoice usage counts', async () => {
    const repository = configure({
      tax_rates: [
        {
          id: 1,
          user_id: USER_ID,
          code: 'VAT19',
          label: 'VAT 19%',
          percentage: 1900,
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      invoice_line_items: [
        {
          id: 10,
          user_id: USER_ID,
          invoice_id: 1,
          time_entry_id: 1,
          project_id: 1,
          order_id: null,
          description: null,
          work_date: '2026-01-01',
          hours: 60,
          unit_rate: 10000,
          line_net: 600000,
          tax_rate_id: 1,
          tax_code_snapshot: 'VAT19',
          tax_label_snapshot: 'VAT 19%',
          tax_percentage_snapshot: 1900,
          tax_amount: 114000,
          line_gross: 714000,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    const rates = await repository.listVatRates();
    expect(rates).toHaveLength(1);
    expect(rates[0]?.invoiceLineItemCount).toBe(1);
  });

  it('creates a vat rate with normalized code', async () => {
    const repository = configure({});
    const created = await repository.createVatRate({ code: ' vat7 ', label: 'VAT 7%', percentage: 700 });
    expect(created.code).toBe('VAT7');
  });

  it('archives instead of deleting when invoice lines exist', async () => {
    const repository = configure({
      tax_rates: [
        {
          id: 1,
          user_id: USER_ID,
          code: 'VAT19',
          label: 'VAT 19%',
          percentage: 1900,
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      invoice_line_items: [
        {
          id: 10,
          user_id: USER_ID,
          invoice_id: 1,
          time_entry_id: 1,
          project_id: 1,
          order_id: null,
          description: null,
          work_date: '2026-01-01',
          hours: 60,
          unit_rate: 10000,
          line_net: 600000,
          tax_rate_id: 1,
          tax_code_snapshot: 'VAT19',
          tax_label_snapshot: 'VAT 19%',
          tax_percentage_snapshot: 1900,
          tax_amount: 114000,
          line_gross: 714000,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    const result = await repository.deleteVatRate(1);
    expect(result.mode).toBe('archived');
    expect(result.vatRate?.isActive).toBe(false);
  });
});
