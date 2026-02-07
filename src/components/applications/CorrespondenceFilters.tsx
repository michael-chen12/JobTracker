/**
 * CorrespondenceFilters Component
 * Ticket #25: Email Correspondence
 *
 * Client-side filters: direction toggles + date range
 */

'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CorrespondenceDirectionBadge } from './CorrespondenceDirectionBadge';
import type { CorrespondenceDirection } from '@/types/application';

export interface CorrespondenceFiltersState {
  directions: CorrespondenceDirection[];
  dateFrom?: string;
  dateTo?: string;
}

interface CorrespondenceFiltersProps {
  filters: CorrespondenceFiltersState;
  onFiltersChange: (filters: CorrespondenceFiltersState) => void;
}

const allDirections: CorrespondenceDirection[] = ['inbound', 'outbound'];

export function CorrespondenceFilters({
  filters,
  onFiltersChange,
}: CorrespondenceFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDirection = (direction: CorrespondenceDirection) => {
    const current = filters.directions || [];
    const updated = current.includes(direction)
      ? current.filter((d) => d !== direction)
      : [...current, direction];

    onFiltersChange({ ...filters, directions: updated });
  };

  const handleDateFromChange = (value: string) => {
    const isoDate = value ? new Date(value + 'T00:00:00').toISOString() : undefined;
    onFiltersChange({ ...filters, dateFrom: isoDate });
  };

  const handleDateToChange = (value: string) => {
    const isoDate = value ? new Date(value + 'T23:59:59').toISOString() : undefined;
    onFiltersChange({ ...filters, dateTo: isoDate });
  };

  const resetFilters = () => {
    onFiltersChange({ directions: [], dateFrom: undefined, dateTo: undefined });
  };

  const activeCount =
    (filters.directions?.length || 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  const dateFromValue = filters.dateFrom
    ? new Date(filters.dateFrom).toISOString().split('T')[0]
    : '';
  const dateToValue = filters.dateTo
    ? new Date(filters.dateTo).toISOString().split('T')[0]
    : '';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeCount}
            </Badge>
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
          {/* Direction filters */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Direction</Label>
            <div className="flex flex-wrap gap-2">
              {allDirections.map((dir) => {
                const isSelected = filters.directions?.includes(dir) || false;
                return (
                  <button
                    key={dir}
                    onClick={() => toggleDirection(dir)}
                    className={`transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                    }`}
                  >
                    <CorrespondenceDirectionBadge direction={dir} size="sm" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range filters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="corrDateFrom" className="text-sm font-medium">
                From
              </Label>
              <Input
                id="corrDateFrom"
                type="date"
                value={dateFromValue}
                onChange={(e) => handleDateFromChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="corrDateTo" className="text-sm font-medium">
                To
              </Label>
              <Input
                id="corrDateTo"
                type="date"
                value={dateToValue}
                onChange={(e) => handleDateToChange(e.target.value)}
              />
            </div>
          </div>

          {/* Reset button */}
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="w-full"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
