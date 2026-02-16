-- Create blockchain_positions table for tracking all trades
CREATE TABLE IF NOT EXISTS blockchain_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL,
    user_address TEXT NOT NULL,
    position_type TEXT CHECK (position_type IN ('YES', 'NO')) NOT NULL,
    amount BIGINT NOT NULL,
    entry_price NUMERIC,
    tx_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_positions_market ON blockchain_positions(market_id);
CREATE INDEX IF NOT EXISTS idx_positions_user ON blockchain_positions(user_address);
CREATE INDEX IF NOT EXISTS idx_positions_created ON blockchain_positions(created_at DESC);

-- Enable RLS
ALTER TABLE blockchain_positions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read positions
CREATE POLICY "Anyone can view positions"
    ON blockchain_positions FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow authenticated users to insert their own positions
CREATE POLICY "Users can insert their positions"
    ON blockchain_positions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create oracle_submissions table if not exists
CREATE TABLE IF NOT EXISTS oracle_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID,
    oracle_node TEXT NOT NULL,
    price NUMERIC NOT NULL,
    confidence NUMERIC,
    timestamp TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_oracle_market ON oracle_submissions(market_id);
CREATE INDEX IF NOT EXISTS idx_oracle_timestamp ON oracle_submissions(timestamp DESC);

-- Enable RLS
ALTER TABLE oracle_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read oracle submissions
CREATE POLICY "Anyone can view oracle submissions"
    ON oracle_submissions FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow authenticated users to submit oracle data
CREATE POLICY "Authenticated users can submit oracle data"
    ON oracle_submissions FOR INSERT
    TO authenticated
    WITH CHECK (true);
