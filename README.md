# QR-Based Student Attendance Management System

A simple, fast, modern, and maintainable college field-project web application designed to streamline student attendance management using dynamic QR codes.

---

## 1. Project Overview

The **QR-Based Student Attendance Management System** provides an academic management platform with role-tailored workspaces:
- **Administrator**: User authentication, student enrollment, faculty management, department allocations, and account activation/deactivation.
- **Teacher**: Faculty dashboard, profile overview, and workspace for upcoming Phase 3 QR attendance sessions.
- **Student**: Student profile, semester/section overview, and portal for upcoming Phase 3 mobile QR scanning and attendance percentages.

> **Phase 2 Implementation**: Full JWT authentication, bcrypt password hashing, PostgreSQL SQL migrations with UUID primary keys, GORM transaction-safe atomic registration, role authorization guards, React Context session persistence, and full Admin Student/Teacher account management.

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
| `GET` | `/api/admin/dashboard` | Returns total and active counts for students and teachers | Admin JWT |
| `GET` | `/api/admin/students` | List all students with linked user profiles | Admin JWT |
| `POST` | `/api/admin/students` | Atomic transaction to create user and student profile | Admin JWT |
| `PUT` | `/api/admin/students/:id` | Update student profile and user details | Admin JWT |
| `PATCH` | `/api/admin/students/:id/status` | Activate / Deactivate student account | Admin JWT |
| `GET` | `/api/admin/teachers` | List all teachers with linked user profiles | Admin JWT |
| `POST` | `/api/admin/teachers` | Atomic transaction to create user and teacher profile | Admin JWT |
| `PUT` | `/api/admin/teachers/:id` | Update teacher profile and user details | Admin JWT |
| `PATCH` | `/api/admin/teachers/:id/status` | Activate / Deactivate teacher account | Admin JWT |

---

## 5. Getting Started & Installation

### Step 1: PostgreSQL Setup
Ensure PostgreSQL is running locally on port 5432 with database `qr_attendance`.

### Step 2: Backend Configuration & Seed
```bash
cd backend
cp .env.example .env
# Edit .env if your PostgreSQL password differs from "postgres"

# Run the Admin seed CLI tool (automatically executes SQL migrations and creates Admin account)
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

### Phase 3 (Upcoming)
- Dynamic QR code generation for teachers with rotating expiry
- Mobile camera QR scanner for students
- Timetable & Class/Subject management
- Live attendance logging & percentage calculations
- Attendance reports & exports
