import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { AchievementWithMetadata } from '@/types/achievements';
import { YourJourneySection } from '../YourJourneySection';

function buildAchievement(
  id: string,
  company: string,
  achievedAt: string
): AchievementWithMetadata {
  return {
    id,
    user_id: 'user-1',
    achievement_type: 'first_application',
    achieved_at: achievedAt,
    created_at: achievedAt,
    updated_at: achievedAt,
    metadata: { company, position: 'Engineer' },
    celebrated: false,
  };
}

function openSection() {
  const trigger = screen.getByText('Your Journey').closest('button');
  expect(trigger).not.toBeNull();
  fireEvent.click(trigger as HTMLButtonElement);
}

describe('YourJourneySection', () => {
  it('shows only the latest 5 journey items sorted by timestamp', () => {
    const achievements = [
      buildAchievement('a1', 'Company 1', '2026-01-01T00:00:00.000Z'),
      buildAchievement('a2', 'Company 2', '2026-01-02T00:00:00.000Z'),
      buildAchievement('a3', 'Company 3', '2026-01-03T00:00:00.000Z'),
      buildAchievement('a4', 'Company 4', '2026-01-04T00:00:00.000Z'),
      buildAchievement('a5', 'Company 5', '2026-01-05T00:00:00.000Z'),
      buildAchievement('a6', 'Company 6', '2026-01-06T00:00:00.000Z'),
    ];

    render(<YourJourneySection initialAchievements={achievements} />);
    openSection();

    expect(screen.getByText(/Company 6/i)).toBeInTheDocument();
    expect(screen.getByText(/Company 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Company 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Company 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Company 2/i)).toBeInTheDocument();
    expect(screen.queryByText(/Company 1/i)).not.toBeInTheDocument();
  });

  it('shows provided error message', () => {
    render(
      <YourJourneySection
        initialAchievements={[buildAchievement('a1', 'Acme', '2026-01-01T00:00:00.000Z')]}
        error="Failed to load your journey"
      />
    );
    openSection();

    expect(screen.getByText('Failed to load your journey')).toBeInTheDocument();
    expect(
      screen.queryByText('Your journey starts here. Create your first application!')
    ).not.toBeInTheDocument();
  });

  it('shows empty state when there are no journey items', () => {
    render(<YourJourneySection initialAchievements={[]} />);
    openSection();

    expect(
      screen.getByText('Your journey starts here. Create your first application!')
    ).toBeInTheDocument();
  });
});
