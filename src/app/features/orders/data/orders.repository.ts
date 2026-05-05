import { Injectable } from '@angular/core';
import { OrderCreateInput, OrderUpdateInput } from '../models/order.model';
import { OrderVM } from '../models/order.vm';
import {
  OrderRecord,
  toOrderInsertValues,
  toOrderModel,
  toOrderUpdateValues,
  toOrderVM,
} from './order.mapper';

type ProjectRecord = {
  id: number;
  code: string;
  name: string;
  useOrders?: boolean;
  isActive: boolean;
};

type TimeEntryRecord = {
  id: number;
  orderId?: number;
};

const ORDERS_KEY = 'timesheets.orders';
const PROJECTS_KEY = 'timesheets.projects';
const TIME_ENTRIES_KEY = 'timesheets.timeEntries';

@Injectable({ providedIn: 'root' })
export class OrdersRepository {
  async listOrders(): Promise<OrderVM[]> {
    return this.getOrderVMs();
  }

  async getOrderById(id: number): Promise<OrderVM | null> {
    return this.getOrderVMs().then((orders) => orders.find((order) => order.id === id) ?? null);
  }

  async createOrder(input: OrderCreateInput): Promise<OrderVM> {
    const payload = toOrderInsertValues(input);
    const all = this.readOrders();
    this.ensureProjectSupportsOrders(payload.projectId);
    this.ensureUniqueProjectCode(all, payload.projectId, payload.code);

    const nextId = all.length === 0 ? 1 : Math.max(...all.map((order) => order.id)) + 1;
    const created: OrderRecord = {
      id: nextId,
      code: payload.code,
      title: payload.title,
      projectId: payload.projectId,
      isActive: payload.isActive,
      createdAt: new Date(),
    };
    this.writeOrders([...all, created]);
    return (await this.getOrderById(created.id)) as OrderVM;
  }

  async updateOrder(id: number, input: OrderUpdateInput): Promise<OrderVM | null> {
    const values = toOrderUpdateValues(input);
    if (Object.keys(values).length === 0) {
      return this.getOrderById(id);
    }

    const all = this.readOrders();
    const current = all.find((order) => order.id === id);
    if (!current) {
      return null;
    }

    const candidateProjectId = values.projectId ?? current.projectId;
    const candidateCode = values.code ?? current.code;
    this.ensureProjectSupportsOrders(candidateProjectId);
    this.ensureUniqueProjectCode(all.filter((order) => order.id !== id), candidateProjectId, candidateCode);

    this.writeOrders(all.map((order) => (order.id === id ? { ...order, ...values } : order)));
    return this.getOrderById(id);
  }

  async archiveOrder(id: number): Promise<OrderVM | null> {
    this.writeOrders(this.readOrders().map((order) => (order.id === id ? { ...order, isActive: false } : order)));
    return this.getOrderById(id);
  }

  async deleteOrder(id: number): Promise<boolean> {
    const existing = this.readOrders().some((order) => order.id === id);
    if (!existing) {
      return false;
    }

    this.writeOrders(this.readOrders().filter((order) => order.id !== id));
    return true;
  }

  private async getOrderVMs(): Promise<OrderVM[]> {
    const projectById = new Map(this.readProjects().map((project) => [project.id, project]));
    const timeEntryCountByOrderId = this.readTimeEntries().reduce<Map<number, number>>((acc, entry) => {
      if (typeof entry.orderId === 'number') {
        acc.set(entry.orderId, (acc.get(entry.orderId) ?? 0) + 1);
      }
      return acc;
    }, new Map<number, number>());

    return this.readOrders()
      .map((order) => {
        const project = projectById.get(order.projectId);
        return toOrderVM(
          toOrderModel(order),
          project?.code ?? 'UNKNOWN',
          project?.name ?? 'Unknown project',
          timeEntryCountByOrderId.get(order.id) ?? 0
        );
      })
      .sort((left, right) => left.code.localeCompare(right.code));
  }

  private ensureProjectSupportsOrders(projectId: number): void {
    const project = this.readProjects().find((item) => item.id === projectId);
    if (!project) {
      throw new Error('Selected project does not exist.');
    }
    if (!project.useOrders) {
      throw new Error('Selected project does not use orders.');
    }
    if (project.isActive === false) {
      throw new Error('Selected project is inactive.');
    }
  }

  private ensureUniqueProjectCode(orders: OrderRecord[], projectId: number, code: string): void {
    const duplicate = orders.some(
      (order) => order.projectId === projectId && order.code.toUpperCase() === code.toUpperCase()
    );
    if (duplicate) {
      throw new Error('An order with this code already exists for the selected project.');
    }
  }

  private readOrders(): OrderRecord[] {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Array<Omit<OrderRecord, 'createdAt'> & { createdAt: string }>;
      return parsed.map((item) => ({
        ...item,
        isActive: item.isActive ?? true,
        createdAt: new Date(item.createdAt),
      }));
    } catch {
      return [];
    }
  }

  private writeOrders(orders: OrderRecord[]): void {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
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
}
