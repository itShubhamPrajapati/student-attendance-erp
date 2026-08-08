# QR-Based Student Attendance Management System

A simple, fast, modern, and reliable college field-project web application designed to streamline classroom student attendance management using dynamic QR codes.

---

## 1. Project Overview

The **QR-Based Student Attendance Management System** provides an end-to-end academic attendance workflow with role-tailored workspaces:
- **Administrator**: User authentication, student enrollment, faculty management, course subjects, academic class batches, teaching assignments, and campus-wide attendance session auditing.
- **Teacher**: Faculty workspace displaying assigned classes, allowing teachers to start live QR attendance sessions (1, 5, or 10 min), display dynamic high-contrast QR codes on lecture screens, monitor real-time check-in feeds, and view session attendance rosters with PRESENT / ABSENT breakdown.
- **Student**: Mobile-responsive student portal displaying enrolled class batch, course curriculum, overall and subject-wise attendance percentages, recent attendance check-in history, and a mobile camera QR scanner (`/attendance/scan`).

> **Phase 4 Implementation**: Live QR-Based Attendance System. Includes database migration `005_create_attendance_tables.sql`, cryptographically secure session token generation, authoritative server-time expiration (`NOW() < expires_at`), duplicate scan prevention (`409 Conflict`), class enrollment validation (`403 Forbidden`), expired session handling (`410 Gone`), real-time attendee feed, mobile camera QR scanner (`html5-qrcode`), and comprehensive student & admin attendance reports.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 / 19 with TypeScript & Vite
- **QR Code Generation**: `qrcode.react` (High-contrast SVG rendering for projectors and laptops)
- **QR Code Scanner**: `html5-qrcode` (HTML5 browser camera scanner with permission handling)
- **State Management**: React Context (`AuthContext` with automatic session restoration via `GET /api/auth/me`)
- **Styling**: Tailwind CSS with custom academic color palette
- **Routing**: React Router DOM (v7) with `ProtectedRoute` role guards
- **Icons**: Lucide React

### Backend
- **Language**: Go (v1.22+)
- **HTTP Framework**: Gin Web Framework (`github.com/gin-gonic/gin`)
- **ORM & Driver**: GORM (`gorm.io/gorm`) with PostgreSQL driver (`gorm.io/driver/postgres`)
- **Authentication**: JWT (`github.com/golang-jwt/jwt/v5`) & Bcrypt (`golang.org/x/crypto/bcrypt`)
- **Security**: Cryptographic session tokens (`crypto/rand`), authoritative server-clock expiration, zero student input spoofing (student ID resolved strictly from JWT)
- **Database Migrations**: Reproducible SQL migration runner (`internal/database/migration.go`) tracking versions in `schema_migrations`

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
 ├── students ───────────┐
 │      │                │
 │      └── class_id ──┐ │
 │                     │ │
 └── teachers          │ │
        │              │ │
        ├── teacher_subject_classes (assignments)
        │        ├── subject_id ──> subjects.id
        │        └── class_id   ──> classes.id
        │
        └── attendance_sessions
                 ├── teacher_id ──> teachers.id
                 ├── subject_id ──> subjects.id
                 ├── class_id   ──> classes.id
                 │
                 └── attendance
                          ├── session_id ──> attendance_sessions.id
                          └── student_id ──> students.id (UNIQUE)
```

### `attendance_sessions` Table (Phase 4)
```sql
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
```

### `attendance` Table (Phase 4)
```sql
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_student UNIQUE(session_id, student_id)
);
```

---

## 4. Complete Attendance Workflow

```text
1. TEACHER LAUNCHES ATTENDANCE
   Teacher logs in ➔ Selects assigned Course & Class ➔ Chooses Duration (1, 5, 10 min)
   ➔ Clicks "Generate Live QR Code"
   ➔ Backend creates attendance_sessions record with crypto token and expires_at.

2. QR CODE DISPLAY ON SCREEN
   Teacher screen displays high-contrast QR code, live countdown timer, and auto-refreshing attendee counter.
   URL encoded in QR: http://localhost:5173/attendance/scan?token=<SESSION_TOKEN>

3. STUDENT SCANS QR CODE
   Student logs in on mobile device ➔ Opens /attendance/scan
   ➔ Grants camera access ➔ Camera detects QR code
   ➔ Frontend submits session_token to POST /api/attendance/mark.

4. BACKEND VERIFIES ATTENDANCE
   ➔ Resolves student ID strictly from JWT
   ➔ Validates session is active (is_active = true)
   ➔ Validates server time (NOW() < expires_at, returns 410 if expired)
   ➔ Validates student is enrolled in the session's class (returns 403 if mismatch)
   ➔ Validates student hasn't already scanned (returns 409 if duplicate)
   ➔ Inserts attendance record with status = 'PRESENT' and timestamp.

5. LIVE DASHBOARDS UPDATE
   ➔ Teacher sees student pop up instantly on the live check-in feed.
   ➔ Student receives verified check-in confirmation card.
   ➔ Student dashboard updates overall attendance % and subject-wise metrics.
   ➔ Teacher / Admin can view full classroom roster with PRESENT and ABSENT breakdown.
```

---

## 5. API Endpoints

### Public & Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Backend and PostgreSQL connection health | No |
| `GET` | `/api/info` | API version & environment info | No |
| `POST` | `/api/auth/login` | Login with email & password, returns JWT | No |
| `GET` | `/api/auth/me` | Validates JWT token and restores session | Bearer JWT |

### Teacher Attendance Management (`RequireRole: TEACHER`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/teacher/profile` | Authenticated teacher profile details | Teacher JWT |
| `GET` | `/api/teacher/assignments` | List subjects & classes assigned to teacher | Teacher JWT |
| `POST` | `/api/teacher/attendance/sessions` | Start a live QR session (duration 1, 5, 10 min) | Teacher JWT |
| `GET` | `/api/teacher/attendance/sessions` | List all sessions created by this teacher | Teacher JWT |
| `GET` | `/api/teacher/attendance/sessions/:id` | Get session details, timer, & attendee count | Teacher JWT |
| `POST` | `/api/teacher/attendance/sessions/:id/end` | Manually end live session (`is_active = false`) | Teacher JWT |
| `GET` | `/api/teacher/attendance/sessions/:id/records` | Full roster with PRESENT & calculated ABSENT | Teacher JWT |

### Student QR Scanning & Metrics (`RequireRole: STUDENT`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/profile` | Student profile with assigned class details | Student JWT |
| `GET` | `/api/student/subjects` | Curriculum subjects for student's class | Student JWT |
| `POST` | `/api/attendance/mark` | Submit QR session token to record attendance | Student JWT |
| `GET` | `/api/student/attendance/summary` | Overall attendance % and subject breakdown | Student JWT |
| `GET` | `/api/student/attendance/recent` | Recent verified attendance scan log feed | Student JWT |

### Admin Audit & Management (`RequireRole: ADMIN`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Extended KPI metrics & recent allocations | Admin JWT |
| `GET` | `/api/admin/attendance/sessions` | Audit all attendance sessions across campus | Admin JWT |
| `GET` | `/api/admin/attendance/sessions/:id/records` | Inspect complete student roster for any session | Admin JWT |
| `GET` | `/api/admin/students` | Student management directory | Admin JWT |
| `POST` | `/api/admin/students` | Create student account and profile | Admin JWT |
| `PATCH` | `/api/admin/students/:id/class` | Assign student to class batch | Admin JWT |
| `GET` | `/api/admin/teachers` | Faculty directory | Admin JWT |
| `GET` | `/api/admin/subjects` | Academic subjects directory | Admin JWT |
| `GET` | `/api/admin/classes` | Class batches directory with student counts | Admin JWT |
| `GET` | `/api/admin/assignments` | Teaching allocations directory | Admin JWT |

---

## 6. Default Demo Accounts

| Role | Email | Password | Dashboard URL |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `ChangeThisPassword123` | `http://localhost:5173/admin` |
| **Teacher** | `teacher@example.com` | `teacher123` | `http://localhost:5173/teacher` |
| **Student** | `student@example.com` | `student123` | `http://localhost:5173/student` |

---

## 7. Installation & Running Instructions

### Step 1: PostgreSQL Setup
Ensure PostgreSQL is running locally on port 5432 with database `qr_attendance`.

### Step 2: Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env if your PostgreSQL password differs from "postgres"

# Optional: Run seed tool to populate Admin account
go run ./cmd/seed

# Start the Go server
go run ./cmd/server
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 8. Mobile QR Scanning Instructions

1. Open `http://localhost:5173/login` on your mobile phone or browser.
2. Log in as a Student (`student@example.com` / `student123`).
3. Click the **Scan Attendance QR** button on your dashboard (or navigate to `/attendance/scan`).
4. Click **Start Camera** and grant camera permissions when prompted.
5. Point the camera at the teacher's QR code on the lecture screen.
6. The system will instantly detect the QR code, verify server-authoritative timestamps and class enrollment, and present a verified check-in confirmation card.
