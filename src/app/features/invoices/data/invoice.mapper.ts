import { InvoiceLineItemModel, InvoiceModel, InvoiceStatus } from '../models/invoice.model';
import { InvoiceLineItemVM, InvoiceVM } from '../models/invoice.vm';
import { TaxRateCreateInput, TaxRateModel } from '../models/tax-rate.model';

export type InvoiceRow = {
  id: number;
  clientId: number;
  invoiceNumber: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  subtotalNet: number;
  totalTax: number;
  totalGross: number;
  createdAt: string;
  openedAt: string | null;
  paidAt: string | null;
  creditedAt: string | null;
};

export type InvoiceLineItemRow = {
  id: number;
  invoiceId: number;
  timeEntryId: number;
  projectId: number;
  orderId: number | null;
  description: string | null;
  workDate: string;
  hours: number;
  unitRate: number;
  lineNet: number;
  taxRateId: number;
  taxCodeSnapshot: string;
  taxLabelSnapshot: string;
  taxPercentageSnapshot: number;
  taxAmount: number;
  lineGross: number;
  createdAt: string;
};

export type TaxRateRow = {
  id: number;
  code: string;
  label: string;
  percentage: number;
  isActive: boolean;
  createdAt: string;
};

export function toInvoiceModel(row: InvoiceRow): InvoiceModel {
  return {
    ...row,
    status: parseInvoiceStatus(row.status),
    createdAt: new Date(row.createdAt),
    openedAt: row.openedAt ? new Date(row.openedAt) : null,
    paidAt: row.paidAt ? new Date(row.paidAt) : null,
    creditedAt: row.creditedAt ? new Date(row.creditedAt) : null,
  };
}

export function toInvoiceVM(model: InvoiceModel, clientName: string, lineItemCount: number): InvoiceVM {
  return { ...model, clientName, lineItemCount };
}

export function toInvoiceLineItemModel(row: InvoiceLineItemRow): InvoiceLineItemModel {
  return {
    ...row,
    description: row.description ?? '',
    createdAt: new Date(row.createdAt),
  };
}

export function toInvoiceLineItemVM(
  model: InvoiceLineItemModel,
  projectCode: string,
  orderCode: string | null,
): InvoiceLineItemVM {
  return { ...model, projectCode, orderCode };
}

export function toTaxRateModel(row: TaxRateRow): TaxRateModel {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
  };
}

export function toTaxRateInsertValues(input: TaxRateCreateInput) {
  return {
    code: input.code.trim().toUpperCase(),
    label: input.label.trim(),
    percentage: Math.max(0, Math.min(10000, Math.trunc(input.percentage))),
  };
}

export function parseInvoiceStatus(value: string): InvoiceStatus {
  const known = Object.values(InvoiceStatus) as string[];
  if (known.includes(value)) {
    return value as InvoiceStatus;
  }
  return InvoiceStatus.CONCEPT;
}
