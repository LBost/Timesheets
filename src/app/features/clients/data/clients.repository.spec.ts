import { TestBed } from '@angular/core/testing';

import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { createFakeSupabase, FakeTables } from '../../../../testing/supabase-client.fake';
import { ClientsRepository } from './clients.repository';

const USER_ID = '00000000-0000-0000-0000-000000000001';

function configure(tables: Partial<FakeTables>): ClientsRepository {
  const fake = createFakeSupabase(
    {
      clients: [],
      projects: [],
      ...tables,
    },
    { userId: USER_ID },
  );
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [ClientsRepository, { provide: SUPABASE_CLIENT, useValue: fake }],
  });
  return TestBed.inject(ClientsRepository);
}

describe('ClientsRepository', () => {
  it('lists clients with their project counts', async () => {
    const repository = configure({
      clients: [
        { id: 1, user_id: USER_ID, name: 'Acme', email: null, phone: null, accent_color: null, is_active: true, created_at: '2026-01-01T00:00:00Z' },
        { id: 2, user_id: USER_ID, name: 'Beta', email: null, phone: null, accent_color: null, is_active: true, created_at: '2026-01-02T00:00:00Z' },
      ],
      projects: [
        { id: 10, user_id: USER_ID, client_id: 1, is_active: true },
        { id: 11, user_id: USER_ID, client_id: 1, is_active: true },
      ],
    });

    const clients = await repository.listClients();
    expect(clients).toHaveLength(2);
    expect(clients.find((client) => client.name === 'Acme')?.projectCount).toBe(2);
    expect(clients.find((client) => client.name === 'Beta')?.projectCount).toBe(0);
  });

  it('creates a client and returns it with zero projects', async () => {
    const repository = configure({});

    const created = await repository.createClient({ name: 'Acme', email: 'a@example.com' });
    expect(created.name).toBe('Acme');
    expect(created.projectCount).toBe(0);
  });

  it('refuses to archive a client with active projects', async () => {
    const repository = configure({
      clients: [
        { id: 1, user_id: USER_ID, name: 'Acme', email: null, phone: null, accent_color: null, is_active: true, created_at: '2026-01-01T00:00:00Z' },
      ],
      projects: [{ id: 10, user_id: USER_ID, client_id: 1, is_active: true }],
    });

    await expect(repository.archiveClient(1)).rejects.toThrow('Cannot archive a client with active projects.');
  });

  it('archives instead of deleting when projects exist', async () => {
    const repository = configure({
      clients: [
        { id: 1, user_id: USER_ID, name: 'Acme', email: null, phone: null, accent_color: null, is_active: true, created_at: '2026-01-01T00:00:00Z' },
      ],
      projects: [{ id: 10, user_id: USER_ID, client_id: 1, is_active: false }],
    });

    const result = await repository.deleteClient(1);
    expect(result.mode).toBe('archived');
    expect(result.client?.isActive).toBe(false);
  });

  it('deletes a client when no dependent projects exist', async () => {
    const repository = configure({
      clients: [
        { id: 1, user_id: USER_ID, name: 'Acme', email: null, phone: null, accent_color: null, is_active: true, created_at: '2026-01-01T00:00:00Z' },
      ],
    });

    const result = await repository.deleteClient(1);
    expect(result.mode).toBe('deleted');
    expect(result.client).toBeNull();
  });
});
