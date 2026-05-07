import { TestBed } from '@angular/core/testing';

import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { createFakeSupabase, FakeTables } from '../../../../testing/supabase-client.fake';
import { TimeEntriesRepository } from './time-entries.repository';

const USER_ID = '00000000-0000-0000-0000-000000000001';

function seed(overrides: Partial<FakeTables> = {}): FakeTables {
  return {
    clients: [
      { id: 1, user_id: USER_ID, name: 'Client A', accent_color: null, is_active: true },
    ],
    projects: [
      {
        id: 10,
        user_id: USER_ID,
        client_id: 1,
        code: 'PRJ',
        name: 'Project A',
        use_orders: true,
        is_active: true,
      },
    ],
    orders: [
      { id: 100, user_id: USER_ID, project_id: 10, code: 'ORD-1', is_active: true },
    ],
    time_entries: [],
    ...overrides,
  };
}

describe('TimeEntriesRepository', () => {
  let repository: TimeEntriesRepository;

  function configure(tables: FakeTables): void {
    const fake = createFakeSupabase(tables, { userId: USER_ID });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        TimeEntriesRepository,
        { provide: SUPABASE_CLIENT, useValue: fake },
      ],
    });
    repository = TestBed.inject(TimeEntriesRepository);
  }

  it('creates and lists entries in month', async () => {
    configure(seed());

    await repository.createEntry({
      clientId: 1,
      projectId: 10,
      orderId: 100,
      date: '2026-05-10',
      hours: 2.5,
      description: 'Test',
    });

    const entries = await repository.listEntriesForMonth(2026, 4);
    expect(entries).toHaveLength(1);
    expect(entries[0].clientName).toBe('Client A');
    expect(entries[0].clientAccentColor).toBeNull();
  });

  it('hydrates client accent color on entries', async () => {
    configure(
      seed({
        clients: [
          { id: 1, user_id: USER_ID, name: 'Client A', accent_color: '#22c55e', is_active: true },
        ],
      }),
    );

    await repository.createEntry({
      clientId: 1,
      projectId: 10,
      orderId: 100,
      date: '2026-05-10',
      hours: 1,
      description: 'A',
    });

    const entries = await repository.listEntriesForMonth(2026, 4);
    expect(entries[0].clientAccentColor).toBe('#22c55e');
  });

  it('enforces order when project uses orders', async () => {
    configure(seed());

    await expect(
      repository.createEntry({
        clientId: 1,
        projectId: 10,
        date: '2026-05-10',
        hours: 2,
      }),
    ).rejects.toThrow('Order is required');
  });

  it('rejects orders for projects that do not use them', async () => {
    configure(
      seed({
        projects: [
          {
            id: 10,
            user_id: USER_ID,
            client_id: 1,
            code: 'PRJ',
            name: 'Project A',
            use_orders: false,
            is_active: true,
          },
        ],
      }),
    );

    await expect(
      repository.createEntry({
        clientId: 1,
        projectId: 10,
        orderId: 100,
        date: '2026-05-10',
        hours: 2,
      }),
    ).rejects.toThrow('Orders are not allowed');
  });

  it('filters entries outside the requested month', async () => {
    configure(seed());

    await repository.createEntry({
      clientId: 1,
      projectId: 10,
      orderId: 100,
      date: '2026-04-29',
      hours: 1,
    });
    await repository.createEntry({
      clientId: 1,
      projectId: 10,
      orderId: 100,
      date: '2026-05-15',
      hours: 1,
    });

    const may = await repository.listEntriesForMonth(2026, 4);
    expect(may).toHaveLength(1);
    expect(may[0].date).toBe('2026-05-15');
  });

  it('rejects updates for locked entries', async () => {
    configure(
      seed({
        time_entries: [
          {
            id: 200,
            user_id: USER_ID,
            client_id: 1,
            project_id: 10,
            order_id: 100,
            date: '2026-05-10',
            hours: 2,
            description: 'Locked',
            locked_by_invoice_id: 99,
            locked_at: '2026-05-11T00:00:00Z',
          },
        ],
      }),
    );

    await expect(repository.updateEntry(200, { hours: 3 })).rejects.toThrow('locked by an open invoice');
  });

  it('rejects delete for locked entries', async () => {
    configure(
      seed({
        time_entries: [
          {
            id: 201,
            user_id: USER_ID,
            client_id: 1,
            project_id: 10,
            order_id: 100,
            date: '2026-05-10',
            hours: 2,
            description: 'Locked',
            locked_by_invoice_id: 99,
            locked_at: '2026-05-11T00:00:00Z',
          },
        ],
      }),
    );

    await expect(repository.deleteEntry(201)).rejects.toThrow('locked by an open invoice');
  });
});
