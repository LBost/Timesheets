import { Injectable, inject } from '@angular/core';

import { InvoiceStatus } from '../../invoices/models/invoice.model';
import { InvoiceVM } from '../../invoices/models/invoice.vm';
import { TimeEntryVM } from '../../time-entries/models/time-entry.vm';
import {
  ActivityLogAction,
  ActivityLogEntityType,
  ActivityLogInsertInput,
} from '../models/activity-log.model';
import {
  summarizeEmailDraftOpened,
  summarizeInvoiceCreated,
  summarizeInvoiceDeleted,
  summarizeInvoiceStatusChanged,
  summarizeTimeEntryCreated,
  summarizeTimeEntryDeleted,
  summarizeTimeEntryUpdated,
} from './activity-log.summaries';
import { ActivityLogsRepository } from './activity-logs.repository';

@Injectable({ providedIn: 'root' })
export class ActivityLogWriter {
  private readonly repository = inject(ActivityLogsRepository);

  logTimeEntryCreated(entry: TimeEntryVM): void {
    this.log({
      action: ActivityLogAction.TIME_ENTRY_CREATED,
      entityType: ActivityLogEntityType.TIME_ENTRY,
      entityId: entry.id,
      summary: summarizeTimeEntryCreated(entry),
      metadata: {
        clientId: entry.clientId,
        projectId: entry.projectId,
        date: entry.date,
      },
    });
  }

  logTimeEntryUpdated(entry: TimeEntryVM): void {
    this.log({
      action: ActivityLogAction.TIME_ENTRY_UPDATED,
      entityType: ActivityLogEntityType.TIME_ENTRY,
      entityId: entry.id,
      summary: summarizeTimeEntryUpdated(entry),
      metadata: {
        clientId: entry.clientId,
        projectId: entry.projectId,
        date: entry.date,
      },
    });
  }

  logTimeEntryDeleted(input: {
    id: number;
    clientName: string;
    projectCode: string;
    date: string;
    clientId: number;
    projectId: number;
  }): void {
    this.log({
      action: ActivityLogAction.TIME_ENTRY_DELETED,
      entityType: ActivityLogEntityType.TIME_ENTRY,
      entityId: input.id,
      summary: summarizeTimeEntryDeleted(input),
      metadata: {
        clientId: input.clientId,
        projectId: input.projectId,
        date: input.date,
      },
    });
  }

  logEmailDraftOpened(input: {
    clientId: number;
    clientName: string;
    entryCount: number;
    subject: string;
    scope: string;
  }): void {
    this.log({
      action: ActivityLogAction.TIME_ENTRIES_EMAIL_DRAFT_OPENED,
      entityType: ActivityLogEntityType.TIME_ENTRIES,
      entityId: null,
      summary: summarizeEmailDraftOpened(input),
      metadata: {
        clientId: input.clientId,
        entryCount: input.entryCount,
        subject: input.subject,
        scope: input.scope,
      },
    });
  }

  logInvoiceCreated(invoice: InvoiceVM): void {
    this.log({
      action: ActivityLogAction.INVOICE_CREATED,
      entityType: ActivityLogEntityType.INVOICE,
      entityId: invoice.id,
      summary: summarizeInvoiceCreated(invoice),
      metadata: {
        clientId: invoice.clientId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
      },
    });
  }

  logInvoiceStatusChanged(input: {
    invoice: InvoiceVM;
    fromStatus: InvoiceStatus;
    toStatus: InvoiceStatus;
  }): void {
    this.log({
      action: ActivityLogAction.INVOICE_STATUS_CHANGED,
      entityType: ActivityLogEntityType.INVOICE,
      entityId: input.invoice.id,
      summary: summarizeInvoiceStatusChanged({
        invoiceNumber: input.invoice.invoiceNumber,
        clientName: input.invoice.clientName,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
      }),
      metadata: {
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        invoiceNumber: input.invoice.invoiceNumber,
      },
    });
  }

  logInvoiceDeleted(input: {
    id: number;
    invoiceNumber: string;
    clientName: string;
    clientId: number;
  }): void {
    this.log({
      action: ActivityLogAction.INVOICE_DELETED,
      entityType: ActivityLogEntityType.INVOICE,
      entityId: input.id,
      summary: summarizeInvoiceDeleted(input),
      metadata: {
        clientId: input.clientId,
        invoiceNumber: input.invoiceNumber,
      },
    });
  }

  private log(input: ActivityLogInsertInput): void {
    void this.repository.insert(input).catch(() => undefined);
  }
}
