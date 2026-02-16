
ALTER TABLE markets 
ADD COLUMN IF NOT EXISTS app_id BIGINT;

COMMENT ON COLUMN markets.app_id IS 'The Algorand Application ID for this prediction market';
