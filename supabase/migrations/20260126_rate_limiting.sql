-- Migration: Add rate limiting tables for feedback form
-- Created: 2026-01-26

-- Table for storing one-time CSRF tokens
CREATE TABLE IF NOT EXISTS rate_limit_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false NOT NULL
);

-- Table for tracking submissions (rate limiting)
CREATE TABLE IF NOT EXISTS submission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_tokens_token ON rate_limit_tokens(token);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tokens_ip ON rate_limit_tokens(ip_address);
CREATE INDEX IF NOT EXISTS idx_submission_logs_ip_time ON submission_logs(ip_address, submitted_at);

-- Enable RLS
ALTER TABLE rate_limit_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_logs ENABLE ROW LEVEL SECURITY;

-- Policies for rate_limit_tokens (only Edge Functions can access)
CREATE POLICY "Service role can manage tokens" ON rate_limit_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for submission_logs (only Edge Functions can access)
CREATE POLICY "Service role can manage logs" ON submission_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Cleanup function to delete expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_tokens
  WHERE expires_at < now() OR (used = true AND created_at < now() - interval '1 hour');
  
  DELETE FROM submission_logs
  WHERE submitted_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON TABLE rate_limit_tokens IS 'Stores one-time CSRF tokens for feedback form submissions';
COMMENT ON TABLE submission_logs IS 'Tracks submission timestamps by IP for rate limiting';
