import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

import {
  SUPABASE_CLIENT,
  requireCurrentUserId,
} from '../../../core/supabase/supabase.client';
import { throwIfError } from '../../../core/supabase/postgrest.util';
import { AppSettings, AppSettingsUpdateInput } from '../models/settings.model';

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

@Injectable({ providedIn: 'root' })
export class SettingsRepository {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);

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
}
