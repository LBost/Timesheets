import { ProjectCreateInput, ProjectModel, ProjectUpdateInput } from '../models/project.model';
import { ProjectVM } from '../models/project.vm';

export interface ProjectRecord {
  id: number;
  name: string;
  code: string;
  unitRate: number;
  unit: string;
  currency: string;
  billingModel: ProjectModel['billingModel'];
  useOrders: boolean;
  clientId: number;
  isActive: boolean;
  createdAt: Date;
}

export function toProjectModel(project: ProjectRecord): ProjectModel {
  return {
    id: project.id,
    name: project.name,
    code: project.code,
    unitRate: project.unitRate,
    unit: project.unit,
    currency: project.currency,
    billingModel: project.billingModel,
    useOrders: project.useOrders,
    clientId: project.clientId,
    isActive: project.isActive,
    createdAt: project.createdAt,
  };
}

export function toProjectVM(project: ProjectModel, clientName: string, timeEntryCount: number): ProjectVM {
  return {
    ...project,
    clientName,
    timeEntryCount,
  };
}

export function toProjectInsertValues(input: ProjectCreateInput) {
  return {
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    unitRate: input.unitRate,
    unit: input.unit?.trim() || 'hours',
    currency: input.currency?.trim().toUpperCase() || 'EUR',
    billingModel: input.billingModel ?? null,
    useOrders: input.useOrders ?? false,
    clientId: input.clientId,
    isActive: input.isActive ?? true,
  };
}

export function toProjectUpdateValues(input: ProjectUpdateInput) {
  return {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.code !== undefined ? { code: input.code.trim().toUpperCase() } : {}),
    ...(input.unitRate !== undefined ? { unitRate: input.unitRate } : {}),
    ...(input.unit !== undefined ? { unit: input.unit.trim() || 'hours' } : {}),
    ...(input.currency !== undefined ? { currency: input.currency.trim().toUpperCase() || 'EUR' } : {}),
    ...(input.billingModel !== undefined ? { billingModel: input.billingModel } : {}),
    ...(input.useOrders !== undefined ? { useOrders: input.useOrders } : {}),
    ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };
}
