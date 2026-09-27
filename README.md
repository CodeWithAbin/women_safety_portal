# Women Safety Portal

A modern, production-grade full-stack web application designed to empower citizens and local communities by crowdsourcing, verifying, and mapping hazardous, unlit, or unsafe public places.

---

## 🌟 Key Features

### 👤 Citizen / User Capabilities
* **Unified Authentication**: Single login interface for both citizens and administrators.
* **Geographic Filtering (State $\rightarrow$ District)**: Browse accepted hazardous locations filtered by State and District using cascading selection.
* **Hazard Reporting**: Submit unsafe locations with photo upload (JPEG/PNG/WebP, max 5MB), severity ratings (1–5), and detailed descriptions.
* **Review Lifecycle**: Reports begin in `pending` review status until approved by the administrator.
* **Notification Feed**: Receive system notifications when submitted reports are accepted (and published) or rejected, with single-click "Mark as Read".

### 🛡️ Administrator Capabilities
* **Overview Dashboard**: Instant visibility into pending moderation counts, active hazardous places, and registered citizens.
* **Report Review Queue**: Inspect submitted hazard reports with reporter contact details and Approve or Reject submissions.
* **Hazardous Places CRUD**: Add verified hazardous locations directly, update details, or delete places with confirmation modals.
* **Citizen Management**: View registered users filtered by State/District, update profile details, or remove accounts (with built-in deletion safeguards protecting the Admin account).

---

## 🛠️ Technology Stack

* **Frontend**: React (via Vite), React Router, Axios, Pure CSS / Light Theme Design System (Deployed on **Vercel**)
* **Backend**: Spring Boot 3.3.4, Java 17, Spring Security 6, JJWT (Deployed on **Railway**)
* **Database**: Turso Cloud (libSQL via HTTP Pipeline API v2 with parameterized queries, transactions, and foreign keys)
* **Authentication**: Stateless JWT (JSON Web Tokens) with server-side Role-Based Access Control (RBAC)
* **Password Hashing**: BCrypt (10 salt rounds)
* **File Storage**: Local disk storage & Railway Persistent Volume mounted at `/app/uploads`

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│              React SPA Frontend (Light Theme)              │
│       Deployed on Vercel (Production Cloud Edge)           │
│   Unified Login | User Dashboard | Admin Dashboard         │
└────────────────────────────┬───────────────────────────────┘
                             │  HTTPS / REST API & Multipart
                             ▼
┌────────────────────────────────────────────────────────────┐
│              Spring Boot 3 (Java 17) Backend               │
│               Deployed on Railway (Docker)                 │
│  Security Filter Chain (JWT) │ RBAC Guard │ Static Uploads │
└──────────────┬───────────────────────────┬─────────────────┘
               │                           │
               ▼                           ▼
┌───────────────────────────────┐ ┌──────────────────────────┐
│     Turso (libSQL) Cloud      │ │ Railway Persistent Volume│
│ (users, places, notifications)│ │      (/app/uploads)      │
└───────────────────────────────┘ └──────────────────────────┘
```

---

## 📁 Folder Structure

```
├── backend-java/
│   ├── src/main/java/com/womensafety/
│   │   ├── config/               # SecurityConfig, TursoConfig, DatabaseInitializer, AdminSeeder
│   │   ├── controller/           # AuthController, PlaceController, NotificationController, AdminController
│   │   ├── model/                # Entity & DTO models (ApiResponse, RegisterRequest, etc.)
│   │   ├── repository/           # Turso-backed repositories (UserRepository, PlaceRepository, etc.)
│   │   ├── security/             # JwtTokenProvider, JwtAuthenticationFilter, UserPrincipal
│   │   └── service/              # AuthService, PlaceService, NotificationService, AdminService, FileStorageService
│   ├── src/main/resources/       # application.properties
│   ├── src/test/java/            # Integration & unit test suites
│   ├── Dockerfile                # Production multi-stage Docker build for Railway
│   ├── .dockerignore
│   ├── .env.example
│   ├── pom.xml                   # Maven dependencies & build configuration
│   └── Women_Safety_Portal.postman_collection.json
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, ProtectedRoute, PlaceCard, etc.
│   │   ├── context/              # AuthContext (JWT & session hydration)
│   │   ├── pages/                # Login, Register, User views, Admin views
│   │   ├── services/             # Centralized Axios API client
│   │   ├── styles/               # Light Theme CSS & components styling
│   │   └── utils/                # Indian States & Districts reference data
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json               # SPA routing rewrite rules for Vercel
│   └── vite.config.js
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites
* **Java**: JDK 17+
* **Maven**: 3.9+
* **Node.js**: v18+ or v20+ (for React frontend)
* **npm**: v9+

### 1. Clone the Repository
```bash
git clone https://github.com/CodeWithAbin/women_safety_portal.git
cd women_safety_portal
```

### 2. Spring Boot Backend Setup
```bash
cd backend-java
cp .env.example .env
```

Edit `backend-java/.env` with your secure values:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
JWT_SECRET=your_secure_random_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_admin_password
UPLOAD_DIR=./uploads
```

Build and run the backend:
```bash
mvn clean spring-boot:run
```
*The database schema and initial administrator account will be validated and initialized automatically on startup.*

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

Start the Vite development server:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔌 Minimal REST API Specification (Exact 16 Endpoints)

### Authentication
* `POST /api/auth/register` — Register a new citizen account.
* `POST /api/auth/login` — Unified login for both User and Admin.
* `GET /api/auth/me` — Verify session and restore profile on refresh.

### User
* `GET /api/places` — Browse accepted hazardous places (`?state=...&district=...`).
* `POST /api/places/report` — Submit a place report for review (`multipart/form-data`).
* `GET /api/notifications` — View user's own status update notifications.
* `PATCH /api/notifications/:id/read` — Mark a notification as read.

### Admin
* `GET /api/admin/reports` — View pending user submissions (`?status=pending`).
* `PATCH /api/admin/reports/:id/status` — Accept or reject report (`{ status: "accepted" | "rejected" }`).
* `GET /api/admin/places` — View and filter accepted places (`?state=...&district=...`).
* `POST /api/admin/places` — Directly publish a verified hazardous place (`multipart/form-data`).
* `PUT /api/admin/places/:id` — Update existing hazardous place.
* `DELETE /api/admin/places/:id` — Delete a hazardous place.
* `GET /api/admin/users` — View registered citizens (`?state=...&district=...`, passwords omitted).
* `PUT /api/admin/users/:id` — Update citizen profile details.
* `DELETE /api/admin/users/:id` — Delete citizen account (Admin account protected).

---

## 🧪 Testing

### Backend Unit & Integration Tests
```bash
cd backend-java
mvn clean test
```

### Frontend Production Build Verification
```bash
cd frontend
npm run build
```

---

## 🔒 Security & Best Practices

* **No Hardcoded Secrets**: Sensitive credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`, `TURSO_AUTH_TOKEN`) are read exclusively from environment variables.
* **Git Hygiene**: `.env` and local database/upload directories are excluded in `.gitignore`. `.env.example` contains only safe placeholder templates.
* **Server-Side Authorization**: Spring Security stateless filter chain independently validates JWT tokens and roles on every protected request.
* **Parameterized Queries**: 100% of Turso libSQL interactions use parameterized SQL statements to prevent injection.
* **Upload Hardening**: File uploads are strictly validated and served from dedicated upload directories (`/app/uploads`).
