/**
 * InteractionFilters Component
 * Ticket #17: Interaction History Tracking
 *
 * Collapsible filter panel for interaction timeline
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
import { InteractionTypeBadge } from './InteractionTypeBadge';
import type { InteractionFilters, InteractionType } from '@/types/contacts';

interface InteractionFiltersProps {
  filters: InteractionFilters;
  onFiltersChange: (filters: InteractionFilters) => void;
}

const allTypes: InteractionType[] = [
  'email',
  'call',
  'meeting',
  'linkedin_message',
  'other',
];

export function InteractionFilters({
  filters,
  onFiltersChange,
}: InteractionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleType = (type: InteractionType) => {
    const currentTypes = filters.types || [];
    const updatedTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    onFiltersChange({ ...filters, types: updatedTypes });
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
    onFiltersChange({ types: [], dateFrom: undefined, dateTo: undefined });
  };

  // Calculate active filter count
  const activeCount =
    (filters.types?.length || 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  // Convert ISO dates to YYYY-MM-DD for input
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
          {/* Type filters */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Interaction Types</Label>
            <div className="flex flex-wrap gap-2">
              {allTypes.map((type) => {
                const isSelected = filters.types?.includes(type) || false;
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                    }`}
                  >
                    <InteractionTypeBadge type={type} size="sm" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range filters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dateFrom" className="text-sm font-medium">
                From
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFromValue}
                onChange={(e) => handleDateFromChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo" className="text-sm font-medium">
                To
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateToValue}
                onChange={(e) => handleDateToChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
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
