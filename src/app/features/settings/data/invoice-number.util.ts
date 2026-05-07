const INVOICE_NUMBER_PATTERN = /^([A-Z]{2,10})-(\d{4})(\d{4})$/;

export function incrementInvoiceNumber(input: string): string {
  const trimmed = input.trim();
  const match = INVOICE_NUMBER_PATTERN.exec(trimmed);
  if (!match) {
    throw new Error('Invalid next invoice number format.');
  }

  const [, prefix, year, sequenceRaw] = match;
  const width = sequenceRaw.length;
  const sequence = Number.parseInt(sequenceRaw, 10);
  const next = sequence + 1;
  return `${prefix}-${year}${String(next).padStart(width, '0')}`;
}
