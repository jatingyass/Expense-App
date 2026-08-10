# Expense App

A personal expense tracker with **JWT auth**, **Razorpay-powered premium memberships**, **CSV export**, and a **leaderboard** for premium users. Built to be a small but production-shaped Node.js app — every cross-cutting concern (env validation, audit logging, rate limiting, signed payments, file storage) is wired the way you'd expect at a real company, not the way a tutorial does it.

The repo is structured so you can read it top-to-bottom in an interview and explain *why* each piece is there.

---

## Stack

| Layer       | Tech                                           |
|-------------|------------------------------------------------|
| Backend     | Node.js, Express                               |
| ORM         | Sequelize (MySQL)                              |
| Auth        | JWT (HS256, stateless) + bcryptjs              |
| Validation  | Zod                                            |
| Payments    | Razorpay (HMAC-SHA256 signature verification)  |
| Storage     | Pluggable: local FS (dev) / S3 (prod)          |
| Email       | Pluggable: console (dev) / SMTP (prod)         |
| Frontend    | React 18 + Vite + TypeScript + Tailwind v4     |
| Container   | Docker + docker-compose                        |
| Logging     | Winston (JSON in prod, colored in dev)         |
| Security    | Helmet, CORS, express-rate-limit, audit log    |

---

## What it does

- **Sign up / log in** with email + password (bcrypt 12 rounds)
- **Track income & expenses** in 11 categories — amounts stored as integer paise (no float rounding)
- **Filter & paginate** — by kind (income/expense), category, date range
- **Upgrade to premium via Razorpay** — real signature-verified payments
- **Download a CSV report** of all your expenses (premium only)
- **Leaderboard** of top spenders (premium only)
- **Forgot / reset password** — single-use tokens, 30-min expiry, sent over SMTP

---

## Quickstart (Docker — one command)

```bash
git clone <this repo>
cd Expense-App
cp .env.example .env       # then edit .env (Razorpay keys, JWT secret)
docker compose up -d --build
```

That brings up:

- **MySQL 8** on `localhost:3308`
- **Backend** on `localhost:3000`
- **Auto-migrations** on boot (`sequelize.sync({ alter: true })` in dev)

Health-check: `curl http://localhost:3000/healthz` → `{ "status": "ok", ... }`

Then start the frontend dev server:

```bash
cd frontend
npm install
npm run dev    # → http://localhost:5173
```

Vite proxies `/api/*` and `/uploads/*` to the backend so there are no CORS headaches in dev.

---

## Quickstart (without Docker)

```bash
npm install
# point .env at your local MySQL (port 3306, your creds)
npm run dev          # nodemon server.js
```

---

## Project layout

```
Expense-App/
├── server.js                    # entry point — connects DB, starts HTTP server
├── app.js                       # Express factory (no listen) — easy to test
├── config/
│   ├── env.js                   # zod-validated env loader; fails fast on missing config
│   └── db.js                    # Sequelize instance + connect()
├── models/                      # Sequelize models + associations
│   ├── user.js, Expense.js, order.js
│   ├── ForgotPasswordRequests.js
│   ├── downloadhistory.js, AuditLog.js
│   └── index.js                 # wires associations
├── controllers/                 # one file per resource — pure handlers
├── routes/                      # auth.js, expenses.js, payments.js, premium.js, files.js
├── middleware/                  # auth, validate, rateLimiter, errorHandler
├── services/                    # paymentService, emailService, storageService, auditService
├── validation/                  # zod schemas
├── utils/                       # ApiError, catchAsync, logger
├── frontend/                    # React + Vite + Tailwind SPA
└── docs/                        # HLD, LLD, API, INTERVIEW, DEPLOYMENT
```

---

## Defaults & guardrails worth knowing

- **`.env` is required** — `config/env.js` parses it through Zod and **exits the process** if anything's missing (e.g., `JWT_SECRET < 32 chars`). No silent misconfig.
- **Money is stored in paise** as `BIGINT.UNSIGNED` — never floats.
- **JWT does NOT carry `isPremium`** — middleware re-fetches the user from the DB on every request. v1 had a stale-claim bug where users stayed "premium" in their token after a refund; this fix kills that class of bug.
- **Razorpay verification uses constant-time comparison** (`crypto.timingSafeEqual`) — no signature-leak side channels.
- **Rate limits**: auth `10 / 15min`, payment `5 / min`, general API `100 / 15min`.
- **Audit log** records every financial event (signup, login, expense create/delete, payment verified, password reset, report download) with IP + UA. Best-effort writes — never breaks the user-facing op.

---

## Documentation

| Doc                                  | What's in it                                                          |
|--------------------------------------|----------------------------------------------------------------------|
| [docs/HLD.md](docs/HLD.md)           | High-level design + Mermaid diagrams (architecture, request flow)    |
| [docs/LLD.md](docs/LLD.md)           | Schema, key algorithms (HMAC verify, password reset, audit, etc.)    |
| [docs/API.md](docs/API.md)           | Every endpoint with curl examples and response shapes                |
| [docs/INTERVIEW.md](docs/INTERVIEW.md) | 50+ interview questions and concrete answers tied to this code     |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker, env vars, S3 / SMTP setup, production hardening notes      |

---

## License

MIT — but this is a portfolio project, do whatever you want with it.
