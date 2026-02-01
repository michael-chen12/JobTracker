import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, change, icon }: MetricCardProps) {
  // Don't show trend if change is 0 or undefined
  const showTrend = change !== undefined && change !== 0;
  const isPositive = change !== undefined && change > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {showTrend && (
          <div className="mt-2 flex items-center gap-1">
            <div
              className={cn(
                'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold',
                isPositive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              )}
              aria-label={isPositive ? 'trend up' : 'trend down'}
            >
              {isPositive ? (
                <ArrowUpIcon className="mr-1 h-3 w-3" />
              ) : (
                <ArrowDownIcon className="mr-1 h-3 w-3" />
              )}
              {isPositive ? '+' : ''}
              {change}%
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
