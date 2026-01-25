-- Drop existing ai_usage table if it exists
DROP TABLE IF EXISTS ai_usage CASCADE;

-- Create ai_usage table for tracking Anthropic API usage
-- This enables rate limiting, cost monitoring, and audit trail

CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Cost tracking
  tokens_used INTEGER,
  cost_estimate DECIMAL(10, 6),
  model_version VARCHAR(50),

  -- Performance metrics
  latency_ms INTEGER,

  -- Audit trail
  success BOOLEAN NOT NULL,
  error_message TEXT,
  input_sample TEXT,
  output_sample TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Critical index for rate limiting queries
CREATE INDEX idx_ai_usage_rate_limit
  ON ai_usage(user_id, operation_type, timestamp DESC);

-- Index for cost analytics
CREATE INDEX idx_ai_usage_cost
  ON ai_usage(user_id, timestamp DESC);

-- Row Level Security
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own AI usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Only server can insert (using service role)
CREATE POLICY "Service role can insert AI usage"
  ON ai_usage FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE ai_usage IS 'Tracks all Anthropic API calls for rate limiting, cost monitoring, and audit trail';
