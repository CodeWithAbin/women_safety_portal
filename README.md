# Women Safety Portal

A modern, production-style full-stack web application designed to empower citizens and local communities by crowdsourcing, verifying, and mapping hazardous, unlit, or unsafe public places.

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

* **Frontend**: React (via Vite), React Router, Axios, Pure CSS / Light Theme Design System
* **Backend**: Node.js, Express.js
* **Database**: Turso Cloud (libSQL via `@libsql/client` with parameterized queries and foreign-key enforcement)
* **Authentication**: JWT (JSON Web Tokens) with server-side Role-Based Access Control (RBAC)
* **Password Hashing**: `bcryptjs` (10 salt rounds)
* **File Storage**: Local disk storage via `multer` in `/uploads`

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│              React SPA Frontend (Light Theme)              │
│   Unified Login | User Dashboard | Admin Dashboard        │
└────────────────────────────┬───────────────────────────────┘
                             │  HTTP / JSON & Multipart
                             ▼
┌────────────────────────────────────────────────────────────┐
│                 Node.js + Express Server                   │
│  Auth Middleware (JWT) │ RBAC Guard │ Multer Uploads      │
└──────────────┬───────────────────────────┬─────────────────┘
               │                           │
               ▼                           ▼
┌───────────────────────────────┐ ┌──────────────────────────┐
│     Turso (libSQL) Database   │ │  Local Static Storage    │
│ (users, places, notifications)│ │        (/uploads)        │
└───────────────────────────────┘ └──────────────────────────┘
```

---

## 📁 Folder Structure

```
├── backend/
│   ├── config/
│   │   └── db.js                 # SQLite connection, schema & indices
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, Session me
│   │   ├── placeController.js    # Place browsing & user reporting
│   │   ├── notificationController.js # User notifications & mark-read
│   │   └── adminController.js    # Report review, place CRUD, user CRUD
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT & role authorization (requireAdmin)
│   │   └── uploadMiddleware.js   # Multer image validation & size limit
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth
│   │   ├── placeRoutes.js        # /api/places
│   │   ├── notificationRoutes.js # /api/notifications
│   │   └── adminRoutes.js        # /api/admin
│   ├── test/
│   │   ├── test_all_endpoints.js # Integration test suite (39 assertions)
│   │   └── verify_deep.js        # Deep edge-case verification suite
│   ├── uploads/                  # Uploaded photo files (.gitkeep)
│   ├── utils/
│   │   ├── seedAdmin.js          # Startup routine ensuring admin account from .env
│   │   └── validation.js         # Input validation helpers
│   ├── .env.example
│   ├── package.json
│   ├── server.js
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
│   └── vite.config.js
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites
* **Node.js**: v18+ or v20+
* **npm**: v9+

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/women-safety-portal.git
cd women-safety-portal
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your secure values:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
JWT_SECRET=your_secure_random_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_admin_password
```

Start the backend server:
```bash
npm start
```
*The database and single administrator account will be initialized automatically on startup.*

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

### Backend Integration Tests
```bash
cd backend
npm test
```
*Executes all 39 automated assertions covering authentication, authorization, reports lifecycle, place browsing, and user deletion cascading.*

### Frontend Full-Stack Integration Test
```bash
cd frontend
npm run test:e2e
```

### Production Build Verification
```bash
cd frontend
npm run build
```

---

## 🔒 Security & GitHub Best Practices

* **No Hardcoded Secrets**: Sensitive credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`) are read exclusively from environment variables (`.env`).
* **Git Hygiene**: `.env` and SQLite database files are excluded in `.gitignore`. `.env.example` contains only safe placeholder templates.
* **Server-Side Authorization**: Backend RBAC middleware independently verifies token and role on every protected request.
* **Parameterized Queries**: 100% of database interactions use parameterized placeholders (`?`) to prevent SQL injection.
* **Upload Hardening**: File types are validated for JPEG/PNG/WebP with a strict 5MB size limit.
