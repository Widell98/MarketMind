-- Add fields to store current price in original currency
ALTER TABLE user_holdings 
ADD COLUMN current_price_per_unit numeric,
ADD COLUMN price_currency text DEFAULT 'SEK';

-- Add index for better performance
CREATE INDEX idx_user_holdings_price_currency ON user_holdings(price_currency);

-- Update existing holdings to set price_currency based on symbol
UPDATE user_holdings 
SET price_currency = CASE 
  WHEN symbol LIKE '%.ST' THEN 'SEK'
  WHEN symbol LIKE '%.L' OR symbol LIKE '%.LON' THEN 'GBP'
  WHEN symbol LIKE '%.PA' OR symbol LIKE '%.F' THEN 'EUR'
  WHEN symbol IS NOT NULL AND symbol NOT LIKE '%.%' THEN 'USD'
  ELSE currency
END
WHERE symbol IS NOT NULL;