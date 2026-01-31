'use client';

/**
 * NotesSummaryCard - AI-powered notes summary display
 *
 * Ticket #14: Notes Summarization
 *
 * Features:
 * - Collapsible card matching MatchAnalysisCard style
 * - Loading states with progress indicator
 * - Structured display: insights, actions, follow-ups
 * - "New notes" detection and badge
 * - Manual summarization trigger
 */

import { useEffect, useState, useTransition } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { summarizeNotes } from '@/actions/summarize-notes';
import { useToast } from '@/hooks/use-toast';
import type { NotesSummary } from '@/types/ai';
import type { ApplicationNote } from '@/types/application';

interface NotesSummaryCardProps {
  applicationId: string;
  notes: ApplicationNote[];
  notesSummary: (NotesSummary & { notesCount?: number; latestNoteDate?: number }) | null;
  summarizedAt: string | null;
  onSummaryComplete?: (summary: NotesSummary) => void;
  className?: string;
}

export function NotesSummaryCard({
  applicationId,
  notes,
  notesSummary,
  summarizedAt,
  onSummaryComplete,
  className,
}: NotesSummaryCardProps) {
  const [isPending, startTransition] = useTransition();
  const [localSummary, setLocalSummary] = useState(notesSummary);
  const [localSummarizedAt, setLocalSummarizedAt] = useState(summarizedAt);
  const { toast } = useToast();
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Calculate if there are new notes since last summary
  const newNotesCount = (() => {
    if (!localSummarizedAt || notes.length === 0) return 0;
    const threshold = new Date(localSummarizedAt).getTime();
    return notes.filter(
      (note) => new Date(note.created_at).getTime() > threshold
    ).length;
  })();

  const hasNewNotes = newNotesCount > 0;

  // Progress bar animation during loading
  useEffect(() => {
    if (!isPending) {
      setAnalysisProgress(0);
      return;
    }

    let progress = 10;
    setAnalysisProgress(progress);

    const interval = setInterval(() => {
      progress = Math.min(95, progress + 8);
      setAnalysisProgress(progress);
    }, 600);

    return () => clearInterval(interval);
  }, [isPending]);

  const handleSummarize = async () => {
    startTransition(async () => {
      const result = await summarizeNotes(applicationId);

      if (result.success && result.summary) {
        setLocalSummary(result.summary);
        setLocalSummarizedAt(new Date().toISOString());
        onSummaryComplete?.(result.summary);

        toast({
          title: 'Summary Generated',
          description: result.truncated
            ? `Summarized ${notes.length} most recent notes`
            : `Summarized ${notes.length} notes successfully`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Summarization Failed',
          description: result.error || 'Please try again',
        });
      }
    });
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

  // Don't show anything if no notes
  if (notes.length === 0) {
    return null;
  }

  // Show button to generate first summary
  if (!localSummary) {
    return (
      <div className={cn('rounded-lg border bg-card p-6 mb-6', className)}>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Notes Summary</h3>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Get AI-powered insights from your {notes.length} note{notes.length !== 1 ? 's' : ''}
          </p>
          {isPending ? (
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">
                  Analyzing {notes.length} notes...
                </p>
                <p className="text-xs text-muted-foreground">
                  This may take 5-10 seconds
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
            <Button onClick={handleSummarize} disabled={isPending} size="lg">
              <MessageSquare className="h-4 w-4 mr-2" />
              Summarize Notes
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Display existing summary
  return (
    <div className={cn('rounded-lg border bg-card mb-6', className)}>
      <div className="p-4 md:p-6">
        {/* Header with summarize button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Notes Summary</h3>
          </div>

          <div className="flex items-center gap-3">
            {/* New notes badge */}
            {hasNewNotes && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {newNotesCount} new note{newNotesCount !== 1 ? 's' : ''}
              </Badge>
            )}

            {/* Re-summarize button */}
            <Button
              onClick={handleSummarize}
              disabled={isPending}
              size="sm"
              variant="outline"
            >
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isPending ? 'Summarizing...' : hasNewNotes ? 'Re-summarize' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isPending && (
          <div className="mb-6 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1 space-y-2">
                <div className="text-sm font-medium">
                  Analyzing {notes.length} notes...
                </div>
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

        {/* Summary Overview */}
        <div className="mb-6">
          <p className="text-sm text-foreground leading-relaxed">
            {localSummary.summary}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            {localSummarizedAt && (
              <span>Summarized on {formatDate(localSummarizedAt)}</span>
            )}
            {localSummary.notesCount && (
              <span> • {localSummary.notesCount} notes analyzed</span>
            )}
          </div>
        </div>

        {/* Key Insights */}
        {localSummary.insights && localSummary.insights.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Key Insights
            </h4>
            <ul className="space-y-2">
              {localSummary.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {localSummary.actionItems && localSummary.actionItems.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Action Items
            </h4>
            <ul className="space-y-2">
              {localSummary.actionItems.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-up Needs */}
        {localSummary.followUpNeeds && localSummary.followUpNeeds.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Follow-up Needs
            </h4>
            <ul className="space-y-2">
              {localSummary.followUpNeeds.map((followUp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>{followUp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
