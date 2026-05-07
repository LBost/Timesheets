import { formatInvoicePeriodLabel } from './invoice-period.util';

describe('formatInvoicePeriodLabel', () => {
  it('formats a monthly period as month name and year', () => {
    expect(formatInvoicePeriodLabel('2026-04-01', '2026-05-01')).toBe('April 2026');
  });

  it('formats a yearly period as the year only', () => {
    expect(formatInvoicePeriodLabel('2026-01-01', '2027-01-01')).toBe('2026');
  });

  it('formats a weekly period as ISO week and year', () => {
    expect(formatInvoicePeriodLabel('2026-04-13', '2026-04-20')).toBe('WK16 2026');
  });

  it('falls back to the raw range when the period does not match a known model', () => {
    expect(formatInvoicePeriodLabel('2026-04-15', '2026-05-10')).toBe('2026-04-15 - 2026-05-10');
  });

  it('falls back to the raw range when input is not a valid ISO date', () => {
    expect(formatInvoicePeriodLabel('not-a-date', '2026-05-01')).toBe('not-a-date - 2026-05-01');
  });
});
