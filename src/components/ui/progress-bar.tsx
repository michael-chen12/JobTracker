import { cn } from '@/lib/utils';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  className?: string;
}

export function ProgressBar({ label, value, max, className }: ProgressBarProps) {
  const percentage = (value / max) * 100;

  // Color based on percentage
  const getColor = (pct: number) => {
    if (pct >= 80) return 'bg-green-600';
    if (pct >= 60) return 'bg-blue-600';
    if (pct >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            getColor(percentage)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
