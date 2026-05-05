import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ProjectsRepository } from '../../projects/data/projects.repository';
import { OrdersPage } from './orders.page';
import { OrdersStore } from '../state/orders.store';

describe('OrdersPage', () => {
  const ordersStoreMock = {
    orders: vi.fn(),
    selectedOrderId: vi.fn(),
    isLoading: vi.fn(),
    error: vi.fn(),
    loadOrders: vi.fn(),
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
    archiveOrder: vi.fn(),
  };
  const projectsRepositoryMock = {
    listProjects: vi.fn(),
  };

  beforeEach(async () => {
    ordersStoreMock.orders.mockReturnValue([]);
    ordersStoreMock.selectedOrderId.mockReturnValue(null);
    ordersStoreMock.isLoading.mockReturnValue(false);
    ordersStoreMock.error.mockReturnValue(null);
    ordersStoreMock.loadOrders.mockResolvedValue(undefined);
    ordersStoreMock.createOrder.mockResolvedValue(undefined);
    ordersStoreMock.updateOrder.mockResolvedValue(undefined);
    ordersStoreMock.archiveOrder.mockResolvedValue(undefined);
    projectsRepositoryMock.listProjects.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [OrdersPage],
      providers: [
        { provide: OrdersStore, useValue: ordersStoreMock },
        { provide: ProjectsRepository, useValue: projectsRepositoryMock },
      ],
    }).compileComponents();
  });

  it('creates the page', () => {
    const fixture = TestBed.createComponent(OrdersPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads projects and orders on init', async () => {
    const fixture = TestBed.createComponent(OrdersPage);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(projectsRepositoryMock.listProjects).toHaveBeenCalled();
    expect(ordersStoreMock.loadOrders).toHaveBeenCalled();
  });
});
