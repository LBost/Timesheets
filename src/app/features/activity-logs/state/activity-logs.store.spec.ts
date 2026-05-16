import { TestBed } from '@angular/core/testing';

import { ActivityLogCategory } from '../models/activity-log.model';
import { ActivityLogsRepository } from '../data/activity-logs.repository';
import { ActivityLogsStore } from './activity-logs.store';

describe('ActivityLogsStore', () => {
  it('loads and appends activity logs', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({
        logs: [
          {
            id: 1,
            action: 'time_entry.created',
            entityType: 'time_entry',
            entityId: 1,
            summary: 'Created',
            metadata: {},
            createdAt: new Date('2026-05-07'),
          },
        ],
        nextCursor: { createdAt: '2026-05-07T00:00:00.000Z', id: 1 },
      })
      .mockResolvedValueOnce({
        logs: [
          {
            id: 2,
            action: 'invoice.created',
            entityType: 'invoice',
            entityId: 2,
            summary: 'Invoice',
            metadata: {},
            createdAt: new Date('2026-05-06'),
          },
        ],
        nextCursor: null,
      });

    TestBed.configureTestingModule({
      providers: [
        ActivityLogsStore,
        { provide: ActivityLogsRepository, useValue: { list } },
      ],
    });

    const store = TestBed.inject(ActivityLogsStore);
    await store.loadLogs();
    expect(store.logs()).toHaveLength(1);

    await store.loadMoreLogs();
    expect(store.logs()).toHaveLength(2);
    expect(store.nextCursor()).toBeNull();
  });

  it('updates filter state', () => {
    TestBed.configureTestingModule({
      providers: [
        ActivityLogsStore,
        { provide: ActivityLogsRepository, useValue: { list: vi.fn() } },
      ],
    });
    const store = TestBed.inject(ActivityLogsStore);
    store.setCategory(ActivityLogCategory.INVOICES);
    store.setDateRange('2026-05-01', '2026-05-15');
    expect(store.category()).toBe(ActivityLogCategory.INVOICES);
    expect(store.fromDate()).toBe('2026-05-01');
    expect(store.toDate()).toBe('2026-05-15');
  });
});
