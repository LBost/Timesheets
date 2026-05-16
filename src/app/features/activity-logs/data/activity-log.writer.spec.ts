import { TestBed } from '@angular/core/testing';

import { ActivityLogAction } from '../models/activity-log.model';
import { ActivityLogsRepository } from './activity-logs.repository';
import { ActivityLogWriter } from './activity-log.writer';

describe('ActivityLogWriter', () => {
  it('logs without throwing when repository insert fails', async () => {
    const insert = vi.fn().mockRejectedValue(new Error('write failed'));
    TestBed.configureTestingModule({
      providers: [
        ActivityLogWriter,
        { provide: ActivityLogsRepository, useValue: { insert } },
      ],
    });

    const writer = TestBed.inject(ActivityLogWriter);
    writer.logTimeEntryCreated({
      id: 1,
      clientId: 1,
      clientName: 'Acme',
      clientEmail: null,
      clientAccentColor: null,
      projectId: 2,
      projectCode: 'PRJ',
      projectName: 'Project',
      orderId: null,
      orderCode: null,
      orderName: null,
      date: '2026-05-07',
      hours: 2,
      description: '',
      lockedByInvoiceId: null,
      lockedAt: null,
      createdAt: new Date(),
    });

    await Promise.resolve();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: ActivityLogAction.TIME_ENTRY_CREATED }),
    );
  });
});
