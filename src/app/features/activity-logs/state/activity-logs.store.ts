import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import { ACTIVITY_LOG_PAGE_SIZE, defaultActivityLogDateRange } from '../models/activity-log.filters';
import {
  ActivityLogCategory,
  ActivityLogListCursor,
} from '../models/activity-log.model';
import { ActivityLogVM } from '../models/activity-log.vm';
import { toActivityLogVM } from '../data/activity-log.mapper';
import { ActivityLogsRepository } from '../data/activity-logs.repository';

type ActivityLogsState = {
  logs: ActivityLogVM[];
  category: ActivityLogCategory;
  fromDate: string;
  toDate: string;
  nextCursor: ActivityLogListCursor | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasLoaded: boolean;
  error: string | null;
};

const defaultRange = defaultActivityLogDateRange();

const initialState: ActivityLogsState = {
  logs: [],
  category: ActivityLogCategory.ALL,
  fromDate: defaultRange.fromDate,
  toDate: defaultRange.toDate,
  nextCursor: null,
  isLoading: false,
  isLoadingMore: false,
  hasLoaded: false,
  error: null,
};

export const ActivityLogsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, repository = inject(ActivityLogsRepository)) => {
    const loadPage = async (append: boolean): Promise<void> => {
      patchState(store, append ? { isLoadingMore: true, error: null } : { isLoading: true, error: null });
      try {
        const result = await repository.list({
          category: store.category(),
          fromDate: store.fromDate(),
          toDate: store.toDate(),
          limit: ACTIVITY_LOG_PAGE_SIZE,
          cursor: append ? store.nextCursor() : null,
        });
        const mapped = result.logs.map(toActivityLogVM);
        patchState(store, {
          logs: append ? [...store.logs(), ...mapped] : mapped,
          nextCursor: result.nextCursor,
          isLoading: false,
          isLoadingMore: false,
          hasLoaded: true,
        });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          isLoadingMore: false,
          error: error instanceof Error ? error.message : 'Failed to load activity logs.',
        });
      }
    };

    return {
      async loadLogs(): Promise<void> {
        patchState(store, { nextCursor: null });
        await loadPage(false);
      },
      async loadMoreLogs(): Promise<void> {
        if (!store.nextCursor() || store.isLoadingMore()) {
          return;
        }
        await loadPage(true);
      },
      setCategory(category: ActivityLogCategory): void {
        patchState(store, { category });
      },
      setDateRange(fromDate: string, toDate: string): void {
        patchState(store, { fromDate, toDate });
      },
    };
  }),
);
