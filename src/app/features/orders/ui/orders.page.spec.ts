import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ProjectsStore } from '../../projects/state/projects.store';
import { OrdersPage } from './orders.page';
import { OrdersStore } from '../state/orders.store';

describe('OrdersPage', () => {
  const ordersStoreMock = {
    orders: vi.fn(),
    selectedOrderId: vi.fn(),
    isLoading: vi.fn(),
    error: vi.fn(),
    loadOrders: vi.fn(),
    loadOrdersIfNeeded: vi.fn(),
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
    archiveOrder: vi.fn(),
  };
  const projectsStoreMock = {
    projects: vi.fn(),
    error: vi.fn(),
    loadProjects: vi.fn(),
    loadProjectsIfNeeded: vi.fn(),
  };

  beforeEach(async () => {
    ordersStoreMock.orders.mockReturnValue([]);
    ordersStoreMock.selectedOrderId.mockReturnValue(null);
    ordersStoreMock.isLoading.mockReturnValue(false);
    ordersStoreMock.error.mockReturnValue(null);
    ordersStoreMock.loadOrders.mockResolvedValue(undefined);
    ordersStoreMock.loadOrdersIfNeeded.mockResolvedValue(undefined);
    ordersStoreMock.createOrder.mockResolvedValue(undefined);
    ordersStoreMock.updateOrder.mockResolvedValue(undefined);
    ordersStoreMock.archiveOrder.mockResolvedValue(undefined);
    projectsStoreMock.projects.mockReturnValue([]);
    projectsStoreMock.error.mockReturnValue(null);
    projectsStoreMock.loadProjects.mockResolvedValue(undefined);
    projectsStoreMock.loadProjectsIfNeeded.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [OrdersPage],
      providers: [
        { provide: OrdersStore, useValue: ordersStoreMock },
        { provide: ProjectsStore, useValue: projectsStoreMock },
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
    expect(projectsStoreMock.loadProjectsIfNeeded).toHaveBeenCalled();
    expect(ordersStoreMock.loadOrdersIfNeeded).toHaveBeenCalled();
  });
});
