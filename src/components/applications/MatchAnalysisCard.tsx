'use client';

import { useEffect, useState, useTransition } from 'react';
import { CheckCircle2, AlertCircle, Lightbulb, ChevronDown, Loader2 } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { analyzeJobMatch } from '@/actions/analyze-job';
import { useToast } from '@/hooks/use-toast';
import type { MatchAnalysis } from '@/types/ai';

interface MatchAnalysisCardProps {
  applicationId: string;
  matchScore: number | null;
  matchAnalysis: MatchAnalysis | null;
  analyzedAt?: string | null;
  onAnalysisComplete?: (score: number, analysis: MatchAnalysis) => void;
  className?: string;
}

export function MatchAnalysisCard({
  applicationId,
  matchScore,
  matchAnalysis,
  analyzedAt,
  onAnalysisComplete,
  className,
}: MatchAnalysisCardProps) {
  const [isPending, startTransition] = useTransition();
  const [localScore, setLocalScore] = useState(matchScore);
  const [localAnalysis, setLocalAnalysis] = useState(matchAnalysis);
  const { toast } = useToast();
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState<'scraping' | 'calculating' | 'analyzing'>('scraping');

  useEffect(() => {
    if (!isPending) {
      setAnalysisProgress(0);
      setAnalysisStep('scraping');
      return;
    }

    let progress = 10;
    setAnalysisProgress(progress);
    setAnalysisStep('scraping');

    const interval = setInterval(() => {
      progress = Math.min(95, progress + 7);
      setAnalysisProgress(progress);

      if (progress < 40) {
        setAnalysisStep('scraping');
      } else if (progress < 70) {
        setAnalysisStep('calculating');
      } else {
        setAnalysisStep('analyzing');
      }
    }, 700);

    return () => clearInterval(interval);
  }, [isPending]);

  const getStepLabel = (step: typeof analysisStep) => {
    if (step === 'scraping') return 'Fetching job description...';
    if (step === 'calculating') return 'Calculating base score...';
    return 'AI is analyzing fit...';
  };

  const handleReanalyze = async () => {
    startTransition(async () => {
      const result = await analyzeJobMatch(applicationId);

      if (result.success && result.score !== undefined && result.analysis) {
        setLocalScore(result.score);
        setLocalAnalysis(result.analysis);
        onAnalysisComplete?.(result.score, result.analysis);
        toast({
          title: 'Success',
          description: 'Analysis updated successfully',
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

  // If no analysis yet, show analyze button
  if (!localAnalysis || localScore === null) {
    return (
      <div className={cn('rounded-lg border bg-card p-6', className)}>
        <div className="flex flex-col items-center gap-4 py-8">
          <h3 className="text-lg font-semibold">Job Match Analysis</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Get AI-powered insights on how well this job matches your profile
          </p>
          {isPending ? (
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{getStepLabel(analysisStep)}</p>
                <p className="text-xs text-muted-foreground">
                  This may take 10-15 seconds
                </p>
              </div>
              <div className="w-full">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={handleReanalyze} disabled={isPending} size="lg">
              Analyze Job Match
            </Button>
          )}
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <div className="p-4 md:p-6">
        {/* Header with score and re-analyze button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold">Match Analysis</h3>

          <div className="flex items-center gap-4">
            {/* Circular progress for mobile */}
            <div className="relative">
              <CircularProgress value={localScore} size={80} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{localScore}</span>
              </div>
            </div>

            <Button
              onClick={handleReanalyze}
              disabled={isPending}
              size="sm"
              variant="outline"
            >
              {isPending ? 'Analyzing...' : 'Re-analyze'}
            </Button>
          </div>
        </div>

        {isPending && (
          <div className="mb-6 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1 space-y-2">
                <div className="text-sm font-medium">{getStepLabel(analysisStep)}</div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Score Breakdown - Stacked on mobile, side-by-side on desktop */}
        <div className="space-y-4 mb-6">
          <h4 className="text-sm font-medium text-muted-foreground">Score Breakdown</h4>
          <div className="space-y-3">
            <ProgressBar
              label="Skills"
              value={localAnalysis.breakdown.skills_score}
              max={40}
            />
            <ProgressBar
              label="Experience"
              value={localAnalysis.breakdown.experience_score}
              max={30}
            />
            <ProgressBar
              label="Education"
              value={localAnalysis.breakdown.education_score}
              max={15}
            />
            <ProgressBar
              label="Other Factors"
              value={localAnalysis.breakdown.other_score}
              max={15}
            />
          </div>
        </div>

        {/* Matching Skills */}
        {localAnalysis.matching_skills.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-muted-foreground">
              Matching Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {localAnalysis.matching_skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {localAnalysis.missing_skills.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-muted-foreground">
              Missing Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {localAnalysis.missing_skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {localAnalysis.strengths.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-muted-foreground">
              Your Strengths
            </h4>
            <ul className="space-y-2">
              {localAnalysis.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {localAnalysis.concerns.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-muted-foreground">
              Potential Concerns
            </h4>
            <ul className="space-y-2">
              {localAnalysis.concerns.map((concern, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {localAnalysis.recommendations.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-muted-foreground">
              Recommendations
            </h4>
            <ul className="space-y-2">
              {localAnalysis.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Reasoning - Collapsible */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className="h-4 w-4" />
            Show AI Analysis Details
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <p className="text-sm">{localAnalysis.reasoning}</p>
              <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
                {analyzedAt && (
                  <p>Analyzed on {formatDate(analyzedAt)}</p>
                )}
                <p>
                  Base Score: {localAnalysis.base_score} → Adjusted:{' '}
                  {localAnalysis.adjusted_score} (
                  {localAnalysis.adjustment > 0 ? '+' : ''}
                  {localAnalysis.adjustment})
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
