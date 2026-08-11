-- ==============================================================================
-- Migration 007: Add late attendance configuration to attendance_sessions
-- ==============================================================================

ALTER TABLE attendance_sessions
ADD COLUMN IF NOT EXISTS late_threshold_minutes INTEGER NOT NULL DEFAULT 10;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_attendance_sessions_late_threshold'
    ) THEN
        ALTER TABLE attendance_sessions
        ADD CONSTRAINT chk_attendance_sessions_late_threshold
        CHECK (late_threshold_minutes >= 0 AND late_threshold_minutes <= 180);
    END IF;
END $$;
