-- ==============================================================================
-- Migration 009: Create attendance_proofs table for digital attendance receipts
-- ==============================================================================

CREATE TABLE IF NOT EXISTS attendance_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL UNIQUE REFERENCES attendance(id) ON DELETE CASCADE,
    public_id VARCHAR(50) NOT NULL UNIQUE,
    college_id UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_proofs_attendance_id ON attendance_proofs(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_proofs_public_id ON attendance_proofs(public_id);
CREATE INDEX IF NOT EXISTS idx_attendance_proofs_college_id ON attendance_proofs(college_id);
CREATE INDEX IF NOT EXISTS idx_attendance_proofs_created_at ON attendance_proofs(created_at);
