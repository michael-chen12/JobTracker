/**
 * MetricCard Usage Examples
 *
 * This file demonstrates how to use the MetricCard component.
 * Import in your analytics dashboard like this:
 *
 * import { MetricCard } from '@/components/analytics/MetricCard';
 */

import { MetricCard } from './MetricCard';
import { BriefcaseIcon, TrendingUpIcon, CalendarIcon } from 'lucide-react';

export function MetricCardExamples() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Basic metric without trend */}
      <MetricCard
        label="Total Applications"
        value="45"
      />

      {/* Metric with positive trend and icon */}
      <MetricCard
        label="Response Rate"
        value="32%"
        change={12}
        icon={<TrendingUpIcon />}
      />

      {/* Metric with negative trend */}
      <MetricCard
        label="Interview Rate"
        value="18%"
        change={-5}
        icon={<BriefcaseIcon />}
      />

      {/* Metric with zero change (no trend shown) */}
      <MetricCard
        label="Avg. Days to Response"
        value="7.2"
        change={0}
        icon={<CalendarIcon />}
      />
    </div>
  );
}
