-- Create table for AI chat decision logs
CREATE TABLE IF NOT EXISTS ai_chat_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  decision_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_decision_logs_user_id ON ai_chat_decision_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_logs_session_id ON ai_chat_decision_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_decision_logs_created_at ON ai_chat_decision_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_logs_request_id ON ai_chat_decision_logs(request_id);

-- Enable RLS
ALTER TABLE ai_chat_decision_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own decision logs
CREATE POLICY "Users can view their own decision logs"
  ON ai_chat_decision_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert decision logs
CREATE POLICY "Service role can insert decision logs"
  ON ai_chat_decision_logs
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE ai_chat_decision_logs IS 'Logs decision-making data from AI chat system for analysis and optimization';

