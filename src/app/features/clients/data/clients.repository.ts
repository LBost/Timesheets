import { Injectable } from '@angular/core';
import { ClientCreateInput, ClientUpdateInput } from '../models/client.model';
import {
  ClientRecord,
  toClientInsertValues,
  toClientModel,
  toClientUpdateValues,
  toClientVM,
} from './client.mapper';
import { ClientVM } from '../models/client.vm';

type ProjectRecord = {
  id: number;
  clientId: number;
  isActive?: boolean;
};

export type DeleteClientResult = {
  mode: 'deleted' | 'archived';
  client: ClientVM | null;
};

const CLIENTS_KEY = 'timesheets.clients';
const PROJECTS_KEY = 'timesheets.projects';

@Injectable({ providedIn: 'root' })
export class ClientsRepository {
  async listClients(): Promise<ClientVM[]> {
    return this.getClientVMs();
  }

  async getClientById(id: number): Promise<ClientVM | null> {
    return this.getClientVMs().then((clients) => clients.find((client) => client.id === id) ?? null);
  }

  async createClient(input: ClientCreateInput): Promise<ClientVM> {
    const payload = toClientInsertValues(input);
    const all = this.readClients();
    const duplicate = all.some((client) => client.name.toLowerCase() === payload.name.toLowerCase());
    if (duplicate) {
      throw new Error('A client with this name already exists.');
    }

    const nextId = all.length === 0 ? 1 : Math.max(...all.map((client) => client.id)) + 1;
    const inserted: ClientRecord = {
      id: nextId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      accentColor: payload.accentColor ?? null,
      isActive: payload.isActive,
      createdAt: new Date(),
    };
    this.writeClients([...all, inserted]);

    return (await this.getClientById(inserted.id)) as ClientVM;
  }

  async updateClient(id: number, input: ClientUpdateInput): Promise<ClientVM | null> {
    const values = toClientUpdateValues(input);
    if (Object.keys(values).length === 0) {
      return this.getClientById(id);
    }

    const all = this.readClients();
    const current = all.find((client) => client.id === id);
    if (!current) {
      return null;
    }

    if (
      values.name &&
      all.some((client) => client.id !== id && client.name.toLowerCase() === values.name?.toLowerCase())
    ) {
      throw new Error('A client with this name already exists.');
    }

    this.writeClients(all.map((client) => (client.id === id ? { ...client, ...values } : client)));
    return this.getClientById(id);
  }

  async archiveClient(id: number): Promise<ClientVM | null> {
    const activeProjectCount = this.readProjects().filter(
      (project) => project.clientId === id && project.isActive !== false
    ).length;

    if (activeProjectCount > 0) {
      throw new Error('Cannot archive a client with active projects.');
    }

    this.writeClients(
      this.readClients().map((client) => (client.id === id ? { ...client, isActive: false } : client))
    );
    return this.getClientById(id);
  }

  async deleteClient(id: number): Promise<DeleteClientResult> {
    const hasProjects = this.readProjects().some((project) => project.clientId === id);
    if (hasProjects) {
      const archived = await this.archiveClient(id);
      return { mode: 'archived', client: archived };
    }

    const existing = this.readClients().some((client) => client.id === id);
    if (!existing) {
      return { mode: 'deleted', client: null };
    }

    this.writeClients(this.readClients().filter((client) => client.id !== id));
    return { mode: 'deleted', client: null };
  }

  private async getClientVMs(): Promise<ClientVM[]> {
    const projectCounts = this.readProjects().reduce<Map<number, number>>((accumulator, project) => {
      const currentCount = accumulator.get(project.clientId) ?? 0;
      accumulator.set(project.clientId, currentCount + 1);
      return accumulator;
    }, new Map<number, number>());

    return this.readClients()
      .map((client) => toClientVM(toClientModel(client), projectCounts.get(client.id) ?? 0))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private readClients(): ClientRecord[] {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Array<Omit<ClientRecord, 'createdAt'> & { createdAt: string }>;
      return parsed.map((item) => ({
        ...item,
        accentColor: item.accentColor ?? null,
        isActive: item.isActive ?? true,
        createdAt: new Date(item.createdAt),
      }));
    } catch {
      return [];
    }
  }

  private writeClients(clientsToPersist: ClientRecord[]): void {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clientsToPersist));
  }

  private readProjects(): ProjectRecord[] {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as ProjectRecord[];
    } catch {
      return [];
    }
  }
}
