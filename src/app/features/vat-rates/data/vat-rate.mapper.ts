import { VatRateCreateInput, VatRateModel, VatRateUpdateInput } from '../models/vat-rate.model';
import { VatRateVM } from '../models/vat-rate.vm';

export interface VatRateRecord {
  id: number;
  code: string;
  label: string;
  percentage: number;
  isActive: boolean;
  createdAt: Date;
}

export interface VatRateRow {
  id: number;
  code: string;
  label: string;
  percentage: number;
  isActive: boolean;
  createdAt: string;
}

export function fromVatRateRow(row: VatRateRow): VatRateRecord {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    percentage: row.percentage,
    isActive: row.isActive,
    createdAt: new Date(row.createdAt),
  };
}

export function toVatRateModel(record: VatRateRecord): VatRateModel {
  return {
    id: record.id,
    code: record.code,
    label: record.label,
    percentage: record.percentage,
    isActive: record.isActive,
    createdAt: record.createdAt,
  };
}

export function toVatRateVM(model: VatRateModel, invoiceLineItemCount: number): VatRateVM {
  return {
    ...model,
    invoiceLineItemCount,
  };
}

function normalizePercentage(value: number): number {
  return Math.max(0, Math.min(10000, Math.trunc(value)));
}

export function toVatRateInsertValues(input: VatRateCreateInput) {
  return {
    code: input.code.trim().toUpperCase(),
    label: input.label.trim(),
    percentage: normalizePercentage(input.percentage),
    isActive: input.isActive ?? true,
  };
}

export function toVatRateUpdateValues(input: VatRateUpdateInput) {
  return {
    ...(input.code !== undefined ? { code: input.code.trim().toUpperCase() } : {}),
    ...(input.label !== undefined ? { label: input.label.trim() } : {}),
    ...(input.percentage !== undefined ? { percentage: normalizePercentage(input.percentage) } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };
}
