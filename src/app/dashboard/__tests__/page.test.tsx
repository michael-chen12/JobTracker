import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AchievementWithMetadata } from '@/types/achievements';
import DashboardPage from '../page';

const mockCreateClient = vi.fn();
const mockGetApplications = vi.fn();
const mockGetAchievements = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock('@/actions/applications', () => ({
  getApplications: (...args: unknown[]) => mockGetApplications(...args),
}));

vi.mock('@/actions/achievements', () => ({
  getAchievements: (...args: unknown[]) => mockGetAchievements(...args),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

function buildAchievement(
  id: string,
  company: string
): AchievementWithMetadata {
  return {
    id,
    user_id: 'user-1',
    achievement_type: 'first_application',
    achieved_at: '2026-01-01T10:00:00.000Z',
    created_at: '2026-01-01T10:00:00.000Z',
    updated_at: '2026-01-01T10:00:00.000Z',
    metadata: { company, position: 'Engineer' },
    celebrated: false,
  };
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'auth-user-1',
              email: 'test@example.com',
              user_metadata: { full_name: 'Test User' },
            },
          },
        }),
      },
    });
  });

  it('prefetches applications and journey achievements in parallel and passes them to DashboardClient', async () => {
    const achievements = [buildAchievement('a-1', 'Acme')];
    const applications = [{ id: 'app-1', company: 'Acme', position: 'Engineer' }];

    mockGetApplications.mockResolvedValue({
      data: applications,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    mockGetAchievements.mockResolvedValue({ data: achievements });

    const element = await DashboardPage();

    expect(mockGetApplications).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(mockGetAchievements).toHaveBeenCalledWith(10);

    const props = (element as { props: Record<string, unknown> }).props;
    expect(props.initialApplications).toEqual(applications);
    expect(props.initialJourneyAchievements).toEqual(achievements);
    expect(props.initialJourneyError).toBeNull();
  });

  it('passes journey error to DashboardClient when achievements query fails', async () => {
    mockGetApplications.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    mockGetAchievements.mockResolvedValue({ error: 'Failed to fetch wins' });

    const element = await DashboardPage();

    const props = (element as { props: Record<string, unknown> }).props;
    expect(props.initialJourneyAchievements).toEqual([]);
    expect(props.initialJourneyError).toBe('Failed to fetch wins');
  });
});
