import { VatRateModel } from './vat-rate.model';

export interface VatRateVM extends VatRateModel {
  invoiceLineItemCount: number;
}
