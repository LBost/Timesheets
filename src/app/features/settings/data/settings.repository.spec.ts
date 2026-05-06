import { TestBed } from '@angular/core/testing';

import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { createFakeSupabase, FakeTables } from '../../../../testing/supabase-client.fake';
import { SettingsRepository } from './settings.repository';

const USER_ID = '00000000-0000-0000-0000-000000000001';

function configure(tables: Partial<FakeTables> = {}): SettingsRepository {
  const fake = createFakeSupabase(
    {
      settings: [],
      ...tables,
    },
    { userId: USER_ID },
  );
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [SettingsRepository, { provide: SUPABASE_CLIENT, useValue: fake }],
  });
  return TestBed.inject(SettingsRepository);
}

describe('SettingsRepository', () => {
  it('returns defaults when no settings row exists', async () => {
    const repository = configure();

    const settings = await repository.getSettings();
    expect(settings.nextInvoiceNumber).toBe('RLZ-20260001');
    expect(settings.preferredTimeEntriesView).toBe('month');
  });

  it('saves settings via upsert and reads them back', async () => {
    const repository = configure();

    const saved = await repository.saveSettings({
      nextInvoiceNumber: 'INV-20260010',
      preferredTimeEntriesView: 'week',
    });
    expect(saved.nextInvoiceNumber).toBe('INV-20260010');
    expect(saved.preferredTimeEntriesView).toBe('week');

    const reloaded = await repository.getSettings();
    expect(reloaded.nextInvoiceNumber).toBe('INV-20260010');
    expect(reloaded.preferredTimeEntriesView).toBe('week');
  });

  it('coerces invalid view values to month', async () => {
    const repository = configure({
      settings: [
        {
          user_id: USER_ID,
          next_invoice_number: 'X',
          preferred_time_entries_view: 'mystery',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    const settings = await repository.getSettings();
    expect(settings.preferredTimeEntriesView).toBe('month');
  });
});
