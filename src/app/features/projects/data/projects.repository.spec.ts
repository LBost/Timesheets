import { TestBed } from '@angular/core/testing';

import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { createFakeSupabase, FakeTables } from '../../../../testing/supabase-client.fake';
import { ProjectsRepository } from './projects.repository';

const USER_ID = '00000000-0000-0000-0000-000000000001';

function configure(tables: Partial<FakeTables>): ProjectsRepository {
  const fake = createFakeSupabase(
    {
      clients: [
        { id: 1, user_id: USER_ID, name: 'Acme', is_active: true },
      ],
      projects: [],
      orders: [],
      time_entries: [],
      ...tables,
    },
    { userId: USER_ID },
  );
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [ProjectsRepository, { provide: SUPABASE_CLIENT, useValue: fake }],
  });
  return TestBed.inject(ProjectsRepository);
}

describe('ProjectsRepository', () => {
  it('creates a project and returns it with the client name', async () => {
    const repository = configure({});

    const project = await repository.createProject({
      name: 'Website redesign',
      code: 'wr-1',
      unitRate: 120,
      clientId: 1,
    });

    expect(project.name).toBe('Website redesign');
    expect(project.code).toBe('WR-1');
    expect(project.clientName).toBe('Acme');
    expect(project.timeEntryCount).toBe(0);
  });

  it('rejects projects against inactive clients', async () => {
    const repository = configure({
      clients: [{ id: 1, user_id: USER_ID, name: 'Acme', is_active: false }],
    });

    await expect(
      repository.createProject({ name: 'X', code: 'X', unitRate: 1, clientId: 1 }),
    ).rejects.toThrow('Selected client is inactive.');
  });

  it('archives instead of deleting when entries exist', async () => {
    const repository = configure({
      projects: [
        {
          id: 10,
          user_id: USER_ID,
          client_id: 1,
          code: 'P',
          name: 'P',
          unit_rate: 100,
          unit: 'hours',
          currency: 'EUR',
          billing_model: null,
          use_orders: false,
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      time_entries: [{ id: 1, user_id: USER_ID, project_id: 10 }],
    });

    const result = await repository.deleteProject(10);
    expect(result.mode).toBe('archived');
    expect(result.project?.isActive).toBe(false);
  });
});
