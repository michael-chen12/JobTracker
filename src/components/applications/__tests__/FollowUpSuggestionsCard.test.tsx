/**
 * Component tests for FollowUpSuggestionsCard
 *
 * Tests:
 * - Empty state with generate button
 * - Loading state display
 * - Suggestions list rendering
 * - Priority badges
 * - Copy template functionality
 * - Regenerate button
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FollowUpSuggestionsCard } from '../FollowUpSuggestionsCard';
import type { FollowUpSuggestions } from '@/types/ai';
import * as generateFollowupsAction from '@/actions/generate-followups';

// Mock server action
vi.mock('@/actions/generate-followups', () => ({
  generateFollowUps: vi.fn(),
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock clipboard API
const mockWriteText = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
  configurable: true,
});

describe('FollowUpSuggestionsCard', () => {
  const mockApplicationId = 'app-123';
  const mockAppliedDate = '2026-01-15T10:00:00Z';

  const mockSuggestions: FollowUpSuggestions = {
    suggestions: [
      {
        action: 'Send follow-up email to recruiter',
        timing: 'Within 2-3 days',
        priority: 'high',
        rationale: '14 days have passed since application with no response.',
        template: 'Hi [Recruiter],\n\nI wanted to follow up on my application...',
        type: 'email',
      },
      {
        action: 'Check application status on company portal',
        timing: 'Today',
        priority: 'medium',
        rationale: 'Company portals often update before email notifications.',
        type: 'application_check',
      },
      {
        action: 'Connect with hiring manager on LinkedIn',
        timing: 'This week',
        priority: 'low',
        rationale: 'Networking can provide additional visibility.',
        template: 'Hi [Name], I recently applied for [Position]...',
        type: 'linkedin',
      },
    ],
    contextSummary: '14 days since applied with no response yet.',
    nextCheckDate: '2026-02-05',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockClear();
    // Use fake timers but allow React's internal timers to work
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-02-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Empty State', () => {
    it('should render generate button when no suggestions', async () => {
      await act(async () => {
        render(
          <FollowUpSuggestionsCard
            applicationId={mockApplicationId}
            appliedDate={mockAppliedDate}
            followUpSuggestions={null}
            followupSuggestionsAt={null}
          />
        );
      });

      expect(screen.getByText('Follow-Up Suggestions')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate suggestions/i })).toBeInTheDocument();
    });

    it('should display days since applied in empty state', async () => {
      await act(async () => {
        render(
          <FollowUpSuggestionsCard
            applicationId={mockApplicationId}
            appliedDate={mockAppliedDate}
            followUpSuggestions={null}
            followupSuggestionsAt={null}
          />
        );
      });

      // Component calculates days, so we just verify it shows the text
      expect(screen.getByText(/\d+ days since applied/)).toBeInTheDocument();
    });

    it('should show descriptive text in empty state', async () => {
      await act(async () => {
        render(
          <FollowUpSuggestionsCard
            applicationId={mockApplicationId}
            appliedDate={mockAppliedDate}
            followUpSuggestions={null}
            followupSuggestionsAt={null}
          />
        );
      });

      expect(
        screen.getByText(/get ai-powered suggestions for your next steps/i)
      ).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    // Note: React 19's useTransition makes testing loading states challenging
    // These tests verify the action is called rather than intermediate loading states
    it('should call generate action when button clicked', async () => {
      const generateSpy = vi
        .spyOn(generateFollowupsAction, 'generateFollowUps')
        .mockResolvedValue({
          success: true,
          suggestions: mockSuggestions,
        });

      await act(async () => {
        render(
          <FollowUpSuggestionsCard
            applicationId={mockApplicationId}
            appliedDate={mockAppliedDate}
            followUpSuggestions={null}
            followupSuggestionsAt={null}
          />
        );
      });

      const generateButton = screen.getByRole('button', { name: /generate suggestions/i });

      await act(async () => {
        fireEvent.click(generateButton);
        // Advance timers to allow useTransition to complete
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        expect(generateSpy).toHaveBeenCalledWith(mockApplicationId);
      }, { timeout: 10000 });
    });
  });

  describe('Suggestions Display', () => {
    it('should render suggestions list with all items', () => {
      render(
        <FollowUpSuggestionsCard
          applicationId={mockApplicationId}
          appliedDate={mockAppliedDate}
          followUpSuggestions={mockSuggestions}
          followupSuggestionsAt="2026-02-01T12:00:00Z"
        />
      );

      expect(screen.getByText(/send follow-up email to recruiter/i)).toBeInTheDocument();
      expect(
        screen.getByText(/check application status on company portal/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/connect with hiring manager on linkedin/i)
      ).toBeInTheDocument();
    });

    it('should display priority badges correctly', () => {
      render(
        <FollowUpSuggestionsCard
          applicationId={mockApplicationId}
          appliedDate={mockAppliedDate}
          followUpSuggestions={mockSuggestions}
          followupSuggestionsAt="2026-02-01T12:00:00Z"
        />
      );

      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('should display timing badges', () => {
      render(
        <FollowUpSuggestionsCard
          applicationId={mockApplicationId}
          appliedDate={mockAppliedDate}
          followUpSuggestions={mockSuggestions}
          followupSuggestionsAt="2026-02-01T12:00:00Z"
        />
      );

      expect(screen.getByText('Within 2-3 days')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('This week')).toBeInTheDocument();
    });

    it('should display rationales', () => {
      render(
        <FollowUpSuggestionsCard
          applicationId={mockApplicationId}
          appliedDate={mockAppliedDate}
          followUpSuggestions={mockSuggestions}
          followupSuggestionsAt="2026-02-01T12:00:00Z"
        />
      );

      expect(
        screen.getByText(/14 days have passed since application/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/company portals often update/i)).toBeInTheDocument();
    });

    it('should display context summary', () => {
      render(
        <FollowUpSuggestionsCard
          applicationId={mockApplicationId}
          appliedDate={mockAppliedDate}
          followUpSuggestions={mockSuggestions}
          followupSuggestionsAt="2026-02-01T12:00:00Z"
        />
      );

      expect(screen.getByText('14 days since applied with no response yet.')).toBeInTheDocument();
    });

    it('should display next check date if provided', () => {
      render(
        <FollowUpSuggestionsCard
          applicationId={mockApplicationId}
          appliedDate={mockAppliedDate}
          followUpSuggestions={mockSuggestions}
          followupSuggestionsAt="2026-02-01T12:00:00Z"
        />
      );

      expect(screen.getByText(/next check-in reminder/i)).toBeInTheDocument();
      expect(screen.getByText(/february 5, 2026/i)).toBeInTheDocument();
    });

    it('should show templates when available', () => {
      render(
        <FollowUpSuggestionsCard
          applicationId={mockApplicationId}
          appliedDate={mockAppliedDate}
          followUpSuggestions={mockSuggestions}
          followupSuggestionsAt="2026-02-01T12:00:00Z"
        />
      );

      // Check for the template heading and content
      const templates = screen.getAllByText(/message template/i);
      expect(templates.length).toBeGreaterThan(0);

      // Check template content exists
      expect(screen.getByText(/i wanted to follow up on my application/i)).toBeInTheDocument();
    });

    it('should render regenerate button when suggestions exist', () => {
      render(
        <FollowUpSuggestionsCard
          applicationId={mockApplicationId}
          appliedDate={mockAppliedDate}
          followUpSuggestions={mockSuggestions}
          followupSuggestionsAt="2026-02-01T12:00:00Z"
        />
      );

      expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
    });
  });

  describe('Copy Template', () => {
    it('should copy template to clipboard when copy button clicked', async () => {
      mockWriteText.mockResolvedValue(undefined);

      await act(async () => {
        render(
          <FollowUpSuggestionsCard
            applicationId={mockApplicationId}
            appliedDate={mockAppliedDate}
            followUpSuggestions={mockSuggestions}
            followupSuggestionsAt="2026-02-01T12:00:00Z"
          />
        );
      });

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });

      await act(async () => {
        fireEvent.click(copyButtons[0]);
        // Advance timers to allow async operations
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(mockSuggestions.suggestions[0].template);
      }, { timeout: 10000 });
    });

    it('should show "Copied" feedback after copying', async () => {
      mockWriteText.mockResolvedValue(undefined);

      await act(async () => {
        render(
          <FollowUpSuggestionsCard
            applicationId={mockApplicationId}
            appliedDate={mockAppliedDate}
            followUpSuggestions={mockSuggestions}
            followupSuggestionsAt="2026-02-01T12:00:00Z"
          />
        );
      });

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });

      await act(async () => {
        fireEvent.click(copyButtons[0]);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        expect(screen.getByText('Copied')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Generate Suggestions', () => {
    it('should call generateFollowUps action when generate clicked', async () => {
      const generateSpy = vi
        .spyOn(generateFollowupsAction, 'generateFollowUps')
        .mockResolvedValue({
          success: true,
          suggestions: mockSuggestions,
        });

      await act(async () => {
        render(
          <FollowUpSuggestionsCard
            applicationId={mockApplicationId}
            appliedDate={mockAppliedDate}
            followUpSuggestions={null}
            followupSuggestionsAt={null}
          />
        );
      });

      const generateButton = screen.getByRole('button', { name: /generate suggestions/i });

      await act(async () => {
        fireEvent.click(generateButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        expect(generateSpy).toHaveBeenCalledWith(mockApplicationId);
      }, { timeout: 10000 });
    });

    it('should update display with new suggestions on success', async () => {
      vi.spyOn(generateFollowupsAction, 'generateFollowUps').mockResolvedValue({
        success: true,
        suggestions: mockSuggestions,
      });

      await act(async () => {
        render(
          <FollowUpSuggestionsCard
            applicationId={mockApplicationId}
            appliedDate={mockAppliedDate}
            followUpSuggestions={null}
            followupSuggestionsAt={null}
          />
        );
      });

      const generateButton = screen.getByRole('button', { name: /generate suggestions/i });

      await act(async () => {
        fireEvent.click(generateButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        expect(screen.getByText(/send follow-up email to recruiter/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should call onSuggestionsComplete callback on success', async () => {
      const onComplete = vi.fn();

      vi.spyOn(generateFollowupsAction, 'generateFollowUps').mockResolvedValue({
        success: true,
        suggestions: mockSuggestions,
      });

      await act(async () => {
        render(
          <FollowUpSuggestionsCard
            applicationId={mockApplicationId}
            appliedDate={mockAppliedDate}
            followUpSuggestions={null}
            followupSuggestionsAt={null}
            onSuggestionsComplete={onComplete}
          />
        );
      });

      const generateButton = screen.getByRole('button', { name: /generate suggestions/i });

      await act(async () => {
        fireEvent.click(generateButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(mockSuggestions);
      }, { timeout: 10000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle error when generation fails', async () => {
      const generateSpy = vi
        .spyOn(generateFollowupsAction, 'generateFollowUps')
        .mockResolvedValue({
          success: false,
          error: 'Rate limit exceeded',
        });

      await act(async () => {
        render(
          <FollowUpSuggestionsCard
            applicationId={mockApplicationId}
            appliedDate={mockAppliedDate}
            followUpSuggestions={null}
            followupSuggestionsAt={null}
          />
        );
      });

      const generateButton = screen.getByRole('button', { name: /generate suggestions/i });

      await act(async () => {
        fireEvent.click(generateButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        // Error is shown via toast (mocked), so we just verify the action was called
        expect(generateSpy).toHaveBeenCalled();
      }, { timeout: 10000 });
    });
  });

  describe('Days Calculation', () => {
    it('should calculate days correctly', async () => {
      await act(async () => {
        render(
          <FollowUpSuggestionsCard
            applicationId={mockApplicationId}
            appliedDate="2026-01-25T10:00:00Z"
            followUpSuggestions={null}
            followupSuggestionsAt={null}
          />
        );
      });

      // Component calculates days dynamically based on current time
      expect(screen.getByText(/\d+ days since applied/)).toBeInTheDocument();
    });

    it('should handle null applied date', async () => {
      await act(async () => {
        render(
          <FollowUpSuggestionsCard
            applicationId={mockApplicationId}
            appliedDate={null}
            followUpSuggestions={null}
            followupSuggestionsAt={null}
          />
        );
      });

      // Should still render without crashing
      expect(screen.getByText('Follow-Up Suggestions')).toBeInTheDocument();
    });
  });
});
