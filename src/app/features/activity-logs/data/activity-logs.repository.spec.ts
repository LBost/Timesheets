import { TestBed } from '@angular/core/testing';

import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { createFakeSupabase } from '../../../../testing/supabase-client.fake';
import { ActivityLogCategory } from '../models/activity-log.model';
import { ActivityLogsRepository } from './activity-logs.repository';

const USER_ID = '00000000-0000-0000-0000-000000000001';

describe('ActivityLogsRepository', () => {
  let repository: ActivityLogsRepository;

  beforeEach(() => {
    const fake = createFakeSupabase(
      {
        activity_logs: [
          {
            id: 1,
            user_id: USER_ID,
            action: 'time_entry.created',
            entity_type: 'time_entry',
            entity_id: 10,
            summary: 'Created entry',
            metadata: {},
            created_at: '2026-05-10T12:00:00.000Z',
          },
          {
            id: 2,
            user_id: USER_ID,
            action: 'invoice.created',
            entity_type: 'invoice',
            entity_id: 3,
            summary: 'Created invoice',
            metadata: {},
            created_at: '2026-05-09T12:00:00.000Z',
          },
        ],
      },
      { userId: USER_ID },
    );

    TestBed.configureTestingModule({
      providers: [
        ActivityLogsRepository,
        { provide: SUPABASE_CLIENT, useValue: fake.asSupabaseClient() },
      ],
    });
    repository = TestBed.inject(ActivityLogsRepository);
  });

  it('inserts activity log rows', async () => {
    await repository.insert({
      action: 'time_entry.updated',
      entityType: 'time_entry',
      entityId: 11,
      summary: 'Updated entry',
    });

    const result = await repository.list({
      category: ActivityLogCategory.ALL,
      fromDate: '2026-05-01',
      toDate: '2026-05-31',
      limit: 10,
      cursor: null,
    });
    expect(result.logs.some((log) => log.action === 'time_entry.updated')).toBe(true);
  });

  it('filters by invoice category', async () => {
    const result = await repository.list({
      category: ActivityLogCategory.INVOICES,
      fromDate: '2026-05-01',
      toDate: '2026-05-31',
      limit: 10,
      cursor: null,
    });
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].action).toBe('invoice.created');
  });
});
