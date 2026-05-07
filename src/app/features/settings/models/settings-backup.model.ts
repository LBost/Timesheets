export const SETTINGS_BACKUP_FORMAT_VERSION = 1;

export type SettingsBackupScope = 'current-user';

export type BackupSettingsRow = {
  next_invoice_number: string;
  preferred_time_entries_view: 'month' | 'week';
  updated_at: string | null;
};

export type BackupClientRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  accent_color: string | null;
  is_active: boolean;
  created_at: string;
};

export type BackupProjectRow = {
  id: number;
  client_id: number;
  code: string;
  name: string;
  unit_rate: number;
  unit: string;
  currency: string;
  billing_model: string | null;
  use_orders: boolean;
  is_active: boolean;
  created_at: string;
};

export type BackupOrderRow = {
  id: number;
  project_id: number;
  code: string;
  title: string;
  is_active: boolean;
  created_at: string;
};

export type BackupTimeEntryRow = {
  id: number;
  date: string;
  client_id: number;
  project_id: number;
  order_id: number | null;
  description: string | null;
  hours: number;
  locked_by_invoice_id: number | null;
  locked_at: string | null;
  created_at: string;
};

export type BackupTaxRateRow = {
  id: number;
  code: string;
  label: string;
  percentage: number;
  is_active: boolean;
  created_at: string;
};

export type BackupInvoiceRow = {
  id: number;
  client_id: number;
  invoice_number: string;
  status: string;
  period_start: string;
  period_end: string;
  issue_date: string;
  subtotal_net: number;
  total_tax: number;
  total_gross: number;
  created_at: string;
  opened_at: string | null;
  paid_at: string | null;
  credited_at: string | null;
};

export type BackupInvoiceLineItemRow = {
  id: number;
  invoice_id: number;
  time_entry_id: number;
  project_id: number;
  order_id: number | null;
  description: string | null;
  work_date: string;
  hours: number;
  unit_rate: number;
  line_net: number;
  tax_rate_id: number;
  tax_code_snapshot: string;
  tax_label_snapshot: string;
  tax_percentage_snapshot: number;
  tax_amount: number;
  line_gross: number;
  created_at: string;
};

export type SettingsBackupData = {
  settings: BackupSettingsRow | null;
  clients: BackupClientRow[];
  projects: BackupProjectRow[];
  orders: BackupOrderRow[];
  time_entries: BackupTimeEntryRow[];
  tax_rates: BackupTaxRateRow[];
  invoices: BackupInvoiceRow[];
  invoice_line_items: BackupInvoiceLineItemRow[];
};

export type SettingsBackupPayload = {
  meta: {
    formatVersion: number;
    exportedAt: string;
    app: 'timesheets';
    scope: SettingsBackupScope;
  };
  data: SettingsBackupData;
};

const EXPECTED_TABLE_KEYS: ReadonlyArray<keyof SettingsBackupData> = [
  'settings',
  'clients',
  'projects',
  'orders',
  'time_entries',
  'tax_rates',
  'invoices',
  'invoice_line_items',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isSettingsBackupPayload(value: unknown): value is SettingsBackupPayload {
  if (!isRecord(value)) return false;
  const meta = value['meta'];
  const data = value['data'];
  if (!isRecord(meta) || !isRecord(data)) return false;

  if (typeof meta['formatVersion'] !== 'number') return false;
  if (typeof meta['exportedAt'] !== 'string') return false;
  if (meta['app'] !== 'timesheets') return false;
  if (meta['scope'] !== 'current-user') return false;

  const dataKeys = Object.keys(data);
  if (dataKeys.length !== EXPECTED_TABLE_KEYS.length) return false;
  for (const key of EXPECTED_TABLE_KEYS) {
    if (!(key in data)) return false;
  }

  const settings = data['settings'];
  if (!(settings === null || isRecord(settings))) return false;
  for (const key of EXPECTED_TABLE_KEYS.slice(1)) {
    const table = data[key];
    if (!Array.isArray(table)) return false;
  }

  return true;
}

export function assertValidSettingsBackupPayload(
  value: unknown,
): asserts value is SettingsBackupPayload {
  if (!isSettingsBackupPayload(value)) {
    throw new Error('Invalid backup file format.');
  }
  if (value.meta.formatVersion !== SETTINGS_BACKUP_FORMAT_VERSION) {
    throw new Error(
      `Unsupported backup version ${value.meta.formatVersion}. Expected version ${SETTINGS_BACKUP_FORMAT_VERSION}.`,
    );
  }
}
