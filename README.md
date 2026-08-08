# QR-Based Student Attendance Management System

A simple, fast, modern, and maintainable college field-project web application designed to streamline student attendance management using dynamic QR codes.

---

## 1. Project Overview

The **QR-Based Student Attendance Management System** provides an academic management platform with role-tailored workspaces:
- **Administrator**: Academic directory, faculties, courses/subjects, and batch management.
- **Teacher**: Timetable overview, dynamic QR attendance session generation, and attendance records.
- **Student**: Subject-wise attendance percentage tracking, mobile QR scanning, and attendance history logs.

> **Phase 1 Foundation**: This phase establishes the core monorepo architecture, Go (Gin + GORM) backend, PostgreSQL connectivity, React (Vite + TypeScript + Tailwind) frontend, mobile-responsive layout, and live health check verification.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 / 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Tailwind typography, custom academic color tokens)
- **Routing**: React Router DOM (v7)
- **Icons**: Lucide React

### Backend
- **Language**: Go (v1.22+)
- **HTTP Framework**: Gin Web Framework (`github.com/gin-gonic/gin`)
- **ORM & Driver**: GORM (`gorm.io/gorm`) with PostgreSQL driver (`gorm.io/driver/postgres`)
- **Configuration**: Environment variables with `github.com/joho/godotenv`
- **Security Ready**: Architecture prepared for JWT and bcrypt in Phase 2

### Database
- **Database**: PostgreSQL (v14+)
- **Default Database**: `qr_attendance`
- **Port**: `5432`

---

## 3. Project Directory Structure

```
qr-attendance-system/
├── frontend/
│   ├── src/
│   │   ├── assets/              # Static assets & branding
│   │   ├── components/          # Reusable UI components (Button, Input, Card, Badge, LoadingSpinner, EmptyState, PageHeader, MobileMenu, ConnectionStatus, Navbar, Sidebar)
│   │   ├── hooks/               # useHealthCheck.ts
│   │   ├── layouts/             # DashboardLayout.tsx, AuthLayout.tsx
│   │   ├── pages/               # LandingPage.tsx, LoginPage.tsx, AdminDashboard.tsx, TeacherDashboard.tsx, StudentDashboard.tsx, NotFoundPage.tsx
│   │   ├── services/            # api.ts (backend HTTP client)
│   │   ├── types/               # TypeScript interfaces & types
│   │   ├── utils/               # cn.ts (tailwind merge utilities)
│   │   ├── App.tsx              # Router & application shell
│   │   ├── main.tsx             # React DOM root entry
│   │   └── index.css            # Tailwind directives & typography
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go          # Server entry point & startup banner
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go        # Environment variable loader
│   │   ├── database/
│   │   │   └── database.go      # PostgreSQL GORM connection & pooling
│   │   ├── handlers/
│   │   │   └── health.go        # Health check handler (/api/health)
│   │   ├── middleware/
│   │   │   ├── cors.go          # Development CORS middleware
│   │   │   └── auth.go          # Auth architecture stubs (Phase 2 ready)
│   │   ├── models/
│   │   │   └── models.go        # GORM database schemas (User, Student, Teacher, Subject, Class, AttendanceSession, Attendance)
│   │   ├── routes/
│   │   │   └── routes.go        # Gin route registration & 404 handler
│   │   └── services/
│   │       └── service.go       # Service architecture placeholders
│   ├── migrations/              # Database migration scripts
│   ├── .env.example             # Example environment template
│   ├── .env                     # Local configuration (Git ignored)
│   └── go.mod                   # Go module definitions
│
├── .gitignore                   # Excludes .env, node_modules, dist, *.exe, *.log
└── README.md                    # Documentation & setup guide
```

---

## 4. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or later (`v20+` recommended)
- **Go**: `v1.22` or later
- **PostgreSQL**: `v14` or later
- **Git**

---

## 5. Getting Started & Installation

### Step 1: Clone or Open the Monorepo
```bash
cd qr-attendance-system
```

### Step 2: PostgreSQL Database Setup
1. Start your local PostgreSQL server:
   - On Windows: Check service `postgresql-x64-18`
   - On Linux/macOS: `sudo systemctl start postgresql` or `brew services start postgresql`
2. Create the database:
```sql
CREATE DATABASE qr_attendance;
```

### Step 3: Backend Configuration & Start
1. Navigate to the backend directory:
```bash
cd backend
```
2. Copy the environment example to create `.env`:
```bash
cp .env.example .env
```
3. Update the `.env` file with your PostgreSQL credentials:
```env
SERVER_PORT=8080
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=qr_attendance
DATABASE_SSLMODE=disable

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION_HOURS=24
```
4. Run the Go backend server:
```bash
go run ./cmd/server
```

You should see the clean startup banner:
```text
==================================================
QR Attendance API
Environment: development
Server: :8080
Database: connected
Health Endpoint: http://localhost:8080/api/health
==================================================
```

### Step 4: Frontend Installation & Start
1. In a new terminal, navigate to the frontend directory:
```bash
cd frontend
```
2. Install npm dependencies:
```bash
npm install
```
3. Start the Vite development server:
```bash
npm run dev
```

---

## 6. Development URLs

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Application** | `http://localhost:5173` | React application with responsive navigation & dashboards |
| **Backend Server** | `http://localhost:8080` | Go Gin REST API |
| **Health Check API** | `http://localhost:8080/api/health` | Verifies API and PostgreSQL connection status |
| **API Info** | `http://localhost:8080/api/info` | Returns API version and environment |
| **Login Page** | `http://localhost:5173/login` | Responsive login UI with show/hide password toggle |
| **Admin Dashboard** | `http://localhost:5173/admin` | Placeholder overview for Students, Teachers, Subjects, Classes |
| **Teacher Dashboard** | `http://localhost:5173/teacher` | Placeholder for Today's Classes, Active Attendance, Records |
| **Student Dashboard** | `http://localhost:5173/student` | Placeholder for Attendance %, Scan QR button, Logs |

---

## 7. Scope & Roadmap

### Phase 1 (Completed)
- [x] Monorepo structure setup
- [x] Go + Gin + GORM backend initialization
- [x] PostgreSQL connection pooling and verification
- [x] Clean `/api/health` check endpoint
- [x] React + Vite + TypeScript + Tailwind CSS frontend
- [x] Live Developer Health/Connection Status widget
- [x] Responsive layout (Desktop sidebar + Mobile collapsible navigation drawer)
- [x] Reusable UI components (Button, Input, Card, Badge, LoadingSpinner, EmptyState, PageHeader)
- [x] Polished Login page UI (show/hide password, responsive card)
- [x] Placeholder dashboards for Admin, Teacher, and Student
- [x] Security-ready architecture (JWT and bcrypt scaffolding)
- [x] Git repository initialization with clean `.gitignore`

### Phase 2 (Upcoming)
- User authentication (JWT token generation & validation)
- Password hashing with `bcrypt`
- Role-based route protection middleware
- Student and Teacher registration/CRUD
- Subject and Class batch allocation
- Dynamic QR code generator for Teachers
- Mobile camera QR scanner for Students
- Real-time attendance logging & percentage calculations
