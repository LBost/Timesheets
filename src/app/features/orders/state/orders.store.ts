import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { OrderCreateInput, OrderUpdateInput } from '../models/order.model';
import { OrderVM } from '../models/order.vm';
import { OrdersRepository } from '../data/orders.repository';

type OrdersState = {
  orders: OrderVM[];
  selectedOrderId: number | null;
  isLoading: boolean;
  hasLoaded: boolean;
  lastLoadedAt: number | null;
  error: string | null;
};

const initialState: OrdersState = {
  orders: [],
  selectedOrderId: null,
  isLoading: false,
  hasLoaded: false,
  lastLoadedAt: null,
  error: null,
};

export const OrdersStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    selectedOrder: computed(
      () => store.orders().find((order) => order.id === store.selectedOrderId()) ?? null
    ),
  })),
  withMethods((store, repository = inject(OrdersRepository)) => {
    const loadOrders = async (): Promise<void> => {
      patchState(store, { isLoading: true, error: null });
      try {
        const orders = await repository.listOrders();
        patchState(store, {
          orders,
          isLoading: false,
          hasLoaded: true,
          lastLoadedAt: Date.now(),
        });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load orders.',
        });
      }
    };

    return {
      async loadOrders(): Promise<void> {
        await loadOrders();
      },
      async loadOrdersIfNeeded(): Promise<void> {
        if (store.hasLoaded()) {
          return;
        }
        await loadOrders();
      },
      selectOrder(id: number | null): void {
        patchState(store, { selectedOrderId: id });
      },
      async createOrder(input: OrderCreateInput): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const order = await repository.createOrder(input);
          patchState(store, (state) => ({
            orders: [...state.orders, order].sort((a, b) => a.code.localeCompare(b.code)),
            selectedOrderId: order.id,
            isLoading: false,
          }));
        } catch (error) {
          patchState(store, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to create order.',
          });
        }
      },
      async updateOrder(id: number, input: OrderUpdateInput): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const updated = await repository.updateOrder(id, input);
          if (!updated) {
            patchState(store, { isLoading: false, error: 'Order not found.' });
            return;
          }

          patchState(store, (state) => ({
            orders: state.orders
              .map((order) => (order.id === id ? updated : order))
              .sort((a, b) => a.code.localeCompare(b.code)),
            isLoading: false,
          }));
        } catch (error) {
          patchState(store, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update order.',
          });
        }
      },
      async archiveOrder(id: number): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const archived = await repository.archiveOrder(id);
          if (!archived) {
            patchState(store, { isLoading: false, error: 'Order not found.' });
            return;
          }

          patchState(store, (state) => ({
            orders: state.orders.map((order) => (order.id === id ? archived : order)),
            isLoading: false,
          }));
        } catch (error) {
          patchState(store, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to archive order.',
          });
        }
      },
      async deleteOrder(id: number): Promise<boolean> {
        patchState(store, { isLoading: true, error: null });
        try {
          const deleted = await repository.deleteOrder(id);
          if (!deleted) {
            patchState(store, { isLoading: false, error: 'Order not found.' });
            return false;
          }

          patchState(store, (state) => ({
            orders: state.orders.filter((order) => order.id !== id),
            selectedOrderId: state.selectedOrderId === id ? null : state.selectedOrderId,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          patchState(store, {
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to delete order.',
          });
          return false;
        }
      },
    };
  })
);
