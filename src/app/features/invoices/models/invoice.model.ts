import { BillingModel } from '../../projects/models/project.model';

export enum InvoiceStatus {
  CONCEPT = 'concept',
  PROFORMA = 'proforma',
  OPEN = 'open',
  PAID = 'paid',
  CREDITED = 'credited',
}

export interface InvoiceModel {
  id: number;
  clientId: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  subtotalNet: number;
  totalTax: number;
  totalGross: number;
  createdAt: Date;
  openedAt: Date | null;
  paidAt: Date | null;
  creditedAt: Date | null;
}

export interface InvoiceLineItemModel {
  id: number;
  invoiceId: number;
  timeEntryId: number;
  projectId: number;
  orderId: number | null;
  description: string;
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
  createdAt: Date;
}

export type InvoiceGenerateMode = 'per_project' | 'combined';

export interface InvoiceGenerateInput {
  clientId: number;
  billingModel: BillingModel;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus.CONCEPT | InvoiceStatus.PROFORMA | InvoiceStatus.OPEN;
  mode: InvoiceGenerateMode;
  taxRateId: number;
}

export interface InvoicePreviewRequest {
  clientId: number;
  billingModel: BillingModel;
  periodStart: string;
  periodEnd: string;
  mode: InvoiceGenerateMode;
  taxRateId: number;
}

export interface InvoicePreviewLineItem {
  timeEntryId: number;
  projectId: number;
  projectCode: string;
  projectName: string;
  orderId: number | null;
  orderCode: string | null;
  orderTitle: string | null;
  description: string;
  workDate: string;
  hours: number;
  unitRate: number;
  lineNet: number;
  taxAmount: number;
  lineGross: number;
}

export interface InvoicePreviewModel {
  groupKey: string;
  subtotalNet: number;
  totalTax: number;
  totalGross: number;
  lineItems: InvoicePreviewLineItem[];
}

export interface InvoicePeriodOption {
  key: string;
  label: string;
  billingModel: BillingModel;
  periodStart: string;
  periodEnd: string;
}

export interface InvoiceStatusUpdateInput {
  status:
    | InvoiceStatus.CONCEPT
    | InvoiceStatus.PROFORMA
    | InvoiceStatus.OPEN
    | InvoiceStatus.PAID
    | InvoiceStatus.CREDITED;
}
