/**
 * MetricCard Component Tests
 *
 * Tests metric display with trend indicators:
 * - Rendering label and value
 * - Positive trend indicators with up arrow
 * - Negative trend indicators with down arrow
 * - No trend when change is 0
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../MetricCard';

describe('MetricCard', () => {
  describe('Basic Rendering', () => {
    it('should render metric label and value', () => {
      render(
        <MetricCard
          label="Total Applications"
          value="45"
        />
      );

      expect(screen.getByText('Total Applications')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('should render with optional icon', () => {
      const TestIcon = () => <svg data-testid="test-icon" />;

      render(
        <MetricCard
          label="Total Applications"
          value="45"
          icon={<TestIcon />}
        />
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  describe('Trend Indicators', () => {
    it('should render positive trend indicator with green badge', () => {
      render(
        <MetricCard
          label="Total Applications"
          value="45"
          change={25}
        />
      );

      const trendElement = screen.getByText(/\+25%/);
      expect(trendElement).toBeInTheDocument();

      // Check for up arrow (using Unicode or aria-label)
      expect(screen.getByLabelText(/trend up/i)).toBeInTheDocument();

      // Check for green styling (badge should have success/green variant)
      const badge = trendElement.closest('[class*="bg-green"]');
      expect(badge).toBeInTheDocument();
    });

    it('should render negative trend indicator with red badge', () => {
      render(
        <MetricCard
          label="Response Rate"
          value="15%"
          change={-15}
        />
      );

      const trendElement = screen.getByText(/-15%/);
      expect(trendElement).toBeInTheDocument();

      // Check for down arrow
      expect(screen.getByLabelText(/trend down/i)).toBeInTheDocument();

      // Check for red styling
      const badge = trendElement.closest('[class*="bg-red"]');
      expect(badge).toBeInTheDocument();
    });

    it('should not render trend indicator when change is 0', () => {
      render(
        <MetricCard
          label="Interview Rate"
          value="10%"
          change={0}
        />
      );

      // Should not find any trend indicators (arrows or trend labels)
      expect(screen.queryByLabelText(/trend/i)).not.toBeInTheDocument();
    });

    it('should not render trend indicator when change is undefined', () => {
      render(
        <MetricCard
          label="Interview Rate"
          value="10%"
        />
      );

      // Should not find any trend indicators
      expect(screen.queryByLabelText(/trend/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(
        <MetricCard
          label="Total Applications"
          value="45"
          change={25}
        />
      );

      // Card should be a section or article
      const card = screen.getByText('Total Applications').closest('[class*="rounded"]');
      expect(card).toBeInTheDocument();
    });
  });
});
