import { TestBed } from '@angular/core/testing';

import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { createFakeSupabase, FakeTables } from '../../../../testing/supabase-client.fake';
import { SettingsRepository } from './settings.repository';
import { SETTINGS_BACKUP_FORMAT_VERSION } from '../models/settings-backup.model';

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

  it('exports user backup payload with metadata', async () => {
    const repository = configure({
      settings: [
        {
          user_id: USER_ID,
          next_invoice_number: 'INV-20260001',
          preferred_time_entries_view: 'month',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      clients: [{ id: 11, user_id: USER_ID, name: 'Acme', is_active: true, created_at: '2026-01-01T00:00:00Z' }],
      projects: [
        {
          id: 22,
          user_id: USER_ID,
          client_id: 11,
          code: 'P-1',
          name: 'Project',
          unit_rate: 10000,
          unit: 'hours',
          currency: 'EUR',
          billing_model: null,
          use_orders: false,
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      orders: [],
      time_entries: [],
      tax_rates: [],
      invoices: [],
      invoice_line_items: [],
    });

    const payload = await repository.exportUserBackup();

    expect(payload.meta.formatVersion).toBe(SETTINGS_BACKUP_FORMAT_VERSION);
    expect(payload.meta.scope).toBe('current-user');
    expect(payload.data.clients).toHaveLength(1);
    expect(payload.data.projects).toHaveLength(1);
    expect(payload.data.settings?.next_invoice_number).toBe('INV-20260001');
  });

  it('restores backup by replacing existing data and forcing current user ownership', async () => {
    const repository = configure({
      clients: [{ id: 99, user_id: USER_ID, name: 'Old', is_active: true, created_at: '2026-01-01T00:00:00Z' }],
      projects: [],
      orders: [],
      time_entries: [],
      tax_rates: [],
      invoices: [],
      invoice_line_items: [],
      settings: [
        {
          user_id: USER_ID,
          next_invoice_number: 'OLD',
          preferred_time_entries_view: 'month',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    await repository.restoreUserBackup({
      meta: {
        formatVersion: SETTINGS_BACKUP_FORMAT_VERSION,
        exportedAt: '2026-05-07T00:00:00.000Z',
        app: 'timesheets',
        scope: 'current-user',
      },
      data: {
        settings: {
          next_invoice_number: 'INV-20269999',
          preferred_time_entries_view: 'week',
          updated_at: '2026-05-07T00:00:00.000Z',
        },
        clients: [
          {
            id: 1,
            user_id: 'somebody-else',
            name: 'New Client',
            email: null,
            phone: null,
            accent_color: null,
            is_active: true,
            created_at: '2026-05-01T00:00:00.000Z',
          },
        ],
        projects: [],
        orders: [],
        time_entries: [],
        tax_rates: [],
        invoices: [],
        invoice_line_items: [],
      },
    });

    const payload = await repository.exportUserBackup();
    expect(payload.data.clients).toHaveLength(1);
    expect(payload.data.clients[0].name).toBe('New Client');
    expect(payload.data.settings?.preferred_time_entries_view).toBe('week');
  });

  it('throws on unsupported backup format version', async () => {
    const repository = configure();

    await expect(
      repository.restoreUserBackup({
        meta: {
          formatVersion: 99,
          exportedAt: '2026-05-07T00:00:00.000Z',
          app: 'timesheets',
          scope: 'current-user',
        },
        data: {
          settings: null,
          clients: [],
          projects: [],
          orders: [],
          time_entries: [],
          tax_rates: [],
          invoices: [],
          invoice_line_items: [],
        },
      }),
    ).rejects.toThrow('Unsupported backup version');
  });
});
