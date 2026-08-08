# QR-Based Student Attendance Management System

A fast, reliable, modern, and mobile-first college field-project web application designed to streamline student attendance management using dynamic, time-sensitive QR codes.

---

## 1. Problem Statement

Traditional classroom attendance in colleges relies on manual pen-and-paper attendance sheets or verbal roll calls, which suffer from critical inefficiencies:
* **Time-Consuming**: Taking roll calls for 60+ students consumes 10–15 minutes of valuable lecture time.
* **Proxy Attendance**: Paper sign-in sheets allow students to mark proxy attendance on behalf of absent peers.
* **Delayed Record-Keeping**: Manual entry into spreadsheets or ERP systems is slow, prone to clerical errors, and delays attendance deficit notifications.
* **Lack of Real-Time Visibility**: Students and faculty lack instant, transparent visibility into their cumulative course attendance percentages.

---

## 2. Objective & Solution

The **QR-Based Student Attendance Management System** solves these challenges with an authoritative, database-backed, real-time workflow:
1. **Faculty Launches Live Session**: Teachers initiate attendance from their personal portal, selecting their assigned class, subject, and session duration (1, 5, or 10 minutes).
2. **Dynamic QR Code Generation**: A high-contrast, cryptographically secure QR code is projected on the classroom screen with a live countdown timer and real-time attendee counter.
3. **Student Mobile Camera Scan**: Enrolled students scan the QR code using their smartphone camera (`html5-qrcode`), directly submitting the session token to the backend.
4. **Server-Authoritative Validation**:
   - The Go backend verifies the student's identity strictly from their signed JWT token (zero client-side ID spoofing).
   - Validates that the student is actively enrolled in that exact class batch.
   - Enforces authoritative PostgreSQL server-time expiration (`NOW() < expires_at`).
   - Prevents duplicate scans via database constraints (`UNIQUE(session_id, student_id)`).
5. **Instant Live Updates**: The teacher's screen updates immediately with live check-in logs, and student dashboards recalculate overall and subject-wise attendance percentages.

---

## 3. Features by User Role

### Administrator (`/admin`)
* **Live KPI Dashboard**: Real-time metrics for total students, faculty members, course subjects, academic class batches, and recent teaching allocations.
* **Student Management**: Full student directory, account activation/deactivation dialogs, and class batch allocation.
* **Teacher Management**: Faculty directory with employee IDs, departmental groupings, and account status controls.
* **Course Subjects**: Subject curriculum catalog with unique course codes and semester tracking.
* **Class Batches**: Academic class management with unique constraint validation on `(department, semester, section, academic_year)` and dynamic student counts.
* **Teaching Allocations**: Smart allocation interface linking faculty to subjects and classrooms.
* **Attendance Audit**: Comprehensive campus-wide attendance log audit with date, subject, and class filtering.

### Faculty Teacher (`/teacher`)
* **Allocated Classes**: Personalized view of all assigned subject and classroom batches.
* **Start Live Attendance**: Modal configuration for lecture sessions with duration options (`1 Minute Demo`, `5 Minutes Standard`, `10 Minutes Extended`).
* **Live QR Screen (`/teacher/attendance/:sessionId`)**:
  - High-contrast QR code generated in-browser with `qrcode.react`.
  - Visual countdown timer with warning colors as expiry approaches.
  - Real-time check-in counter (`Present: X / Y • Z%`) and auto-refreshing attendee stream.
  - "End Attendance Session Now" control for manual session termination.
* **Session Attendance Roster (`/teacher/attendance/:sessionId/records`)**: Full classroom roster displaying `PRESENT` students with check-in timestamps and calculated `ABSENT` students with search and print support.

### Student (`/student`)
* **Overall Attendance Percentage**: Prominent KPI card with cumulative attendance percentage and total lecture counts.
* **Subject-Wise Attendance Breakdown**: Individual course progress cards displaying attended sessions, total lectures held, and percentage progress bars.
* **Mobile Camera Scanner (`/attendance/scan`)**:
  - Responsive camera scanner (`375 x 812` mobile-ready) built with `html5-qrcode`.
  - Clean camera permission handling (granted, denied, retry prompts).
  - Instant verification feedback (`✓ Attendance Marked Successfully`).
  - Friendly alerts for duplicate scans (`409 Conflict`), expired sessions (`410 Gone`), and wrong class enrollment (`403 Forbidden`).
  - Secondary manual token entry for desktop testing and demo fallbacks.
* **Recent Check-In Timeline**: Log feed showing recent verified lecture check-ins with timestamps.

---

## 4. Technology Stack

### Frontend
* **Core**: React 18 / 19, TypeScript, Vite
* **Styling**: Tailwind CSS with custom academic palette (Indigo, Emerald, Amber, Rose, Slate)
* **Routing**: React Router DOM (v7) with `ProtectedRoute` role authorization guards
* **QR Code Generation**: `qrcode.react` (SVG rendering for high-contrast projector display)
* **QR Code Scanning**: `html5-qrcode` (HTML5 browser camera scanner with permission handling)
* **Icons**: Lucide React

### Backend
* **Language**: Go (v1.22+)
* **HTTP Framework**: Gin Web Framework (`github.com/gin-gonic/gin`)
* **ORM**: GORM (`gorm.io/gorm`) with PostgreSQL driver (`gorm.io/driver/postgres`)
* **Authentication**: JWT (`github.com/golang-jwt/jwt/v5`) & Bcrypt (`golang.org/x/crypto/bcrypt`)
* **Security**: Cryptographic tokens (`crypto/rand`), server-clock validation, zero student spoofing
* **Database Migrations**: Reproducible SQL migration runner (`internal/database/migration.go`) tracking applied versions in `schema_migrations`

### Database
* **Engine**: PostgreSQL (v14+)
* **Default Database**: `qr_attendance`
* **Port**: `5432`
* **Primary Keys**: UUID (`gen_random_uuid()`)

---

## 5. Project Architecture & Workflow

```text
                                BROWSER / CLIENT
                          (Mobile Phone & Desktop)
                                     │
                                     ▼
                        React + TypeScript + Vite
                                     │
                              REST API (JSON)
                                     │
                                     ▼
                             Go + Gin Framework
                                     │
                             JWT & Role Guards
                                     │
                                     ▼
                            GORM Service Layer
                                     │
                                     ▼
                          PostgreSQL 14+ Database
```

### Complete Attendance Lifecycle Diagram

```text
                  TEACHER
                     │
                     ▼
          Start Attendance Session
          (Select Subject, Class, Duration)
                     │
                     ▼
                 GO BACKEND
          (Generates Crypto Token,
           Sets Authoritative expires_at)
                     │
                     ▼
               PROJECTOR / SCREEN
          (Displays Large QR Code & Live Timer)
                     │
                     ▼
                  STUDENT
          (Scans QR with Mobile Camera)
                     │
                     ▼
                 GO BACKEND
          ┌──────────┴──────────┐
          │  AUTHORITATIVE      │
          │  VALIDATION CHECKS  │
          └──────────┬──────────┘
                     ├── 1. Valid & active session?
                     ├── 2. Server time < expires_at? (410 if expired)
                     ├── 3. Student enrolled in this class? (403 if mismatch)
                     └── 4. Not already marked? (409 if duplicate)
                     │
                     ▼
             ATTENDANCE RECORDED
          (status = 'PRESENT', marked_at = NOW())
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
     TEACHER                   STUDENT
  Live Feed Updates         Confirmation Card
  (Roster Shows PRESENT)    (Updated Attendance %)
```

---

## 6. Database Schema & Tables

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

### Database Tables Overview

| Table | Primary Key | Description | Key Constraints |
| :--- | :--- | :--- | :--- |
| `users` | UUID | Authentication accounts (Admin, Teacher, Student) | `email UNIQUE` |
| `students` | UUID | Student academic profiles | `user_id UNIQUE`, `roll_number UNIQUE`, `class_id FK (nullable)` |
| `teachers` | UUID | Faculty instructor profiles | `user_id UNIQUE`, `employee_id UNIQUE` |
| `subjects` | UUID | Course academic curriculum | `code UNIQUE` |
| `classes` | UUID | Academic class batches | `UNIQUE(department, semester, section, academic_year)` |
| `teacher_subject_classes` | UUID | Teaching allocations | `UNIQUE(teacher_id, subject_id, class_id)` |
| `attendance_sessions` | UUID | Live QR lecture sessions | `session_token UNIQUE`, `teacher_id FK`, `subject_id FK`, `class_id FK` |
| `attendance` | UUID | Verified student attendance records | `UNIQUE(session_id, student_id)`, `status = 'PRESENT'` |

---

## 7. API Endpoints Reference

### Public & Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Backend and PostgreSQL database health check | No |
| `GET` | `/api/info` | API version & environment info | No |
| `POST` | `/api/auth/login` | Login with email & password, returns JWT token | No |
| `GET` | `/api/auth/me` | Validates JWT token and restores user session | Bearer JWT |

### Admin APIs (`RequireRole: ADMIN`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Returns live counts for students, teachers, subjects, classes | Admin JWT |
| `GET` | `/api/admin/students` | List all students with linked user accounts & class info | Admin JWT |
| `POST` | `/api/admin/students` | Atomic transaction to create user & student profile | Admin JWT |
| `PUT` | `/api/admin/students/:id` | Update student profile details | Admin JWT |
| `PATCH` | `/api/admin/students/:id/status` | Activate / Deactivate student account | Admin JWT |
| `PATCH` | `/api/admin/students/:id/class` | Assign student to an academic class (or null to unassign) | Admin JWT |
| `GET` | `/api/admin/teachers` | List all teachers with employee IDs & departments | Admin JWT |
| `POST` | `/api/admin/teachers` | Atomic transaction to create user & teacher profile | Admin JWT |
| `PUT` | `/api/admin/teachers/:id` | Update teacher profile details | Admin JWT |
| `PATCH` | `/api/admin/teachers/:id/status` | Activate / Deactivate teacher account | Admin JWT |
| `GET` | `/api/admin/subjects` | List all subjects sorted by semester and name | Admin JWT |
| `POST` | `/api/admin/subjects` | Create subject with unique code validation | Admin JWT |
| `PUT` | `/api/admin/subjects/:id` | Update subject details | Admin JWT |
| `DELETE` | `/api/admin/subjects/:id` | Delete unused subject (409 if assigned) | Admin JWT |
| `GET` | `/api/admin/classes` | List all classes with dynamic student counts | Admin JWT |
| `POST` | `/api/admin/classes` | Create class batch with uniqueness validation | Admin JWT |
| `PUT` | `/api/admin/classes/:id` | Update class batch details | Admin JWT |
| `DELETE` | `/api/admin/classes/:id` | Delete unused class (409 if linked) | Admin JWT |
| `GET` | `/api/admin/assignments` | List all teacher-subject-class allocations | Admin JWT |
| `POST` | `/api/admin/assignments` | Create teaching assignment linking teacher, subject, and class | Admin JWT |
| `DELETE` | `/api/admin/assignments/:id` | Remove teaching assignment | Admin JWT |
| `GET` | `/api/admin/attendance/sessions` | Audit all campus attendance sessions with filters | Admin JWT |
| `GET` | `/api/admin/attendance/sessions/:id/records`| Inspect complete student roster for any session | Admin JWT |

### Teacher APIs (`RequireRole: TEACHER`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/teacher/profile` | Authenticated teacher profile details | Teacher JWT |
| `GET` | `/api/teacher/assignments` | List subjects & classes assigned to logged-in teacher | Teacher JWT |
| `POST` | `/api/teacher/attendance/sessions` | Start live QR session (duration 1, 5, 10 min) | Teacher JWT |
| `GET` | `/api/teacher/attendance/sessions` | List sessions created by this teacher | Teacher JWT |
| `GET` | `/api/teacher/attendance/sessions/:id` | Live session details, countdown timer, attendee count | Teacher JWT |
| `POST` | `/api/teacher/attendance/sessions/:id/end` | Manually end live session (sets is_active = false) | Teacher JWT |
| `GET` | `/api/teacher/attendance/sessions/:id/records` | Classroom roster with PRESENT & calculated ABSENT | Teacher JWT |

### Student APIs (`RequireRole: STUDENT`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/profile` | Student profile with assigned class details | Student JWT |
| `GET` | `/api/student/subjects` | Curriculum subjects for student's class | Student JWT |
| `POST` | `/api/attendance/mark` | Submit QR session token to record attendance | Student JWT |
| `GET` | `/api/student/attendance/summary` | Overall attendance % and subject breakdown | Student JWT |
| `GET` | `/api/student/attendance/recent` | Recent verified attendance scan log feed | Student JWT |

---

## 8. Installation & Setup Guide

### Prerequisites
* Go (v1.22+)
* Node.js (v18+) & npm
* PostgreSQL (v14+) running on `localhost:5432` with database `qr_attendance`

### Step 1: Database Setup
```sql
-- Connect to PostgreSQL and create database
CREATE DATABASE qr_attendance;
```

### Step 2: Backend Configuration & Seed
```bash
cd backend
cp .env.example .env
# Edit .env if your PostgreSQL password is not 'postgres'

# Run the idempotent Demo Seed tool (executes SQL migrations and seeds demo data)
go run ./cmd/seed

# Start the Go backend server (runs on port 8080)
go run ./cmd/server
```

### Step 3: Frontend Setup & Dev Server
```bash
cd frontend
npm install
npm run dev
# Frontend dev server will be running on http://localhost:5173
```

---

## 9. Demo Accounts

| Role | Email | Password | Direct Portal Link |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@example.com` | `ChangeThisPassword123` | `http://localhost:5173/admin` |
| **Faculty Teacher** | `teacher@example.com` | `teacher123` | `http://localhost:5173/teacher` |
| **Faculty Teacher 2** | `prof.patel@example.com` | `teacher123` | `http://localhost:5173/teacher` |
| **Student** | `student@example.com` | `student123` | `http://localhost:5173/student` |
| **Student 2** | `priya.patel@example.com` | `student123` | `http://localhost:5173/student` |

---

## 10. Live Demo Walkthrough Script (5–10 Min College Presentation)

Follow this exact sequence for your faculty presentation:

1. **Step 1 — Admin Management Overview**:
   - Open `http://localhost:5173/login` and log in as **Admin** (`admin@example.com` / `ChangeThisPassword123`).
   - Show the **Admin Dashboard** with live counts for Students (10), Teachers (2), Subjects (4), Classes (2), and Teaching Allocations.
   - Briefly click **Students Directory** (`/admin/students`) to show that students are assigned to `SY BSc Computer Science`.
   - Click **Teaching Assignments** (`/admin/assignments`) to show that `Prof. Vikram Sharma` is assigned to teach `Data Structures (CS201)` to `SY BSc CS`.

2. **Step 2 — Teacher Launches Live Attendance**:
   - Log in as **Teacher** (`teacher@example.com` / `teacher123`).
   - On the Teacher Dashboard, find **Data Structures (CS201)** and click **Start Attendance**.
   - Select **1 Minute (Quick Test / Demo)** duration and click **Generate Live QR Code**.
   - The screen displays the large, high-contrast QR code, live remaining countdown timer (`00:59`), and `Present: 0 / 10 (0%)`.

3. **Step 3 — Student Scans QR Code on Mobile**:
   - In a separate browser tab or mobile device, log in as **Student** (`student@example.com` / `student123`).
   - Click **Scan Attendance QR** (`/attendance/scan`).
   - Click **Start Camera** (or use the session token) to scan the QR code displayed on the teacher's screen.
   - The student instantly receives a green verified confirmation card: `✓ Attendance Marked Successfully` for `Data Structures`.

4. **Step 4 — Verify Live Real-Time Updates**:
   - Switch back to the Teacher's screen: the attendance counter immediately updates to `Present: 1 / 10 (10%)`, and `Rahul Sharma` appears in the live check-in stream.
   - Switch to the Student Dashboard: show the updated **Overall Attendance %** and the **Data Structures** progress bar (`1 / 1 • 100%`).

5. **Step 5 — Demonstrate Security & Failure Guards**:
   - **Duplicate Scan Prevention**: Attempt to scan the same QR code again as the same student. The system rejects it with `409 Conflict`: `"Attendance has already been marked for this session"`.
   - **Session Expiration Guard**: Wait for the 1-minute countdown timer to reach `00:00`. Attempt to scan with a second student account (`priya.patel@example.com`). The server rejects it with `410 Gone`: `"This attendance session has expired"`.
   - **Teacher Session Records**: On the Teacher portal, click **View Attendance Report** to see the full classroom roster: `Rahul Sharma` is marked `PRESENT` with timestamp, and the remaining 9 students are marked `ABSENT`.
   - **Admin Attendance Audit**: Log back in as Admin and open `http://localhost:5173/admin/attendance` to demonstrate campus-wide audit transparency.

---

## 11. Production Cloud Deployment (Neon + Render + Vercel)

### Architecture Overview
* **Database**: [Neon PostgreSQL](https://neon.tech) (Serverless PostgreSQL with SSL)
* **Backend API**: [Render](https://render.com) (Go Gin Web Service running `backend/`)
* **Frontend UI**: [Vercel](https://vercel.com) (React + Vite SPA with rewrites in `frontend/`)

### Step 1: Create Neon PostgreSQL Database
1. Sign up at [Neon](https://neon.tech) and create a project named `qr-attendance`.
2. Copy your connection string (`DATABASE_URL`), formatted as:
   ```text
   postgres://neondb_owner:YOUR_PASSWORD@ep-xyz-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Deploy Go Backend on Render
1. Create a new **Web Service** on [Render](https://render.com) linked to your GitHub repository.
2. Configure:
   * **Root Directory**: `backend`
   * **Runtime**: `Go`
   * **Build Command**: `go build -o server ./cmd/server`
   * **Start Command**: `./server`
   * **Health Check Path**: `/api/health`
3. Add Environment Variables in the Render Dashboard:
   * `ENVIRONMENT` = `production`
   * `DATABASE_URL` = `your_neon_connection_string`
   * `JWT_SECRET` = `generate_a_secure_256_bit_secret`
   * `FRONTEND_URL` = `https://your-frontend-app.vercel.app`
   * `JWT_EXPIRATION_HOURS` = `24`
4. Click **Deploy Web Service** and note your Render API URL (e.g. `https://qr-attendance-api.onrender.com`).

### Step 3: Deploy Frontend on Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Configure:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Add Environment Variables in the Vercel Dashboard:
   * `VITE_BACKEND_URL` = `https://qr-attendance-api.onrender.com`
   * `VITE_APP_URL` = `https://your-app-name.vercel.app`
4. Click **Deploy**.

### Step 4: Run Production Seed (Optional / Demo)
To seed initial faculty, subjects, and classroom demo data on Neon:
```bash
cd backend
DATABASE_URL="your_neon_connection_string" go run ./cmd/seed
```
