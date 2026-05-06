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
import { ProjectCreateInput, ProjectUpdateInput } from '../models/project.model';
import { ProjectVM } from '../models/project.vm';
import {
  ProjectRow,
  fromProjectRow,
  toProjectInsertValues,
  toProjectModel,
  toProjectUpdateValues,
  toProjectVM,
} from './project.mapper';

export type DeleteProjectResult = {
  mode: 'deleted' | 'archived';
  project: ProjectVM | null;
};

const PROJECT_SELECT =
  'id, name, code, unitRate:unit_rate, unit, currency, billingModel:billing_model, useOrders:use_orders, clientId:client_id, isActive:is_active, createdAt:created_at';

@Injectable({ providedIn: 'root' })
export class ProjectsRepository {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);

  async listProjects(): Promise<ProjectVM[]> {
    const { data: rows, error } = await this.supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .order('name', { ascending: true })
      .returns<ProjectRow[]>();
    throwIfError(error, 'Failed to load projects.');
    if (!rows) {
      return [];
    }

    const [clientNames, entryCounts] = await Promise.all([
      this.getClientNamesById(),
      this.getTimeEntryCountByProjectId(),
    ]);

    return rows.map((row) =>
      toProjectVM(
        toProjectModel(fromProjectRow(row)),
        clientNames.get(row.clientId) ?? 'Unknown client',
        entryCounts.get(row.id) ?? 0,
      ),
    );
  }

  async getProjectById(id: number): Promise<ProjectVM | null> {
    const { data: row, error } = await this.supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', id)
      .maybeSingle<ProjectRow>();
    throwIfError(error, 'Failed to load project.');
    if (!row) {
      return null;
    }

    const [clientNames, entryCounts] = await Promise.all([
      this.getClientNamesById(row.clientId),
      this.getTimeEntryCountByProjectId(id),
    ]);
    return toProjectVM(
      toProjectModel(fromProjectRow(row)),
      clientNames.get(row.clientId) ?? 'Unknown client',
      entryCounts.get(row.id) ?? 0,
    );
  }

  async createProject(input: ProjectCreateInput): Promise<ProjectVM> {
    const userId = await requireCurrentUserId(this.supabase);
    const payload = toProjectInsertValues(input);
    await this.ensureActiveClient(payload.clientId);

    const { data: row, error } = await this.supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: payload.name,
        code: payload.code,
        unit_rate: payload.unitRate,
        unit: payload.unit,
        currency: payload.currency,
        billing_model: payload.billingModel,
        use_orders: payload.useOrders,
        client_id: payload.clientId,
        is_active: payload.isActive,
      })
      .select(PROJECT_SELECT)
      .single<ProjectRow>();

    if (isUniqueViolation(error)) {
      throw new Error('A project with this code already exists for the selected client.');
    }
    throwIfError(error, 'Failed to create project.');

    const clientNames = await this.getClientNamesById(row!.clientId);
    return toProjectVM(
      toProjectModel(fromProjectRow(row!)),
      clientNames.get(row!.clientId) ?? 'Unknown client',
      0,
    );
  }

  async updateProject(id: number, input: ProjectUpdateInput): Promise<ProjectVM | null> {
    const values = toProjectUpdateValues(input);
    if (Object.keys(values).length === 0) {
      return this.getProjectById(id);
    }

    if (values.clientId !== undefined) {
      await this.ensureActiveClient(values.clientId);
    }

    const updatePayload: Record<string, unknown> = {};
    if (values.name !== undefined) updatePayload['name'] = values.name;
    if (values.code !== undefined) updatePayload['code'] = values.code;
    if (values.unitRate !== undefined) updatePayload['unit_rate'] = values.unitRate;
    if (values.unit !== undefined) updatePayload['unit'] = values.unit;
    if (values.currency !== undefined) updatePayload['currency'] = values.currency;
    if (values.billingModel !== undefined) updatePayload['billing_model'] = values.billingModel;
    if (values.useOrders !== undefined) updatePayload['use_orders'] = values.useOrders;
    if (values.clientId !== undefined) updatePayload['client_id'] = values.clientId;
    if (values.isActive !== undefined) updatePayload['is_active'] = values.isActive;

    const { data: row, error } = await this.supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .select(PROJECT_SELECT)
      .maybeSingle<ProjectRow>();

    if (isUniqueViolation(error)) {
      throw new Error('A project with this code already exists for the selected client.');
    }
    throwIfError(error, 'Failed to update project.');
    if (!row) {
      return null;
    }

    const [clientNames, entryCounts] = await Promise.all([
      this.getClientNamesById(row.clientId),
      this.getTimeEntryCountByProjectId(id),
    ]);
    return toProjectVM(
      toProjectModel(fromProjectRow(row)),
      clientNames.get(row.clientId) ?? 'Unknown client',
      entryCounts.get(row.id) ?? 0,
    );
  }

  async archiveProject(id: number): Promise<ProjectVM | null> {
    const { data: row, error } = await this.supabase
      .from('projects')
      .update({ is_active: false })
      .eq('id', id)
      .select(PROJECT_SELECT)
      .maybeSingle<ProjectRow>();
    throwIfError(error, 'Failed to archive project.');
    if (!row) {
      return null;
    }

    const [clientNames, entryCounts] = await Promise.all([
      this.getClientNamesById(row.clientId),
      this.getTimeEntryCountByProjectId(id),
    ]);
    return toProjectVM(
      toProjectModel(fromProjectRow(row)),
      clientNames.get(row.clientId) ?? 'Unknown client',
      entryCounts.get(row.id) ?? 0,
    );
  }

  async deleteProject(id: number): Promise<DeleteProjectResult> {
    const [{ count: orderCount, error: ordersError }, { count: entryCount, error: entriesError }] =
      await Promise.all([
        this.supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', id),
        this.supabase
          .from('time_entries')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', id),
      ]);
    throwIfError(ordersError, 'Failed to inspect project orders.');
    throwIfError(entriesError, 'Failed to inspect project time entries.');

    if ((orderCount ?? 0) > 0 || (entryCount ?? 0) > 0) {
      const archived = await this.archiveProject(id);
      return { mode: 'archived', project: archived };
    }

    const { error } = await this.supabase.from('projects').delete().eq('id', id);
    throwIfError(error, 'Failed to delete project.');
    return { mode: 'deleted', project: null };
  }

  private async ensureActiveClient(clientId: number): Promise<void> {
    const { data: row, error } = await this.supabase
      .from('clients')
      .select('id, is_active')
      .eq('id', clientId)
      .maybeSingle<{ id: number; is_active: boolean }>();
    throwIfError(error, 'Failed to verify client.');
    if (!row) {
      throw new Error('Selected client does not exist.');
    }
    if (row.is_active === false) {
      throw new Error('Selected client is inactive.');
    }
  }

  private async getClientNamesById(clientId?: number): Promise<Map<number, string>> {
    let query = this.supabase.from('clients').select('id, name');
    if (clientId !== undefined) {
      query = query.eq('id', clientId);
    }
    const { data: rows, error } = await query.returns<Array<{ id: number; name: string }>>();
    throwIfError(error, 'Failed to load clients.');

    const map = new Map<number, string>();
    for (const row of rows ?? []) {
      map.set(row.id, row.name);
    }
    return map;
  }

  private async getTimeEntryCountByProjectId(projectId?: number): Promise<Map<number, number>> {
    let query = this.supabase.from('time_entries').select('project_id');
    if (projectId !== undefined) {
      query = query.eq('project_id', projectId);
    }
    const { data: rows, error } = await query.returns<Array<{ project_id: number }>>();
    throwIfError(error, 'Failed to load project time entry counts.');

    const counts = new Map<number, number>();
    for (const row of rows ?? []) {
      counts.set(row.project_id, (counts.get(row.project_id) ?? 0) + 1);
    }
    return counts;
  }
}
