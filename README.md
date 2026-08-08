# QR-Based Student Attendance Management System

A simple, fast, modern, and maintainable college field-project web application designed to streamline student attendance management using dynamic QR codes.

---

## 1. Project Overview

The **QR-Based Student Attendance Management System** provides an academic management platform with role-tailored workspaces:
- **Administrator**: User authentication, student enrollment, faculty management, course subjects, academic class batches, teaching assignments, and student-to-class allocations.
- **Teacher**: Faculty dashboard displaying assigned course subjects and classroom batches in preparation for Phase 4 QR attendance sessions.
- **Student**: Student portal displaying enrolled profile details, assigned class batch, and class subjects curriculum in preparation for Phase 4 mobile QR scanning.

> **Phase 3 Implementation**: Academic structure and class management. Includes SQL migrations (`003_create_academic_tables.sql`, `004_create_assignments.sql`), full REST APIs for Subjects, Classes, Teaching Assignments, and Student Class Allocation, role-protected Teacher/Student portals, and extended live KPI dashboard metrics.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 / 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **State Management**: React Context (`AuthContext` with automatic session restoration via `GET /api/auth/me`)
- **Styling**: Tailwind CSS with custom academic color tokens
- **Routing**: React Router DOM (v7) with `ProtectedRoute` role guards
- **Icons**: Lucide React

### Backend
- **Language**: Go (v1.22+)
- **HTTP Framework**: Gin Web Framework (`github.com/gin-gonic/gin`)
- **ORM & Driver**: GORM (`gorm.io/gorm`) with PostgreSQL driver (`gorm.io/driver/postgres`)
- **Authentication**: JWT (`github.com/golang-jwt/jwt/v5`) & Bcrypt (`golang.org/x/crypto/bcrypt`)
- **Database Migrations**: Reproducible SQL migration runner (`internal/database/migration.go`) tracking versions in `schema_migrations`
- **Configuration**: Environment variables with `github.com/joho/godotenv`

### Database
- **Database**: PostgreSQL (v14+)
- **Default Database**: `qr_attendance`
- **Port**: `5432`
- **Primary Keys**: UUID (`gen_random_uuid()`)

---

## 3. Database Architecture & Schema

```text
users
 │
 ├── students
 │      │
 │      └── class_id → classes.id
 │
 └── teachers
        │
        └── teacher_subject_classes
                 │
                 ├── subject_id → subjects.id
                 │
                 └── class_id → classes.id
```

### `users` Table
```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### `students` Table
```sql
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    semester INTEGER NOT NULL,
    section VARCHAR(20) NOT NULL,
    class_id UUID NULL REFERENCES classes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### `teachers` Table
```sql
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### `subjects` Table (Phase 3)
```sql
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    semester INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### `classes` Table (Phase 3)
```sql
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
```

### `teacher_subject_classes` Table (Phase 3)
```sql
CREATE TABLE IF NOT EXISTS teacher_subject_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_teacher_subject_class UNIQUE (teacher_id, subject_id, class_id)
);
```

---

## 4. API Endpoints

### Public & Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Backend and PostgreSQL health check | No |
| `GET` | `/api/info` | API version & environment info | No |
| `POST` | `/api/auth/login` | Login with email and password, returns JWT & user profile | No |
| `GET` | `/api/auth/me` | Validates JWT token and restores user session | Bearer JWT |

### Admin Management (`RequireRole: ADMIN`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Returns live counts for students, teachers, subjects, classes, and recent assignments | Admin JWT |
| `GET` | `/api/admin/students` | List all students with linked user profiles and assigned classes | Admin JWT |
| `POST` | `/api/admin/students` | Atomic transaction to create user and student profile | Admin JWT |
| `PUT` | `/api/admin/students/:id` | Update student profile and user details | Admin JWT |
| `PATCH` | `/api/admin/students/:id/status` | Activate / Deactivate student account | Admin JWT |
| `PATCH` | `/api/admin/students/:id/class` | Assign student to an academic class (or `null` to unassign) | Admin JWT |
| `GET` | `/api/admin/teachers` | List all teachers with linked user profiles | Admin JWT |
| `POST` | `/api/admin/teachers` | Atomic transaction to create user and teacher profile | Admin JWT |
| `PUT` | `/api/admin/teachers/:id` | Update teacher profile and user details | Admin JWT |
| `PATCH` | `/api/admin/teachers/:id/status` | Activate / Deactivate teacher account | Admin JWT |
| `GET` | `/api/admin/subjects` | List all subjects sorted by semester and name | Admin JWT |
| `POST` | `/api/admin/subjects` | Create new course subject with unique code validation | Admin JWT |
| `PUT` | `/api/admin/subjects/:id` | Update subject details | Admin JWT |
| `DELETE` | `/api/admin/subjects/:id` | Delete unused subject (returns 409 if assigned to teacher/class) | Admin JWT |
| `GET` | `/api/admin/classes` | List all classes with dynamic enrolled student count | Admin JWT |
| `POST` | `/api/admin/classes` | Create new academic class batch with uniqueness validation | Admin JWT |
| `PUT` | `/api/admin/classes/:id` | Update class batch details | Admin JWT |
| `DELETE` | `/api/admin/classes/:id` | Delete unused class (returns 409 if linked to students or assignments) | Admin JWT |
| `GET` | `/api/admin/assignments` | List all teacher-subject-class allocations | Admin JWT |
| `POST` | `/api/admin/assignments` | Create teaching assignment linking active teacher, subject, and class | Admin JWT |
| `DELETE` | `/api/admin/assignments/:id` | Remove teaching assignment | Admin JWT |

### Teacher Portal (`RequireRole: TEACHER`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/teacher/profile` | Authenticated teacher profile details | Teacher JWT |
| `GET` | `/api/teacher/assignments` | List subjects and classes assigned to the logged-in teacher | Teacher JWT |

### Student Portal (`RequireRole: STUDENT`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/profile` | Authenticated student profile with assigned class info | Student JWT |
| `GET` | `/api/student/subjects` | List course subjects curriculum for the student's assigned class | Student JWT |

---

## 5. Getting Started & Installation

### Step 1: PostgreSQL Setup
Ensure PostgreSQL is running locally on port 5432 with database `qr_attendance`.

### Step 2: Backend Configuration & Seed
```bash
cd backend
cp .env.example .env
# Edit .env if your PostgreSQL password differs from "postgres"

# Run the Admin seed CLI tool (executes SQL migrations and creates Admin account)
go run ./cmd/seed

# Start the Go server
go run ./cmd/server
```

### Step 3: Frontend Installation & Start
```bash
cd frontend
npm install
npm run dev
```

---

## 6. Default Demo Accounts

| Role | Email | Password | Dashboard URL |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `ChangeThisPassword123` | `http://localhost:5173/admin` |
| **Teacher** | `teacher@example.com` | `teacher123` | `http://localhost:5173/teacher` |
| **Student** | `student@example.com` | `student123` | `http://localhost:5173/student` |

---

## 7. Scope & Roadmap

### Phase 1 (Completed)
- [x] Monorepo architecture & PostgreSQL connection pooling
- [x] Reusable responsive UI component library & layouts
- [x] Live health check & connection widget

### Phase 2 (Completed)
- [x] SQL migrations (`001_create_users.sql`, `002_create_students_and_teachers.sql`)
- [x] Bcrypt password hashing & JWT token issuance (24h validity)
- [x] Role-based middleware (`RequireAuth`, `RequireRole`)
- [x] Database transactions (`CreateStudentTx`, `CreateTeacherTx`) with rollback on error
- [x] React Auth Context with `localStorage` token persistence & `GET /api/auth/me` restore
- [x] Protected routes preventing unauthorized role access
- [x] Admin Student Management (table, mobile cards, Add modal, Edit modal, Deactivate dialog)
- [x] Admin Teacher Management (table, mobile cards, Add modal, Edit modal, Deactivate dialog)
- [x] Live Admin Dashboard KPI cards connected to database metrics
- [x] Seed CLI tool (`go run ./cmd/seed`)

### Phase 3 (Completed)
- [x] SQL migrations (`003_create_academic_tables.sql`, `004_create_assignments.sql`)
- [x] `subjects` table with unique course codes and semester tracking
- [x] `classes` table with unique batch constraint `(department, semester, section, academic_year)`
- [x] `students.class_id` nullable foreign key with `ON DELETE SET NULL`
- [x] `teacher_subject_classes` table linking teacher, subject, and class
- [x] Admin Subjects management (`/admin/subjects`) with modal forms and 409 conflict safety
- [x] Admin Classes management (`/admin/classes`) with dynamic student counts and 409 conflict safety
- [x] Admin Student Class allocation modal (`/admin/students`)
- [x] Admin Teaching Assignments management (`/admin/assignments`) with smart dropdown UX
- [x] Extended Admin Dashboard with live Subject/Class KPIs and Recent Teaching Assignments
- [x] Teacher portal (`/teacher`) displaying personalized assigned subjects and classes
- [x] Student portal (`/student`) displaying enrolled class and subject curriculum
- [x] Strict role-based backend authorization guards

### Phase 4 (Upcoming)
- Dynamic QR code generation for teachers with rotating expiry
- Mobile camera QR scanner for students
- Live attendance logging & percentage calculations
- Attendance reports & exports
