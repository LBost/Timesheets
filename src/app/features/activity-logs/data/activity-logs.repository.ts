import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_CLIENT, requireCurrentUserId } from '../../../core/supabase/supabase.client';
import { throwIfError } from '../../../core/supabase/postgrest.util';
import {
  ActivityLogCategory,
  ActivityLogInsertInput,
  ActivityLogListQuery,
  ActivityLogListResult,
} from '../models/activity-log.model';
import { ActivityLogRow, fromActivityLogRow } from './activity-log.mapper';

const ACTIVITY_LOG_SELECT =
  'id, action, entityType:entity_type, entityId:entity_id, summary, metadata, createdAt:created_at';

@Injectable({ providedIn: 'root' })
export class ActivityLogsRepository {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);

  async insert(input: ActivityLogInsertInput): Promise<void> {
    const userId = await requireCurrentUserId(this.supabase);
    const { error } = await this.supabase.from('activity_logs').insert({
      user_id: userId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      summary: input.summary,
      metadata: input.metadata ?? {},
    });
    throwIfError(error, 'Failed to write activity log.');
  }

  async list(query: ActivityLogListQuery): Promise<ActivityLogListResult> {
    let request = this.supabase
      .from('activity_logs')
      .select(ACTIVITY_LOG_SELECT)
      .gte('created_at', startOfDayIso(query.fromDate))
      .lte('created_at', endOfDayIso(query.toDate));

    if (query.category === ActivityLogCategory.TIME_ENTRIES) {
      request = request.or(
        'action.like.time_entry.%,action.eq.time_entries.email_draft_opened',
      );
    } else if (query.category === ActivityLogCategory.INVOICES) {
      request = request.like('action', 'invoice.%');
    } else if (query.category === ActivityLogCategory.EMAIL) {
      request = request.eq('action', 'time_entries.email_draft_opened');
    }

    if (query.cursor) {
      request = request.or(
        `created_at.lt.${query.cursor.createdAt},and(created_at.eq.${query.cursor.createdAt},id.lt.${query.cursor.id})`,
      );
    }

    const { data: rows, error } = await request
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(query.limit + 1)
      .returns<ActivityLogRow[]>();
    throwIfError(error, 'Failed to load activity logs.');

    const allRows = rows ?? [];
    const hasMore = allRows.length > query.limit;
    const pageRows = hasMore ? allRows.slice(0, query.limit) : allRows;
    const last = pageRows.at(-1);

    return {
      logs: pageRows.map((row) => fromActivityLogRow(row)),
      nextCursor:
        hasMore && last ? { createdAt: last.createdAt, id: last.id } : null,
    };
  }
}

function startOfDayIso(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function endOfDayIso(date: string): string {
  return `${date}T23:59:59.999Z`;
}
