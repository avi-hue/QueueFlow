# QueueFlow — Architectural & Design Decisions (Prototype Architecture)

## Decision Log

### 1. Prototype-First Lightweight In-Memory Data Store
- **Context:** The project is meant for rapid prototyping and demonstration. Heavy production databases like external MongoDB daemons, Docker Compose setups, or 200MB+ `mongodb-memory-server` binaries introduce unnecessary installation hurdles and slow boot/test cycles.
- **Decision:** Replaced the external database dependency with a clean, zero-dependency in-memory data store (`server/src/db/inMemoryStore.js`).
- **Benefits:**
  - **Zero installation:** Runs immediately on any system with Node.js.
  - **Instant startup:** Boots in < 100ms.
  - **Auto-seeded on start:** Demo accounts (Owner, Staff, Cafe, Customers) are populated automatically when the server starts.
  - **Blazing-fast tests:** 15 integration tests run in ~4 seconds instead of 70+ seconds.

### 2. Streamlined Bearer Token Authentication
- **Context:** Production setups often involve complex refresh token rotation in `httpOnly` secure cookies with CORS cross-domain cookie complexities and mutex-based retry queues in Axios.
- **Decision:** Simplified to standard JWT Bearer token authentication. Tokens are stored in `localStorage` and passed in the `Authorization: Bearer <token>` header.
- **Benefits:**
  - Eliminates localhost cookie mismatch or same-site issues.
  - Keeps the Axios client simple and easy to understand (< 30 lines).
  - Reliable for rapid interactive testing across roles.

### 3. Removal of Production-Only Middleware Overheads
- **Context:** Production middlewares like `express-rate-limit` and `helmet` can block rapid demo clicks or localhost resources during prototyping.
- **Decision:** Removed rate limiting and rigid security headers while retaining standard CORS, JSON body parsing, and centralized error handling.
- **Benefits:** Frictionless demo interactions without 429 "Too Many Requests" or CORS asset blockers.

### 4. Interactive 1-Click Demo Switcher
- **Context:** Evaluators need to switch between Customer, Staff, and Business Owner views quickly.
- **Decision:** Added 1-click autofill and login buttons directly on the landing page and login screen.
- **Benefits:** Instant demonstration of role-based views without typing credentials.
