-- ==============================================================================
-- Migration 004: Create teacher_subject_classes table for academic assignments
-- ==============================================================================

CREATE TABLE IF NOT EXISTS teacher_subject_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_teacher_subject_class UNIQUE (teacher_id, subject_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_tsc_teacher_id ON teacher_subject_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tsc_subject_id ON teacher_subject_classes(subject_id);
CREATE INDEX IF NOT EXISTS idx_tsc_class_id ON teacher_subject_classes(class_id);
