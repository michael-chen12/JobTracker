'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDebounce } from '@/hooks/useDebounce';
import { AdvancedFilterPanel, type AdvancedFilters } from './AdvancedFilterPanel';
import { FilterPresets } from './FilterPresets';
import { useDashboardStore } from '@/stores/dashboard-store';

const statusOptions = [
  { value: 'bookmarked', label: 'Bookmarked' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export function TableToolbar() {
  const filters = useDashboardStore((state) => state.filters);
  const applyFilters = useDashboardStore((state) => state.applyFilters);

  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [hasReferral, setHasReferral] = useState<boolean | undefined>(undefined);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const debouncedSearch = useDebounce(search, 500);
  const prevDebouncedSearchRef = useRef(debouncedSearch);

  useEffect(() => {
    const nextSearch = filters.search || '';
    setSearch(nextSearch);
    setSelectedStatuses(filters.status || []);
    setHasReferral(filters.hasReferral);
    setAdvancedFilters({
      location: filters.location,
      jobType: filters.jobType,
      salaryMin: filters.salaryMin,
      salaryMax: filters.salaryMax,
      appliedDateFrom: filters.appliedDateFrom,
      appliedDateTo: filters.appliedDateTo,
      tags: filters.tags,
      priority: filters.priority,
    });
    prevDebouncedSearchRef.current = nextSearch;
  }, [filters]);

  // Trigger filter change only when debounced search actually changes
  useEffect(() => {
    if (prevDebouncedSearchRef.current !== debouncedSearch) {
      prevDebouncedSearchRef.current = debouncedSearch;
      applyFilters({
        search: debouncedSearch,
        status: selectedStatuses,
        hasReferral,
        ...advancedFilters,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]); // Intentionally omit applyFilters and other deps to avoid extra fetches

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];

    setSelectedStatuses(newStatuses);
    applyFilters({
      search: debouncedSearch,
      status: newStatuses,
      hasReferral,
      ...advancedFilters,
    });
  };

  const handleReferralChange = (value: boolean | undefined) => {
    setHasReferral(value);
    applyFilters({
      search: debouncedSearch,
      status: selectedStatuses,
      hasReferral: value,
      ...advancedFilters,
    });
  };

  const handleAdvancedFiltersChange = (newAdvancedFilters: AdvancedFilters) => {
    setAdvancedFilters(newAdvancedFilters);
    applyFilters({
      search: debouncedSearch,
      status: selectedStatuses,
      hasReferral,
      ...newAdvancedFilters,
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedStatuses([]);
    setHasReferral(undefined);
    setAdvancedFilters({});
    applyFilters({}, { replace: true });
  };

  const hasBasicFilters =
    search.length > 0 ||
    selectedStatuses.length > 0 ||
    hasReferral !== undefined;
  const hasAdvancedFilters = Object.values(advancedFilters).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined
  );
  const hasFilters = hasBasicFilters || hasAdvancedFilters;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 lg:flex-1">
          <div className="relative w-full min-w-0 sm:flex-1 sm:max-w-sm">
            <label htmlFor="applications-search" className="sr-only">
              Search applications by company or position
            </label>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="applications-search"
              placeholder="Search by company or position..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Status
                {selectedStatuses.length > 0 && (
                  <span className="ml-1 rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                    {selectedStatuses.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-3">
                  Filter by Status
                </h4>
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(option.value)}
                      onChange={() => handleStatusToggle(option.value)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Referral Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Referral
                {hasReferral !== undefined && (
                  <span className="ml-1 rounded-full bg-teal-100 dark:bg-teal-900 px-2 py-0.5 text-xs font-medium text-teal-800 dark:text-teal-300">
                    {hasReferral ? 'Yes' : 'No'}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm mb-3">Filter by Referral</h4>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                  <input
                    type="radio"
                    name="referral"
                    checked={hasReferral === true}
                    onChange={() => handleReferralChange(true)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                  <input
                    type="radio"
                    name="referral"
                    checked={hasReferral === false}
                    onChange={() => handleReferralChange(false)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">No</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                  <input
                    type="radio"
                    name="referral"
                    checked={hasReferral === undefined}
                    onChange={() => handleReferralChange(undefined)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">All</span>
                </label>
              </div>
            </PopoverContent>
          </Popover>

          {hasFilters && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="w-full gap-2 sm:w-auto"
            >
              Clear all filters
            </Button>
          )}
        </div>

        {/* Filter Presets */}
        <FilterPresets />
      </div>

      {/* Advanced Filters Panel */}
      <AdvancedFilterPanel
        filters={advancedFilters}
        onFiltersChange={handleAdvancedFiltersChange}
      />
    </div>
  );
}
