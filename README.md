# QueueFlow — Smart Virtual Queue Management Platform (Prototype)

> **Tagline:** Stop Waiting. Start Flowing.  
> **Status:** Modules 1-5 Complete (Auth, Smart Queue Management, Live Tracking, Discovery, & Dynamic Wait Time Prediction). Active prototype with 10 real-time businesses!

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
**Results:** 28 passing tests across `auth.test.js`, `business.test.js`, `queue.test.js`, and `prediction.test.js`.

---

## 6. Endpoints Implemented

Base Path: `/api/v1`

### Health Check
- `GET /health` — API status confirmation

### Auth (Module 1)
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

### Queue Operations (Module 2: Smart Queue Management)
- `POST /queue/join` — Customer joins queue (checks capacity & duplicate active tickets)
- `GET /queue/my-token` — Customer live active ticket position, assigned counter & dynamic ETA
- `POST /queue/cancel/:tokenId` — Customer cancel ticket
- `GET /queue/public/:businessId` — Public business queue snapshot
- `GET /queue/business/queue` — Staff/Owner complete live queue state machine
- `PATCH /queue/business/queue/status` — Owner toggle queue status (`open`, `paused`, `closed`)
- `POST /queue/business/queue/call-next` — Staff call next waiting ticket to counter
- `POST /queue/business/queue/start-service/:tokenId` — Staff transition token to serving
- `POST /queue/business/queue/complete/:tokenId` — Staff complete token service & update historical metrics
- `POST /queue/business/queue/skip/:tokenId` — Staff skip no-show customer
- `POST /queue/business/queue/walk-in` — Staff generate walk-in token

### Smart Wait-Time Prediction (Module 3)
- `GET /queue/prediction/:businessId` — Public & client detailed prediction breakdown (hybrid live rolling durations, historical hourly rush patterns, multi-counter concurrency, confidence score)

### Public Discovery
- `GET /businesses` — Public venue directory with haversine distance and live queue wait-times
- `GET /businesses/:id` — Public business information


---

## 7. Progress Roadmap & Current State

- [x] **Phase 0 — Setup & Prototype Architecture:** Monorepo, zero-dependency in-memory store, health check.
- [x] **Phase 1 — Auth & Business Basics (Module 1):** Complete auth, role guards, business profile, counters, staff management, and responsive React frontend.
- [x] **Phase 2 — Core Queue MVP (Smart Queue Management):** Token generation, dynamic position calculation, queue state machine (`waiting → called → serving → completed`), walk-in management.
- [x] **Phase 3 — Real-Time Updates (Live Queue Tracking):** Socket.IO rooms (`business:{id}`, `token:{id}`, `public`), live customer hero screen & live staff counter panel synchronization.
- [x] **Phase 4 — Customer Discovery (Nearby Queue Comparison):** Geo search, haversine distance calculation (mile ranges), and 10 dynamic seeded demo businesses.
- [x] **Phase 5 — Wait-Time Prediction (Smart Wait-Time):** Dynamic ETA algorithm blending using real-time completed token service durations.
- [ ] **Phase 6 — Notifications:** Approaching alerts & no-show handling.
- [ ] **Phase 7 — Analytics:** Utilization charts, peak hours, metrics summary.
