import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ClientCreateInput, ClientUpdateInput } from '../models/client.model';
import { ClientsRepository } from '../data/clients.repository';
import { ClientVM } from '../models/client.vm';

type ClientsState = {
  clients: ClientVM[];
  selectedClientId: number | null;
  isLoading: boolean;
  hasLoaded: boolean;
  lastLoadedAt: number | null;
  error: string | null;
};

const initialState: ClientsState = {
  clients: [],
  selectedClientId: null,
  isLoading: false,
  hasLoaded: false,
  lastLoadedAt: null,
  error: null,
};

export const ClientsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    selectedClient: computed(
      () => store.clients().find((client) => client.id === store.selectedClientId()) ?? null
    ),
  })),
  withMethods((store, repository = inject(ClientsRepository)) => {
    const loadClients = async (): Promise<void> => {
      patchState(store, { isLoading: true, error: null });
      try {
        const clients = await repository.listClients();
        patchState(store, {
          clients,
          isLoading: false,
          hasLoaded: true,
          lastLoadedAt: Date.now(),
        });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load clients.',
        });
      }
    };

    return {
      async loadClients(): Promise<void> {
        await loadClients();
      },
      async loadClientsIfNeeded(): Promise<void> {
        if (store.hasLoaded()) {
          return;
        }
        await loadClients();
      },
      selectClient(id: number | null): void {
        patchState(store, { selectedClientId: id });
      },
      async createClient(input: ClientCreateInput): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const client = await repository.createClient(input);
          patchState(store, (state) => ({
            clients: [...state.clients, client].sort((a, b) => a.name.localeCompare(b.name)),
            selectedClientId: client.id,
            isLoading: false,
          }));
        } catch (error) {
          patchState(store, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to create client.',
          });
        }
      },
      async updateClient(id: number, input: ClientUpdateInput): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const updated = await repository.updateClient(id, input);
          if (!updated) {
            patchState(store, { isLoading: false, error: 'Client not found.' });
            return;
          }

          patchState(store, (state) => ({
            clients: state.clients
              .map((client) => (client.id === id ? updated : client))
              .sort((a, b) => a.name.localeCompare(b.name)),
            isLoading: false,
          }));
        } catch (error) {
          patchState(store, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update client.',
          });
        }
      },
      async archiveClient(id: number): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const archived = await repository.archiveClient(id);
          if (!archived) {
            patchState(store, { isLoading: false, error: 'Client not found.' });
            return;
          }

          patchState(store, (state) => ({
            clients: state.clients.map((client) => (client.id === id ? archived : client)),
            isLoading: false,
          }));
        } catch (error) {
          patchState(store, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to archive client.',
          });
        }
      },
      async deleteClient(id: number): Promise<'deleted' | 'archived' | null> {
        patchState(store, { isLoading: true, error: null });
        try {
          const result = await repository.deleteClient(id);
          if (result.mode === 'archived' && !result.client) {
            patchState(store, { isLoading: false, error: 'Client not found.' });
            return null;
          }
          patchState(store, (state) => ({
            clients:
              result.mode === 'deleted'
                ? state.clients.filter((client) => client.id !== id)
                : state.clients.map((client) => (client.id === id ? result.client ?? client : client)),
            selectedClientId: state.selectedClientId === id ? null : state.selectedClientId,
            isLoading: false,
          }));
          return result.mode;
        } catch (error) {
          patchState(store, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to delete client.',
          });
          return null;
        }
      },
    };
  })
);
