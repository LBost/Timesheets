import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_CLIENT, requireCurrentUserId } from '../../../core/supabase/supabase.client';
import { isUniqueViolation, throwIfError } from '../../../core/supabase/postgrest.util';
import { VatRateCreateInput, VatRateUpdateInput } from '../models/vat-rate.model';
import { VatRateVM } from '../models/vat-rate.vm';
import {
  VatRateRow,
  fromVatRateRow,
  toVatRateInsertValues,
  toVatRateModel,
  toVatRateUpdateValues,
  toVatRateVM,
} from './vat-rate.mapper';

export type DeleteVatRateResult = {
  mode: 'deleted' | 'archived';
  vatRate: VatRateVM | null;
};

const VAT_RATE_SELECT = 'id, code, label, percentage, isActive:is_active, createdAt:created_at';

@Injectable({ providedIn: 'root' })
export class VatRatesRepository {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);

  async listVatRates(): Promise<VatRateVM[]> {
    const { data: rows, error } = await this.supabase
      .from('tax_rates')
      .select(VAT_RATE_SELECT)
      .order('code', { ascending: true })
      .returns<VatRateRow[]>();
    throwIfError(error, 'Failed to load VAT rates.');
    if (!rows) {
      return [];
    }

    const usageCounts = await this.getInvoiceLineItemCountByRateId();
    return rows.map((row) =>
      toVatRateVM(toVatRateModel(fromVatRateRow(row)), usageCounts.get(row.id) ?? 0),
    );
  }

  async getVatRateById(id: number): Promise<VatRateVM | null> {
    const { data: row, error } = await this.supabase
      .from('tax_rates')
      .select(VAT_RATE_SELECT)
      .eq('id', id)
      .maybeSingle<VatRateRow>();
    throwIfError(error, 'Failed to load VAT rate.');
    if (!row) {
      return null;
    }

    const usageCounts = await this.getInvoiceLineItemCountByRateId(id);
    return toVatRateVM(toVatRateModel(fromVatRateRow(row)), usageCounts.get(row.id) ?? 0);
  }

  async createVatRate(input: VatRateCreateInput): Promise<VatRateVM> {
    const userId = await requireCurrentUserId(this.supabase);
    const payload = toVatRateInsertValues(input);

    const { data: row, error } = await this.supabase
      .from('tax_rates')
      .insert({
        user_id: userId,
        code: payload.code,
        label: payload.label,
        percentage: payload.percentage,
        is_active: payload.isActive,
      })
      .select(VAT_RATE_SELECT)
      .single<VatRateRow>();
    if (isUniqueViolation(error)) {
      throw new Error('A VAT rate with this code already exists.');
    }
    throwIfError(error, 'Failed to create VAT rate.');
    return toVatRateVM(toVatRateModel(fromVatRateRow(row!)), 0);
  }

  async updateVatRate(id: number, input: VatRateUpdateInput): Promise<VatRateVM | null> {
    const values = toVatRateUpdateValues(input);
    if (Object.keys(values).length === 0) {
      return this.getVatRateById(id);
    }

    const updatePayload: Record<string, unknown> = {};
    if (values.code !== undefined) updatePayload['code'] = values.code;
    if (values.label !== undefined) updatePayload['label'] = values.label;
    if (values.percentage !== undefined) updatePayload['percentage'] = values.percentage;
    if (values.isActive !== undefined) updatePayload['is_active'] = values.isActive;

    const { data: row, error } = await this.supabase
      .from('tax_rates')
      .update(updatePayload)
      .eq('id', id)
      .select(VAT_RATE_SELECT)
      .maybeSingle<VatRateRow>();
    if (isUniqueViolation(error)) {
      throw new Error('A VAT rate with this code already exists.');
    }
    throwIfError(error, 'Failed to update VAT rate.');
    if (!row) {
      return null;
    }

    const usageCounts = await this.getInvoiceLineItemCountByRateId(id);
    return toVatRateVM(toVatRateModel(fromVatRateRow(row)), usageCounts.get(row.id) ?? 0);
  }

  async archiveVatRate(id: number): Promise<VatRateVM | null> {
    const { data: row, error } = await this.supabase
      .from('tax_rates')
      .update({ is_active: false })
      .eq('id', id)
      .select(VAT_RATE_SELECT)
      .maybeSingle<VatRateRow>();
    throwIfError(error, 'Failed to archive VAT rate.');
    if (!row) {
      return null;
    }

    const usageCounts = await this.getInvoiceLineItemCountByRateId(id);
    return toVatRateVM(toVatRateModel(fromVatRateRow(row)), usageCounts.get(row.id) ?? 0);
  }

  async deleteVatRate(id: number): Promise<DeleteVatRateResult> {
    const { count, error: countError } = await this.supabase
      .from('invoice_line_items')
      .select('id', { count: 'exact', head: true })
      .eq('tax_rate_id', id);
    throwIfError(countError, 'Failed to inspect invoice line items.');

    if ((count ?? 0) > 0) {
      const archived = await this.archiveVatRate(id);
      return { mode: 'archived', vatRate: archived };
    }

    const { error } = await this.supabase.from('tax_rates').delete().eq('id', id);
    throwIfError(error, 'Failed to delete VAT rate.');
    return { mode: 'deleted', vatRate: null };
  }

  private async getInvoiceLineItemCountByRateId(rateId?: number): Promise<Map<number, number>> {
    let query = this.supabase.from('invoice_line_items').select('tax_rate_id');
    if (rateId !== undefined) {
      query = query.eq('tax_rate_id', rateId);
    }
    const { data: rows, error } = await query.returns<Array<{ tax_rate_id: number }>>();
    throwIfError(error, 'Failed to load VAT usage counts.');

    const counts = new Map<number, number>();
    for (const row of rows ?? []) {
      counts.set(row.tax_rate_id, (counts.get(row.tax_rate_id) ?? 0) + 1);
    }
    return counts;
  }
}
