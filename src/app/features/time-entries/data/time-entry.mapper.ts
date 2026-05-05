import { TimeEntryCreateInput, TimeEntryModel, TimeEntryUpdateInput } from '../models/time-entry.model';
import { TimeEntryVM } from '../models/time-entry.vm';

export interface TimeEntryRecord {
  id: number;
  clientId: number;
  projectId: number;
  orderId: number | null;
  date: string;
  hours: number;
  description: string;
  createdAt: Date;
}

export function toTimeEntryModel(record: TimeEntryRecord): TimeEntryModel {
  return {
    id: record.id,
    clientId: record.clientId,
    projectId: record.projectId,
    orderId: record.orderId,
    date: record.date,
    hours: record.hours,
    description: record.description,
    createdAt: record.createdAt,
  };
}

export function toTimeEntryVM(
  model: TimeEntryModel,
  clientName: string,
  clientAccentColor: string | null,
  projectCode: string,
  projectName: string,
  orderCode: string | null,
): TimeEntryVM {
  return {
    ...model,
    clientName,
    clientAccentColor,
    projectCode,
    projectName,
    orderCode,
  };
}

export function toTimeEntryInsertValues(input: TimeEntryCreateInput) {
  return {
    clientId: input.clientId,
    projectId: input.projectId,
    orderId: input.orderId ?? null,
    date: (input.date ?? '').trim(),
    hours: Number(input.hours ?? 0),
    description: (input.description ?? '').trim(),
  };
}

export function toTimeEntryUpdateValues(input: TimeEntryUpdateInput) {
  return {
    ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
    ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
    ...(input.orderId !== undefined ? { orderId: input.orderId } : {}),
    ...(input.date !== undefined ? { date: input.date.trim() } : {}),
    ...(input.hours !== undefined ? { hours: Number(input.hours) } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
  };
}
