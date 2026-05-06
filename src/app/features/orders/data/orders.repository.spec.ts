import { TestBed } from '@angular/core/testing';

import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { createFakeSupabase, FakeTables } from '../../../../testing/supabase-client.fake';
import { OrdersRepository } from './orders.repository';

const USER_ID = '00000000-0000-0000-0000-000000000001';

function configure(tables: Partial<FakeTables>): OrdersRepository {
  const fake = createFakeSupabase(
    {
      projects: [
        {
          id: 10,
          user_id: USER_ID,
          client_id: 1,
          code: 'PRJ',
          name: 'Project A',
          use_orders: true,
          is_active: true,
        },
      ],
      orders: [],
      time_entries: [],
      ...tables,
    },
    { userId: USER_ID },
  );
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [OrdersRepository, { provide: SUPABASE_CLIENT, useValue: fake }],
  });
  return TestBed.inject(OrdersRepository);
}

describe('OrdersRepository', () => {
  it('creates an order and includes the project code', async () => {
    const repository = configure({});

    const order = await repository.createOrder({
      code: 'po-1',
      title: 'July extra scope',
      projectId: 10,
    });

    expect(order.code).toBe('PO-1');
    expect(order.projectCode).toBe('PRJ');
    expect(order.projectName).toBe('Project A');
  });

  it('rejects orders against projects that do not use orders', async () => {
    const repository = configure({
      projects: [
        {
          id: 10,
          user_id: USER_ID,
          client_id: 1,
          code: 'PRJ',
          name: 'Project A',
          use_orders: false,
          is_active: true,
        },
      ],
    });

    await expect(
      repository.createOrder({ code: 'A', title: 'B', projectId: 10 }),
    ).rejects.toThrow('Selected project does not use orders.');
  });

  it('deletes existing orders and reports success', async () => {
    const repository = configure({
      orders: [
        {
          id: 100,
          user_id: USER_ID,
          project_id: 10,
          code: 'PO-1',
          title: 'X',
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    const deleted = await repository.deleteOrder(100);
    expect(deleted).toBe(true);
  });
});
