import { ActivityLogAction, ActivityLogModel } from '../models/activity-log.model';
import { ActivityLogVM } from '../models/activity-log.vm';

export interface ActivityLogRow {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const ACTION_LABELS: Record<ActivityLogAction, string> = {
  'time_entry.created': 'Time entry created',
  'time_entry.updated': 'Time entry updated',
  'time_entry.deleted': 'Time entry deleted',
  'time_entries.email_draft_opened': 'Email draft opened',
  'invoice.created': 'Invoice created',
  'invoice.status_changed': 'Invoice status changed',
  'invoice.deleted': 'Invoice deleted',
};

export function fromActivityLogRow(row: ActivityLogRow): ActivityLogModel {
  return {
    id: row.id,
    action: row.action as ActivityLogAction,
    entityType: row.entityType as ActivityLogModel['entityType'],
    entityId: row.entityId,
    summary: row.summary,
    metadata: row.metadata ?? {},
    createdAt: new Date(row.createdAt),
  };
}

export function toActivityLogVM(model: ActivityLogModel): ActivityLogVM {
  return {
    ...model,
    actionLabel: ACTION_LABELS[model.action] ?? model.action,
  };
}
