import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsightCard } from '../InsightCard';
import type { InsightItem } from '@/types/insights';

describe('InsightCard', () => {
  const mockInsight: InsightItem = {
    id: 'insight-1',
    type: 'weekly_summary',
    severity: 'info',
    title: 'Great week!',
    message: 'You applied to 5 companies this week',
    icon: 'TrendingUp',
    iconColor: 'text-blue-500',
    createdAt: new Date('2024-01-15T10:00:00Z'),
  };

  it('renders insight title and message', () => {
    render(<InsightCard insight={mockInsight} />);

    expect(screen.getByText('Great week!')).toBeInTheDocument();
    expect(screen.getByText('You applied to 5 companies this week')).toBeInTheDocument();
  });

  it('renders icon when showIcon is true', () => {
    render(<InsightCard insight={mockInsight} showIcon={true} />);

    // Icon should be rendered - check for svg element with specific class
    const iconContainer = screen.getByTestId('insight-icon');
    expect(iconContainer).toBeInTheDocument();
  });

  it('does not render icon when showIcon is false', () => {
    render(<InsightCard insight={mockInsight} showIcon={false} />);

    // Icon should not be rendered
    const iconContainer = screen.queryByTestId('insight-icon');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('applies correct severity styling for info', () => {
    const { container } = render(<InsightCard insight={mockInsight} />);

    // Check for info severity border color (blue-200)
    const card = container.querySelector('.border-l-4.border-blue-200');
    expect(card).toBeInTheDocument();
  });

  it('applies correct severity styling for warning', () => {
    const warningInsight: InsightItem = {
      ...mockInsight,
      severity: 'warning',
    };

    const { container } = render(<InsightCard insight={warningInsight} />);

    // Check for warning severity border color (amber-200)
    const card = container.querySelector('.border-l-4.border-amber-200');
    expect(card).toBeInTheDocument();
  });

  it('applies correct severity styling for critical', () => {
    const criticalInsight: InsightItem = {
      ...mockInsight,
      severity: 'critical',
    };

    const { container } = render(<InsightCard insight={criticalInsight} />);

    // Check for critical severity border color (red-200)
    const card = container.querySelector('.border-l-4.border-red-200');
    expect(card).toBeInTheDocument();
  });

  it('renders icon with correct color class', () => {
    render(<InsightCard insight={mockInsight} showIcon={true} />);

    const iconContainer = screen.getByTestId('insight-icon');
    const icon = iconContainer.querySelector('svg');

    expect(icon).toHaveClass('text-blue-500');
  });

  it('does not render timestamp (unlike WinCard)', () => {
    render(<InsightCard insight={mockInsight} />);

    // Insight cards should not display relative time
    // Check that the timestamp is not rendered
    const timeElement = screen.queryByText(/ago/i);
    expect(timeElement).not.toBeInTheDocument();
  });
});
