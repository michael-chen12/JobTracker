'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TagSelector } from '@/components/tags/TagSelector';
import { format } from 'date-fns';

export interface AdvancedFilters {
  location?: string;
  jobType?: string[];
  salaryMin?: number;
  salaryMax?: number;
  appliedDateFrom?: string;
  appliedDateTo?: string;
  tags?: string[];
  priority?: string[];
}

interface AdvancedFilterPanelProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
}

const JOB_TYPE_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
];

export function AdvancedFilterPanel({ filters, onFiltersChange }: AdvancedFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof AdvancedFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleToggleJobType = (jobType: string) => {
    const currentTypes = filters.jobType || [];
    const newTypes = currentTypes.includes(jobType)
      ? currentTypes.filter((t) => t !== jobType)
      : [...currentTypes, jobType];
    handleFilterChange('jobType', newTypes.length > 0 ? newTypes : undefined);
  };

  const handleTogglePriority = (priority: string) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter((p) => p !== priority)
      : [...currentPriorities, priority];
    handleFilterChange('priority', newPriorities.length > 0 ? newPriorities : undefined);
  };

  const handleClearAdvancedFilters = () => {
    onFiltersChange({
      location: undefined,
      jobType: undefined,
      salaryMin: undefined,
      salaryMax: undefined,
      appliedDateFrom: undefined,
      appliedDateTo: undefined,
      tags: undefined,
      priority: undefined,
    });
  };

  // Count active advanced filters
  const activeFilterCount = [
    filters.location,
    filters.jobType?.length,
    filters.salaryMin !== undefined || filters.salaryMax !== undefined,
    filters.appliedDateFrom || filters.appliedDateTo,
    filters.tags?.length,
    filters.priority?.length,
  ].filter(Boolean).length;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2 px-0 hover:bg-transparent"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="font-medium">Advanced Filters</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
              {activeFilterCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAdvancedFilters}
            className="gap-2 text-sm"
          >
            <X className="h-4 w-4" />
            Clear Advanced Filters
          </Button>
        )}
      </div>

      {/* Expanded Filter Form */}
      {isExpanded && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Location Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                placeholder="e.g., San Francisco"
                value={filters.location || ''}
                onChange={(e) =>
                  handleFilterChange('location', e.target.value || undefined)
                }
              />
            </div>

            {/* Salary Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Salary ($)</label>
              <Input
                type="number"
                placeholder="e.g., 80000"
                value={filters.salaryMin || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'salaryMin',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                min={0}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Salary ($)</label>
              <Input
                type="number"
                placeholder="e.g., 150000"
                value={filters.salaryMax || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'salaryMax',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                min={0}
              />
            </div>

            {/* Applied Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Applied From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {filters.appliedDateFrom
                      ? format(new Date(filters.appliedDateFrom), 'MMM dd, yyyy')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.appliedDateFrom ? new Date(filters.appliedDateFrom) : undefined}
                    onSelect={(date) =>
                      handleFilterChange('appliedDateFrom', date?.toISOString().split('T')[0])
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Applied To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {filters.appliedDateTo
                      ? format(new Date(filters.appliedDateTo), 'MMM dd, yyyy')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.appliedDateTo ? new Date(filters.appliedDateTo) : undefined}
                    onSelect={(date) =>
                      handleFilterChange('appliedDateTo', date?.toISOString().split('T')[0])
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Job Type Filter (Multi-select buttons) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Type</label>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={filters.jobType?.includes(option.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleToggleJobType(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Priority Filter (Multi-select buttons) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={filters.priority?.includes(option.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTogglePriority(option.value)}
                  className={filters.priority?.includes(option.value) ? option.color : ''}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <TagSelector
              selectedTagIds={filters.tags || []}
              onTagsChange={(tagIds) => handleFilterChange('tags', tagIds.length > 0 ? tagIds : undefined)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
