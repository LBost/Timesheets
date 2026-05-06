import { OrderCreateInput, OrderModel, OrderUpdateInput } from '../models/order.model';
import { OrderVM } from '../models/order.vm';

export interface OrderRecord {
  id: number;
  code: string;
  title: string;
  projectId: number;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Raw Supabase row using camelCase aliases (`projectId:project_id`, etc.) set
 * in `orders.repository.ts`. `createdAt` arrives as an ISO string.
 */
export interface OrderRow {
  id: number;
  code: string;
  title: string;
  projectId: number;
  isActive: boolean;
  createdAt: string;
}

export function fromOrderRow(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    projectId: row.projectId,
    isActive: row.isActive,
    createdAt: new Date(row.createdAt),
  };
}

export function toOrderModel(order: OrderRecord): OrderModel {
  return {
    id: order.id,
    code: order.code,
    title: order.title,
    projectId: order.projectId,
    isActive: order.isActive,
    createdAt: order.createdAt,
  };
}

export function toOrderVM(
  order: OrderModel,
  projectCode: string,
  projectName: string,
  timeEntryCount: number
): OrderVM {
  return {
    ...order,
    projectCode,
    projectName,
    timeEntryCount,
  };
}

export function toOrderInsertValues(input: OrderCreateInput) {
  return {
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    projectId: input.projectId,
    isActive: input.isActive ?? true,
  };
}

export function toOrderUpdateValues(input: OrderUpdateInput) {
  return {
    ...(input.code !== undefined ? { code: input.code.trim().toUpperCase() } : {}),
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };
}
