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
import { OrderCreateInput, OrderUpdateInput } from '../models/order.model';
import { OrderVM } from '../models/order.vm';
import {
  OrderRow,
  fromOrderRow,
  toOrderInsertValues,
  toOrderModel,
  toOrderUpdateValues,
  toOrderVM,
} from './order.mapper';

const ORDER_SELECT =
  'id, code, title, projectId:project_id, isActive:is_active, createdAt:created_at';

@Injectable({ providedIn: 'root' })
export class OrdersRepository {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);

  async listOrders(): Promise<OrderVM[]> {
    const { data: rows, error } = await this.supabase
      .from('orders')
      .select(ORDER_SELECT)
      .order('code', { ascending: true })
      .returns<OrderRow[]>();
    throwIfError(error, 'Failed to load orders.');
    if (!rows) {
      return [];
    }

    const [projectsById, entryCounts] = await Promise.all([
      this.getProjectSummariesById(),
      this.getTimeEntryCountByOrderId(),
    ]);

    return rows.map((row) => {
      const project = projectsById.get(row.projectId);
      return toOrderVM(
        toOrderModel(fromOrderRow(row)),
        project?.code ?? 'UNKNOWN',
        project?.name ?? 'Unknown project',
        entryCounts.get(row.id) ?? 0,
      );
    });
  }

  async getOrderById(id: number): Promise<OrderVM | null> {
    const { data: row, error } = await this.supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', id)
      .maybeSingle<OrderRow>();
    throwIfError(error, 'Failed to load order.');
    if (!row) {
      return null;
    }

    const [projectsById, entryCounts] = await Promise.all([
      this.getProjectSummariesById(row.projectId),
      this.getTimeEntryCountByOrderId(id),
    ]);
    const project = projectsById.get(row.projectId);
    return toOrderVM(
      toOrderModel(fromOrderRow(row)),
      project?.code ?? 'UNKNOWN',
      project?.name ?? 'Unknown project',
      entryCounts.get(row.id) ?? 0,
    );
  }

  async createOrder(input: OrderCreateInput): Promise<OrderVM> {
    const userId = await requireCurrentUserId(this.supabase);
    const payload = toOrderInsertValues(input);
    await this.ensureProjectSupportsOrders(payload.projectId);

    const { data: row, error } = await this.supabase
      .from('orders')
      .insert({
        user_id: userId,
        code: payload.code,
        title: payload.title,
        project_id: payload.projectId,
        is_active: payload.isActive,
      })
      .select(ORDER_SELECT)
      .single<OrderRow>();

    if (isUniqueViolation(error)) {
      throw new Error('An order with this code already exists for the selected project.');
    }
    throwIfError(error, 'Failed to create order.');

    const projectsById = await this.getProjectSummariesById(row!.projectId);
    const project = projectsById.get(row!.projectId);
    return toOrderVM(
      toOrderModel(fromOrderRow(row!)),
      project?.code ?? 'UNKNOWN',
      project?.name ?? 'Unknown project',
      0,
    );
  }

  async updateOrder(id: number, input: OrderUpdateInput): Promise<OrderVM | null> {
    const values = toOrderUpdateValues(input);
    if (Object.keys(values).length === 0) {
      return this.getOrderById(id);
    }

    if (values.projectId !== undefined) {
      await this.ensureProjectSupportsOrders(values.projectId);
    }

    const updatePayload: Record<string, unknown> = {};
    if (values.code !== undefined) updatePayload['code'] = values.code;
    if (values.title !== undefined) updatePayload['title'] = values.title;
    if (values.projectId !== undefined) updatePayload['project_id'] = values.projectId;
    if (values.isActive !== undefined) updatePayload['is_active'] = values.isActive;

    const { data: row, error } = await this.supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select(ORDER_SELECT)
      .maybeSingle<OrderRow>();

    if (isUniqueViolation(error)) {
      throw new Error('An order with this code already exists for the selected project.');
    }
    throwIfError(error, 'Failed to update order.');
    if (!row) {
      return null;
    }

    const [projectsById, entryCounts] = await Promise.all([
      this.getProjectSummariesById(row.projectId),
      this.getTimeEntryCountByOrderId(id),
    ]);
    const project = projectsById.get(row.projectId);
    return toOrderVM(
      toOrderModel(fromOrderRow(row)),
      project?.code ?? 'UNKNOWN',
      project?.name ?? 'Unknown project',
      entryCounts.get(row.id) ?? 0,
    );
  }

  async archiveOrder(id: number): Promise<OrderVM | null> {
    const { data: row, error } = await this.supabase
      .from('orders')
      .update({ is_active: false })
      .eq('id', id)
      .select(ORDER_SELECT)
      .maybeSingle<OrderRow>();
    throwIfError(error, 'Failed to archive order.');
    if (!row) {
      return null;
    }

    const [projectsById, entryCounts] = await Promise.all([
      this.getProjectSummariesById(row.projectId),
      this.getTimeEntryCountByOrderId(id),
    ]);
    const project = projectsById.get(row.projectId);
    return toOrderVM(
      toOrderModel(fromOrderRow(row)),
      project?.code ?? 'UNKNOWN',
      project?.name ?? 'Unknown project',
      entryCounts.get(row.id) ?? 0,
    );
  }

  async deleteOrder(id: number): Promise<boolean> {
    const { error: existenceError, data: existingRow } = await this.supabase
      .from('orders')
      .select('id')
      .eq('id', id)
      .maybeSingle<{ id: number }>();
    throwIfError(existenceError, 'Failed to verify order.');
    if (!existingRow) {
      return false;
    }

    const { error } = await this.supabase.from('orders').delete().eq('id', id);
    throwIfError(error, 'Failed to delete order.');
    return true;
  }

  private async ensureProjectSupportsOrders(projectId: number): Promise<void> {
    const { data: row, error } = await this.supabase
      .from('projects')
      .select('id, use_orders, is_active')
      .eq('id', projectId)
      .maybeSingle<{ id: number; use_orders: boolean; is_active: boolean }>();
    throwIfError(error, 'Failed to verify project.');
    if (!row) {
      throw new Error('Selected project does not exist.');
    }
    if (!row.use_orders) {
      throw new Error('Selected project does not use orders.');
    }
    if (row.is_active === false) {
      throw new Error('Selected project is inactive.');
    }
  }

  private async getProjectSummariesById(
    projectId?: number,
  ): Promise<Map<number, { code: string; name: string }>> {
    let query = this.supabase.from('projects').select('id, code, name');
    if (projectId !== undefined) {
      query = query.eq('id', projectId);
    }
    const { data: rows, error } = await query.returns<
      Array<{ id: number; code: string; name: string }>
    >();
    throwIfError(error, 'Failed to load projects.');

    const map = new Map<number, { code: string; name: string }>();
    for (const row of rows ?? []) {
      map.set(row.id, { code: row.code, name: row.name });
    }
    return map;
  }

  private async getTimeEntryCountByOrderId(orderId?: number): Promise<Map<number, number>> {
    let query = this.supabase.from('time_entries').select('order_id').not('order_id', 'is', null);
    if (orderId !== undefined) {
      query = query.eq('order_id', orderId);
    }
    const { data: rows, error } = await query.returns<Array<{ order_id: number }>>();
    throwIfError(error, 'Failed to load order time entry counts.');

    const counts = new Map<number, number>();
    for (const row of rows ?? []) {
      counts.set(row.order_id, (counts.get(row.order_id) ?? 0) + 1);
    }
    return counts;
  }
}
