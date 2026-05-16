import { ActivityLogCategory } from './activity-log.model';
import { matchesActivityLogCategory } from './activity-log.filters';

describe('activity-log.filters', () => {
  it('matches categories by action prefix', () => {
    expect(matchesActivityLogCategory('time_entry.created', ActivityLogCategory.TIME_ENTRIES)).toBe(
      true,
    );
    expect(matchesActivityLogCategory('invoice.created', ActivityLogCategory.INVOICES)).toBe(true);
    expect(
      matchesActivityLogCategory(
        'time_entries.email_draft_opened',
        ActivityLogCategory.EMAIL,
      ),
    ).toBe(true);
    expect(matchesActivityLogCategory('invoice.created', ActivityLogCategory.EMAIL)).toBe(false);
  });
});
