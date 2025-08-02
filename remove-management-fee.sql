-- Remove managementFeePercentage column from contracts table
-- Run this after deploying the code changes

ALTER TABLE contracts 
DROP COLUMN IF EXISTS management_fee_percentage;

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;