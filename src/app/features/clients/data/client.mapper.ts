import { normalizeClientAccentHex } from '../../../shared/components/client-accent/client-accent.util';
import { ClientCreateInput, ClientModel, ClientUpdateInput } from '../models/client.model';
import { ClientVM } from '../models/client.vm';

export interface ClientRecord {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  accentColor?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function toClientModel(client: ClientRecord): ClientModel {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    accentColor: normalizeClientAccentHex(client.accentColor) ?? null,
    isActive: client.isActive,
    createdAt: client.createdAt,
  };
}

export function toClientVM(client: ClientModel, projectCount: number): ClientVM {
  return {
    ...client,
    projectCount,
  };
}

export function toClientInsertValues(input: ClientCreateInput) {
  return {
    name: input.name.trim(),
    email: normalizeOptionalText(input.email),
    phone: normalizeOptionalText(input.phone),
    accentColor: normalizeClientAccentHex(input.accentColor),
    isActive: input.isActive ?? true,
  };
}

export function toClientUpdateValues(input: ClientUpdateInput) {
  return {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.email !== undefined ? { email: normalizeOptionalText(input.email) } : {}),
    ...(input.phone !== undefined ? { phone: normalizeOptionalText(input.phone) } : {}),
    ...(input.accentColor !== undefined
      ? { accentColor: normalizeClientAccentHex(input.accentColor) }
      : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };
}
