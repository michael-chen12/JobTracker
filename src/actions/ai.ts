'use server';

import { createClient } from '@/lib/supabase/server';
import { getAnthropicService } from '@/lib/ai/anthropic';
import { RateLimitError, QuotaExceededError, APIError } from '@/lib/ai/errors';

/**
 * Test action to verify Anthropic integration works
 *
 * This is a simple test endpoint - delete after verification
 */
export async function testAnthropicConnection() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Get user database ID
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !dbUser) {
      return { error: 'User not found' };
    }

    // Test simple API call (won't count against rate limit for now)
    const anthropic = getAnthropicService();

    const response = await anthropic.createMessage(
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from Anthropic!" in exactly 5 words.',
          },
        ],
      },
      dbUser.id,
      'summarize_notes' // Use summarize_notes as test operation (50/hour limit)
    );

    const firstContent = response.content[0];
    const responseText =
      firstContent && firstContent.type === 'text' ? firstContent.text : '';

    return {
      data: {
        message: responseText,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        model: response.model,
      },
    };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: error.message };
    }

    if (error instanceof QuotaExceededError) {
      return { error: error.message };
    }

    if (error instanceof APIError) {
      return { error: `API Error: ${error.message}` };
    }

    console.error('Unexpected error in testAnthropicConnection:', error);
    return { error: 'An unexpected error occurred' };
  }
}
