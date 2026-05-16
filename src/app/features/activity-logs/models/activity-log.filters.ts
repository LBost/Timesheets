import { ActivityLogCategory } from './activity-log.model';

export const ACTIVITY_LOG_PAGE_SIZE = 50;

export function defaultActivityLogDateRange(): { fromDate: string; toDate: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    fromDate: isoDate(from),
    toDate: isoDate(to),
  };
}

export function matchesActivityLogCategory(action: string, category: ActivityLogCategory): boolean {
  if (category === ActivityLogCategory.ALL) {
    return true;
  }
  if (category === ActivityLogCategory.TIME_ENTRIES) {
    return action.startsWith('time_entry.') || action === 'time_entries.email_draft_opened';
  }
  if (category === ActivityLogCategory.INVOICES) {
    return action.startsWith('invoice.');
  }
  if (category === ActivityLogCategory.EMAIL) {
    return action === 'time_entries.email_draft_opened';
  }
  return true;
}

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
