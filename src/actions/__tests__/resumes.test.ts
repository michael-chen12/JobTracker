import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadResume, deleteResume } from '../resumes';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server');
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Resume Actions', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(),
    },
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe('uploadResume', () => {
    it('should reject unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') });

      const formData = new FormData();
      const result = await uploadResume(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should reject missing file', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      const formData = new FormData();
      const result = await uploadResume(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No file provided');
    });
  });
});
