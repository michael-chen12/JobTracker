'use client';

import { Button } from '@/components/ui/button';
import type { DateRangeFilter } from '@/types/analytics';

interface DateRangeSelectorProps {
  value: DateRangeFilter;
  onChange: (range: DateRangeFilter) => void;
}

const DATE_RANGES: { label: string; value: DateRangeFilter }[] = [
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 60 days', value: '60' },
  { label: 'Last 90 days', value: '90' },
  { label: 'All time', value: 'all' },
];

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Date range:</span>
      <div className="flex flex-wrap gap-2">
        {DATE_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={value === range.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
