-- ==============================================================================
-- Migration 010: Add optional phone and address fields to students table
-- ==============================================================================

ALTER TABLE students
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE students
ADD COLUMN IF NOT EXISTS address VARCHAR(255);
