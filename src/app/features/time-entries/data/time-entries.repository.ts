import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';

import {
  SUPABASE_CLIENT,
  requireCurrentUserId,
} from '../../../core/supabase/supabase.client';
import { throwIfError } from '../../../core/supabase/postgrest.util';
import { normalizeClientAccentHex } from '../../../shared/components/client-accent/client-accent.util';
import { TimeEntryCreateInput, TimeEntryUpdateInput } from '../models/time-entry.model';
import { TimeEntryVM } from '../models/time-entry.vm';
import {
  TimeEntryRow,
  fromTimeEntryRow,
  toTimeEntryInsertValues,
  toTimeEntryModel,
  toTimeEntryUpdateValues,
  toTimeEntryVM,
} from './time-entry.mapper';

const TIME_ENTRY_SELECT =
  'id, clientId:client_id, projectId:project_id, orderId:order_id, date, hours, description, createdAt:created_at';

type ClientLookupRow = {
  id: number;
  name: string;
  accent_color: string | null;
  is_active: boolean;
};

type ProjectLookupRow = {
  id: number;
  client_id: number;
  code: string;
  name: string;
  use_orders: boolean;
  is_active: boolean;
};

type OrderLookupRow = {
  id: number;
  project_id: number;
  code: string;
  is_active: boolean;
};

@Injectable({ providedIn: 'root' })
export class TimeEntriesRepository {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);

  async listEntriesForMonth(year: number, month: number): Promise<TimeEntryVM[]> {
    const start = isoDate(new Date(year, month, 1));
    const end = isoDate(new Date(year, month + 1, 1));

    const { data: rows, error } = await this.supabase
      .from('time_entries')
      .select(TIME_ENTRY_SELECT)
      .gte('date', start)
      .lt('date', end)
      .order('date', { ascending: true })
      .order('id', { ascending: true })
      .returns<TimeEntryRow[]>();
    throwIfError(error, 'Failed to load time entries.');
    if (!rows || rows.length === 0) {
      return [];
    }

    const [clientsById, projectsById, ordersById] = await Promise.all([
      this.getClientsById(),
      this.getProjectsById(),
      this.getOrdersById(),
    ]);

    return rows.map((row) => {
      const record = fromTimeEntryRow(row);
      const client = clientsById.get(record.clientId);
      const project = projectsById.get(record.projectId);
      const order = record.orderId === null ? null : ordersById.get(record.orderId);
      return toTimeEntryVM(
        toTimeEntryModel(record),
        client?.name ?? 'Unknown client',
        normalizeClientAccentHex(client?.accent_color ?? null) ?? null,
        project?.code ?? 'UNKNOWN',
        project?.name ?? 'Unknown project',
        order?.code ?? null,
      );
    });
  }

  async getEntryById(id: number): Promise<TimeEntryVM | null> {
    const { data: row, error } = await this.supabase
      .from('time_entries')
      .select(TIME_ENTRY_SELECT)
      .eq('id', id)
      .maybeSingle<TimeEntryRow>();
    throwIfError(error, 'Failed to load time entry.');
    if (!row) {
      return null;
    }

    return this.hydrateSingle(row);
  }

  async createEntry(input: TimeEntryCreateInput): Promise<TimeEntryVM> {
    const userId = await requireCurrentUserId(this.supabase);
    const payload = toTimeEntryInsertValues(input);
    await this.ensureValidCascade(payload.clientId, payload.projectId, payload.orderId);

    const { data: row, error } = await this.supabase
      .from('time_entries')
      .insert({
        user_id: userId,
        client_id: payload.clientId,
        project_id: payload.projectId,
        order_id: payload.orderId,
        date: payload.date,
        hours: payload.hours,
        description: payload.description || null,
      })
      .select(TIME_ENTRY_SELECT)
      .single<TimeEntryRow>();
    throwIfError(error, 'Failed to create time entry.');

    return this.hydrateSingle(row!);
  }

  async updateEntry(id: number, input: TimeEntryUpdateInput): Promise<TimeEntryVM | null> {
    const values = toTimeEntryUpdateValues(input);
    if (Object.keys(values).length === 0) {
      return this.getEntryById(id);
    }

    const { data: current, error: currentError } = await this.supabase
      .from('time_entries')
      .select('id, client_id, project_id, order_id')
      .eq('id', id)
      .maybeSingle<{ id: number; client_id: number; project_id: number; order_id: number | null }>();
    throwIfError(currentError, 'Failed to load time entry.');
    if (!current) {
      return null;
    }

    const nextClientId = values.clientId ?? current.client_id;
    const nextProjectId = values.projectId ?? current.project_id;
    const nextOrderId = values.orderId !== undefined ? values.orderId : current.order_id;
    await this.ensureValidCascade(nextClientId, nextProjectId, nextOrderId);

    const updatePayload: Record<string, unknown> = {};
    if (values.clientId !== undefined) updatePayload['client_id'] = values.clientId;
    if (values.projectId !== undefined) updatePayload['project_id'] = values.projectId;
    if (values.orderId !== undefined) updatePayload['order_id'] = values.orderId;
    if (values.date !== undefined) updatePayload['date'] = values.date;
    if (values.hours !== undefined) updatePayload['hours'] = values.hours;
    if (values.description !== undefined) updatePayload['description'] = values.description || null;

    const { data: row, error } = await this.supabase
      .from('time_entries')
      .update(updatePayload)
      .eq('id', id)
      .select(TIME_ENTRY_SELECT)
      .maybeSingle<TimeEntryRow>();
    throwIfError(error, 'Failed to update time entry.');
    if (!row) {
      return null;
    }

    return this.hydrateSingle(row);
  }

  async deleteEntry(id: number): Promise<boolean> {
    const { data: existingRow, error: existenceError } = await this.supabase
      .from('time_entries')
      .select('id')
      .eq('id', id)
      .maybeSingle<{ id: number }>();
    throwIfError(existenceError, 'Failed to verify time entry.');
    if (!existingRow) {
      return false;
    }

    const { error } = await this.supabase.from('time_entries').delete().eq('id', id);
    throwIfError(error, 'Failed to delete time entry.');
    return true;
  }

  private async hydrateSingle(row: TimeEntryRow): Promise<TimeEntryVM> {
    const record = fromTimeEntryRow(row);
    const [client, project, order] = await Promise.all([
      this.getClientById(record.clientId),
      this.getProjectById(record.projectId),
      record.orderId === null ? Promise.resolve(null) : this.getOrderById(record.orderId),
    ]);

    return toTimeEntryVM(
      toTimeEntryModel(record),
      client?.name ?? 'Unknown client',
      normalizeClientAccentHex(client?.accent_color ?? null) ?? null,
      project?.code ?? 'UNKNOWN',
      project?.name ?? 'Unknown project',
      order?.code ?? null,
    );
  }

  private async ensureValidCascade(
    clientId: number,
    projectId: number,
    orderId: number | null,
  ): Promise<void> {
    const client = await this.getClientById(clientId);
    if (!client) {
      throw new Error('Selected client does not exist.');
    }
    if (client.is_active === false) {
      throw new Error('Selected client is inactive.');
    }

    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('Selected project does not exist.');
    }
    if (project.is_active === false) {
      throw new Error('Selected project is inactive.');
    }
    if (project.client_id !== clientId) {
      throw new Error('Selected project does not belong to the selected client.');
    }

    if (project.use_orders) {
      if (orderId === null) {
        throw new Error('Order is required for projects that use orders.');
      }

      const order = await this.getOrderById(orderId);
      if (!order || order.project_id !== projectId) {
        throw new Error('Selected order does not belong to the selected project.');
      }
      if (order.is_active === false) {
        throw new Error('Selected order is inactive.');
      }
      return;
    }

    if (orderId !== null) {
      throw new Error('Orders are not allowed for the selected project.');
    }
  }

  private async getClientById(id: number): Promise<ClientLookupRow | null> {
    const { data: row, error } = await this.supabase
      .from('clients')
      .select('id, name, accent_color, is_active')
      .eq('id', id)
      .maybeSingle<ClientLookupRow>();
    throwIfError(error, 'Failed to load client.');
    return row ?? null;
  }

  private async getProjectById(id: number): Promise<ProjectLookupRow | null> {
    const { data: row, error } = await this.supabase
      .from('projects')
      .select('id, client_id, code, name, use_orders, is_active')
      .eq('id', id)
      .maybeSingle<ProjectLookupRow>();
    throwIfError(error, 'Failed to load project.');
    return row ?? null;
  }

  private async getOrderById(id: number): Promise<OrderLookupRow | null> {
    const { data: row, error } = await this.supabase
      .from('orders')
      .select('id, project_id, code, is_active')
      .eq('id', id)
      .maybeSingle<OrderLookupRow>();
    throwIfError(error, 'Failed to load order.');
    return row ?? null;
  }

  private async getClientsById(): Promise<Map<number, ClientLookupRow>> {
    const { data: rows, error } = await this.supabase
      .from('clients')
      .select('id, name, accent_color, is_active')
      .returns<ClientLookupRow[]>();
    throwIfError(error, 'Failed to load clients.');
    return new Map((rows ?? []).map((row) => [row.id, row]));
  }

  private async getProjectsById(): Promise<Map<number, ProjectLookupRow>> {
    const { data: rows, error } = await this.supabase
      .from('projects')
      .select('id, client_id, code, name, use_orders, is_active')
      .returns<ProjectLookupRow[]>();
    throwIfError(error, 'Failed to load projects.');
    return new Map((rows ?? []).map((row) => [row.id, row]));
  }

  private async getOrdersById(): Promise<Map<number, OrderLookupRow>> {
    const { data: rows, error } = await this.supabase
      .from('orders')
      .select('id, project_id, code, is_active')
      .returns<OrderLookupRow[]>();
    throwIfError(error, 'Failed to load orders.');
    return new Map((rows ?? []).map((row) => [row.id, row]));
  }
}

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
