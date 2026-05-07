import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_CLIENT, requireCurrentUserId } from '../../../core/supabase/supabase.client';
import { throwIfError } from '../../../core/supabase/postgrest.util';
import { BillingModel } from '../../projects/models/project.model';
import { incrementInvoiceNumber } from '../../settings/data/invoice-number.util';
import { SettingsRepository } from '../../settings/data/settings.repository';
import {
  InvoiceGenerateInput,
  InvoicePeriodOption,
  InvoicePreviewModel,
  InvoicePreviewRequest,
  InvoiceLineItemModel,
  InvoiceModel,
  InvoiceStatus,
  InvoiceStatusUpdateInput,
} from '../models/invoice.model';
import { InvoiceLineItemVM, InvoiceVM } from '../models/invoice.vm';
import { TaxRateModel } from '../models/tax-rate.model';
import {
  InvoiceLineItemRow,
  InvoiceRow,
  TaxRateRow,
  toInvoiceLineItemModel,
  toInvoiceLineItemVM,
  toInvoiceModel,
  toInvoiceVM,
  toTaxRateModel,
} from './invoice.mapper';

const INVOICE_SELECT =
  'id, clientId:client_id, invoiceNumber:invoice_number, status, periodStart:period_start, periodEnd:period_end, issueDate:issue_date, subtotalNet:subtotal_net, totalTax:total_tax, totalGross:total_gross, createdAt:created_at, openedAt:opened_at, paidAt:paid_at, creditedAt:credited_at';

const LINE_ITEM_SELECT =
  'id, invoiceId:invoice_id, timeEntryId:time_entry_id, projectId:project_id, orderId:order_id, description, workDate:work_date, hours, unitRate:unit_rate, lineNet:line_net, taxRateId:tax_rate_id, taxCodeSnapshot:tax_code_snapshot, taxLabelSnapshot:tax_label_snapshot, taxPercentageSnapshot:tax_percentage_snapshot, taxAmount:tax_amount, lineGross:line_gross, createdAt:created_at';

const TAX_RATE_SELECT =
  'id, code, label, percentage, isActive:is_active, createdAt:created_at';

@Injectable({ providedIn: 'root' })
export class InvoicesRepository {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);
  private readonly settingsRepository = inject(SettingsRepository);

  async listInvoices(): Promise<InvoiceVM[]> {
    const { data: rows, error } = await this.supabase
      .from('invoices')
      .select(INVOICE_SELECT)
      .order('created_at', { ascending: false })
      .returns<InvoiceRow[]>();
    throwIfError(error, 'Failed to load invoices.');
    if (!rows || rows.length === 0) {
      return [];
    }

    const [clientsById, countsByInvoiceId] = await Promise.all([
      this.getClientNamesById(),
      this.getLineItemCountsByInvoiceId(),
    ]);
    return rows.map((row) =>
      toInvoiceVM(
        toInvoiceModel(row),
        clientsById.get(row.clientId) ?? 'Unknown client',
        countsByInvoiceId.get(row.id) ?? 0,
      ),
    );
  }

  async listTaxRates(): Promise<TaxRateModel[]> {
    const { data: rows, error } = await this.supabase
      .from('tax_rates')
      .select(TAX_RATE_SELECT)
      .order('code', { ascending: true })
      .returns<TaxRateRow[]>();
    throwIfError(error, 'Failed to load tax rates.');

    if (!rows || rows.length === 0) {
      return this.seedDefaultTaxRates();
    }
    return rows.map(toTaxRateModel);
  }

  async listLineItems(invoiceId: number): Promise<InvoiceLineItemVM[]> {
    const { data: rows, error } = await this.supabase
      .from('invoice_line_items')
      .select(LINE_ITEM_SELECT)
      .eq('invoice_id', invoiceId)
      .order('work_date', { ascending: true })
      .returns<InvoiceLineItemRow[]>();
    throwIfError(error, 'Failed to load invoice line items.');
    if (!rows || rows.length === 0) {
      return [];
    }

    const [projectsById, ordersById] = await Promise.all([
      this.getProjectSummariesById(),
      this.getOrderSummariesById(),
    ]);
    return rows.map((row) =>
      toInvoiceLineItemVM(
        toInvoiceLineItemModel(row),
        projectsById.get(row.projectId) ?? { code: 'UNKNOWN', name: 'Unknown project' },
        row.orderId === null ? null : (ordersById.get(row.orderId) ?? null),
      ),
    );
  }

  async generateInvoices(input: InvoiceGenerateInput): Promise<InvoiceVM[]> {
    const userId = await requireCurrentUserId(this.supabase);
    const taxRate = await this.getTaxRateById(input.taxRateId);
    if (!taxRate || !taxRate.isActive) {
      throw new Error('Selected tax rate is not available.');
    }

    const entries = await this.listEligibleEntries(input.clientId, input.periodStart, input.periodEnd, input.billingModel);
    if (entries.length === 0) {
      throw new Error('No billable time entries found for the selected period.');
    }

    const grouped =
      input.mode === 'per_project'
        ? new Map<number, EligibleEntry[]>(entries.reduce((acc, entry) => {
            const list = acc.get(entry.project_id) ?? [];
            list.push(entry);
            acc.set(entry.project_id, list);
            return acc;
          }, new Map<number, EligibleEntry[]>()))
        : new Map<number, EligibleEntry[]>([[0, entries]]);

    const settings = await this.settingsRepository.getSettings();
    let nextInvoiceNumber = settings.nextInvoiceNumber;
    const createdIds: number[] = [];

    for (const [, groupEntries] of grouped) {
      const totals = calculateTotals(groupEntries, taxRate.percentage);
      const { data: invoiceRow, error: invoiceError } = await this.supabase
        .from('invoices')
        .insert({
          user_id: userId,
          client_id: input.clientId,
          invoice_number: nextInvoiceNumber,
          status: input.status,
          period_start: input.periodStart,
          period_end: input.periodEnd,
          issue_date: isoDate(new Date()),
          subtotal_net: totals.subtotalNet,
          total_tax: totals.totalTax,
          total_gross: totals.totalGross,
          opened_at: input.status === InvoiceStatus.OPEN ? new Date().toISOString() : null,
        })
        .select(INVOICE_SELECT)
        .single<InvoiceRow>();
      throwIfError(invoiceError, 'Failed to create invoice.');

      const lineItemsPayload = groupEntries.map((entry) => {
        const lineNet = entry.hours * entry.unit_rate;
        const taxAmount = Math.round((lineNet * taxRate.percentage) / 10000);
        return {
          user_id: userId,
          invoice_id: invoiceRow!.id,
          time_entry_id: entry.id,
          project_id: entry.project_id,
          order_id: entry.order_id,
          description: entry.description,
          work_date: entry.date,
          hours: entry.hours,
          unit_rate: entry.unit_rate,
          line_net: lineNet,
          tax_rate_id: taxRate.id,
          tax_code_snapshot: taxRate.code,
          tax_label_snapshot: taxRate.label,
          tax_percentage_snapshot: taxRate.percentage,
          tax_amount: taxAmount,
          line_gross: lineNet + taxAmount,
        };
      });

      const { error: lineItemError } = await this.supabase.from('invoice_line_items').insert(lineItemsPayload);
      throwIfError(lineItemError, 'Failed to create invoice line items.');

      if (input.status === InvoiceStatus.OPEN) {
        const nowIso = new Date().toISOString();
        const timeEntryIds = groupEntries.map((entry) => entry.id);
        for (const timeEntryId of timeEntryIds) {
          const { error: lockError } = await this.supabase
            .from('time_entries')
            .update({
              locked_by_invoice_id: invoiceRow!.id,
              locked_at: nowIso,
            })
            .eq('id', timeEntryId);
          throwIfError(lockError, 'Failed to lock time entries.');
        }
      }

      createdIds.push(invoiceRow!.id);
      nextInvoiceNumber = incrementInvoiceNumber(nextInvoiceNumber);
    }

    await this.settingsRepository.saveSettings({
      nextInvoiceNumber,
      preferredTimeEntriesView: settings.preferredTimeEntriesView,
    });

    const all = await this.listInvoices();
    return all.filter((invoice) => createdIds.includes(invoice.id));
  }

  async listAvailablePeriods(clientId: number): Promise<InvoicePeriodOption[]> {
    const entries = await this.listEligibleEntriesForClient(clientId);
    if (entries.length === 0) {
      return [];
    }

    const periods = new Map<string, InvoicePeriodOption>();
    for (const entry of entries) {
      const period = this.periodForEntry(entry.date, entry.billingModel);
      if (!periods.has(period.key)) {
        periods.set(period.key, period);
      }
    }
    return [...periods.values()].sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  }

  async previewInvoices(input: InvoicePreviewRequest): Promise<InvoicePreviewModel[]> {
    const taxRate = await this.getTaxRateById(input.taxRateId);
    if (!taxRate || !taxRate.isActive) {
      throw new Error('Selected tax rate is not available.');
    }

    const entries = await this.listEligibleEntries(
      input.clientId,
      input.periodStart,
      input.periodEnd,
      input.billingModel,
    );
    if (entries.length === 0) {
      return [];
    }
    const [projectsById, ordersById] = await Promise.all([
      this.getProjectSummariesById(),
      this.getOrderSummariesById(),
    ]);

    const grouped =
      input.mode === 'per_project'
        ? new Map<number, EligibleEntry[]>(entries.reduce((acc, entry) => {
            const list = acc.get(entry.project_id) ?? [];
            list.push(entry);
            acc.set(entry.project_id, list);
            return acc;
          }, new Map<number, EligibleEntry[]>()))
        : new Map<number, EligibleEntry[]>([[0, entries]]);

    const previews: InvoicePreviewModel[] = [];
    for (const [groupKey, groupEntries] of grouped) {
      const lineItems = groupEntries.map((entry) => {
        const lineNet = entry.hours * entry.unit_rate;
        const taxAmount = Math.round((lineNet * taxRate.percentage) / 10000);
        return {
          timeEntryId: entry.id,
          projectId: entry.project_id,
          projectCode: projectsById.get(entry.project_id)?.code ?? 'UNKNOWN',
          projectName: projectsById.get(entry.project_id)?.name ?? 'Unknown project',
          orderId: entry.order_id,
          orderCode: entry.order_id === null ? null : (ordersById.get(entry.order_id)?.code ?? null),
          orderTitle: entry.order_id === null ? null : (ordersById.get(entry.order_id)?.title ?? null),
          description: entry.description ?? '',
          workDate: entry.date,
          hours: entry.hours,
          unitRate: entry.unit_rate,
          lineNet,
          taxAmount,
          lineGross: lineNet + taxAmount,
        };
      });
      previews.push({
        groupKey: String(groupKey),
        subtotalNet: lineItems.reduce((sum, item) => sum + item.lineNet, 0),
        totalTax: lineItems.reduce((sum, item) => sum + item.taxAmount, 0),
        totalGross: lineItems.reduce((sum, item) => sum + item.lineGross, 0),
        lineItems,
      });
    }

    return previews;
  }

  async updateStatus(id: number, input: InvoiceStatusUpdateInput): Promise<InvoiceVM | null> {
    const { data: existing, error: existingError } = await this.supabase
      .from('invoices')
      .select(INVOICE_SELECT)
      .eq('id', id)
      .maybeSingle<InvoiceRow>();
    throwIfError(existingError, 'Failed to load invoice.');
    if (!existing) {
      return null;
    }

    const currentStatus = existing.status;
    if (currentStatus === InvoiceStatus.CREDITED) {
      throw new Error('Credited invoices are terminal and cannot be changed.');
    }
    if (currentStatus === InvoiceStatus.PAID && input.status !== InvoiceStatus.CREDITED) {
      throw new Error('Paid invoices can only be transitioned to credited.');
    }
    if (currentStatus !== InvoiceStatus.OPEN && input.status === InvoiceStatus.PAID) {
      throw new Error('Only open invoices can be marked as paid.');
    }

    const nowIso = new Date().toISOString();
    const patch: Record<string, unknown> = { status: input.status };
    if (input.status === InvoiceStatus.OPEN) patch['opened_at'] = nowIso;
    if (input.status === InvoiceStatus.PAID) patch['paid_at'] = nowIso;
    if (input.status === InvoiceStatus.CREDITED) patch['credited_at'] = nowIso;
    if (input.status === InvoiceStatus.CONCEPT || input.status === InvoiceStatus.PROFORMA) {
      patch['opened_at'] = null;
      patch['paid_at'] = null;
      patch['credited_at'] = null;
    }

    const { data: updated, error } = await this.supabase
      .from('invoices')
      .update(patch)
      .eq('id', id)
      .select(INVOICE_SELECT)
      .maybeSingle<InvoiceRow>();
    throwIfError(error, 'Failed to update invoice status.');
    if (!updated) {
      return null;
    }

    if (input.status === InvoiceStatus.OPEN) {
      const timeEntryIds = await this.getTimeEntryIdsForInvoice(id);
      if (timeEntryIds.length === 0) {
        throw new Error('Cannot open invoice without line items.');
      }
      const { error: lockError } = await this.supabase
        .from('time_entries')
        .update({
          locked_by_invoice_id: id,
          locked_at: nowIso,
        })
        .eq('id', timeEntryIds[0]);
      throwIfError(lockError, 'Failed to lock time entries.');
      for (const timeEntryId of timeEntryIds.slice(1)) {
        const { error: eachLockError } = await this.supabase
          .from('time_entries')
          .update({
            locked_by_invoice_id: id,
            locked_at: nowIso,
          })
          .eq('id', timeEntryId);
        throwIfError(eachLockError, 'Failed to lock time entries.');
      }
    }

    if (input.status === InvoiceStatus.CONCEPT || input.status === InvoiceStatus.PROFORMA) {
      const timeEntryIds = await this.getTimeEntryIdsForInvoice(id);
      for (const timeEntryId of timeEntryIds) {
        const { error: unlockError } = await this.supabase
          .from('time_entries')
          .update({
            locked_by_invoice_id: null,
            locked_at: null,
          })
          .eq('id', timeEntryId);
        throwIfError(unlockError, 'Failed to unlock time entries.');
      }
    }

    const [clientsById, countsByInvoiceId] = await Promise.all([
      this.getClientNamesById(updated.clientId),
      this.getLineItemCountsByInvoiceId(id),
    ]);
    return toInvoiceVM(
      toInvoiceModel(updated),
      clientsById.get(updated.clientId) ?? 'Unknown client',
      countsByInvoiceId.get(id) ?? 0,
    );
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const { data: existing, error: existingError } = await this.supabase
      .from('invoices')
      .select('id, status')
      .eq('id', id)
      .maybeSingle<{ id: number; status: string }>();
    throwIfError(existingError, 'Failed to load invoice.');
    if (!existing) {
      return false;
    }

    if (existing.status === InvoiceStatus.CREDITED) {
      throw new Error('Credited invoices cannot be deleted.');
    }

    if (existing.status === InvoiceStatus.PAID) {
      throw new Error('Paid invoices cannot be deleted.');
    }

    const { error: unlockError } = await this.supabase
      .from('time_entries')
      .update({
        locked_by_invoice_id: null,
        locked_at: null,
      })
      .eq('locked_by_invoice_id', id);
    throwIfError(unlockError, 'Failed to unlock time entries.');

    const { error: deleteError } = await this.supabase.from('invoices').delete().eq('id', id);
    throwIfError(deleteError, 'Failed to delete invoice.');
    return true;
  }

  private async seedDefaultTaxRates(): Promise<TaxRateModel[]> {
    const userId = await requireCurrentUserId(this.supabase);
    const defaults = [
      { user_id: userId, code: 'VAT0', label: 'VAT 0%', percentage: 0, is_active: true },
      { user_id: userId, code: 'VAT7', label: 'VAT 7%', percentage: 700, is_active: true },
      { user_id: userId, code: 'VAT19', label: 'VAT 19%', percentage: 1900, is_active: true },
    ];
    const { data: rows, error } = await this.supabase
      .from('tax_rates')
      .insert(defaults)
      .select(TAX_RATE_SELECT)
      .returns<TaxRateRow[]>();
    throwIfError(error, 'Failed to initialize tax rates.');
    return (rows ?? []).map(toTaxRateModel);
  }

  private async getTaxRateById(id: number): Promise<TaxRateModel | null> {
    const { data: row, error } = await this.supabase
      .from('tax_rates')
      .select(TAX_RATE_SELECT)
      .eq('id', id)
      .maybeSingle<TaxRateRow>();
    throwIfError(error, 'Failed to load tax rate.');
    return row ? toTaxRateModel(row) : null;
  }

  private async listEligibleEntries(
    clientId: number,
    periodStart: string,
    periodEnd: string,
    billingModel: BillingModel,
  ): Promise<EligibleEntry[]> {
    const { data: entries, error } = await this.supabase
      .from('time_entries')
      .select('id, client_id, project_id, order_id, date, hours, description, locked_by_invoice_id')
      .eq('client_id', clientId)
      .gte('date', periodStart)
      .lt('date', periodEnd)
      .returns<EligibleTimeEntryRow[]>();
    throwIfError(error, 'Failed to load time entries for invoice generation.');
    if (!entries || entries.length === 0) {
      return [];
    }

    const { data: projects, error: projectError } = await this.supabase
      .from('projects')
      .select('id, unit_rate, billing_model, is_active')
      .returns<Array<{ id: number; unit_rate: number; billing_model: BillingModel | null; is_active: boolean }>>();
    throwIfError(projectError, 'Failed to load project details.');
    const projectsById = new Map((projects ?? []).map((project) => [project.id, project]));

    return entries
      .map((entry) => {
        const project = projectsById.get(entry.project_id);
        if (
          entry.locked_by_invoice_id !== null ||
          !project ||
          !project.is_active ||
          project.billing_model !== billingModel
        ) {
          return null;
        }
        return {
          ...entry,
          unit_rate: project.unit_rate,
        };
      })
      .filter((entry): entry is EligibleEntry & { billingModel: BillingModel } => entry !== null);
  }

  private async listEligibleEntriesForClient(clientId: number): Promise<EligibleEntryWithBilling[]> {
    const { data: entries, error } = await this.supabase
      .from('time_entries')
      .select('id, client_id, project_id, order_id, date, hours, description, locked_by_invoice_id')
      .eq('client_id', clientId)
      .returns<EligibleTimeEntryRow[]>();
    throwIfError(error, 'Failed to load eligible time entries.');
    if (!entries || entries.length === 0) {
      return [];
    }

    const { data: projects, error: projectError } = await this.supabase
      .from('projects')
      .select('id, unit_rate, billing_model, is_active')
      .returns<Array<{ id: number; unit_rate: number; billing_model: BillingModel | null; is_active: boolean }>>();
    throwIfError(projectError, 'Failed to load project details.');
    const projectsById = new Map((projects ?? []).map((project) => [project.id, project]));

    return entries
      .map((entry) => {
        const project = projectsById.get(entry.project_id);
        if (entry.locked_by_invoice_id !== null || !project || !project.is_active || !project.billing_model) {
          return null;
        }
        return {
          ...entry,
          unit_rate: project.unit_rate,
          billingModel: project.billing_model,
        };
      })
      .filter((entry): entry is EligibleEntryWithBilling => entry !== null);
  }

  private periodForEntry(dateIso: string, billingModel: BillingModel): InvoicePeriodOption {
    const date = new Date(`${dateIso}T00:00:00`);
    if (billingModel === BillingModel.MONTH) {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const monthLabel = start.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      return {
        key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        label: monthLabel,
        billingModel,
        periodStart: isoDate(start),
        periodEnd: isoDate(end),
      };
    }
    if (billingModel === BillingModel.YEAR) {
      const year = date.getFullYear();
      return {
        key: String(year),
        label: String(year),
        billingModel,
        periodStart: `${year}-01-01`,
        periodEnd: `${year + 1}-01-01`,
      };
    }

    const day = date.getDay();
    const distance = day === 0 ? 6 : day - 1;
    const start = new Date(date);
    start.setDate(date.getDate() - distance);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return {
      key: isoDate(start),
      label: `Week of ${isoDate(start)}`,
      billingModel,
      periodStart: isoDate(start),
      periodEnd: isoDate(end),
    };
  }

  private async getClientNamesById(clientId?: number): Promise<Map<number, string>> {
    let query = this.supabase.from('clients').select('id, name');
    if (clientId !== undefined) {
      query = query.eq('id', clientId);
    }
    const { data: rows, error } = await query.returns<Array<{ id: number; name: string }>>();
    throwIfError(error, 'Failed to load clients.');
    return new Map((rows ?? []).map((row) => [row.id, row.name]));
  }

  private async getProjectSummariesById(): Promise<Map<number, { code: string; name: string }>> {
    const { data: rows, error } = await this.supabase
      .from('projects')
      .select('id, code, name')
      .returns<Array<{ id: number; code: string; name: string }>>();
    throwIfError(error, 'Failed to load projects.');
    return new Map((rows ?? []).map((row) => [row.id, { code: row.code, name: row.name }]));
  }

  private async getOrderSummariesById(): Promise<Map<number, { code: string; title: string }>> {
    const { data: rows, error } = await this.supabase
      .from('orders')
      .select('id, code, title')
      .returns<Array<{ id: number; code: string; title: string }>>();
    throwIfError(error, 'Failed to load orders.');
    return new Map((rows ?? []).map((row) => [row.id, { code: row.code, title: row.title }]));
  }

  private async getLineItemCountsByInvoiceId(invoiceId?: number): Promise<Map<number, number>> {
    let query = this.supabase.from('invoice_line_items').select('invoice_id');
    if (invoiceId !== undefined) {
      query = query.eq('invoice_id', invoiceId);
    }
    const { data: rows, error } = await query.returns<Array<{ invoice_id: number }>>();
    throwIfError(error, 'Failed to load invoice line item counts.');
    const counts = new Map<number, number>();
    for (const row of rows ?? []) {
      counts.set(row.invoice_id, (counts.get(row.invoice_id) ?? 0) + 1);
    }
    return counts;
  }

  private async getTimeEntryIdsForInvoice(invoiceId: number): Promise<number[]> {
    const { data: rows, error } = await this.supabase
      .from('invoice_line_items')
      .select('time_entry_id')
      .eq('invoice_id', invoiceId)
      .returns<Array<{ time_entry_id: number }>>();
    throwIfError(error, 'Failed to load linked time entries.');
    return (rows ?? []).map((row) => row.time_entry_id);
  }
}

type EligibleTimeEntryRow = {
  id: number;
  client_id: number;
  project_id: number;
  order_id: number | null;
  date: string;
  hours: number;
  description: string | null;
  locked_by_invoice_id: number | null;
};

type EligibleEntry = EligibleTimeEntryRow & { unit_rate: number };
type EligibleEntryWithBilling = EligibleEntry & { billingModel: BillingModel };

function calculateTotals(entries: EligibleEntry[], taxPercentage: number) {
  let subtotalNet = 0;
  let totalTax = 0;
  for (const entry of entries) {
    const lineNet = entry.hours * entry.unit_rate;
    subtotalNet += lineNet;
    totalTax += Math.round((lineNet * taxPercentage) / 10000);
  }
  return {
    subtotalNet,
    totalTax,
    totalGross: subtotalNet + totalTax,
  };
}

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
