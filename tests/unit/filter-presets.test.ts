import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

import {
  getFilterPresets,
  saveFilterPreset,
  deleteFilterPreset,
  updateFilterPreset,
} from '@/actions/filter-presets';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';

type MockQuery = Record<string, ReturnType<typeof vi.fn>>;

function buildUsersQuery(result: { data: unknown; error: unknown }): MockQuery {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
}

function buildSaveFiltersInsertQuery(result: { data: unknown; error: unknown }): MockQuery {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
}

function buildSaveFiltersDeleteQuery(result: { error: unknown }): MockQuery {
  return {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(result),
  };
}

function buildSaveFiltersUpdateQuery(result: { data: unknown; error: unknown }): MockQuery {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
}

function buildAdminPresetsQuery(result: { data: unknown; error: unknown }): MockQuery {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
  };
}

describe('filter-presets actions', () => {
  let mockSupabase: {
    auth: { getUser: ReturnType<typeof vi.fn> };
    from: ReturnType<typeof vi.fn>;
  };
  let mockAdminSupabase: { from: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: { getUser: vi.fn() },
      from: vi.fn(),
    };

    mockAdminSupabase = {
      from: vi.fn(),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as never);
  });

  describe('saveFilterPreset', () => {
    it('rejects empty preset name', async () => {
      const result = await saveFilterPreset('', {});
      expect(result.error).toBe('Preset name is required');
      expect(createClient).not.toHaveBeenCalled();
    });

    it('rejects preset name longer than 50 characters', async () => {
      const result = await saveFilterPreset('a'.repeat(51), {});
      expect(result.error).toBe('Preset name must be 50 characters or less');
      expect(createClient).not.toHaveBeenCalled();
    });

    it('rejects preset name with invalid characters', async () => {
      const result = await saveFilterPreset('invalid/name', {});
      expect(result.error).toBe(
        'Preset name can only contain letters, numbers, spaces, hyphens, and underscores'
      );
      expect(createClient).not.toHaveBeenCalled();
    });

    it('rejects unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await saveFilterPreset('Remote Jobs', {});
      expect(result.error).toBe('Unauthorized');
    });

    it('returns user-not-found when users lookup fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      });

      const usersQuery = buildUsersQuery({
        data: null,
        error: { message: 'No rows found' },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery;
        return {};
      });

      const result = await saveFilterPreset('Remote Jobs', {});
      expect(result.error).toBe('User not found');
    });

    it('handles duplicate preset names using 23505 error code', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      });

      const usersQuery = buildUsersQuery({
        data: { id: 'db-user-1' },
        error: null,
      });

      const presetsQuery = buildSaveFiltersInsertQuery({
        data: null,
        error: { code: '23505', message: 'duplicate key value' },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery;
        if (table === 'saved_filters') return presetsQuery;
        return {};
      });

      const result = await saveFilterPreset('My Preset', { search: 'remote' });
      expect(result.error).toBe('A preset with this name already exists');
    });

    it('returns database message for non-duplicate insert errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      });

      const usersQuery = buildUsersQuery({
        data: { id: 'db-user-1' },
        error: null,
      });

      const presetsQuery = buildSaveFiltersInsertQuery({
        data: null,
        error: { code: '50000', message: 'insert failed' },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery;
        if (table === 'saved_filters') return presetsQuery;
        return {};
      });

      const result = await saveFilterPreset('My Preset', {});
      expect(result.error).toBe('insert failed');
    });

    it('creates preset successfully and revalidates cache tag', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      });

      const usersQuery = buildUsersQuery({
        data: { id: 'db-user-1' },
        error: null,
      });

      const createdPreset = {
        id: 'preset-1',
        user_id: 'db-user-1',
        name: 'Remote Roles',
        filters: { search: 'remote' },
        created_at: '2026-02-01T00:00:00.000Z',
        updated_at: '2026-02-01T00:00:00.000Z',
      };

      const presetsQuery = buildSaveFiltersInsertQuery({
        data: createdPreset,
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery;
        if (table === 'saved_filters') return presetsQuery;
        return {};
      });

      const result = await saveFilterPreset('  Remote Roles  ', { search: 'remote' });

      expect(result.data).toEqual(createdPreset);
      expect(revalidateTag).toHaveBeenCalledWith('filter-presets', 'max');
      expect(presetsQuery.insert).toHaveBeenCalledWith({
        user_id: 'db-user-1',
        name: 'Remote Roles',
        filters: { search: 'remote' },
      });
    });
  });

  describe('getFilterPresets', () => {
    it('rejects unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getFilterPresets();
      expect(result.error).toBe('Unauthorized');
    });

    it('returns user-not-found when users lookup fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      });

      const usersQuery = buildUsersQuery({
        data: null,
        error: { message: 'not found' },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery;
        return {};
      });

      const result = await getFilterPresets();
      expect(result.error).toBe('User not found');
    });

    it('returns presets from admin client query', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      });

      const usersQuery = buildUsersQuery({
        data: { id: 'db-user-1' },
        error: null,
      });

      const presets = [
        {
          id: 'preset-1',
          user_id: 'db-user-1',
          name: 'Remote',
          filters: { search: 'remote' },
          created_at: '2026-02-01T00:00:00.000Z',
          updated_at: '2026-02-01T00:00:00.000Z',
        },
      ];

      const adminQuery = buildAdminPresetsQuery({
        data: presets,
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery;
        return {};
      });

      mockAdminSupabase.from.mockImplementation((table: string) => {
        if (table === 'saved_filters') return adminQuery;
        return {};
      });

      const result = await getFilterPresets();
      expect(result.data).toEqual(presets);
    });

    it('returns admin query error message when fetch fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      });

      const usersQuery = buildUsersQuery({
        data: { id: 'db-user-1' },
        error: null,
      });

      const adminQuery = buildAdminPresetsQuery({
        data: null,
        error: { message: 'query failed' },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery;
        return {};
      });

      mockAdminSupabase.from.mockImplementation((table: string) => {
        if (table === 'saved_filters') return adminQuery;
        return {};
      });

      const result = await getFilterPresets();
      expect(result.error).toBe('query failed');
    });
  });

  describe('deleteFilterPreset', () => {
    it('rejects unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await deleteFilterPreset('preset-1');
      expect(result.error).toBe('Unauthorized');
    });

    it('returns delete error message when delete fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      });

      const deleteQuery = buildSaveFiltersDeleteQuery({
        error: { message: 'delete failed' },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'saved_filters') return deleteQuery;
        return {};
      });

      const result = await deleteFilterPreset('preset-1');
      expect(result.error).toBe('delete failed');
    });

    it('deletes preset and revalidates cache tag on success', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      });

      const deleteQuery = buildSaveFiltersDeleteQuery({
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'saved_filters') return deleteQuery;
        return {};
      });

      const result = await deleteFilterPreset('preset-1');
      expect(result.success).toBe(true);
      expect(revalidateTag).toHaveBeenCalledWith('filter-presets', 'max');
    });
  });

  describe('updateFilterPreset', () => {
    it('rejects empty preset name', async () => {
      const result = await updateFilterPreset('preset-1', '');
      expect(result.error).toBe('Preset name is required');
      expect(createClient).not.toHaveBeenCalled();
    });

    it('rejects preset name with invalid characters', async () => {
      const result = await updateFilterPreset('preset-1', 'bad/name');
      expect(result.error).toBe(
        'Preset name can only contain letters, numbers, spaces, hyphens, and underscores'
      );
    });

    it('rejects unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await updateFilterPreset('preset-1', 'Renamed');
      expect(result.error).toBe('Unauthorized');
    });

    it('handles duplicate preset names on update', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      });

      const updateQuery = buildSaveFiltersUpdateQuery({
        data: null,
        error: { code: '23505', message: 'duplicate key value' },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'saved_filters') return updateQuery;
        return {};
      });

      const result = await updateFilterPreset('preset-1', 'Duplicate Name');
      expect(result.error).toBe('A preset with this name already exists');
    });

    it('updates preset successfully and revalidates cache tag', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      });

      const updatedPreset = {
        id: 'preset-1',
        user_id: 'db-user-1',
        name: 'Renamed Preset',
        filters: { search: 'remote' },
        created_at: '2026-02-01T00:00:00.000Z',
        updated_at: '2026-02-02T00:00:00.000Z',
      };

      const updateQuery = buildSaveFiltersUpdateQuery({
        data: updatedPreset,
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'saved_filters') return updateQuery;
        return {};
      });

      const result = await updateFilterPreset('preset-1', '  Renamed Preset  ');
      expect(result.data).toEqual(updatedPreset);
      expect(updateQuery.update).toHaveBeenCalledWith({ name: 'Renamed Preset' });
      expect(revalidateTag).toHaveBeenCalledWith('filter-presets', 'max');
    });
  });
});
