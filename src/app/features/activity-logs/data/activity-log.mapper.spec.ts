import { fromActivityLogRow, toActivityLogVM } from './activity-log.mapper';

describe('activity-log.mapper', () => {
  it('maps row to model and vm', () => {
    const model = fromActivityLogRow({
      id: 1,
      action: 'time_entry.created',
      entityType: 'time_entry',
      entityId: 9,
      summary: 'Created time entry',
      metadata: { clientId: 1 },
      createdAt: '2026-05-07T10:00:00.000Z',
    });

    expect(model.metadata).toEqual({ clientId: 1 });
    expect(toActivityLogVM(model).actionLabel).toBe('Time entry created');
  });
});
