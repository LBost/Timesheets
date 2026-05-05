import { Injectable } from '@angular/core';
import { ProjectCreateInput, ProjectUpdateInput } from '../models/project.model';
import { ProjectVM } from '../models/project.vm';
import {
  ProjectRecord,
  toProjectInsertValues,
  toProjectModel,
  toProjectUpdateValues,
  toProjectVM,
} from './project.mapper';

type ClientRecord = {
  id: number;
  name: string;
  isActive?: boolean;
};

type TimeEntryRecord = {
  id: number;
  projectId?: number;
  orderId?: number;
  project?: string;
};

type OrderRecord = {
  id: number;
  projectId: number;
};

export type DeleteProjectResult = {
  mode: 'deleted' | 'archived';
  project: ProjectVM | null;
};

const PROJECTS_KEY = 'timesheets.projects';
const CLIENTS_KEY = 'timesheets.clients';
const TIME_ENTRIES_KEY = 'timesheets.timeEntries';
const ORDERS_KEY = 'timesheets.orders';

@Injectable({ providedIn: 'root' })
export class ProjectsRepository {
  async listProjects(): Promise<ProjectVM[]> {
    return this.getProjectVMs();
  }

  async getProjectById(id: number): Promise<ProjectVM | null> {
    return this.getProjectVMs().then((projects) => projects.find((project) => project.id === id) ?? null);
  }

  async createProject(input: ProjectCreateInput): Promise<ProjectVM> {
    const payload = toProjectInsertValues(input);
    this.ensureActiveClient(payload.clientId);
    const all = this.readProjects();
    this.ensureUniqueClientCode(all, payload.clientId, payload.code);

    const nextId = all.length === 0 ? 1 : Math.max(...all.map((project) => project.id)) + 1;
    const created: ProjectRecord = {
      id: nextId,
      name: payload.name,
      code: payload.code,
      unitRate: payload.unitRate,
      unit: payload.unit,
      currency: payload.currency,
      billingModel: payload.billingModel,
      useOrders: payload.useOrders,
      clientId: payload.clientId,
      isActive: payload.isActive,
      createdAt: new Date(),
    };
    this.writeProjects([...all, created]);
    return (await this.getProjectById(created.id)) as ProjectVM;
  }

  async updateProject(id: number, input: ProjectUpdateInput): Promise<ProjectVM | null> {
    const values = toProjectUpdateValues(input);
    if (Object.keys(values).length === 0) {
      return this.getProjectById(id);
    }

    const all = this.readProjects();
    const current = all.find((project) => project.id === id);
    if (!current) {
      return null;
    }

    const candidateClientId = values.clientId ?? current.clientId;
    const candidateCode = values.code ?? current.code;
    this.ensureActiveClient(candidateClientId);
    this.ensureUniqueClientCode(all.filter((project) => project.id !== id), candidateClientId, candidateCode);

    this.writeProjects(all.map((project) => (project.id === id ? { ...project, ...values } : project)));
    return this.getProjectById(id);
  }

  async archiveProject(id: number): Promise<ProjectVM | null> {
    this.writeProjects(
      this.readProjects().map((project) => (project.id === id ? { ...project, isActive: false } : project))
    );
    return this.getProjectById(id);
  }

  async deleteProject(id: number): Promise<DeleteProjectResult> {
    const hasOrders = this.readOrders().some((order) => order.projectId === id);
    const hasTimeEntries = this.readTimeEntries().some((entry) => entry.projectId === id);
    if (hasOrders || hasTimeEntries) {
      const archived = await this.archiveProject(id);
      return { mode: 'archived', project: archived };
    }

    const existing = this.readProjects().some((project) => project.id === id);
    if (!existing) {
      return { mode: 'deleted', project: null };
    }

    this.writeProjects(this.readProjects().filter((project) => project.id !== id));
    return { mode: 'deleted', project: null };
  }

  private async getProjectVMs(): Promise<ProjectVM[]> {
    const clients = this.readClients();
    const clientNameById = new Map(clients.map((client) => [client.id, client.name]));
    const timeEntryCountByProjectId = this.readTimeEntries().reduce<Map<number, number>>((acc, entry) => {
      if (typeof entry.projectId === 'number') {
        acc.set(entry.projectId, (acc.get(entry.projectId) ?? 0) + 1);
      }
      return acc;
    }, new Map<number, number>());

    return this.readProjects()
      .map((project) =>
        toProjectVM(
          toProjectModel(project),
          clientNameById.get(project.clientId) ?? 'Unknown client',
          timeEntryCountByProjectId.get(project.id) ?? 0
        )
      )
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private ensureUniqueClientCode(projects: ProjectRecord[], clientId: number, code: string): void {
    const duplicate = projects.some(
      (project) => project.clientId === clientId && project.code.toUpperCase() === code.toUpperCase()
    );
    if (duplicate) {
      throw new Error('A project with this code already exists for the selected client.');
    }
  }

  private ensureActiveClient(clientId: number): void {
    const client = this.readClients().find((item) => item.id === clientId);
    if (!client) {
      throw new Error('Selected client does not exist.');
    }
    if (client.isActive === false) {
      throw new Error('Selected client is inactive.');
    }
  }

  private readProjects(): ProjectRecord[] {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Array<Omit<ProjectRecord, 'createdAt'> & { createdAt: string }>;
      return parsed.map((item) => ({
        ...item,
        useOrders: item.useOrders ?? false,
        isActive: item.isActive ?? true,
        createdAt: new Date(item.createdAt),
      }));
    } catch {
      return [];
    }
  }

  private writeProjects(projects: ProjectRecord[]): void {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
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

  private readTimeEntries(): TimeEntryRecord[] {
    const raw = localStorage.getItem(TIME_ENTRIES_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as TimeEntryRecord[];
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
