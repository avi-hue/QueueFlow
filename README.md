# QueueFlow — Smart Virtual Queue Management Platform (Prototype)

> **Tagline:** Stop Waiting. Start Flowing.  
> **Status:** Module 1 Complete (Phase 0: Setup & Prototype Architecture, Phase 1: Authentication & Business Basics).

---

## 1. Project Overview & Prototype Philosophy

QueueFlow is a virtual queue platform that removes the uncertainty of waiting lines. 

To keep the development and demonstration process **fast, self-contained, and lightweight for prototype purposes**, we streamlined the tech stack:
- **Zero External Database Setup:** Runs on a fast in-memory data store with auto-seeding. No MongoDB installation, Docker daemon, or heavy binary downloads required.
- **Instant Boot:** Backend boots in ~50ms; automated test suite runs in ~4s.
- **Pre-loaded Demo Accounts:** Clinic Owner, Clinic Staff, Cafe Owner, and Customers are pre-loaded on server start.
- **Clean API & Frontend:** Express REST API with standard JWT Bearer tokens + React (Vite) with Tailwind CSS.

---

## 2. Streamlined Tech Stack

| Layer | Choice | Prototype Rationale |
|---|---|---|
| **Frontend** | React 18, Vite, React Router v7, Tailwind CSS, Axios, Lucide Icons | Ultra-fast HMR, modern dark-mode aesthetic, responsive layouts |
| **Backend** | Node.js + Express | Minimal, clean REST endpoints |
| **Realtime** | Socket.IO (ready for Phase 3) | Room-based event architecture |
| **Data Store** | In-Memory Prototype Store (`server/src/db/inMemoryStore.js`) | Zero DB install, instant boot, auto-seeded on launch |
| **Auth** | JWT Bearer Token (`localStorage` + `Authorization` header) | Simple, bulletproof, zero cookie-cors issues on localhost |
| **Validation** | Zod | Robust schema validation for registration & business updates |
| **Testing** | Jest + Supertest | 15 integration tests running in ~4 seconds |

---

## 3. Quick Start (Zero-Setup)

### 1. Install Dependencies
From the repository root:
```bash
# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install

# Return to root
cd ..
```

### 2. Start the App
Run both client and server concurrently:
```bash
npm run dev
```
Or run individually:
- **Server:** `npm --prefix server run dev` (Runs on `http://localhost:5000`)
- **Client:** `npm --prefix client run dev` (Runs on `http://localhost:5173`)

*Note: The server auto-seeds demo data on start. No separate seed script is needed.*

---

## 4. Demo Accounts & 1-Click Login

All demo accounts share the password: `Password123!`

| Role | Name | Email | Associated Business |
|---|---|---|---|
| **Business Owner** | Dr. Robert Vance | `owner@queueflow.dev` | Apex Health Clinic |
| **Business Staff** | Nurse Sarah Connor | `staff@queueflow.dev` | Apex Health Clinic (Triage Counter A) |
| **Business Owner** | Marco Rossi | `cafe@queueflow.dev` | Urban Grind Artisanal Coffee |
| **Customer** | Alex Turner | `customer@queueflow.dev` | — |
| **Customer** | Jane Doe | `jane@queueflow.dev` | — |

*The landing page and login page feature 1-click test buttons to instantly test any of these roles.*

---

## 5. Automated Tests

Run the full integration test suite:
```bash
npm test
```
**Results:** 15 passing tests across `auth.test.js` and `business.test.js` in ~4.6 seconds.

---

## 6. Endpoints Implemented (Module 1)

Base Path: `/api/v1`

### Health Check
- `GET /health` — API status confirmation

### Auth
- `POST /auth/register` — Register customer or business owner (with business co-creation)
- `POST /auth/login` — Login user, returns access token
- `POST /auth/refresh` — Refresh token endpoint
- `POST /auth/logout` — Logout
- `GET /auth/me` — Current authenticated user details

### Business Operations (Owner / Staff)
- `GET /business/profile` — View venue profile (Staff/Owner)
- `PATCH /business/profile` — Update venue settings, hours, and details (Owner only)
- `POST /business/counters` — Add service counter (Owner only)
- `PATCH /business/counters/:id` — Toggle active status or edit counter (Owner only)
- `DELETE /business/counters/:id` — Remove counter (Owner only)
- `GET /business/staff` — List staff (Staff/Owner)
- `POST /business/staff` — Add staff member (Owner only)
- `DELETE /business/staff/:id` — Remove staff member (Owner only)

### Public Discovery
- `GET /businesses/:id` — Public business information

---

## 7. Progress Roadmap & Current State

- [x] **Phase 0 — Setup & Prototype Architecture:** Monorepo, zero-dependency in-memory store, health check.
- [x] **Phase 1 — Auth & Business Basics (Module 1):** Complete auth, role guards, business profile, counters, staff management, and responsive React frontend.
- [ ] **Phase 2 — Core Queue MVP:** Token generation, position calculation, queue state machine (`waiting → called → serving → completed`), walk-in management.
- [ ] **Phase 3 — Real-Time Updates:** Socket.IO rooms (`business:{id}`, `token:{id}`), live customer hero screen & live staff counter panel.
- [ ] **Phase 4 — Customer Discovery:** Geo search, radius filter, sort by wait time.
- [ ] **Phase 5 — Wait-Time Prediction:** ETA algorithm blend.
- [ ] **Phase 6 — Notifications:** Approaching alerts & no-show handling.
- [ ] **Phase 7 — Analytics:** Utilization charts, peak hours, metrics summary.
