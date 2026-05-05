import { TestBed } from '@angular/core/testing';
import { TimeEntriesRepository } from './time-entries.repository';

describe('TimeEntriesRepository', () => {
  let repository: TimeEntriesRepository;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'timesheets.clients',
      JSON.stringify([{ id: 1, name: 'Client A' }]),
    );
    localStorage.setItem(
      'timesheets.projects',
      JSON.stringify([
        { id: 10, clientId: 1, code: 'PRJ', name: 'Project A', useOrders: true },
      ]),
    );
    localStorage.setItem(
      'timesheets.orders',
      JSON.stringify([{ id: 100, projectId: 10, code: 'ORD-1' }]),
    );

    TestBed.configureTestingModule({
      providers: [TimeEntriesRepository],
    });
    repository = TestBed.inject(TimeEntriesRepository);
  });

  it('creates and lists entries in month', async () => {
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
    localStorage.setItem(
      'timesheets.clients',
      JSON.stringify([{ id: 1, name: 'Client A', accentColor: '#22c55e' }]),
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
    await expect(
      repository.createEntry({
        clientId: 1,
        projectId: 10,
        date: '2026-05-10',
        hours: 2,
      }),
    ).rejects.toThrow('Order is required');
  });
});
