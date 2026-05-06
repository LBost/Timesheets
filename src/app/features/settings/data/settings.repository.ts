import { Injectable } from '@angular/core';
import { AppSettings, AppSettingsUpdateInput } from '../models/settings.model';

const SETTINGS_KEY = 'timesheets.settings';
const DEFAULT_SETTINGS: AppSettings = {
  nextInvoiceNumber: 'RLZ-20260001',
  preferredTimeEntriesView: 'month',
};

@Injectable({ providedIn: 'root' })
export class SettingsRepository {
  async getSettings(): Promise<AppSettings> {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return {
        nextInvoiceNumber:
          typeof parsed.nextInvoiceNumber === 'string' && parsed.nextInvoiceNumber.trim().length > 0
            ? parsed.nextInvoiceNumber.trim()
            : DEFAULT_SETTINGS.nextInvoiceNumber,
        preferredTimeEntriesView:
          parsed.preferredTimeEntriesView === 'week' ? 'week' : DEFAULT_SETTINGS.preferredTimeEntriesView,
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  async saveSettings(input: AppSettingsUpdateInput): Promise<AppSettings> {
    const normalized: AppSettings = {
      nextInvoiceNumber: input.nextInvoiceNumber.trim(),
      preferredTimeEntriesView: input.preferredTimeEntriesView === 'week' ? 'week' : 'month',
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
    return normalized;
  }

  async savePreferredTimeEntriesView(view: 'month' | 'week'): Promise<AppSettings> {
    const current = await this.getSettings();
    return this.saveSettings({
      nextInvoiceNumber: current.nextInvoiceNumber,
      preferredTimeEntriesView: view,
    });
  }
}
