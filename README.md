<div align="center">

<img src="./stitch_screens/screenshots/01_qr_attendance_logo_a1f71a2c.png" alt="QR Attendance System Logo" width="120" style="border-radius: 20px; margin-bottom: 16px;" />

# QR-Based Student Attendance Management System

**An enterprise-grade, server-authoritative academic ERP and real-time attendance management platform built with dynamic, cryptographically verifiable QR sessions.**

[![Go Version](https://img.shields.io/badge/Go-1.26+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![Gin Framework](https://img.shields.io/badge/Gin-v1.12.0-008ECF?style=for-the-badge&logo=gin&logoColor=white)](https://gin-gonic.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

<p align="center">
  <a href="#-project-overview">Overview</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-attendance-workflow">Workflow</a> •
  <a href="#-security-model">Security</a> •
  <a href="#-database-design">Database</a> •
  <a href="#-api-documentation">API</a> •
  <a href="#-local-development">Quickstart</a> •
  <a href="#-live-demo-walkthrough">Demo Script</a> •
  <a href="#-ui-gallery">UI Showcase</a>
</p>

</div>

---

## 📋 Table of Contents

- [🚀 Project Overview](#-project-overview)
  - [The Problem](#the-problem)
  - [The Solution](#the-solution)
  - [Why This Project?](#why-this-project)
- [✨ Key Features](#-key-features)
  - [Administrator Portal](#1-administrator-portal-admin)
  - [Faculty Teacher Portal](#2-faculty-teacher-portal-teacher)
  - [Student Portal](#3-student-portal-student)
  - [Universal & Security Capabilities](#4-universal--security-capabilities)
- [🏗️ System Architecture](#️-system-architecture)
  - [Technology Stack Matrix](#technology-stack-matrix)
  - [Layer Responsibilities](#layer-responsibilities)
- [🔄 Attendance Workflow & Lifecycle](#-attendance-workflow--lifecycle)
  - [Attendance Validation Sequence Flow](#attendance-validation-sequence-flow)
  - [Session State Transition Lifecycle](#session-state-transition-lifecycle)
- [🔐 Security Model & Integrity](#-security-model--integrity)
  - [Server-Authoritative Enforcement](#server-authoritative-enforcement)
  - [Defense-in-Depth Mechanisms](#defense-in-depth-mechanisms)
- [👥 Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [🗄️ Database Design](#️-database-design)
  - [Entity Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
  - [Schema & Tables Overview](#schema--tables-overview)
  - [Database Migrations Engine](#database-migrations-engine)
- [🔌 API Documentation](#-api-documentation)
  - [Authentication & Public Endpoints](#1-authentication--public-endpoints)
  - [Admin Management APIs](#2-admin-management-apis)
  - [Faculty Teacher APIs](#3-faculty-teacher-apis)
  - [Student Workspace APIs](#4-student-workspace-apis)
  - [Universal & Verification APIs](#5-universal--verification-apis)
- [📜 Verifiable Digital Attendance Proofs](#-verifiable-digital-attendance-proofs)
- [📊 Multi-Format Reporting & Analytics](#-multi-format-reporting--analytics)
- [🖼️ User Interface Gallery](#️-user-interface-gallery)
- [⚙️ Local Development & Quick Start](#️-local-development--quick-start)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone Repository](#step-1-clone-repository)
  - [Step 2: Database Setup](#step-2-database-setup)
  - [Step 3: Backend Configuration & Seed](#step-3-backend-configuration--seed)
  - [Step 4: Frontend Installation & Dev Server](#step-4-frontend-installation--dev-server)
  - [Environment Variables Reference](#environment-variables-reference)
- [🧪 Testing & Validation](#-testing--validation)
- [🔑 Demo & Seed Accounts](#-demo--seed-accounts)
- [🎬 Live Demo Walkthrough Script](#-live-demo-walkthrough-script)
- [⚠️ Error Handling & HTTP Status Codes](#️-error-handling--http-status-codes)
- [📱 Responsive & Mobile Design](#-responsive--mobile-design)
- [🚀 Production Cloud Deployment](#-production-cloud-deployment)
  - [Neon PostgreSQL + Render Go API + Vercel React SPA](#neon-postgresql--render-go-api--vercel-react-spa)
- [📂 Project Directory Structure](#-project-directory-structure)
- [🗺️ Product Roadmap](#️-product-roadmap)
- [⚠️ Known Limitations & Mitigations](#️-known-limitations--mitigations)
- [🤝 Contributing](#-contributing)
- [📄 License & Acknowledgements](#-license--acknowledgements)

---

## 🚀 Project Overview

### The Problem
Traditional higher education classroom attendance relies heavily on manual paper sign-in sheets or verbal roll calls. These legacy methods introduce four fundamental institutional challenges:
1. **Massive Instructional Time Loss**: Conducting roll calls across classes of 60–120 students consumes 10–15 minutes (up to 25%) of scheduled lecture time.
2. **Rampant Proxy Attendance**: Paper sheets and static QR codes allow students to forge signatures or circulate screenshots to off-campus peers.
3. **Delayed ERP Sync & Data Silos**: Manual transcription into spreadsheets or institutional ERP systems takes days, delaying attendance deficit alerts and student interventions.
4. **Zero Verification Trail**: When disputes arise regarding eligibility or exam admittance, institutions lack an auditable, timestamped proof of presence.

### The Solution
The **QR-Based Student Attendance Management System** is a full-stack, server-authoritative web application engineered to eliminate proxy attendance, automate institutional record-keeping, and deliver instant visibility for students, faculty, and academic administrators.

Faculty initiate live, time-bounded attendance sessions that project dynamic QR tokens. Students scan the projection using their mobile device’s native camera. The Go backend validates enrollment, timing, and token validity in milliseconds—instantly updating classroom rosters and calculating cumulative academic percentages.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Faculty Teacher │       │ Classroom Screen│       │ Enrolled Student│
│ Launches Live   │──────>│ Projects Secure │<──────│ Scans via Mobile│
│ QR Session      │       │ Dynamic QR Code │       │ Browser Camera  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                                                   │
         ▼                                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Go + Gin Backend Service                       │
│    • JWT Identity Validation (Zero Client-Side Identity Spoofing)   │
│    • Class Enrollment & Batch Verification                          │
│    • Server-Clock Expiration Check (NOW() < expires_at)            │
│    • Unique Attendance Constraint Check & Audit Logging             │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database (ACID Storage)                  │
│    • Attendance Records • Audit Logs • Verifiable Proof Tokens      │
└─────────────────────────────────────────────────────────────────────┘
```

### Why This Project?
- **Server-Authoritative Trust**: The client never tells the server *who* marked attendance; the backend extracts identity strictly from cryptographically signed HTTP-only/Bearer JWTs.
- **Projector-First UX**: High-contrast, scalable SVG QR rendering paired with real-time countdown clocks and live attendee streams.
- **Enterprise Auditability**: Immutable change logs for manual corrections, late entries, session re-openings, and digital PDF receipt verification.
- **Zero Heavy Installs**: Runs as a progressive, lightweight web application across iOS Safari, Android Chrome, and desktop browsers without native app store friction.

---

## ✨ Key Features

### 1. Administrator Portal (`/admin`)
- **Real-Time KPI Dashboard**: Campus-wide metrics tracking active student enrollments, faculty counts, course offerings, academic class batches, and teaching allocations.
- **Student Directory Management**: Full CRUD operations for student profiles, batch allocation, search filters, and one-click account activation/deactivation.
- **Faculty Directory Management**: Instructor directory tracking employee IDs, departmental affiliations, contact information, and account status controls.
- **Academic Curriculum Management**: Course subject catalog with unique course code enforcement (`code UNIQUE`) and semester level mappings.
- **Academic Class Batch Engine**: Class batch registry with composite uniqueness constraints on `(department, semester, section, academic_year)` and real-time student count aggregation.
- **Teaching Allocation Matrix**: Smart assignment interface linking instructors to specific subjects and class batches with conflict prevention.
- **Campus-Wide Attendance Audit**: Complete audit trail of all attendance sessions with date, subject, and class filtering, full student rosters, and session finalization controls.

### 2. Faculty Teacher Portal (`/teacher`)
- **Teaching Workspace**: Consolidated dashboard displaying all assigned subjects, lecture schedules, and associated student batches.
- **Live Attendance Session Launcher**: Modal configuration for lecture sessions with configurable durations (`1 Minute Demo`, `5 Minutes Standard`, `10 Minutes Extended`) and custom late-entry thresholds.
- **Projector Display Mode (`/teacher/attendance/:sessionId`)**:
  - High-contrast, scalable SVG QR code powered by `qrcode.react`.
  - Color-coded visual countdown timer (Green $\rightarrow$ Amber $\rightarrow$ Red as expiry nears).
  - Live check-in statistics counter (`Present: X / Y • Z%`) with real-time attendee stream.
  - Emergency **"End Attendance Session Now"** kill-switch.
- **Classroom Roster & Session Manager (`/teacher/attendance/:sessionId/records`)**: Full roster view showing `PRESENT` and `LATE` students with exact timestamps, alongside calculated `ABSENT` students.
- **Manual Attendance & Audit Corrections**: Manually mark or adjust student statuses with mandatory reason logging and immutable audit trails (`attendance_audit`).
- **Session Finalization & Reopen Guard**: Lock completed sessions from further edits (`FINALIZED`) with role-guarded reopening capabilities.
- **Multi-Format Export Engine**: One-click export of class and student attendance sheets into **CSV**, **Excel (`.xlsx`)**, and **Institutional PDF** formats.
- **Student Search & Drilldown**: Roll-number search tool to inspect student-specific subject histories and attendance rates.
- **Teaching Analytics Dashboard**: Class-wide attendance distribution graphs, low-attendance alerts (<75% threshold), and late-submission trends.

### 3. Student Portal (`/student`)
- **Student Academic Overview**: Cumulative attendance percentage KPI card with color-coded eligibility indicators and total lecture counts.
- **Subject-Wise Progress Cards**: Detailed course cards showing attended sessions, total lectures held, and percentage progress bars.
- **Mobile Camera Scanner (`/attendance/scan`)**:
  - High-speed camera scanner powered by `html5-qrcode` with rear/front camera selection.
  - Transparent permission handling with clear retry prompts.
  - Instant scan verification feedback with animated status badges.
  - Desktop fallback manual token entry for low-light or device-restricted scenarios.
- **Attendance Calendar Heatmap (`/student/attendance/calendar`)**: Interactive monthly calendar visualizing daily attendance status across all registered subjects.
- **Attendance History & Activity Feed (`/student/attendance/history`)**: Searchable timeline of verified check-ins with exact timestamps, session details, and status indicators.
- **Verifiable Digital Receipts (`/student/attendance/proof`)**: Downloadable institutional PDF certificates with embedded public verification QR codes.
- **Student Profile & Security**: Editable personal contact details and self-service password reset.

### 4. Universal & Security Capabilities
- **Public Certificate Verification Portal (`/verify/attendance/:publicId`)**: Unauthenticated portal allowing anyone (parents, employers, academic boards) to verify the authenticity of an attendance receipt.
- **Unified Activity Feed (`/activity`)**: Real-time system activity stream detailing session creations, student check-ins, and administrative modifications.
- **Theme Customization**: Sleek Dark Mode / Light Mode with instant toggle and local storage persistence.
- **Network Health Diagnostics**: Real-time frontend-to-backend ping monitoring and database status indicator (`ConnectionStatus`).

---

## 🏗️ System Architecture

The application is structured into decoupled frontend, backend, and data tiers communicating over a RESTful JSON API.

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                           CLIENT / USER TIER                           │
 │                                                                        │
 │   ┌──────────────────────┐  ┌─────────────────────┐  ┌─────────────┐  │
 │   │  Student Smartphone  │  │  Teacher Classroom  │  │ Admin Desk  │  │
 │   │    (Camera / PWA)    │  │ (Projector / Screen)│  │ (Dashboard) │  │
 │   └──────────┬───────────┘  └──────────┬──────────┘  └──────┬──────┘  │
 └──────────────┼─────────────────────────┼────────────────────┼──────────┘
                │                         │                    │
                └───────────────────┬─────┴────────────────────┘
                                    │ HTTPS / REST (JSON)
                                    ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                    FRONTEND APPLICATION (React + Vite)                 │
 │                                                                        │
 │   • React 18 SPA + TypeScript + React Router DOM v7                    │
 │   • Tailwind CSS Design System (Custom Academic Palette + Dark Mode)   │
 │   • QR Engine: qrcode.react (Generator) + html5-qrcode (Scanner)       │
 │   • State & Auth: Context API + ProtectedRoute Authorization Guards    │
 └──────────────────────────────────┬─────────────────────────────────────┘
                                    │ JSON API Requests (Bearer JWT)
                                    ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                       BACKEND SERVICE (Go + Gin)                       │
 │                                                                        │
 │   ┌────────────────────────────────────────────────────────────────┐   │
 │   │                     Routing & Middleware                       │   │
 │   │   • CORS Middleware   • Gin Recovery/Logger   • Route Groups   │   │
 │   │   • JWT Auth Guard    • Role Authorization (Admin/Teacher/Std) │   │
 │   └────────────────────────────────┬───────────────────────────────┘   │
 │                                    ▼                                   │
 │   ┌────────────────────────────────────────────────────────────────┐   │
 │   │                 Business Logic & Service Layer                 │   │
 │   │   • AuthService        • AttendanceService   • AcademicService │   │
 │   │   • ExportService      • ProofService (PDF)  • AnalyticsService│   │
 │   └────────────────────────────────┬───────────────────────────────┘   │
 │                                    ▼                                   │
 │   ┌────────────────────────────────────────────────────────────────┐   │
 │   │                 Data Access Layer (GORM ORM)                   │   │
 │   │   • PostgreSQL Driver  • ACID Transactions   • Schema Mapper   │   │
 │   └────────────────────────────────┬───────────────────────────────┘   │
 └────────────────────────────────────┼───────────────────────────────────┘
                                      │ SQL Queries / Pooling
                                      ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      DATABASE TIER (PostgreSQL 14+)                    │
 │                                                                        │
 │   • Tables: users, students, teachers, subjects, classes,              │
 │             teacher_subject_classes, attendance_sessions, attendance,  │
 │             attendance_audit, attendance_session_audit, proofs         │
 │   • Integrity: Foreign Keys, UUIDv4 PKs, Unique Composite Indexes      │
 │   • Migration Engine: Tracked SQL version runner (001 -> 011)          │
 └────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack Matrix

| Layer | Technology | Version / Package | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Core** | Go (Golang) | `1.26+` | High-throughput, concurrent compiled backend |
| **Web Framework** | Gin Web Framework | `v1.12.0` | Low-latency HTTP router and middleware pipeline |
| **Database ORM** | GORM | `v1.31.2` | Type-safe query building, associations, and transactions |
| **Database Driver**| pgx / postgres | `v1.6.2` | High-performance PostgreSQL connection pooling |
| **Database Engine**| PostgreSQL | `14+` | ACID relational persistence with UUID primary keys |
| **Authentication** | JWT | `jwt/v5 (v5.3.1)` | Stateless, signed bearer tokens with role claims |
| **Password Hash**  | Bcrypt | `golang.org/x/crypto` | Adaptive cryptographic password hashing (cost 10) |
| **PDF Generation** | GoFPDF | `v1.16.2` | Programmatic vector PDF generation for receipts & reports |
| **Excel Export**   | Excelize | `v2.11.0` | Structured Microsoft Excel (`.xlsx`) generation |
| **Frontend Core**  | React + TypeScript | `React 18.3 / TS 5.7` | Reactive component architecture with strict types |
| **Build Engine**   | Vite | `v6.2.0` | Ultra-fast ESM bundling and development server |
| **Routing**        | React Router | `v7.2.0` | Client-side routing with role-guarded routes |
| **Styling**        | Tailwind CSS | `v3.4.17` | Utility-first responsive styling and dark mode |
| **Icons**          | Lucide React | `v1.16.0` | Clean, accessible vector UI icons |
| **QR Generation**  | qrcode.react | `v4.2.0` | Projector-ready SVG QR generation in-browser |
| **QR Scanning**    | html5-qrcode | `v2.3.8` | Cross-platform browser camera stream scanner |

### Layer Responsibilities
- **Frontend Layer**: Renders role-aware dashboards, handles camera permissions, decodes QR payloads, visualizes countdown timers, and executes client-side filtering.
- **Middleware Layer**: Enforces CORS policies, validates incoming JWT tokens, parses user claims, and blocks unauthorized cross-role API calls.
- **Service Layer**: Orchestrates business rules—evaluating session expiration, calculating attendance percentage statistics, issuing crypto tokens, generating Excel/PDF files, and logging audit records.
- **Data Access Layer**: Executes database queries using transactions to guarantee atomicity during account creation and attendance recording.

---

## 🔄 Attendance Workflow & Lifecycle

### Attendance Validation Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Teacher
    participant Projector as Classroom Screen
    actor Student
    participant Mobile as Student Phone
    participant Backend as Go Gin API
    participant DB as PostgreSQL

    Teacher->>Backend: POST /api/teacher/attendance/sessions (subject_id, class_id, duration)
    Note over Backend: Generate crypto random token<br/>Set expires_at = NOW() + duration<br/>Set late_after = NOW() + late_threshold
    Backend->>DB: INSERT INTO attendance_sessions
    DB-->>Backend: Session Created (ID, Token)
    Backend-->>Teacher: Return session payload
    Teacher->>Projector: Render High-Contrast Dynamic QR Code + Countdown Timer

    Student->>Mobile: Open /attendance/scan & scan projected QR
    Mobile->>Backend: POST /api/attendance/mark { session_token } [Bearer Student JWT]

    Note over Backend: 1. Extract student_id from verified JWT
    Note over Backend: 2. Query session by session_token

    alt Session Not Found or Inactive
        Backend-->>Mobile: 404 / 400 Bad Request
    else Server Clock NOW() >= expires_at
        Backend-->>Mobile: 410 Gone (Session Expired)
    else Student Class != Session Class
        Backend-->>Mobile: 403 Forbidden (Not enrolled in this class)
    else Duplicate Entry Exists in DB
        Backend-->>Mobile: 409 Conflict (Attendance already marked)
    else Valid Check-in
        Note over Backend: Determine Status:<br/>NOW() > late_after ? 'LATE' : 'PRESENT'
        Backend->>DB: INSERT INTO attendance (session_id, student_id, status, marked_at)
        Backend->>DB: INSERT INTO attendance_proofs (attendance_id, public_id)
        DB-->>Backend: Record Persisted
        Backend-->>Mobile: 200 OK { status, proof_public_id, marked_at }
        Mobile-->>Student: Display Verified Attendance Badge & Receipt Link
    end

    Teacher->>Backend: Polling /api/teacher/attendance/sessions/:id/live
    Backend->>DB: Count PRESENT, LATE, ABSENT
    DB-->>Backend: Aggregate metrics & attendee stream
    Backend-->>Teacher: Live telemetry update (Present: 18/20 • 90%)
```

### Session State Transition Lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Teacher selects Subject & Class
    DRAFT --> ACTIVE: Teacher clicks "Start Attendance Session"
    
    state ACTIVE {
        [*] --> PRESENT_WINDOW: 0 to Late Threshold
        PRESENT_WINDOW --> LATE_WINDOW: Late Threshold to Expiry
        LATE_WINDOW --> TIMED_OUT: Countdown reaches 00:00
    }

    ACTIVE --> CLOSED: Countdown Expires (Server NOW() >= expires_at)
    ACTIVE --> TERMINATED: Teacher manually ends session (/end)

    CLOSED --> FINALIZED: Teacher / Admin finalizes session (/finalize)
    TERMINATED --> FINALIZED: Teacher / Admin finalizes session (/finalize)
    
    FINALIZED --> REOPENED: Admin / Teacher reopens with mandatory reason (/reopen)
    REOPENED --> FINALIZED: Re-finalized after audit corrections
```

---

## 🔐 Security Model & Integrity

The system adheres to strict defense-in-depth principles to prevent attendance tampering, proxy marking, and privilege escalation.

```
       [ Client Request ]
               │
               ▼
   [ 1. CORS Whitelist Guard ]          ──> Blocks untrusted origins
               │
               ▼
   [ 2. JWT Cryptographic Verify ]      ──> Validates HMAC-SHA256 signature & expiry
               │
               ▼
   [ 3. Server-Side Identity Lock ]     ──> Extracts student_id strictly from JWT claims
               │
               ▼
   [ 4. RBAC Role Middleware ]          ──> Blocks cross-role access (Admin vs Teacher vs Student)
               │
               ▼
   [ 5. Temporal Clock Check ]          ──> Authoritative server timestamp (NOW() < expires_at)
               │
               ▼
   [ 6. Class Enrollment Validation ]   ──> Verifies student.class_id == session.class_id
               │
               ▼
   [ 7. DB Unique Constraint Lock ]     ──> UNIQUE(session_id, student_id) prevents duplicate scans
               │
               ▼
   [ 8. Immutable Audit Trail Log ]     ──> Records all manual adjustments with reasons
```

### Server-Authoritative Enforcement

| Security Control | Implementation Mechanism | Threat Mitigated |
| :--- | :--- | :--- |
| **Zero Identity Spoofing** | Student ID is extracted strictly from the verified JWT claims (`c.GetString("user_id")`) on the server. Request payloads never accept a `student_id`. | Malicious clients attempting to mark attendance on behalf of another student's Roll Number or ID. |
| **Server-Authoritative Clock** | Expiration is evaluated against the PostgreSQL / Go server clock (`time.Now().UTC() > session.ExpiresAt`). Client device clocks are completely ignored. | Students modifying device system time to scan expired QR codes. |
| **Cryptographic Dynamic Tokens** | Session tokens are generated using cryptographically secure random bytes (`crypto/rand`), producing high-entropy URLs. | Attackers guessing or enumerating active session tokens. |
| **Class Boundary Isolation** | The backend verifies that the student's assigned `class_id` matches the session's target `class_id`. | Students from different departments or sections marking attendance for lectures they do not belong to. |
| **Database Uniqueness Guard** | A composite database constraint `UNIQUE(session_id, student_id)` enforces single-entry integrity at the storage engine level. | Concurrent multi-tab scans or rapid replay attacks. |
| **Immutable Audit Logging** | Manual attendance adjustments and status overrides require mandatory reason strings and are recorded in `attendance_audit`. | Unauthorized faculty grade or attendance alterations without institutional accountability. |
| **Tamper-Resistant Proofs** | Every attendance check-in generates an institutional `AttendanceProof` with a unique public identifier (`PRF-...`) for third-party verification. | Forged attendance certificates or falsified physical eligibility cards. |

---

## 👥 Role-Based Access Control (RBAC)

The application enforces strict separation of concerns across three distinct user roles:

| Capability / Resource | Administrator (`ADMIN`) | Faculty Teacher (`TEACHER`) | Student (`STUDENT`) | Public / Guest |
| :--- | :---: | :---: | :---: | :---: |
| **View Campus Dashboard & KPIs** | ✅ | ❌ | ❌ | ❌ |
| **Manage Students & Teachers Directory** | ✅ | ❌ | ❌ | ❌ |
| **Manage Subjects & Class Batches** | ✅ | ❌ | ❌ | ❌ |
| **Manage Teaching Assignments** | ✅ | ❌ | ❌ | ❌ |
| **Audit All Campus Sessions** | ✅ | ❌ | ❌ | ❌ |
| **Launch Live Attendance Sessions** | ❌ | ✅ | ❌ | ❌ |
| **Display Dynamic QR & Projector Timer**| ❌ | ✅ | ❌ | ❌ |
| **Manage Session Roster & Records** | ✅ (View/Finalize) | ✅ (Full Control) | ❌ | ❌ |
| **Manual Attendance & Audit Corrections**| ❌ | ✅ | ❌ | ❌ |
| **Finalize & Reopen Sessions** | ✅ | ✅ (Own sessions) | ❌ | ❌ |
| **Export Reports (CSV, Excel, PDF)** | ❌ | ✅ | ❌ | ❌ |
| **Search Student Attendance Records** | ❌ | ✅ | ❌ | ❌ |
| **Scan Live QR Code via Camera** | ❌ | ❌ | ✅ | ❌ |
| **View Personal Attendance Summary & Progress**| ❌ | ❌ | ✅ | ❌ |
| **View Monthly Attendance Calendar Heatmap**| ❌ | ❌ | ✅ | ❌ |
| **Download Verified Attendance Proof (PDF)**| ✅ | ✅ | ✅ | ❌ |
| **Public Proof Certificate Verification** | ✅ | ✅ | ✅ | ✅ |
| **Update Personal Profile & Password** | ✅ | ✅ | ✅ | ❌ |

---

## 🗄️ Database Design

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o| students : "has academic profile"
    users ||--o| teachers : "has faculty profile"
    users ||--o{ attendance_audit : "acts as actor"
    users ||--o{ attendance_session_audit : "acts as actor"

    classes ||--o{ students : "enrolled in"
    classes ||--o{ teacher_subject_classes : "assigned to"
    classes ||--o{ attendance_sessions : "hosts"

    subjects ||--o{ teacher_subject_classes : "taught in"
    subjects ||--o{ attendance_sessions : "conducted for"

    teachers ||--o{ teacher_subject_classes : "allocated to"
    teachers ||--o{ attendance_sessions : "initiates"

    attendance_sessions ||--o{ attendance : "records"
    attendance_sessions ||--o{ attendance_session_audit : "audited by"

    students ||--o{ attendance : "submits"
    students ||--o{ attendance_audit : "subject of audit"

    attendance ||--o| attendance_proofs : "generates verifiable receipt"
    attendance ||--o{ attendance_audit : "modified by"

    users {
        uuid id PK
        varchar name
        varchar email UK
        text password_hash
        varchar role
        boolean is_active
        timestamp created_at
    }

    students {
        uuid id PK
        uuid user_id FK,UK
        varchar roll_number UK
        varchar department
        integer semester
        varchar section
        uuid class_id FK
        varchar phone
        varchar address
    }

    teachers {
        uuid id PK
        uuid user_id FK,UK
        varchar employee_id UK
        varchar department
        varchar phone
        varchar address
    }

    subjects {
        uuid id PK
        varchar name
        varchar code UK
        varchar department
        integer semester
    }

    classes {
        uuid id PK
        varchar name
        varchar department
        integer semester
        varchar section
        varchar academic_year
    }

    teacher_subject_classes {
        uuid id PK
        uuid teacher_id FK
        uuid subject_id FK
        uuid class_id FK
    }

    attendance_sessions {
        uuid id PK
        uuid teacher_id FK
        uuid subject_id FK
        uuid class_id FK
        text session_token UK
        timestamp started_at
        timestamp expires_at
        integer late_threshold_minutes
        varchar finalization_status
        timestamp finalized_at
        uuid finalized_by FK
        boolean is_active
    }

    attendance {
        uuid id PK
        uuid session_id FK
        uuid student_id FK
        varchar status
        timestamp marked_at
    }

    attendance_audit {
        uuid id PK
        uuid attendance_id FK
        uuid session_id FK
        uuid student_id FK
        uuid actor_user_id FK
        varchar actor_role
        varchar action
        varchar previous_status
        varchar new_status
        text reason
        timestamp created_at
    }

    attendance_proofs {
        uuid id PK
        uuid attendance_id FK,UK
        varchar public_id UK
        uuid college_id
        timestamp created_at
    }
```

### Schema & Tables Overview

| Table Name | Primary Key | Description | Key Constraints & Indexes |
| :--- | :--- | :--- | :--- |
| `users` | `id` (UUID) | System authentication accounts | `email UNIQUE`, `role IN ('ADMIN','TEACHER','STUDENT')` |
| `students` | `id` (UUID) | Enrolled student academic profiles | `user_id UNIQUE`, `roll_number UNIQUE`, `class_id FK` |
| `teachers` | `id` (UUID) | Faculty instructor profiles | `user_id UNIQUE`, `employee_id UNIQUE` |
| `subjects` | `id` (UUID) | Course curriculum catalog | `code UNIQUE` |
| `classes` | `id` (UUID) | Academic class batches | `UNIQUE(department, semester, section, academic_year)` |
| `teacher_subject_classes`| `id` (UUID) | Teaching allocation matrix | `UNIQUE(teacher_id, subject_id, class_id)` |
| `attendance_sessions` | `id` (UUID) | Live QR lecture sessions | `session_token UNIQUE`, `teacher_id FK`, `subject_id FK`, `class_id FK` |
| `attendance` | `id` (UUID) | Verified student attendance records | `UNIQUE(session_id, student_id)`, `status IN ('PRESENT','LATE')` |
| `attendance_audit` | `id` (UUID) | Immutable audit log of manual status adjustments | `session_id FK`, `student_id FK`, `actor_user_id FK` |
| `attendance_session_audit` | `id` (UUID) | Immutable audit log of session finalization/reopen events | `session_id FK`, `actor_user_id FK` |
| `attendance_proofs` | `id` (UUID) | Cryptographically referenced public proof certificates | `attendance_id UNIQUE`, `public_id UNIQUE` |
| `schema_migrations` | `version` (VARCHAR) | Internal migration runner version history | `version PRIMARY KEY` |

### Database Migrations Engine
The Go backend includes a built-in, transactional migration runner (`internal/database/migration.go`). SQL migrations in `backend/migrations/` execute automatically upon startup:
- `001_create_users.sql`: Authentication accounts table.
- `002_create_students_and_teachers.sql`: Student & Teacher entity profiles.
- `003_create_academic_tables.sql`: Course subjects and class batches.
- `004_create_assignments.sql`: Faculty subject/class allocation matrix.
- `005_create_attendance_tables.sql`: Live sessions and attendance ledger.
- `006_create_attendance_audit_table.sql`: Immutable change audit logs.
- `007_add_late_attendance_configuration.sql`: Configurable late entry thresholds.
- `008_add_attendance_session_finalization.sql`: Session locking and reopening audits.
- `009_create_attendance_proofs.sql`: Digital proof identities and public verification tokens.
- `010_add_student_profile_fields.sql`: Student contact and address fields.
- `011_add_teacher_profile_fields.sql`: Faculty contact and address fields.

---

## 🔌 API Documentation

### 1. Authentication & Public Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Backend and PostgreSQL database health check | Public |
| `GET` | `/api/info` | API version, service status & runtime info | Public |
| `POST`| `/api/auth/login` | Login with email & password, returns JWT token & user profile | Public |
| `GET` | `/api/auth/me` | Validates JWT token and returns authenticated session info | Bearer JWT |

### 2. Admin Management APIs

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/admin/dashboard` | Aggregated campus counts (students, faculty, subjects, batches) | `ADMIN` |
| `GET` | `/api/admin/students` | List all students with linked user accounts & class info | `ADMIN` |
| `POST`| `/api/admin/students` | Create user account & student academic profile atomically | `ADMIN` |
| `PUT` | `/api/admin/students/:id` | Update student profile details | `ADMIN` |
| `PATCH`| `/api/admin/students/:id/status`| Toggle student active/inactive account status | `ADMIN` |
| `PATCH`| `/api/admin/students/:id/class` | Assign student to an academic class batch (or unassign) | `ADMIN` |
| `GET` | `/api/admin/teachers` | List all teachers with employee IDs & departments | `ADMIN` |
| `POST`| `/api/admin/teachers` | Create user account & teacher profile atomically | `ADMIN` |
| `PUT` | `/api/admin/teachers/:id` | Update teacher profile details | `ADMIN` |
| `PATCH`| `/api/admin/teachers/:id/status`| Toggle teacher active/inactive status | `ADMIN` |
| `GET` | `/api/admin/subjects` | List all curriculum course subjects | `ADMIN` |
| `POST`| `/api/admin/subjects` | Register new course subject with unique code check | `ADMIN` |
| `PUT` | `/api/admin/subjects/:id` | Update subject details | `ADMIN` |
| `DELETE`| `/api/admin/subjects/:id` | Delete subject (guarded against active allocations) | `ADMIN` |
| `GET` | `/api/admin/classes` | List academic class batches with dynamic student counts | `ADMIN` |
| `POST`| `/api/admin/classes` | Create class batch with composite uniqueness validation | `ADMIN` |
| `PUT` | `/api/admin/classes/:id` | Update class batch details | `ADMIN` |
| `DELETE`| `/api/admin/classes/:id` | Delete class batch (guarded against active allocations) | `ADMIN` |
| `GET` | `/api/admin/assignments` | List all teaching allocations | `ADMIN` |
| `POST`| `/api/admin/assignments` | Allocate instructor to subject and class batch | `ADMIN` |
| `DELETE`| `/api/admin/assignments/:id`| Remove teaching allocation | `ADMIN` |
| `GET` | `/api/admin/attendance/sessions` | Campus-wide attendance audit with subject/class filters | `ADMIN` |
| `GET` | `/api/admin/attendance/sessions/:id/records` | Complete student roster for any attendance session | `ADMIN` |
| `POST`| `/api/admin/attendance/sessions/:id/finalize` | Finalize session and lock records | `ADMIN` |
| `POST`| `/api/admin/attendance/sessions/:id/reopen` | Reopen finalized session with mandatory reason | `ADMIN` |
| `GET` | `/api/admin/attendance/sessions/:id/audit` | Lifecycle audit trail for session finalization/reopening | `ADMIN` |

### 3. Faculty Teacher APIs

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/teacher/profile` | Teacher profile, assigned classes & teaching metrics | `TEACHER` |
| `PATCH`| `/api/teacher/profile` | Update teacher phone and address | `TEACHER` |
| `PATCH`| `/api/teacher/account/password`| Change teacher account password | `TEACHER` |
| `GET` | `/api/teacher/assignments` | List subjects & class batches assigned to logged-in teacher | `TEACHER` |
| `POST`| `/api/teacher/attendance/sessions` | Launch live QR session (duration: 1, 5, 10 min) | `TEACHER` |
| `GET` | `/api/teacher/attendance/sessions` | List all attendance sessions created by this teacher | `TEACHER` |
| `GET` | `/api/teacher/attendance/sessions/:id` | Session details, countdown timer & attendee counts | `TEACHER` |
| `GET` | `/api/teacher/attendance/sessions/:id/live` | Real-time polling telemetry for active QR screen | `TEACHER` |
| `POST`| `/api/teacher/attendance/sessions/:id/end` | Manually terminate active session | `TEACHER` |
| `GET` | `/api/teacher/attendance/sessions/:id/records` | Session roster with PRESENT, LATE, and calculated ABSENT | `TEACHER` |
| `PATCH`| `/api/teacher/attendance/sessions/:id/late-settings` | Configure late attendance threshold minutes | `TEACHER` |
| `POST`| `/api/teacher/attendance/sessions/:id/finalize` | Finalize and lock attendance session | `TEACHER` |
| `GET` | `/api/teacher/attendance/sessions/:id/audit` | Session lifecycle audit history | `TEACHER` |
| `POST`| `/api/teacher/attendance/manual` | Manually mark attendance with mandatory reason & audit | `TEACHER` |
| `PATCH`| `/api/teacher/attendance/:attendance_id/correct`| Correct existing attendance status with mandatory reason | `TEACHER` |
| `GET` | `/api/teacher/attendance/:attendance_id/audit`| Audit log history for a specific attendance record | `TEACHER` |
| `GET` | `/api/teacher/students/search` | Search students by roll number or name across assigned classes | `TEACHER` |
| `GET` | `/api/teacher/students/:student_id/attendance`| Detailed attendance drilldown for a specific student | `TEACHER` |
| `GET` | `/api/teacher/attendance/analytics` | Course attendance averages, distributions & risk alerts | `TEACHER` |
| `GET` | `/api/teacher/attendance/export/csv` | Export session attendance report in CSV format | `TEACHER` |
| `GET` | `/api/teacher/attendance/export/excel` | Export session attendance report in Excel (`.xlsx`) format | `TEACHER` |
| `GET` | `/api/teacher/attendance/export/pdf` | Export session attendance report in Institutional PDF format | `TEACHER` |

### 4. Student Workspace APIs

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/student/profile` | Student academic profile with assigned class batch info | `STUDENT` |
| `PATCH`| `/api/student/profile` | Update student phone and address | `STUDENT` |
| `PATCH`| `/api/student/account/password`| Change student account password | `STUDENT` |
| `GET` | `/api/student/subjects` | Curriculum subjects for student's enrolled class | `STUDENT` |
| `POST`| `/api/attendance/mark` | Submit scanned QR session token to mark attendance | `STUDENT` |
| `GET` | `/api/student/attendance/summary` | Overall attendance percentage & subject-wise breakdown | `STUDENT` |
| `GET` | `/api/student/attendance/recent` | Recent verified attendance scan log feed | `STUDENT` |
| `GET` | `/api/student/attendance/calendar`| Monthly calendar attendance feed by date | `STUDENT` |
| `GET` | `/api/student/attendance/history` | Comprehensive historical attendance ledger | `STUDENT` |
| `GET` | `/api/student/attendance/analytics`| Detailed student attendance analytics & streak trends | `STUDENT` |
| `GET` | `/api/student/attendance/:attendance_id/proof` | JSON payload of digital attendance receipt | `STUDENT` |
| `GET` | `/api/student/attendance/:attendance_id/proof/pdf` | Download official institutional PDF attendance receipt | `STUDENT` |

### 5. Universal & Verification APIs

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/activity/recent` | Unified system activity log (logins, scans, sessions) | Bearer JWT |
| `GET` | `/api/attendance/proof/verify/:public_id` | Public verification of digital attendance receipt | Public |

<details>
<summary><b>🔍 Sample Request & Response Payloads (Click to Expand)</b></summary>

#### 1. Mark Attendance Request
```http
POST /api/attendance/mark HTTP/1.1
Host: localhost:8080
Authorization: Bearer <STUDENT_JWT_TOKEN>
Content-Type: application/json

{
  "session_token": "8f3b2a1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
}
```

#### 2. Mark Attendance Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "attendance_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "proof_id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "proof_public_id": "PRF-20260818-CS001-9B1D",
    "session_id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
    "marked_at": "2026-08-18T10:15:32Z",
    "subject_name": "Data Structures",
    "subject_code": "CS201",
    "class_name": "SY BSc Computer Science",
    "status": "PRESENT",
    "late_threshold_minutes": 10
  },
  "message": "Attendance marked successfully"
}
```

#### 3. Public Proof Verification Response (`200 OK`)
```json
{
  "valid": true,
  "verification_status": "VALID",
  "public_id": "PRF-20260818-CS001-9B1D",
  "student_name": "Rahul Sharma",
  "roll_number": "CS001",
  "department": "Computer Science",
  "class_name": "SY BSc Computer Science",
  "subject_name": "Data Structures",
  "subject_code": "CS201",
  "session_date": "18 Aug 2026",
  "attendance_marked_at": "2026-08-18T10:15:32Z",
  "attendance_status": "PRESENT",
  "status_label": "Present (On-Time)",
  "college_name": "College of Computer Science & Engineering",
  "verified_at": "2026-08-18T11:30:00Z",
  "message": "Attendance record is authentic and verified."
}
```

</details>

---

## 📜 Verifiable Digital Attendance Proofs

To provide institutional credibility and eliminate paper dispute claims, the platform features a **Cryptographic Digital Attendance Proof Engine**:

1. **Unique Public Identifier**: Every verified check-in automatically creates a public receipt ID (`PRF-YYYYMMDD-ROLL-XXXX`).
2. **Institutional PDF Receipt**: Students and faculty can generate and download a vector PDF certificate (`jung-kurt/gofpdf`) formatted with college headers, student details, course metadata, exact timestamp, and an embedded verification QR code (`skip2/go-qrcode`).
3. **Public Verification Portal**: Scanning the QR code on the PDF certificate redirects to `/verify/attendance/:publicId`, allowing third parties to confirm the record's authenticity directly from the database without requiring login credentials.

---

## 📊 Multi-Format Reporting & Analytics

The backend provides a high-performance export pipeline for academic compliance, departmental reviews, and accreditation audits:

- **Excel Export (`.xlsx`)**: Generated via `xuri/excelize/v2`, featuring formatted summary headers, full student rosters, percentage metrics, and color-coded status styling.
- **CSV Export**: Lightweight, RFC-4180-compliant comma-separated format designed for immediate ingestion into university-wide ERP databases.
- **Institutional PDF Reports**: Clean, printable PDF rosters complete with presentation tables, sign-off blocks, and summary statistics.

---

## 🖼️ User Interface Gallery

<div align="center">

### Authentication & Landing Portals
| Public Landing Page | Secure Role-Based Login |
| :---: | :---: |
| <img src="./stitch_screens/screenshots/03_qr_attendance_-_landing_page_ff0e8b22.png" alt="Landing Page" width="440" /> | <img src="./stitch_screens/screenshots/02_login_-_qr_attendance_e139e7af.png" alt="Login Portal" width="440" /> |

### Teacher Classroom Experience
| Teacher Dashboard & Schedule | Projector Live QR Attendance Session |
| :---: | :---: |
| <img src="./stitch_screens/screenshots/05_teacher_workspace_-_qr_attendance_212fe018.png" alt="Teacher Workspace" width="440" /> | <img src="./stitch_screens/screenshots/06_active_qr_session_-_teacher_workspace_812c3d44.png" alt="Active QR Session" width="440" /> |

### Student Workspace & Mobile Scanner
| Student Dashboard & Progress | Mobile Camera QR Scanner |
| :---: | :---: |
| <img src="./stitch_screens/screenshots/15_student_dashboard_-_qr_attendance_0fb105d8.png" alt="Student Dashboard" width="440" /> | <img src="./stitch_screens/screenshots/16_scan_attendance_qr_-_student_workspace_31e7d0f3.png" alt="Student Scanner" width="440" /> |

### Analytics & Verifiable Proofs
| Student Attendance Analytics | Verifiable Attendance Proof Certificate |
| :---: | :---: |
| <img src="./stitch_screens/screenshots/20_attendance_analytics_-_student_workspace__desktop__8fce3931.png" alt="Student Analytics" width="440" /> | <img src="./stitch_screens/screenshots/23_attendance_proof_document_-_desktop_7abe55b4.png" alt="Attendance Proof" width="440" /> |

### Administration & Audit
| Administrator KPI Dashboard | Teacher Attendance Analytics |
| :---: | :---: |
| <img src="./stitch_screens/screenshots/04_admin_dashboard_-_qr_attendance_2e7a4e15.png" alt="Admin Dashboard" width="440" /> | <img src="./stitch_screens/screenshots/07_teacher_analytics_dashboard_-_desktop_b5e9e068.png" alt="Teacher Analytics" width="440" /> |

</div>

---

## ⚙️ Local Development & Quick Start

Follow these steps to run the complete stack locally on Windows, macOS, or Linux.

### Prerequisites
- **Go**: Version `1.22+` (Go `1.26` recommended) $\rightarrow$ [Install Go](https://go.dev/dl/)
- **Node.js**: Version `18.x` or `20.x` & `npm` $\rightarrow$ [Install Node.js](https://nodejs.org/)
- **PostgreSQL**: Version `14+` running locally or accessible via Cloud (Neon / Supabase) $\rightarrow$ [Install PostgreSQL](https://www.postgresql.org/download/)

---

### Step 1: Clone Repository
```bash
git clone https://github.com/itShubhamPrajapati/student-attendance-erp.git
cd student-attendance-erp
```

---

### Step 2: Database Setup
Create a PostgreSQL database named `qr_attendance`:
```sql
-- Connect to your PostgreSQL instance (psql or pgAdmin)
CREATE DATABASE qr_attendance;
```

---

### Step 3: Backend Configuration & Seed
```bash
# Navigate to the backend directory
cd backend

# Create your local environment configuration file
cp .env.example .env

# Run the idempotent Demo Dataset Seed tool
# This automatically executes all 11 SQL migrations and creates demo accounts
go run ./cmd/seed

# Start the Go Gin backend server (Runs on port 8080)
go run ./cmd/server
```

> [!TIP]
> The backend server will start on `http://localhost:8080`. You can test health at `http://localhost:8080/api/health`.

---

### Step 4: Frontend Installation & Dev Server
Open a new terminal window:
```bash
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server (Runs on port 5173)
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**.

---

### Environment Variables Reference

#### Backend (`backend/.env`)
```env
PORT=8080
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173

# PostgreSQL Connection (Local or Cloud DATABASE_URL)
DATABASE_URL=
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=qr_attendance
DATABASE_SSLMODE=disable

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRATION_HOURS=24

# Initial Admin Credentials (used during seed)
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeThisPassword123
```

#### Frontend (`frontend/.env`)
```env
# Backend API Base URL
VITE_BACKEND_URL=http://localhost:8080

# Public App Base URL (Used for QR token redirect generation)
VITE_APP_URL=http://localhost:5173
```

---

## 🧪 Testing & Validation

The backend includes a comprehensive suite of automated unit and integration tests covering GORM schema mapping, business logic, service boundaries, route registration, and cryptographic proofs.

Run backend tests from the `backend/` directory:
```bash
cd backend
go test -v ./...
```

### Key Test Suites Implemented:
- `internal/services/attendance_service_test.go`: GORM table naming verification, session duration validation, late threshold calculations, and duplicate prevention logic.
- `internal/services/attendance_export_service_test.go`: RFC CSV generation, Excelize workbook building, and column structure assertions.
- `internal/services/attendance_proof_service_test.go`: Verifiable proof ID format tests and public verification handler checks.
- `internal/services/student_profile_service_test.go`: Profile serialization and password hashing tests.
- `internal/routes/routes_test.go`: Router registration, role authorization guards, and public endpoint checks.

---

## 🔑 Demo & Seed Accounts

The built-in database seed tool (`backend/cmd/seed`) populates the system with realistic academic data:

| Role | Name | Email Address | Password | Direct Portal |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | System Administrator | `admin@example.com` | `ChangeThisPassword123` | [`/admin`](http://localhost:5173/admin) |
| **Faculty Teacher** | Prof. Vikram Sharma | `teacher@example.com` | `teacher123` | [`/teacher`](http://localhost:5173/teacher) |
| **Faculty Teacher 2** | Prof. Anjali Patel | `prof.patel@example.com` | `teacher123` | [`/teacher`](http://localhost:5173/teacher) |
| **Student (Roll: CS001)** | Rahul Sharma | `student@example.com` | `student123` | [`/student`](http://localhost:5173/student) |
| **Student 2 (Roll: CS002)**| Priya Patel | `priya.patel@example.com` | `student123` | [`/student`](http://localhost:5173/student) |

> [!NOTE]
> Demo accounts are automatically enrolled in **SY BSc Computer Science (Sem 3, Sec A)** for course **Data Structures (CS201)**.

---

## 🎬 Live Demo Walkthrough Script

Use this 5–7 minute script for faculty presentations, internal hackathons, or project evaluations:

1. **Step 1 — Admin Overview (`http://localhost:5173/login`)**:
   - Log in as **Administrator** (`admin@example.com` / `ChangeThisPassword123`).
   - Highlight the **Admin Dashboard** showing live KPI counters (10 Students, 2 Teachers, 4 Subjects, 2 Classes).
   - Navigate to **Teaching Assignments** (`/admin/assignments`) to demonstrate that `Prof. Vikram Sharma` is assigned to teach `Data Structures (CS201)` to `SY BSc Computer Science`.

2. **Step 2 — Teacher Launches Dynamic QR Session**:
   - Log out and log in as **Teacher** (`teacher@example.com` / `teacher123`).
   - On the Teacher Dashboard, find **Data Structures (CS201)** and click **Start Attendance**.
   - Select **1 Minute (Quick Demo)** duration and click **Generate Live QR Code**.
   - Present the high-contrast QR code, live countdown clock (`00:59`), and live attendance telemetry (`Present: 0 / 10 • 0%`).

3. **Step 3 — Student Scans QR on Mobile / Tab**:
   - In a second incognito window or mobile device, log in as **Student** (`student@example.com` / `student123`).
   - Open **Scan Attendance QR** (`/attendance/scan`).
   - Scan the projected QR code using the camera (or paste the session token).
   - The student instantly receives a verified confirmation badge: `✓ Attendance Marked Successfully` with an instant link to their digital receipt.

4. **Step 4 — Verify Live Classroom Sync & Analytics**:
   - Switch back to the Teacher's screen: the counter immediately updates to `Present: 1 / 10 (10%)`, and `Rahul Sharma` appears in the real-time attendee stream.
   - Switch to the Student Dashboard: demonstrate that their **Overall Attendance %** and **Data Structures** course progress have dynamically recalculated.

5. **Step 5 — Demonstrate Security & Failure Guards**:
   - **Duplicate Scan Guard**: Attempt to scan the same QR code again as Rahul. The server immediately returns `409 Conflict`: *"Attendance has already been marked for this session"*.
   - **Expiration Guard**: Allow the countdown timer to elapse to `00:00`. Attempt to scan with a second student account (`priya.patel@example.com`). The server rejects it with `410 Gone`: *"This attendance session has expired"*.
   - **Manual Attendance & Audit Trail**: On the Teacher portal, click **View Attendance Report** $\rightarrow$ manually mark Priya Patel with reason `"Network Latency during Lecture"`. Show the immutable audit trail record.
   - **Report Export**: Click **Export Excel (`.xlsx`)** to generate a full attendance sheet.

---

## ⚠️ Error Handling & HTTP Status Codes

The API uses standardized HTTP status codes and structured JSON response payloads:

| HTTP Status | Error Code / State | Trigger Condition & Explanation |
| :---: | :--- | :--- |
| `200 OK` | `SUCCESS` | Request succeeded; attendance recorded or records retrieved. |
| `400 Bad Request` | `INVALID_INPUT` | Missing required parameters, invalid JSON, or invalid UUID syntax. |
| `401 Unauthorized` | `UNAUTHORIZED` | Missing, expired, or invalid JWT token in `Authorization` header. |
| `403 Forbidden` | `FORBIDDEN` | Role mismatch (e.g., student calling admin route) or student not enrolled in session's class batch. |
| `404 Not Found` | `NOT_FOUND` | Session token, student profile, subject, or class record does not exist. |
| `409 Conflict` | `DUPLICATE_RECORD` | Attendance has already been marked for this `(session_id, student_id)` pair, or duplicate email/roll number during registration. |
| `410 Gone` | `SESSION_EXPIRED` | The attendance session's countdown has ended (`NOW() >= expires_at`) or was terminated manually. |
| `500 Internal Error`| `SERVER_ERROR` | Unhandled database error or unexpected server exception. |

---

## 📱 Responsive & Mobile Design

- **Mobile Camera Scanner**: Optimized for mobile viewports (`375px` to `430px` standard smartphones) with auto-orientation and torch/flip camera support.
- **Projector Optimized Display**: High-contrast dark background for the teacher's active session screen, ensuring crisp readability on classroom projectors even in bright ambient lighting.
- **Adaptive Layouts**: Responsive navigation drawer, collapsible sidebar, touch-friendly tables, and stacked metric cards on mobile viewports.
- **Dark Mode Support**: Seamless dark/light theme switching with CSS variables and Tailwind classes.

---

## 🚀 Production Cloud Deployment

The repository is pre-configured for one-click cloud deployment across **Neon**, **Render**, and **Vercel**.

### Neon PostgreSQL + Render Go API + Vercel React SPA

```
┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│      Vercel (SPA)      │     │      Render (API)      │     │   Neon (PostgreSQL)    │
│  React 18 + Vite Dist  │────>│   Go Gin Web Service   │────>│  Serverless PostgreSQL │
│ (student-erp.vercel.app│     │(qr-api.onrender.com)   │     │ (SSL Mode = Require)   │
└────────────────────────┘     └────────────────────────┘     └────────────────────────┘
```

#### 1. Database (Neon Serverless PostgreSQL)
1. Create a free PostgreSQL instance at [Neon](https://neon.tech).
2. Copy your connection URI (`DATABASE_URL`), ensuring `?sslmode=require` is appended:
   ```text
   postgres://username:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

#### 2. Backend API (Render Web Service)
The repository includes a root `render.yaml` blueprint:
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service** with:
   - **Root Directory**: `backend`
   - **Runtime**: `Go`
   - **Build Command**: `go build -o server ./cmd/server`
   - **Start Command**: `./server`
   - **Health Check Path**: `/api/health`
3. Configure Environment Variables in Render:
   - `ENVIRONMENT` = `production`
   - `DATABASE_URL` = `<your_neon_connection_string>`
   - `JWT_SECRET` = `<generate_secure_random_256_bit_key>`
   - `FRONTEND_URL` = `https://your-app.vercel.app`
   - `JWT_EXPIRATION_HOURS` = `24`

#### 3. Frontend UI (Vercel)
The `frontend/` directory includes `vercel.json` for SPA rewrites:
1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Select **Root Directory**: `frontend`.
3. Set Framework Preset to **Vite**.
4. Configure Environment Variables:
   - `VITE_BACKEND_URL` = `https://your-render-api.onrender.com`
   - `VITE_APP_URL` = `https://your-app.vercel.app`
5. Click **Deploy**.

---

## 📂 Project Directory Structure

```text
qr-attendance-system/
├── backend/
│   ├── cmd/
│   │   ├── seed/
│   │   │   └── main.go                 # Production demo dataset seeder
│   │   └── server/
│   │       └── main.go                 # Backend HTTP entrypoint
│   ├── internal/
│   │   ├── config/                     # Environment variable parsing
│   │   ├── database/
│   │   │   ├── database.go             # PostgreSQL connection & pool setup
│   │   │   └── migration.go            # SQL schema migration runner
│   │   ├── handlers/                   # HTTP Controller layer (Gin)
│   │   │   ├── academic_handler.go
│   │   │   ├── activity_handler.go
│   │   │   ├── admin_handler.go
│   │   │   ├── attendance_export_handler.go
│   │   │   ├── attendance_handler.go
│   │   │   ├── attendance_proof_handler.go
│   │   │   ├── auth_handler.go
│   │   │   ├── health.go
│   │   │   ├── student_profile_handler.go
│   │   │   ├── teacher_attendance_analytics_handler.go
│   │   │   └── teacher_profile_handler.go
│   │   ├── middleware/                 # JWT Auth, Role Guard, CORS
│   │   ├── models/                     # GORM structs, DTOs & DB schemas
│   │   ├── routes/                     # Router definition & endpoint mapping
│   │   └── services/                   # Business logic, Excel & PDF generators
│   ├── migrations/                     # 11 Tracked SQL database migrations (001-011)
│   ├── .env.example                    # Backend environment template
│   ├── go.mod                          # Go module dependencies
│   └── go.sum                          # Checksums for Go dependencies
│
├── frontend/
│   ├── src/
│   │   ├── auth/                       # AuthContext, Token Storage, ProtectedRoute
│   │   ├── components/                 # Reusable UI component library (26+ components)
│   │   │   ├── ActivityFeedCard.tsx
│   │   │   ├── AttendanceProofCard.tsx
│   │   │   ├── ConnectionStatus.tsx
│   │   │   ├── CorrectAttendanceModal.tsx
│   │   │   ├── ManualAttendanceModal.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── context/                    # ThemeContext (Dark / Light mode)
│   │   ├── pages/                      # 25 Route views & interactive portals
│   │   │   ├── ActivityPage.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminStudentsPage.tsx
│   │   │   ├── AdminTeachersPage.tsx
│   │   │   ├── AttendanceProofVerificationPage.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── StudentAttendanceCalendarPage.tsx
│   │   │   ├── StudentAttendanceHistoryPage.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── StudentScanAttendancePage.tsx
│   │   │   ├── TeacherAttendanceAnalyticsPage.tsx
│   │   │   ├── TeacherAttendanceSessionPage.tsx
│   │   │   └── TeacherDashboard.tsx
│   │   ├── services/                   # Axios / Fetch API client integrations
│   │   ├── types/                      # TypeScript shared interface contracts
│   │   ├── App.tsx                     # React Router tree & route declarations
│   │   ├── index.css                   # Tailwind CSS global styles & variables
│   │   └── main.tsx                    # React DOM root mounting
│   ├── .env.example                    # Frontend environment template
│   ├── package.json                    # Frontend package dependencies & scripts
│   ├── tailwind.config.js              # Tailwind custom theme & color tokens
│   ├── tsconfig.json                   # TypeScript compiler configuration
│   ├── vercel.json                     # Vercel SPA rewrite routing rules
│   └── vite.config.ts                  # Vite bundler configuration
│
├── stitch_screens/
│   └── screenshots/                    # 31 UI Screenshots & design artifacts
├── render.yaml                         # Render Infrastructure-as-Code blueprint
└── README.md                           # Comprehensive documentation
```

---

## 🗺️ Product Roadmap

### Completed Features ✅
- [x] Stateless JWT authentication with role-based access control (`ADMIN`, `TEACHER`, `STUDENT`).
- [x] Dynamic, high-contrast SVG QR generation with visual remaining countdown timers.
- [x] Mobile camera scanner with rear/front camera support via `html5-qrcode`.
- [x] Server-authoritative temporal expiration (`NOW() < expires_at`).
- [x] Database-level duplicate scan prevention (`UNIQUE(session_id, student_id)`).
- [x] Complete Admin management suite for Students, Teachers, Subjects, Classes, and Assignments.
- [x] Teacher live attendee counter and real-time check-in stream.
- [x] Multi-format attendance report export (CSV, Excel `.xlsx`, Institutional PDF).
- [x] Manual attendance marking and status correction with mandatory audit trail logging.
- [x] Dynamic late-attendance thresholds and automatic `LATE` classification.
- [x] Session finalization (locking) and auditable reopening engine.
- [x] Cryptographic digital attendance receipts with public verification QR portal.
- [x] Student monthly calendar heatmap and attendance streaks analytics.
- [x] Dark / Light mode toggle with persistent local storage.

### Planned / Future Scope 🔮
- [ ] **Geofencing & BLE Beacons**: Optional GPS/Wi-Fi subnet constraints for high-security exam halls.
- [ ] **Automated Deficit Notifications**: Email / SMS alerts for students dropping below 75% attendance.
- [ ] **Biometric Passkey (WebAuthn)**: Fingerprint/FaceID confirmation alongside QR scan.
- [ ] **Institutional ERP Connector**: Native webhook integrations for Canvas, Blackboard, and Moodle.

---

## ⚠️ Known Limitations & Mitigations

1. **Camera Permissions in Mobile Web**: Browser camera access requires explicit user consent over a secure context (`HTTPS` or `localhost`). In low-light or restricted environments, the student portal offers a secondary manual token entry fallback.
2. **Proxy via Screen Re-broadcast**: Standard QR attendance cannot mathematically guarantee that a student is physically in the room if a peer live-streams the projector screen. To mitigate this:
   - QR sessions can be configured for short windows (e.g. 1 minute).
   - Late-threshold controls mark delayed scans as `LATE`.
   - The teacher roster shows real-time headcounts to cross-check with classroom presence.
3. **Clock Skew on Distributed Servers**: In multi-instance deployments, unsynced system clocks can cause expiration mismatches. The system mitigates this by relying on PostgreSQL database timestamps (`NOW()`).

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. **Fork the Project**: Click the Fork button at the top right of this repository.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit Your Changes**:
   ```bash
   git commit -m 'feat: Add AmazingFeature'
   ```
4. **Run Verification Tests**:
   ```bash
   cd backend && go test ./...
   ```
5. **Push to the Branch**:
   ```bash
   git push origin feature/AmazingFeature
   ```
6. **Open a Pull Request**: Submit your PR with a detailed description of your changes.

---

## 📄 License & Acknowledgements

### License
This project is currently distributed for academic evaluation and institutional portfolio presentation.

### Acknowledgements
- [Gin Web Framework](https://github.com/gin-gonic/gin) for the high-performance Go web engine.
- [GORM](https://gorm.io) for developer-friendly PostgreSQL ORM capabilities.
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) for robust browser camera barcode scanning.
- [Lucide Icons](https://lucide.dev) for modern, accessible UI icons.
- [Tailwind CSS](https://tailwindcss.com) for the responsive design system.

---

<div align="center">

**QR-Based Student Attendance Management System** • Engineered with precision for modern academic institutions.

⭐ **If you find this project valuable for your research, college presentation, or development, please consider giving it a star!** ⭐

</div>
