import { InvoiceLineItemModel, InvoiceModel } from './invoice.model';

export interface InvoiceVM extends InvoiceModel {
  clientName: string;
  lineItemCount: number;
}

export interface InvoiceLineItemVM extends InvoiceLineItemModel {
  projectCode: string;
  orderCode: string | null;
}
