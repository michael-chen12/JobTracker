'use client';

/**
 * FollowUpSuggestionsCard - AI-powered follow-up suggestions display
 *
 * Ticket #15: Follow-Up Suggestions
 *
 * Features:
 * - Collapsible card matching MatchAnalysisCard style
 * - Loading states with progress indicator
 * - Priority-based display (high, medium, low)
 * - Copy-to-clipboard templates
 * - Manual generation trigger
 * - Days-since-applied context display
 */

import { useEffect, useState, useTransition } from 'react';
import {
  Mail,
  Phone,
  Linkedin,
  CheckCircle,
  Copy,
  Check,
  Loader2,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { generateFollowUps } from '@/actions/generate-followups';
import { useToast } from '@/hooks/use-toast';
import type { FollowUpSuggestions, FollowUpSuggestion } from '@/types/ai';

interface FollowUpSuggestionsCardProps {
  applicationId: string;
  appliedDate: string | null;
  followUpSuggestions: FollowUpSuggestions | null;
  followupSuggestionsAt: string | null;
  onSuggestionsComplete?: (suggestions: FollowUpSuggestions) => void;
  className?: string;
}

export function FollowUpSuggestionsCard({
  applicationId,
  appliedDate,
  followUpSuggestions,
  followupSuggestionsAt,
  onSuggestionsComplete,
  className,
}: FollowUpSuggestionsCardProps) {
  const [isPending, startTransition] = useTransition();
  const [localSuggestions, setLocalSuggestions] = useState(followUpSuggestions);
  const [localSuggestionsAt, setLocalSuggestionsAt] = useState(followupSuggestionsAt);
  const { toast } = useToast();
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Calculate days since applied
  const daysSinceApplied = appliedDate
    ? Math.floor((Date.now() - new Date(appliedDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Progress bar animation during loading
  // Smoother, slower animation: starts at 5%, increments by 4% every 1000ms
  useEffect(() => {
    if (!isPending) {
      setAnalysisProgress(0);
      return;
    }

    let progress = 5;
    setAnalysisProgress(progress);

    const interval = setInterval(() => {
      progress = Math.min(92, progress + 4);
      setAnalysisProgress(progress);
    }, 1000); // Slower interval for smoother feel

    return () => clearInterval(interval);
  }, [isPending]);

  const handleGenerate = async () => {
    startTransition(async () => {
      const result = await generateFollowUps(applicationId);

      if (result.success && result.suggestions) {
        setLocalSuggestions(result.suggestions);
        setLocalSuggestionsAt(new Date().toISOString());
        onSuggestionsComplete?.(result.suggestions);

        toast({
          title: 'Suggestions Generated',
          description: `Generated ${result.suggestions.suggestions.length} follow-up actions`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: result.error || 'Please try again',
        });
      }
    });
  };

  const handleCopyTemplate = async (template: string, index: number) => {
    try {
      await navigator.clipboard.writeText(template);
      setCopiedIndex(index);
      toast({
        title: 'Template Copied',
        description: 'Message template copied to clipboard',
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Failed to copy template to clipboard',
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Icon mapping for suggestion types
  const getTypeIcon = (type: FollowUpSuggestion['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'application_check':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  // Priority badge styling
  const getPriorityBadge = (priority: FollowUpSuggestion['priority']) => {
    const styles = {
      high: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
      low: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    };

    const icons = {
      high: <AlertTriangle className="h-3 w-3" />,
      medium: <Info className="h-3 w-3" />,
      low: <Info className="h-3 w-3" />,
    };

    return (
      <Badge variant="outline" className={cn('flex items-center gap-1 capitalize', styles[priority])}>
        {icons[priority]}
        {priority}
      </Badge>
    );
  };

  // Show button to generate first suggestions
  if (!localSuggestions) {
    return (
      <div className={cn('rounded-lg border bg-card p-6 mb-6', className)}>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Follow-Up Suggestions</h3>
          </div>

          {/* Days since applied context */}
          {appliedDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{daysSinceApplied} days since applied</span>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center max-w-md">
            Get AI-powered suggestions for your next steps and follow-up actions
          </p>

          {isPending ? (
            <div className="flex flex-col items-center gap-4 w-full max-w-md">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Generating suggestions...</p>
                <p className="text-xs text-muted-foreground">
                  This may take 5-10 seconds
                </p>
              </div>
              <div className="w-full space-y-2">
                <Progress value={analysisProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {analysisProgress}% complete
                </p>
              </div>
            </div>
          ) : (
            <Button onClick={handleGenerate} disabled={isPending} size="lg">
              <CheckCircle className="h-4 w-4 mr-2" />
              Generate Suggestions
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Display existing suggestions
  return (
    <div className={cn('rounded-lg border bg-card mb-6', className)}>
      <div className="p-4 md:p-6">
        {/* Header with regenerate button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Follow-Up Suggestions</h3>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isPending}
            size="sm"
            variant="outline"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Generating...' : 'Regenerate'}
          </Button>
        </div>

        {/* Loading state */}
        {isPending && (
          <div className="mb-6 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Generating suggestions...</span>
                  <span className="text-xs text-muted-foreground">{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
            </div>
          </div>
        )}

        {/* Context Summary */}
        <div className="mb-6 rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-foreground leading-relaxed">
            {localSuggestions.contextSummary}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {localSuggestionsAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(localSuggestionsAt)}
              </span>
            )}
            {appliedDate && (
              <span className="flex items-center gap-1">
                {daysSinceApplied} days since applied
              </span>
            )}
          </div>
        </div>

        {/* Suggestions List */}
        <div className="space-y-4">
          {localSuggestions.suggestions.map((suggestion, index) => (
            <div
              key={index}
              role="article"
              className="rounded-lg border bg-card p-4 space-y-3"
            >
              {/* Header: Type Icon + Priority Badge + Timing */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {getTypeIcon(suggestion.type)}
                  <span className="text-xs font-medium capitalize">
                    {suggestion.type.replace('_', ' ')}
                  </span>
                </div>
                {getPriorityBadge(suggestion.priority)}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {suggestion.timing}
                </Badge>
              </div>

              {/* Action */}
              <div>
                <p className="font-medium text-sm">{suggestion.action}</p>
              </div>

              {/* Rationale */}
              <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>

              {/* Template (if available) */}
              {suggestion.template && (
                <div className="rounded-md bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Message Template
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => handleCopyTemplate(suggestion.template!, index)}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-foreground/80 whitespace-pre-wrap">
                    {suggestion.template}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Next Check Date */}
        {localSuggestions.nextCheckDate && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Next Check-In Reminder
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Check back on{' '}
                  {new Date(localSuggestions.nextCheckDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
