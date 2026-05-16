export const ActivityLogAction = {
  TIME_ENTRY_CREATED: 'time_entry.created',
  TIME_ENTRY_UPDATED: 'time_entry.updated',
  TIME_ENTRY_DELETED: 'time_entry.deleted',
  TIME_ENTRIES_EMAIL_DRAFT_OPENED: 'time_entries.email_draft_opened',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_STATUS_CHANGED: 'invoice.status_changed',
  INVOICE_DELETED: 'invoice.deleted',
} as const;

export type ActivityLogAction = (typeof ActivityLogAction)[keyof typeof ActivityLogAction];

export const ActivityLogEntityType = {
  TIME_ENTRY: 'time_entry',
  TIME_ENTRIES: 'time_entries',
  INVOICE: 'invoice',
} as const;

export type ActivityLogEntityType = (typeof ActivityLogEntityType)[keyof typeof ActivityLogEntityType];

export const ActivityLogCategory = {
  ALL: 'all',
  TIME_ENTRIES: 'time_entries',
  INVOICES: 'invoices',
  EMAIL: 'email',
} as const;

export type ActivityLogCategory = (typeof ActivityLogCategory)[keyof typeof ActivityLogCategory];

export interface ActivityLogModel {
  id: number;
  action: ActivityLogAction;
  entityType: ActivityLogEntityType;
  entityId: number | null;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface ActivityLogInsertInput {
  action: ActivityLogAction;
  entityType: ActivityLogEntityType;
  entityId: number | null;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityLogListQuery {
  category: ActivityLogCategory;
  fromDate: string;
  toDate: string;
  limit: number;
  cursor: ActivityLogListCursor | null;
}

export interface ActivityLogListCursor {
  createdAt: string;
  id: number;
}

export interface ActivityLogListResult {
  logs: ActivityLogModel[];
  nextCursor: ActivityLogListCursor | null;
}
