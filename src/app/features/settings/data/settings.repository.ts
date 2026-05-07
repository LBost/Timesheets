import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

import {
  SUPABASE_CLIENT,
  requireCurrentUserId,
} from '../../../core/supabase/supabase.client';
import { throwIfError } from '../../../core/supabase/postgrest.util';
import { AppSettings, AppSettingsUpdateInput } from '../models/settings.model';
import {
  SettingsBackupData,
  SettingsBackupPayload,
  assertValidSettingsBackupPayload,
  SETTINGS_BACKUP_FORMAT_VERSION,
} from '../models/settings-backup.model';

const DEFAULT_SETTINGS: AppSettings = {
  nextInvoiceNumber: 'RLZ-20260001',
  preferredTimeEntriesView: 'month',
};

const SETTINGS_SELECT =
  'nextInvoiceNumber:next_invoice_number, preferredTimeEntriesView:preferred_time_entries_view';

type SettingsRow = {
  nextInvoiceNumber: string;
  preferredTimeEntriesView: 'month' | 'week';
};

const BACKUP_SELECT_BY_TABLE = {
  clients: 'id,name,email,phone,accent_color,is_active,created_at',
  projects:
    'id,client_id,code,name,unit_rate,unit,currency,billing_model,use_orders,is_active,created_at',
  orders: 'id,project_id,code,title,is_active,created_at',
  time_entries:
    'id,date,client_id,project_id,order_id,description,hours,locked_by_invoice_id,locked_at,created_at',
  tax_rates: 'id,code,label,percentage,is_active,created_at',
  invoices:
    'id,client_id,invoice_number,status,period_start,period_end,issue_date,subtotal_net,total_tax,total_gross,created_at,opened_at,paid_at,credited_at',
  invoice_line_items:
    'id,invoice_id,time_entry_id,project_id,order_id,description,work_date,hours,unit_rate,line_net,tax_rate_id,tax_code_snapshot,tax_label_snapshot,tax_percentage_snapshot,tax_amount,line_gross,created_at',
} as const;

@Injectable({ providedIn: 'root' })
export class SettingsRepository {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);
  private readonly backupSupabase = this.supabase as any;

  async getSettings(): Promise<AppSettings> {
    const userId = await requireCurrentUserId(this.supabase);
    const { data: row, error } = await this.supabase
      .from('settings')
      .select(SETTINGS_SELECT)
      .eq('user_id', userId)
      .maybeSingle<SettingsRow>();
    throwIfError(error, 'Failed to load settings.');

    if (!row) {
      // Persist defaults on first read so the row exists for later upserts.
      return this.saveSettings(DEFAULT_SETTINGS);
    }

    return {
      nextInvoiceNumber:
        typeof row.nextInvoiceNumber === 'string' && row.nextInvoiceNumber.trim().length > 0
          ? row.nextInvoiceNumber.trim()
          : DEFAULT_SETTINGS.nextInvoiceNumber,
      preferredTimeEntriesView:
        row.preferredTimeEntriesView === 'week' ? 'week' : DEFAULT_SETTINGS.preferredTimeEntriesView,
    };
  }

  async saveSettings(input: AppSettingsUpdateInput): Promise<AppSettings> {
    const userId = await requireCurrentUserId(this.supabase);
    const normalized: AppSettings = {
      nextInvoiceNumber: input.nextInvoiceNumber.trim(),
      preferredTimeEntriesView: input.preferredTimeEntriesView === 'week' ? 'week' : 'month',
    };

    const { data: row, error } = await this.supabase
      .from('settings')
      .upsert(
        {
          user_id: userId,
          next_invoice_number: normalized.nextInvoiceNumber,
          preferred_time_entries_view: normalized.preferredTimeEntriesView,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select(SETTINGS_SELECT)
      .single<SettingsRow>();
    throwIfError(error, 'Failed to save settings.');

    return {
      nextInvoiceNumber: row!.nextInvoiceNumber,
      preferredTimeEntriesView: row!.preferredTimeEntriesView === 'week' ? 'week' : 'month',
    };
  }

  async savePreferredTimeEntriesView(view: 'month' | 'week'): Promise<AppSettings> {
    const current = await this.getSettings();
    return this.saveSettings({
      nextInvoiceNumber: current.nextInvoiceNumber,
      preferredTimeEntriesView: view,
    });
  }

  async exportUserBackup(): Promise<SettingsBackupPayload> {
    const userId = await requireCurrentUserId(this.supabase);
    const data = await this.fetchBackupData(userId);
    return {
      meta: {
        formatVersion: SETTINGS_BACKUP_FORMAT_VERSION,
        exportedAt: new Date().toISOString(),
        app: 'timesheets',
        scope: 'current-user',
      },
      data,
    };
  }

  async restoreUserBackup(payload: unknown): Promise<void> {
    assertValidSettingsBackupPayload(payload);
    const userId = await requireCurrentUserId(this.supabase);

    await this.deleteAllUserData(userId);
    await this.insertBackupData(userId, payload.data);
  }

  private async fetchBackupData(userId: string): Promise<SettingsBackupData> {
    const { data: settingsRow, error: settingsError } = await this.supabase
      .from('settings')
      .select('next_invoice_number,preferred_time_entries_view,updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    throwIfError(settingsError, 'Failed to read settings for backup.');

    const clients = await this.readTableRows('clients', userId);
    const projects = await this.readTableRows('projects', userId);
    const orders = await this.readTableRows('orders', userId);
    const timeEntries = await this.readTableRows('time_entries', userId);
    const taxRates = await this.readTableRows('tax_rates', userId);
    const invoices = await this.readTableRows('invoices', userId);
    const invoiceLineItems = await this.readTableRows('invoice_line_items', userId);

    return {
      settings: settingsRow,
      clients,
      projects,
      orders,
      time_entries: timeEntries,
      tax_rates: taxRates,
      invoices,
      invoice_line_items: invoiceLineItems,
    };
  }

  private async readTableRows(table: keyof typeof BACKUP_SELECT_BY_TABLE, userId: string) {
    const { data, error } = await this.backupSupabase
      .from(table)
      .select(BACKUP_SELECT_BY_TABLE[table])
      .eq('user_id', userId)
      .order('id', { ascending: true });
    throwIfError(error, `Failed to read ${table} for backup.`);
    return (data ?? []).map((row: Record<string, unknown>) => ({ ...row }));
  }

  private async deleteAllUserData(userId: string): Promise<void> {
    await this.deleteTableRows('invoice_line_items', userId);
    await this.deleteTableRows('invoices', userId);
    await this.deleteTableRows('time_entries', userId);
    await this.deleteTableRows('orders', userId);
    await this.deleteTableRows('projects', userId);
    await this.deleteTableRows('clients', userId);
    await this.deleteTableRows('tax_rates', userId);
    await this.deleteTableRows('settings', userId);
  }

  private async deleteTableRows(table: string, userId: string): Promise<void> {
    const { error } = await this.backupSupabase.from(table).delete().eq('user_id', userId);
    throwIfError(error, `Failed to clear ${table} before restore.`);
  }

  private async insertBackupData(userId: string, data: SettingsBackupData): Promise<void> {
    await this.insertTableRows('clients', data.clients, userId);
    await this.insertTableRows('projects', data.projects, userId);
    await this.insertTableRows('orders', data.orders, userId);
    await this.insertTableRows('time_entries', data.time_entries, userId);
    await this.insertTableRows('tax_rates', data.tax_rates, userId);
    await this.insertTableRows('invoices', data.invoices, userId);
    await this.insertTableRows('invoice_line_items', data.invoice_line_items, userId);
    if (data.settings) {
      const { error } = await this.supabase.from('settings').upsert(
        {
          user_id: userId,
          next_invoice_number: data.settings.next_invoice_number,
          preferred_time_entries_view: data.settings.preferred_time_entries_view,
          updated_at: data.settings.updated_at ?? new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      throwIfError(error, 'Failed to restore settings.');
    }
  }

  private async insertTableRows(
    table: string,
    rows: ReadonlyArray<Record<string, unknown>>,
    userId: string,
  ): Promise<void> {
    if (rows.length === 0) return;
    const payload = rows.map((row) => ({ ...row, user_id: userId }));
    const { error } = await this.backupSupabase.from(table).insert(payload);
    throwIfError(error, `Failed to restore ${table}.`);
  }
}
