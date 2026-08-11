-- ==============================================================================
-- Migration 006: Create attendance_audit table for immutable attendance history
-- ==============================================================================

CREATE TABLE IF NOT EXISTS attendance_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NULL,
    attendance_id UUID NULL REFERENCES attendance(id) ON DELETE SET NULL,
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(20) NULL,
    new_status VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_audit_college_id ON attendance_audit(college_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_attendance_id ON attendance_audit(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_session_id ON attendance_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_student_id ON attendance_audit(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_actor_user_id ON attendance_audit(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_created_at ON attendance_audit(created_at);
