'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { getApplications, type GetApplicationsParams } from '@/actions/applications';
import type { ApplicationRow } from '@/components/applications/columns';
import { filtersToSearchParams, searchParamsToFilters } from '@/lib/filterQueryParams';

export type DashboardViewMode = 'table' | 'kanban';

export interface DashboardPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardState {
  applications: ApplicationRow[];
  pagination: DashboardPagination;
  filters: GetApplicationsParams;
  loading: boolean;
  viewMode: DashboardViewMode;
  error: string | null;
}

export interface DashboardActions {
  initialize: (state: Partial<DashboardState>) => void;
  applyFilters: (
    filters: Partial<GetApplicationsParams>,
    options?: { replace?: boolean }
  ) => Promise<void>;
  setApplications: (applications: ApplicationRow[]) => void;
  setPagination: (pagination: DashboardPagination) => void;
  setLoading: (loading: boolean) => void;
  setViewMode: (mode: DashboardViewMode) => void;
  resetFilters: () => Promise<void>;
}

export type DashboardStore = DashboardState & DashboardActions;

interface DashboardStoreInit {
  applications: ApplicationRow[];
  pagination: DashboardPagination;
  filters?: GetApplicationsParams;
  loading?: boolean;
  viewMode?: DashboardViewMode;
  error?: string | null;
}

const DEFAULT_VIEW_MODE: DashboardViewMode = 'table';

function normalizeFilters(filters: GetApplicationsParams): GetApplicationsParams {
  const params = filtersToSearchParams(filters);
  return searchParamsToFilters(params);
}

function createDashboardStore(init: DashboardStoreInit): StoreApi<DashboardStore> {
  const initialFilters = normalizeFilters(init.filters ?? {});

  return createStore<DashboardStore>((set, get) => ({
    applications: init.applications,
    pagination: init.pagination,
    filters: initialFilters,
    loading: init.loading ?? false,
    viewMode: init.viewMode ?? DEFAULT_VIEW_MODE,
    error: init.error ?? null,

    initialize: (state) => {
      const nextFilters = normalizeFilters(state.filters ?? get().filters);
      set({
        ...state,
        filters: nextFilters,
      });
    },

    applyFilters: async (filters, options) => {
      const baseFilters = options?.replace ? {} : get().filters;
      const merged = normalizeFilters({
        ...baseFilters,
        ...filters,
      });

      set({
        filters: merged,
        loading: true,
      });

      try {
        const result = await getApplications(merged);
        if ('data' in result && 'pagination' in result) {
          set({
            applications: result.data,
            pagination: result.pagination,
            loading: false,
            error: null,
          });
        } else {
          set({
            loading: false,
            error: result.error ?? 'Failed to fetch applications',
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to fetch applications';
        set({
          loading: false,
          error: message,
        });
      }
    },

    setApplications: (applications) => set({ applications }),
    setPagination: (pagination) => set({ pagination }),
    setLoading: (loading) => set({ loading }),
    setViewMode: (viewMode) => set({ viewMode }),

    resetFilters: async () => {
      await get().applyFilters({}, { replace: true });
    },
  }));
}

const DashboardStoreContext = createContext<StoreApi<DashboardStore> | null>(null);

export function DashboardStoreProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState: DashboardStoreInit;
}) {
  const storeRef = useRef<StoreApi<DashboardStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createDashboardStore(initialState);
  }

  return (
    <DashboardStoreContext.Provider value={storeRef.current!}>
      {children}
    </DashboardStoreContext.Provider>
  );
}

export function useDashboardStore<T>(selector: (state: DashboardStore) => T): T {
  const store = useContext(DashboardStoreContext);

  if (!store) {
    throw new Error('DashboardStoreProvider is missing');
  }

  return useStore(store, selector);
}
