import { InvoiceStatus } from '../models/invoice.model';
import { parseInvoiceStatus, toTaxRateInsertValues } from './invoice.mapper';

describe('invoice.mapper', () => {
  it('normalizes tax rate insert values', () => {
    expect(
      toTaxRateInsertValues({
        code: ' vat19 ',
        label: ' VAT 19 ',
        percentage: 1900.8,
      }),
    ).toEqual({
      code: 'VAT19',
      label: 'VAT 19',
      percentage: 1900,
    });
  });

  it('falls back to concept on unknown status', () => {
    expect(parseInvoiceStatus('nope')).toBe(InvoiceStatus.CONCEPT);
    expect(parseInvoiceStatus(InvoiceStatus.OPEN)).toBe(InvoiceStatus.OPEN);
  });
});
