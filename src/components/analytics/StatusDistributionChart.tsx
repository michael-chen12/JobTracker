'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { StatusDistribution } from '@/types/analytics';

interface StatusDistributionChartProps {
  data: StatusDistribution[];
}

const formatStatusLabel = (status: string) =>
  status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
        <CardDescription>Application status breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="count"
              nameKey="status"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => {
                  const payload = props?.payload as StatusDistribution | undefined;
                  const percent = payload?.percentage;
                  const valueLabel =
                    typeof percent === 'number' ? `${value} (${percent}%)` : value;
                  return [
                    valueLabel,
                    formatStatusLabel(typeof name === 'string' ? name : String(name)),
                  ];
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
          {data.map((entry) => (
            <div key={entry.status} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span>
                {formatStatusLabel(entry.status)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
