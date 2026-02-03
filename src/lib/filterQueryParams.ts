import type { GetApplicationsParams } from '@/actions/applications';

/**
 * Convert filter params to URL search params for sharing/bookmarking
 */
export function filtersToSearchParams(filters: GetApplicationsParams): URLSearchParams {
  const params = new URLSearchParams();

  // Helper to add param only if value exists
  const addParam = (key: string, value: any) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','));
      }
    } else if (typeof value === 'number') {
      params.set(key, value.toString());
    } else if (typeof value === 'boolean') {
      params.set(key, value ? '1' : '0');
    } else if (typeof value === 'string' && value.trim().length > 0) {
      params.set(key, value);
    }
  };

  // Basic filters
  addParam('page', filters.page);
  addParam('limit', filters.limit);
  addParam('sortBy', filters.sortBy);
  addParam('sortOrder', filters.sortOrder);
  addParam('status', filters.status);
  addParam('search', filters.search);
  addParam('hasReferral', filters.hasReferral);

  // Advanced filters
  addParam('location', filters.location);
  addParam('jobType', filters.jobType);
  addParam('salaryMin', filters.salaryMin);
  addParam('salaryMax', filters.salaryMax);
  addParam('appliedDateFrom', filters.appliedDateFrom);
  addParam('appliedDateTo', filters.appliedDateTo);
  addParam('tags', filters.tags);
  addParam('priority', filters.priority);

  return params;
}

/**
 * Parse URL search params back to filter params
 */
export function searchParamsToFilters(searchParams: URLSearchParams): GetApplicationsParams {
  const filters: GetApplicationsParams = {};

  // Helper to get array param
  const getArrayParam = (key: string): string[] | undefined => {
    const value = searchParams.get(key);
    if (!value) return undefined;
    return value.split(',').filter(Boolean);
  };

  // Helper to get number param
  const getNumberParam = (key: string): number | undefined => {
    const value = searchParams.get(key);
    if (!value) return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  };

  // Helper to get boolean param
  const getBooleanParam = (key: string): boolean | undefined => {
    const value = searchParams.get(key);
    if (!value) return undefined;
    return value === '1' || value === 'true';
  };

  // Helper to get string param
  const getStringParam = (key: string): string | undefined => {
    const value = searchParams.get(key);
    return value && value.trim().length > 0 ? value : undefined;
  };

  // Basic filters
  filters.page = getNumberParam('page');
  filters.limit = getNumberParam('limit');
  filters.sortBy = getStringParam('sortBy') as any;
  filters.sortOrder = getStringParam('sortOrder') as any;
  filters.status = getArrayParam('status');
  filters.search = getStringParam('search');
  filters.hasReferral = getBooleanParam('hasReferral');

  // Advanced filters
  filters.location = getStringParam('location');
  filters.jobType = getArrayParam('jobType');
  filters.salaryMin = getNumberParam('salaryMin');
  filters.salaryMax = getNumberParam('salaryMax');
  filters.appliedDateFrom = getStringParam('appliedDateFrom');
  filters.appliedDateTo = getStringParam('appliedDateTo');
  filters.tags = getArrayParam('tags');
  filters.priority = getArrayParam('priority');

  return filters;
}

/**
 * Check if filters object has any active filters
 */
export function hasActiveFilters(filters: GetApplicationsParams): boolean {
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    ...activeFilters
  } = filters;

  return Object.values(activeFilters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null;
  });
}

/**
 * Merge filter objects, removing undefined values
 */
export function mergeFilters(...filterObjects: Partial<GetApplicationsParams>[]): GetApplicationsParams {
  const merged: GetApplicationsParams = {};

  for (const filters of filterObjects) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length === 0) {
          delete merged[key as keyof GetApplicationsParams];
        } else {
          (merged as any)[key] = value;
        }
      }
    }
  }

  return merged;
}
