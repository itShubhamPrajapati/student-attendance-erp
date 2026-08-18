-- ==============================================================================
-- Migration 011: Add optional phone and address fields to teachers table
-- ==============================================================================

ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS address VARCHAR(255);
