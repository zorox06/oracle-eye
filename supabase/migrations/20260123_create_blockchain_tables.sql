-- Create blockchain_positions table to track on-chain bets
CREATE TABLE IF NOT EXISTS blockchain_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  market_id UUID REFERENCES markets(id) NOT NULL,
  app_id BIGINT NOT NULL,
  side TEXT CHECK (side IN ('yes', 'no')) NOT NULL,
  amount_microalgo BIGINT NOT NULL,
  tx_id TEXT NOT NULL UNIQUE,
  block_height BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX idx_blockchain_positions_user ON blockchain_positions(user_address);
CREATE INDEX idx_blockchain_positions_market ON blockchain_positions(market_id);
CREATE INDEX idx_blockchain_positions_tx ON blockchain_positions(tx_id);

-- Create oracle_submissions table to audit oracle resolutions
CREATE TABLE IF NOT EXISTS oracle_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id),
  app_id BIGINT,
  consensus_price NUMERIC NOT NULL,
  confidence_score INTEGER,
  nodes_online INTEGER,
  nodes_data JSONB,
  tx_id TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for oracle submissions
CREATE INDEX idx_oracle_submissions_market ON oracle_submissions(market_id);
CREATE INDEX idx_oracle_submissions_app ON oracle_submissions(app_id);

-- Enable RLS
ALTER TABLE blockchain_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oracle_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blockchain_positions
CREATE POLICY "Users can view own positions" 
  ON blockchain_positions FOR SELECT 
  USING (
    user_address = (SELECT address FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Service role can insert positions"
  ON blockchain_positions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update positions"
  ON blockchain_positions FOR UPDATE
  USING (auth.role() = 'service_role');

-- RLS Policies for oracle_submissions
CREATE POLICY "Anyone can view oracle submissions"
  ON oracle_submissions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can insert oracle submissions"
  ON oracle_submissions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Add indexes for performance
CREATE INDEX idx_positions_unclaimed ON blockchain_positions(market_id, claimed) WHERE NOT claimed;
CREATE INDEX idx_oracle_recent ON oracle_submissions(submitted_at DESC);
