'use client';

import { useState, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { analyzeJobMatch } from '@/actions/analyze-job';
import { useToast } from '@/hooks/use-toast';

interface MatchScoreBadgeProps {
  applicationId: string;
  matchScore: number | null;
  onAnalysisComplete?: (score: number) => void;
  className?: string;
}

/**
 * Get badge variant based on score
 */
function getScoreVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 80) return 'default'; // Will be styled as green
  if (score >= 60) return 'secondary'; // Will be styled as blue
  if (score >= 40) return 'outline'; // Will be styled as yellow
  return 'destructive'; // Red
}

/**
 * Get badge color classes based on score
 */
function getScoreColorClass(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300';
  if (score >= 60) return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300';
  return 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300';
}

export function MatchScoreBadge({
  applicationId,
  matchScore,
  onAnalysisComplete,
  className,
}: MatchScoreBadgeProps) {
  const [isPending, startTransition] = useTransition();
  const [localScore, setLocalScore] = useState(matchScore);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    startTransition(async () => {
      const result = await analyzeJobMatch(applicationId);

      if (result.success && result.score !== undefined) {
        setLocalScore(result.score);
        onAnalysisComplete?.(result.score);
        toast({
          title: `Match score: ${result.score}%`,
          description: 'View details in the application page',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Analysis failed',
        });
      }
    });
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {localScore !== null ? (
        <>
          {/* Score badge with color coding */}
          <Badge
            variant="outline"
            className={cn(
              'font-semibold',
              getScoreColorClass(localScore)
            )}
          >
            {localScore}% Match
          </Badge>

          {/* Re-analyze button (icon only on mobile) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAnalyze}
            disabled={isPending}
            className="h-8 w-8 p-0 md:w-auto md:px-3"
            title="Re-analyze job match"
          >
            <RefreshCw
              className={cn('h-4 w-4', isPending && 'animate-spin')}
            />
            <span className="hidden md:inline ml-2">
              {isPending ? 'Analyzing...' : 'Re-analyze'}
            </span>
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAnalyze}
          disabled={isPending}
          className="text-xs md:text-sm"
        >
          {isPending ? 'Analyzing...' : 'Analyze Match'}
        </Button>
      )}
    </div>
  );
}
