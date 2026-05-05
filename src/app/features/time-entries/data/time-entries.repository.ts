import { Injectable } from '@angular/core';
import { TimeEntryCreateInput, TimeEntryUpdateInput } from '../models/time-entry.model';
import { TimeEntryVM } from '../models/time-entry.vm';
import { normalizeClientAccentHex } from '../../../shared/components/client-accent/client-accent.util';
import {
  TimeEntryRecord,
  toTimeEntryInsertValues,
  toTimeEntryModel,
  toTimeEntryUpdateValues,
  toTimeEntryVM,
} from './time-entry.mapper';

type ClientRecord = {
  id: number;
  name: string;
  accentColor?: string | null;
  isActive?: boolean;
};

type ProjectRecord = {
  id: number;
  clientId: number;
  code: string;
  name: string;
  useOrders?: boolean;
  isActive?: boolean;
};

type OrderRecord = {
  id: number;
  projectId: number;
  code: string;
  isActive?: boolean;
};

const TIME_ENTRIES_KEY = 'timesheets.timeEntries';
const CLIENTS_KEY = 'timesheets.clients';
const PROJECTS_KEY = 'timesheets.projects';
const ORDERS_KEY = 'timesheets.orders';

@Injectable({ providedIn: 'root' })
export class TimeEntriesRepository {
  async listEntriesForMonth(year: number, month: number): Promise<TimeEntryVM[]> {
    return this.getTimeEntryVMs().then((entries) =>
      entries.filter((entry) => {
        const date = new Date(`${entry.date}T00:00:00`);
        return date.getFullYear() === year && date.getMonth() === month;
      }),
    );
  }

  async getEntryById(id: number): Promise<TimeEntryVM | null> {
    return this.getTimeEntryVMs().then((entries) => entries.find((entry) => entry.id === id) ?? null);
  }

  async createEntry(input: TimeEntryCreateInput): Promise<TimeEntryVM> {
    const payload = toTimeEntryInsertValues(input);
    this.ensureValidCascade(payload.clientId, payload.projectId, payload.orderId);

    const all = this.readEntries();
    const nextId = all.length === 0 ? 1 : Math.max(...all.map((entry) => entry.id)) + 1;
    const created: TimeEntryRecord = {
      id: nextId,
      clientId: payload.clientId,
      projectId: payload.projectId,
      orderId: payload.orderId,
      date: payload.date,
      hours: payload.hours,
      description: payload.description,
      createdAt: new Date(),
    };

    this.writeEntries([...all, created]);
    return (await this.getEntryById(created.id)) as TimeEntryVM;
  }

  async updateEntry(id: number, input: TimeEntryUpdateInput): Promise<TimeEntryVM | null> {
    const values = toTimeEntryUpdateValues(input);
    if (Object.keys(values).length === 0) {
      return this.getEntryById(id);
    }

    const all = this.readEntries();
    const current = all.find((entry) => entry.id === id);
    if (!current) {
      return null;
    }

    const nextClientId = values.clientId ?? current.clientId;
    const nextProjectId = values.projectId ?? current.projectId;
    const nextOrderId = values.orderId ?? current.orderId;
    this.ensureValidCascade(nextClientId, nextProjectId, nextOrderId);

    this.writeEntries(all.map((entry) => (entry.id === id ? { ...entry, ...values } : entry)));
    return this.getEntryById(id);
  }

  async deleteEntry(id: number): Promise<boolean> {
    const all = this.readEntries();
    const exists = all.some((entry) => entry.id === id);
    if (!exists) {
      return false;
    }

    this.writeEntries(all.filter((entry) => entry.id !== id));
    return true;
  }

  private async getTimeEntryVMs(): Promise<TimeEntryVM[]> {
    const clientsById = new Map(this.readClients().map((client) => [client.id, client]));
    const projectsById = new Map(this.readProjects().map((project) => [project.id, project]));
    const ordersById = new Map(this.readOrders().map((order) => [order.id, order]));

    return this.readEntries()
      .map((entry) => {
        const model = toTimeEntryModel(entry);
        const client = clientsById.get(model.clientId);
        const project = projectsById.get(model.projectId);
        const order = model.orderId === null ? null : ordersById.get(model.orderId);
        return toTimeEntryVM(
          model,
          client?.name ?? 'Unknown client',
          normalizeClientAccentHex(client?.accentColor) ?? null,
          project?.code ?? 'UNKNOWN',
          project?.name ?? 'Unknown project',
          order?.code ?? null,
        );
      })
      .sort((left, right) => left.date.localeCompare(right.date) || left.id - right.id);
  }

  private ensureValidCascade(clientId: number, projectId: number, orderId: number | null): void {
    const client = this.readClients().find((item) => item.id === clientId);
    if (!client) {
      throw new Error('Selected client does not exist.');
    }
    if (client.isActive === false) {
      throw new Error('Selected client is inactive.');
    }

    const project = this.readProjects().find((item) => item.id === projectId);
    if (!project) {
      throw new Error('Selected project does not exist.');
    }
    if (project.isActive === false) {
      throw new Error('Selected project is inactive.');
    }
    if (project.clientId !== clientId) {
      throw new Error('Selected project does not belong to the selected client.');
    }

    const useOrders = project.useOrders ?? false;
    if (useOrders) {
      if (orderId === null) {
        throw new Error('Order is required for projects that use orders.');
      }

      const order = this.readOrders().find((item) => item.id === orderId);
      if (!order || order.projectId !== projectId) {
        throw new Error('Selected order does not belong to the selected project.');
      }
      if (order.isActive === false) {
        throw new Error('Selected order is inactive.');
      }
      return;
    }

    if (orderId !== null) {
      throw new Error('Orders are not allowed for the selected project.');
    }
  }

  private readEntries(): TimeEntryRecord[] {
    const raw = localStorage.getItem(TIME_ENTRIES_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Array<
        Partial<Omit<TimeEntryRecord, 'createdAt'>> & { createdAt?: string; workDate?: string }
      >;
      return parsed
        .filter((item) => typeof item.id === 'number' && typeof item.projectId === 'number')
        .map((item) => ({
          id: item.id as number,
          clientId: (item.clientId as number | undefined) ?? 0,
          projectId: item.projectId as number,
          orderId: typeof item.orderId === 'number' ? item.orderId : null,
          date: (item.date ?? item.workDate ?? '').toString(),
          hours: Number(item.hours ?? 0),
          description: (item.description ?? '').toString(),
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        }));
    } catch {
      return [];
    }
  }

  private writeEntries(entries: TimeEntryRecord[]): void {
    localStorage.setItem(TIME_ENTRIES_KEY, JSON.stringify(entries));
  }

  private readClients(): ClientRecord[] {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as ClientRecord[];
    } catch {
      return [];
    }
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

  private readOrders(): OrderRecord[] {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as OrderRecord[];
    } catch {
      return [];
    }
  }
}
