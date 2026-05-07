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
  lockedByInvoiceId: number | null;
  lockedAt: Date | null;
  createdAt: Date;
}

/**
 * Raw Supabase row shape using camelCase aliases set in
 * `time-entries.repository.ts`. The `description` column is nullable in
 * Postgres but the runtime model coerces it to an empty string.
 * `createdAt` arrives as an ISO string.
 */
export interface TimeEntryRow {
  id: number;
  clientId: number;
  projectId: number;
  orderId: number | null;
  date: string;
  hours: number;
  description: string | null;
  lockedByInvoiceId: number | null;
  lockedAt: string | null;
  createdAt: string;
}

export function fromTimeEntryRow(row: TimeEntryRow): TimeEntryRecord {
  return {
    id: row.id,
    clientId: row.clientId,
    projectId: row.projectId,
    orderId: row.orderId ?? null,
    date: row.date,
    hours: Number(row.hours),
    description: row.description ?? '',
    lockedByInvoiceId: row.lockedByInvoiceId ?? null,
    lockedAt: row.lockedAt ? new Date(row.lockedAt) : null,
    createdAt: new Date(row.createdAt),
  };
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
    lockedByInvoiceId: record.lockedByInvoiceId,
    lockedAt: record.lockedAt,
    createdAt: record.createdAt,
  };
}

export function toTimeEntryVM(
  model: TimeEntryModel,
  clientName: string,
  clientEmail: string | null,
  clientAccentColor: string | null,
  projectCode: string,
  projectName: string,
  orderCode: string | null,
  orderName: string | null,
): TimeEntryVM {
  return {
    ...model,
    clientName,
    clientEmail,
    clientAccentColor,
    projectCode,
    projectName,
    orderCode,
    orderName,
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
