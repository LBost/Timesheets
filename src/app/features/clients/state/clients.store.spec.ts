import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ClientsRepository } from '../data/clients.repository';
import { ClientsStore } from './clients.store';

describe('ClientsStore', () => {
  const repositoryMock = {
    listClients: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    archiveClient: vi.fn(),
  };

  beforeEach(() => {
    repositoryMock.listClients.mockReset();
    repositoryMock.createClient.mockReset();
    repositoryMock.updateClient.mockReset();
    repositoryMock.archiveClient.mockReset();

    TestBed.configureTestingModule({
      providers: [{ provide: ClientsRepository, useValue: repositoryMock }],
    });
  });

  it('loads clients into state', async () => {
    const now = new Date('2026-01-01');
    repositoryMock.listClients.mockResolvedValue([
      {
        id: 1,
        name: 'Acme',
        email: null,
        phone: null,
        isActive: true,
        createdAt: now,
        projectCount: 0,
      },
    ]);

    const store = TestBed.inject(ClientsStore);
    await store.loadClients();

    expect(store.clients().length).toBe(1);
    expect(store.error()).toBeNull();
  });

  it('creates and appends a client', async () => {
    const now = new Date('2026-01-01');
    repositoryMock.createClient.mockResolvedValue({
      id: 2,
      name: 'Beta',
      email: 'beta@example.com',
      phone: null,
      isActive: true,
      createdAt: now,
      projectCount: 0,
    });

    const store = TestBed.inject(ClientsStore);
    await store.createClient({ name: 'Beta', email: 'beta@example.com' });

    expect(store.clients().map((client) => client.name)).toContain('Beta');
    expect(store.selectedClientId()).toBe(2);
  });

  it('stores error when archive fails', async () => {
    repositoryMock.archiveClient.mockRejectedValue(
      new Error('Cannot archive a client with active projects.')
    );

    const store = TestBed.inject(ClientsStore);
    await store.archiveClient(5);

    expect(store.error()).toContain('active projects');
  });
});
