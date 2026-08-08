-- ==============================================================================
-- Migration 005: Create attendance_sessions and attendance tables
-- ==============================================================================

CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    session_token TEXT NOT NULL UNIQUE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher_id ON attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_subject_id ON attendance_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_id ON attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_token ON attendance_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_active ON attendance_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_expires_at ON attendance_sessions(expires_at);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_student UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_at ON attendance(marked_at);
