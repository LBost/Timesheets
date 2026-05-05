import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { OrdersRepository } from '../data/orders.repository';
import { OrdersStore } from './orders.store';

describe('OrdersStore', () => {
  const repositoryMock = {
    listOrders: vi.fn(),
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
    archiveOrder: vi.fn(),
  };

  beforeEach(() => {
    repositoryMock.listOrders.mockReset();
    repositoryMock.createOrder.mockReset();
    repositoryMock.updateOrder.mockReset();
    repositoryMock.archiveOrder.mockReset();

    TestBed.configureTestingModule({
      providers: [{ provide: OrdersRepository, useValue: repositoryMock }],
    });
  });

  it('loads orders into state', async () => {
    repositoryMock.listOrders.mockResolvedValue([
      {
        id: 1,
        code: 'PO-1',
        title: 'Retainer',
        projectId: 1,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        projectCode: 'PRJ-1',
        projectName: 'Project One',
        timeEntryCount: 0,
      },
    ]);

    const store = TestBed.inject(OrdersStore);
    await store.loadOrders();

    expect(store.orders().length).toBe(1);
    expect(store.error()).toBeNull();
  });

  it('creates and appends an order', async () => {
    repositoryMock.createOrder.mockResolvedValue({
      id: 2,
      code: 'PO-2',
      title: 'Extension',
      projectId: 1,
      isActive: true,
      createdAt: new Date('2026-01-01'),
      projectCode: 'PRJ-1',
      projectName: 'Project One',
      timeEntryCount: 0,
    });

    const store = TestBed.inject(OrdersStore);
    await store.createOrder({ code: 'PO-2', title: 'Extension', projectId: 1 });

    expect(store.orders().map((order) => order.code)).toContain('PO-2');
    expect(store.selectedOrderId()).toBe(2);
  });
});
