-- ==============================================================================
-- Migration 008: Add attendance session finalization, locking, and session audit table
-- ==============================================================================

-- 1. Add finalization status and audit fields to attendance_sessions
ALTER TABLE attendance_sessions
ADD COLUMN IF NOT EXISTS finalization_status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS finalized_by UUID NULL REFERENCES users(id) ON DELETE SET NULL;

-- 2. Add constraint for allowed finalization statuses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_attendance_sessions_finalization_status'
    ) THEN
        ALTER TABLE attendance_sessions
        ADD CONSTRAINT chk_attendance_sessions_finalization_status
        CHECK (finalization_status IN ('OPEN', 'FINALIZED'));
    END IF;
END $$;

-- 3. Create indexes on finalization fields for performance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_finalization_status ON attendance_sessions(finalization_status);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_finalized_by ON attendance_sessions(finalized_by);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_finalized_at ON attendance_sessions(finalized_at);

-- 4. Create immutable attendance_session_audit table for session-level lifecycle events
CREATE TABLE IF NOT EXISTS attendance_session_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NULL,
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(30) NOT NULL,
    previous_status VARCHAR(20) NULL,
    new_status VARCHAR(20) NOT NULL,
    reason TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Create indexes on attendance_session_audit
CREATE INDEX IF NOT EXISTS idx_attendance_session_audit_session_id ON attendance_session_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_audit_actor_user_id ON attendance_session_audit(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_audit_created_at ON attendance_session_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_session_audit_college_id ON attendance_session_audit(college_id);
