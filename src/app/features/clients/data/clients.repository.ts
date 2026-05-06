import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

import {
  SUPABASE_CLIENT,
  requireCurrentUserId,
} from '../../../core/supabase/supabase.client';
import {
  isUniqueViolation,
  throwIfError,
} from '../../../core/supabase/postgrest.util';
import { ClientCreateInput, ClientUpdateInput } from '../models/client.model';
import { ClientVM } from '../models/client.vm';
import {
  ClientRow,
  fromClientRow,
  toClientInsertValues,
  toClientModel,
  toClientUpdateValues,
  toClientVM,
} from './client.mapper';

export type DeleteClientResult = {
  mode: 'deleted' | 'archived';
  client: ClientVM | null;
};

const CLIENT_SELECT =
  'id, name, email, phone, accentColor:accent_color, isActive:is_active, createdAt:created_at';

@Injectable({ providedIn: 'root' })
export class ClientsRepository {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);

  async listClients(): Promise<ClientVM[]> {
    const { data: rows, error } = await this.supabase
      .from('clients')
      .select(CLIENT_SELECT)
      .order('name', { ascending: true })
      .returns<ClientRow[]>();
    throwIfError(error, 'Failed to load clients.');
    if (!rows) {
      return [];
    }

    const counts = await this.getProjectCountByClientId();
    return rows.map((row) =>
      toClientVM(toClientModel(fromClientRow(row)), counts.get(row.id) ?? 0),
    );
  }

  async getClientById(id: number): Promise<ClientVM | null> {
    const { data: row, error } = await this.supabase
      .from('clients')
      .select(CLIENT_SELECT)
      .eq('id', id)
      .maybeSingle<ClientRow>();
    throwIfError(error, 'Failed to load client.');
    if (!row) {
      return null;
    }

    const counts = await this.getProjectCountByClientId(id);
    return toClientVM(toClientModel(fromClientRow(row)), counts.get(row.id) ?? 0);
  }

  async createClient(input: ClientCreateInput): Promise<ClientVM> {
    const userId = await requireCurrentUserId(this.supabase);
    const payload = toClientInsertValues(input);
    const { data: row, error } = await this.supabase
      .from('clients')
      .insert({
        user_id: userId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        accent_color: payload.accentColor ?? null,
        is_active: payload.isActive,
      })
      .select(CLIENT_SELECT)
      .single<ClientRow>();

    if (isUniqueViolation(error)) {
      throw new Error('A client with this name already exists.');
    }
    throwIfError(error, 'Failed to create client.');
    return toClientVM(toClientModel(fromClientRow(row!)), 0);
  }

  async updateClient(id: number, input: ClientUpdateInput): Promise<ClientVM | null> {
    const values = toClientUpdateValues(input);
    if (Object.keys(values).length === 0) {
      return this.getClientById(id);
    }

    const updatePayload: Record<string, unknown> = {};
    if (values.name !== undefined) updatePayload['name'] = values.name;
    if (values.email !== undefined) updatePayload['email'] = values.email;
    if (values.phone !== undefined) updatePayload['phone'] = values.phone;
    if (values.accentColor !== undefined) updatePayload['accent_color'] = values.accentColor;
    if (values.isActive !== undefined) updatePayload['is_active'] = values.isActive;

    const { data: row, error } = await this.supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', id)
      .select(CLIENT_SELECT)
      .maybeSingle<ClientRow>();

    if (isUniqueViolation(error)) {
      throw new Error('A client with this name already exists.');
    }
    throwIfError(error, 'Failed to update client.');
    if (!row) {
      return null;
    }

    const counts = await this.getProjectCountByClientId(id);
    return toClientVM(toClientModel(fromClientRow(row)), counts.get(row.id) ?? 0);
  }

  async archiveClient(id: number): Promise<ClientVM | null> {
    const { count, error: countError } = await this.supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', id)
      .eq('is_active', true);
    throwIfError(countError, 'Failed to inspect client projects.');
    if ((count ?? 0) > 0) {
      throw new Error('Cannot archive a client with active projects.');
    }

    const { data: row, error } = await this.supabase
      .from('clients')
      .update({ is_active: false })
      .eq('id', id)
      .select(CLIENT_SELECT)
      .maybeSingle<ClientRow>();
    throwIfError(error, 'Failed to archive client.');
    if (!row) {
      return null;
    }

    const counts = await this.getProjectCountByClientId(id);
    return toClientVM(toClientModel(fromClientRow(row)), counts.get(row.id) ?? 0);
  }

  async deleteClient(id: number): Promise<DeleteClientResult> {
    const { count, error: countError } = await this.supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', id);
    throwIfError(countError, 'Failed to inspect client projects.');

    if ((count ?? 0) > 0) {
      const archived = await this.archiveClient(id);
      return { mode: 'archived', client: archived };
    }

    const { error } = await this.supabase.from('clients').delete().eq('id', id);
    throwIfError(error, 'Failed to delete client.');
    return { mode: 'deleted', client: null };
  }

  /**
   * Group active project counts by `clientId`. Pass `clientId` to limit the
   * scan when only one row is needed; otherwise compute totals for all rows.
   */
  private async getProjectCountByClientId(clientId?: number): Promise<Map<number, number>> {
    let query = this.supabase.from('projects').select('client_id');
    if (clientId !== undefined) {
      query = query.eq('client_id', clientId);
    }
    const { data: rows, error } = await query.returns<Array<{ client_id: number }>>();
    throwIfError(error, 'Failed to load client project counts.');

    const counts = new Map<number, number>();
    for (const row of rows ?? []) {
      counts.set(row.client_id, (counts.get(row.client_id) ?? 0) + 1);
    }
    return counts;
  }
}
