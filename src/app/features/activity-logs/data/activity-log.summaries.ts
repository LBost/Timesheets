import { InvoiceStatus } from '../../invoices/models/invoice.model';
import { TimeEntryVM } from '../../time-entries/models/time-entry.vm';
import { InvoiceVM } from '../../invoices/models/invoice.vm';

export function summarizeTimeEntryCreated(entry: TimeEntryVM): string {
  return `Created time entry for ${entry.clientName} · ${entry.projectCode} · ${entry.date}`;
}

export function summarizeTimeEntryUpdated(entry: TimeEntryVM): string {
  return `Updated time entry for ${entry.clientName} · ${entry.projectCode} · ${entry.date}`;
}

export function summarizeTimeEntryDeleted(input: {
  clientName: string;
  projectCode: string;
  date: string;
}): string {
  return `Deleted time entry for ${input.clientName} · ${input.projectCode} · ${input.date}`;
}

export function summarizeInvoiceCreated(invoice: InvoiceVM): string {
  return `Created invoice ${invoice.invoiceNumber} for ${invoice.clientName}`;
}

export function summarizeInvoiceStatusChanged(input: {
  invoiceNumber: string;
  clientName: string;
  fromStatus: InvoiceStatus;
  toStatus: InvoiceStatus;
}): string {
  return `Changed invoice ${input.invoiceNumber} (${input.clientName}) from ${input.fromStatus} to ${input.toStatus}`;
}

export function summarizeInvoiceDeleted(input: {
  invoiceNumber: string;
  clientName: string;
}): string {
  return `Deleted invoice ${input.invoiceNumber} for ${input.clientName}`;
}

export function summarizeEmailDraftOpened(input: {
  clientName: string;
  entryCount: number;
  subject: string;
}): string {
  const countLabel = input.entryCount === 1 ? '1 time entry' : `${input.entryCount} time entries`;
  return `Opened email draft for ${countLabel} (${input.clientName}) · ${input.subject}`;
}
