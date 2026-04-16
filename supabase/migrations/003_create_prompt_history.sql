CREATE TABLE prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  goal TEXT NOT NULL,
  domain TEXT NOT NULL,
  questions JSONB NOT NULL,
  answers JSONB NOT NULL,
  output_prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_history_user ON prompt_history(user_id, created_at DESC);
