-- ==============================================================================
-- Migration 003: Create subjects and classes tables, and add class_id to students
-- ==============================================================================

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    semester INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_department ON subjects(department);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester);

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INTEGER NOT NULL,
    section VARCHAR(20) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_class_batch UNIQUE (department, semester, section, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_classes_dept_sem ON classes(department, semester);
CREATE INDEX IF NOT EXISTS idx_classes_section ON classes(section);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);

-- Nullable class reference on existing students
ALTER TABLE students 
    ADD COLUMN IF NOT EXISTS class_id UUID NULL REFERENCES classes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
