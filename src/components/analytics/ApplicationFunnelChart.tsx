'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import type { ApplicationFunnel } from '@/types/analytics';

interface ApplicationFunnelChartProps {
  data: ApplicationFunnel[];
}

export function ApplicationFunnelChart({ data }: ApplicationFunnelChartProps) {
  const maxCount = data[0]?.count || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Funnel</CardTitle>
        <CardDescription>Conversion through application stages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((stage, index) => {
          const widthPercentage = (stage.count / maxCount) * 100;

          return (
            <div key={stage.stage} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stage.label}</span>
                  {index < data.length - 1 && stage.conversionRate !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowRight className="h-3 w-3" />
                      <span>{stage.conversionRate}%</span>
                    </div>
                  )}
                </div>
                <span className="font-semibold">{stage.count}</span>
              </div>
              <div className="h-8 w-full rounded-md bg-muted">
                <div
                  className="h-full rounded-md bg-primary transition-all"
                  style={{ width: `${widthPercentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
