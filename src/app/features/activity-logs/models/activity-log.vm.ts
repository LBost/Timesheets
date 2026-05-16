import { ActivityLogAction, ActivityLogEntityType } from './activity-log.model';

export interface ActivityLogVM {
  id: number;
  action: ActivityLogAction;
  entityType: ActivityLogEntityType;
  entityId: number | null;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  actionLabel: string;
}
