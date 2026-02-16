-- Create positions table to track user bets
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    user_address TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('yes', 'no')),
    amount BIGINT NOT NULL, -- Amount in microALGO
    tx_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes for faster queries
    CONSTRAINT positions_market_user_idx UNIQUE (market_id, user_address, tx_id)
);

-- Create index for market lookups
CREATE INDEX IF NOT EXISTS idx_positions_market ON positions(market_id);
CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_address);

-- Enable RLS
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read positions
CREATE POLICY "Anyone can view positions"
ON positions FOR SELECT
USING (true);

-- Allow anyone to insert their own position
CREATE POLICY "Anyone can insert positions"
ON positions FOR INSERT
WITH CHECK (true);
