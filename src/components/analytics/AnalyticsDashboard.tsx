'use client';

import { useState } from 'react';
import type { AnalyticsData, DateRangeFilter } from '@/types/analytics';
import { MetricCard } from './MetricCard';
import { ApplicationTrendsChart } from './ApplicationTrendsChart';
import { StatusDistributionChart } from './StatusDistributionChart';
import { ApplicationFunnelChart } from './ApplicationFunnelChart';
import { DateRangeSelector } from './DateRangeSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsDashboardProps {
  initialData: AnalyticsData;
  initialRange: DateRangeFilter;
}

export function AnalyticsDashboard({ initialData, initialRange }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRangeFilter>(initialRange);
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateRangeChange = async (range: DateRangeFilter) => {
    setDateRange(range);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/analytics?range=${range}`);
      const result = await response.json();

      if (result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Track your job search progress and insights
            </p>
          </div>
          <DateRangeSelector value={dateRange} onChange={handleDateRangeChange} />
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            label={data.metrics.totalApplications.label}
            value={data.metrics.totalApplications.value}
            change={data.metrics.totalApplications.change}
          />
          <MetricCard
            label={data.metrics.responseRate.label}
            value={data.metrics.responseRate.value}
            change={data.metrics.responseRate.change}
          />
          <MetricCard
            label={data.metrics.interviewRate.label}
            value={data.metrics.interviewRate.value}
            change={data.metrics.interviewRate.change}
          />
          <MetricCard
            label={data.metrics.averageDaysToResponse.label}
            value={data.metrics.averageDaysToResponse.value}
          />
          <MetricCard
            label={data.metrics.averageMatchScore.label}
            value={data.metrics.averageMatchScore.value}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <ApplicationTrendsChart data={data.trends} />
          </div>
          <StatusDistributionChart data={data.statusDistribution} />
          <ApplicationFunnelChart data={data.funnel} />
        </div>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle>Top Companies</CardTitle>
            <CardDescription>Companies you&apos;ve applied to most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topCompanies.map((company, index) => (
                <div key={company.company} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <span className="font-medium">{company.company}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {company.count} {company.count === 1 ? 'application' : 'applications'}
                  </span>
                </div>
              ))}
              {data.topCompanies.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No applications yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
