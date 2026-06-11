# Expense App — Interview Q&A

50+ questions an interviewer can ask about this project, with concrete answers tied to the actual code. Organized by topic so you can quickly review before a screen / loop.

> **How to use this:** read top-down once. Then before an interview, skim the section headers and make sure you can answer one question from each section without rehearsal. If you can do that, you can defend the project end-to-end.

---

## A. Project overview & motivation

### A1. Walk me through this project in 60 seconds.
Expense App is a personal finance tracker with a paid premium tier. Users sign up with email/password, log expenses and income, filter and paginate the list, and on the premium plan they unlock CSV export and a leaderboard. It's built on Node/Express + MySQL + React, with a pluggable storage layer (local FS in dev, S3 in prod) and a pluggable email driver (console in dev, SMTP in prod). The two pieces I'd point to are the **HMAC-SHA256 verification on Razorpay payments** (replaces a v1 bug where users could grant themselves premium for free) and the **stateless JWT auth that re-fetches `isPremium` from the DB on every request** to avoid stale-claim bugs.

### A2. Why build this and not something else?
It's small enough that I can defend every line, but it touches enough cross-cutting concerns — auth, payments, rate limiting, audit logging, file storage, transactional DB writes — that it generalises. Most "todo app" projects skip those. This one doesn't.

### A3. What was the hardest part?
Getting payment verification right. The original code accepted a client-supplied `status` field, which is the kind of bug that makes the news. Fixing it required reading Razorpay's signature contract carefully, computing the same HMAC server-side, and using `crypto.timingSafeEqual` for the comparison so we don't leak via timing.

---

## B. Architecture & design choices

### B1. Why MySQL and not Postgres / Mongo?
MySQL because the data is relational (users, expenses, orders, audit log all link by FK), transactions are first-class, and ops familiarity is high. Postgres would also work — the choice between them isn't load-bearing here. Mongo would be a bad fit: the leaderboard query is a `JOIN` + `GROUP BY` + `SUM`, and that's friction in a document store.

### B2. Why JWT and not server-side sessions?
Stateless API ⇒ horizontal scale without a session store. Any node can verify any token with the shared HMAC secret. The trade-off is revocation — you can't kick someone out before their token expires. I'd accept that for a personal-finance app; for banking I'd add a token-version column on `Users` and bump it on logout-everywhere.

### B3. Why does the JWT not contain `isPremium`?
Because it goes stale. v1 stuffed `isPremium: true` into the token at signup time, so even after a refund the user kept premium until the token expired. The fix is to keep the JWT minimal (`{ userId }`) and re-read `isPremium` from the DB on every authenticated request. That's one extra `SELECT id, name, email, isPremium FROM users WHERE id = ?` per request — sub-millisecond on a primary-key lookup.

### B4. What's in the JWT payload exactly?
Just `{ userId, iat, exp }`. Anything else can change mid-token-lifetime, and anything that can change can become stale.

### B5. Why bcrypt at 12 rounds?
2^12 ≈ 4096 iterations → ~250ms per hash on commodity hardware. Slow enough to make brute-force expensive, fast enough to not be a UX issue on login. 10 rounds (the v1 default) is too cheap on modern hardware.

### B6. Walk me through your folder structure.
- `config/` — env loading + DB connection. Both fail fast if misconfigured.
- `models/` — Sequelize models, one per file, plus `index.js` which wires associations.
- `controllers/` — pure handlers, one resource per file. They don't know about HTTP concerns beyond reading from `req` and writing to `res`.
- `routes/` — `auth.js`, `expenses.js`, `payments.js`, `premium.js`, `files.js`. Each declares its middleware chain and binds controllers.
- `middleware/` — auth, validate, errorHandler, rateLimiter. Cross-cutting concerns applied uniformly.
- `services/` — paymentService, emailService, storageService, auditService. **Side-effects live here** so controllers stay testable and providers can be swapped.
- `validation/` — Zod schemas, one file per resource.
- `utils/` — `ApiError` (typed errors), `catchAsync` (async wrapper), `logger`.
- `frontend/` — separate Vite project.

### B7. Why a separate `app.js` and `server.js`?
`app.js` exports an Express app factory — no `listen()`, no DB connect — so you can `require('./app')` in a test and hit it with supertest. `server.js` does the side-effects: connect DB, sync, listen, register signal handlers. This is the standard split for Node apps that want testability.

### B8. Why do you have a `services/` folder?
Controllers should orchestrate, not own side-effects. If `loginController` directly called `nodemailer.sendMail`, swapping to SES would mean editing every controller that emails. Putting "send mail" behind `emailService.sendMail` means one driver swap (`EMAIL_DRIVER=smtp` vs `console`) and the call sites don't change.

---

## C. Database & schema

### C1. Why store amounts as integer paise (BIGINT) instead of DECIMAL or float?
Floats have precision bugs (`0.1 + 0.2 !== 0.3`). DECIMAL is fine but slower and harder to serialize across JSON boundaries (ends up as a string). BIGINT in paise is exact, fast to sum, and trivial to send over JSON. The frontend converts to rupees at the display boundary.

### C2. Why `kind = 'income' | 'expense'` instead of two tables?
Same shape (amount, description, category, date, userId), same indexes, same hot queries. Two tables would just mean `UNION ALL` everywhere. One table with a discriminator column is the natural form.

### C3. What indexes did you add and why?
- `Users(email)` UNIQUE — login lookup.
- `Expenses(userId, occurredAt)` — dashboard list and date-range filters.
- `Expenses(userId, kind)` — leaderboard `WHERE userId = ? AND kind = 'expense'`.
- `Orders(orderId)` UNIQUE — payment idempotency.
- `Orders(userId, status)` — "find this user's pending order".
- `ForgotPasswordRequests(expiresAt)` — for the periodic-cleanup job.
- `AuditLogs(userId, createdAt)` — query a user's audit trail.
- `AuditLogs(event, createdAt)` — alert on `payment.failed` rates, etc.

### C4. What does `ON DELETE CASCADE` vs `SET NULL` mean and why pick one?
CASCADE deletes child rows when the parent is deleted; SET NULL keeps them but nulls the FK. I used CASCADE for `Expenses` (no point keeping orphan expenses) but SET NULL for `AuditLog` (we want the audit history to survive user deletion for compliance / forensics).

### C5. How do you avoid float rounding when summing amounts?
The column is `BIGINT UNSIGNED`. `SUM(amount)` returns an exact bigint. No rounding ever happens server-side. The only conversion is at the display layer (`amount / 100`), and even there I use `.toFixed(2)` to render to two decimals.

### C6. Walk me through the leaderboard query.
```sql
SELECT u.id, u.name,
       COALESCE(SUM(CASE WHEN e.kind='expense' THEN e.amount ELSE 0 END), 0) AS totalSpend
FROM Users u
LEFT JOIN Expenses e ON e.userId = u.id
GROUP BY u.id
ORDER BY totalSpend DESC;
```
The `LEFT JOIN` so users with zero expenses still show up. The `CASE` so the sum only includes `kind='expense'`. The `(userId, kind)` index makes the per-user filter cheap.

### C7. How would the leaderboard scale at 1M users?
Today this is a `O(users + expenses)` table scan. At a million users I'd materialize: a nightly job populates a `leaderboard_snapshots` table; the API reads from that. If I needed near-real-time, I'd `incrementally` update the snapshot whenever an expense is created (event-driven).

### C8. What does `sequelize.sync({ alter: true })` do? Would you use it in prod?
It diffs your models against the DB and runs `ALTER TABLE` to make them match. Useful in dev. In prod it's dangerous — it'll drop or change columns without ceremony. In prod I'd run real migrations (`umzug` or Sequelize's CLI) so the schema change is reviewed, version-controlled, and reversible.

---

## D. Auth & security

### D1. Walk through the login flow.
```
POST /api/auth/login { email, password }
  → User.findOne({ email })
  → bcrypt.compare(password, user.password)
  → jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
  → return { token, user }
```
A failed compare returns the same generic "Invalid email or password" so we don't reveal whether the email exists.

### D2. How do you prevent email enumeration on login?
Same response (and same status code, 401) whether the user exists or not. Same on `forgot-password` — always 200 "If that email is registered…", regardless of whether we actually sent an email.

### D3. How do you prevent enumeration on signup?
On signup we *do* return 409 "Email already in use" — there's no way around that without making signup unusable. The mitigation is the rate limiter on the auth prefix (10 / 15 min per IP).

### D4. How would you add 2FA?
Slot it into the auth flow as a second step: on successful password check, generate a TOTP challenge, return a short-lived "challenge token" instead of a full JWT. User submits the 6-digit code with the challenge token, server verifies and issues the real JWT. Storage: a single `totpSecret` column on `Users`, encrypted at rest.

### D5. How does the rate limiter work?
`express-rate-limit` keeps an in-memory counter keyed by IP. Three configs:
- `apiLimiter`: 100 / 15min general API
- `authLimiter`: 10 / 15min on `/api/auth/*`
- `paymentLimiter`: 5 / minute on `/api/payments/*`

For multi-instance prod, the in-memory store is a problem (each box has its own count). I'd swap in `rate-limit-redis` so all instances share state.

### D6. How do you protect against brute-forcing the reset link?
The link's path segment IS the token — a UUIDv4 with 122 bits of entropy. Even at a billion guesses per second it would take 10^28 years. Plus single-use, plus 30-min expiry, plus rate-limited. Defense in depth.

### D7. What does helmet do?
Sets sane HTTP security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, a Content-Security-Policy. None of those are sufficient alone but together they shut a bunch of common XSS / clickjacking / MIME-sniffing footguns.

### D8. What's wrong with logging full request bodies?
Passwords, JWTs, payment signatures, PII. The `logger` only logs at the controller level — the actual sensitive fields never hit the log line. Helmet additionally strips a lot of header noise.

### D9. How does CORS work in this app?
`cors({ origin: env.CORS_ORIGIN, credentials: true })`. Single allowed origin from env, no wildcards. In dev `CORS_ORIGIN=http://localhost:5173` and the SPA hits `localhost:3000`. In prod the SPA and API are usually same-origin so CORS doesn't apply.

---

## E. Payments

### E1. Walk through the entire payment flow start to finish.
1. SPA `POST /api/payments/order`. Server calls Razorpay `orders.create({ amount })`, persists `Order` row, returns `{ orderId, amount, currency, keyId }`.
2. SPA opens Razorpay Checkout JS with those values. Browser talks to Razorpay directly — card data never touches our server.
3. On success, Razorpay's callback returns `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`.
4. SPA `POST /api/payments/verify { ...those three }`.
5. Server recomputes `HMAC_SHA256(SECRET, "<order_id>|<payment_id>")` and compares with `crypto.timingSafeEqual` against the incoming signature.
6. If valid: in a single transaction, mark `Order.status='paid'` and set `Users.isPremium=true`. Audit-log `payment.verified`.

### E2. How does HMAC verification work?
HMAC-SHA256 takes a secret and a message and produces a 32-byte digest. Razorpay computes `HMAC_SHA256(KEY_SECRET, "${order_id}|${payment_id}")` on their server when the payment succeeds, and sends the hex-encoded digest to the browser as `razorpay_signature`. We do the same computation server-side with our copy of `KEY_SECRET` and check the digests match. The client never has the secret, so it can't forge a valid signature for an arbitrary `order_id` it didn't pay for.

### E3. Why `crypto.timingSafeEqual` and not `===`?
A naive `===` short-circuits on the first byte mismatch. By measuring response times an attacker can binary-search the signature byte-by-byte. `timingSafeEqual` always compares all bytes, regardless of where the first difference is, so the time is constant and the side channel closes.

### E4. What if the Razorpay request hits the verify endpoint twice?
First call processes normally and flips `Order.status` to `paid`. Second call finds the row, sees `status === 'paid'`, returns success without doing anything else. Idempotent. The `UNIQUE INDEX (orderId)` enforces it at the DB layer too.

### E5. What if verify succeeds but the DB write fails?
Both writes (order update + user upgrade) run in the same Sequelize transaction. If either throws, the transaction rolls back: `Order.status` stays `'created'` (so a retry can re-process) and the user stays non-premium (consistent). The Razorpay side has the payment captured either way — so the user has paid, our DB says they haven't. Mitigation: monitoring on `Order.status='created'` rows older than X minutes triggers a manual reconciliation. In a more mature system I'd set up a Razorpay webhook to re-attempt the verification automatically.

### E6. What was wrong with the v1 verification?
```js
order.status = req.body.status === 'successful' ? 'completed' : 'failed';
if (order.status === 'completed') user.isPremium = true;
```
We trusted the client-supplied `status`. Anyone could `curl -X POST /verify -d '{"status":"successful"}'` and become premium for free. The fix is: trust nothing the client says about money; verify cryptographically.

### E7. How do you handle refunds?
Currently I don't — it's a documented future addition. The hook would be a Razorpay webhook → API endpoint that flips `Order.status='refunded'` and `User.isPremium=false` in a transaction, plus an audit-log entry. The DB schema already supports the `refunded` enum value.

### E8. What's the security boundary between the SPA and the API for payment?
The SPA holds the **public** `keyId` and the order id. The HMAC `keySecret` is only on the server (validated through `env.js` to be present at boot). The SPA can ask the server to *create* an order, but it can't fake a verification because it doesn't have the secret to sign with.

---

## F. Validation, error handling, and middleware

### F1. Why Zod and not Joi / Yup / express-validator?
Zod's TypeScript inference is excellent (less duplication between schema and types) and the `safeParse` API is ergonomic. Same library can validate env at boot and request bodies at runtime → one mental model, not three.

### F2. Walk me through the `validate` middleware.
```js
const validate = (schema, source = 'body') => (req, res, next) => {
  const r = schema.safeParse(req[source]);
  if (!r.success) {
    const details = r.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  Object.assign(req[source], r.data);
  next();
};
```
Curried: `validate(schema)` defaults to body, `validate(schema, 'query')` for query, etc. On failure it forwards an `ApiError.badRequest` with field-by-field details. On success it merges Zod's parsed (coerced + defaulted) values back into `req[source]` so the controller sees normalized data.

### F3. How does your `catchAsync` work?
```js
const catchAsync = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```
Express 4 doesn't auto-catch promise rejections from async handlers. Wrapping every controller in `catchAsync` means a thrown `ApiError` (or any other error) flows into the global `errorHandler` rather than crashing the request.

### F4. Walk through the `errorHandler`.
It maps known error types to HTTP responses:
- `ApiError` (anything we explicitly throw) → use its `statusCode` + `message` + `details`
- `SequelizeUniqueConstraintError` → 409 Resource already exists
- `SequelizeValidationError` → 400 Validation failed
- `JsonWebTokenError` / `TokenExpiredError` → 401 Invalid token / Token expired
- Anything else → 500 Internal server error

In `NODE_ENV !== 'production'` it includes `stack` in the response for debugging; in prod it doesn't.

### F5. Why a typed `ApiError` instead of raw `throw new Error(...)`?
Raw errors get a `statusCode` from nowhere — the handler defaults them to 500. `ApiError` carries `statusCode` + `details` + `isOperational`. The static factories (`ApiError.notFound`, `.conflict`) keep call sites readable and prevent typos in status codes.

### F6. How do you handle schema migrations?
In dev, `sequelize.sync({ alter: true })` runs at boot and adjusts the schema. In production, that's reckless — I'd use `umzug` or Sequelize's CLI for explicit, version-controlled migrations.

---

## G. File storage

### G1. Why presigned URLs instead of `multer` / `multipart-form-data`?
Two reasons. **Memory & bandwidth**: with multer the bytes go through our process — every parallel upload is RAM. Presigned URLs let the browser PUT directly to S3, our process only handles small JSON requests. **PCI/data scope**: we never see the bytes. Same code shape works in dev (local PUT to our own server) and prod (presigned to S3) because the SPA's flow is identical.

### G2. How do you prevent path traversal on the local upload route?
```js
const safe = path.basename(rawKey);                 // strips '../' and any directory parts
const dest = path.join(uploadDir, safe);
if (!dest.startsWith(uploadDir + path.sep)) throw ApiError.badRequest('Invalid key');
```
Two layers: `basename` is sufficient on its own, but the post-resolve check is belt-and-suspenders.

### G3. How do you cap upload size?
Per-mime caps in `MIME_LIMITS`: 10MB for images, 25MB for PDF/CSV. The presigned URL response advertises `maxBytes` so the client can reject early. The local PUT route **also** rejects bodies over `ABSOLUTE_MAX_BYTES` (25MB hard ceiling) regardless of mime.

### G4. How do you avoid filename collisions?
`buildKey(prefix, filename)` returns `${prefix}/${timestamp}_${randomHex(6)}_${sanitized}`. Even uploads of the same filename within the same millisecond collide with probability 1/2^48.

### G5. What's the difference between `getUploadUrl` and `writeBuffer` in the storage service?
- `getUploadUrl` is for **client-uploaded** content (user picks a file, browser PUTs it).
- `writeBuffer` is for **server-generated** content (CSV reports — server has the bytes already, just needs to put them somewhere).

Same backend interface, different entry points.

---

## H. Email, audit, and observability

### H1. How is email pluggable?
`EMAIL_DRIVER=console` writes to stdout — perfect for dev, no SMTP setup needed. `EMAIL_DRIVER=smtp` connects via nodemailer to whatever SMTP server you point it at (Gmail, SES, Mailgun, SendGrid). Switch is a single env var, code stays the same.

### H2. Why is the audit write fire-and-forget?
Audit is observability. If we wrapped it in a transaction with the business write, an `audit_logs` table problem would roll back the actual user-visible op. That's the wrong trade-off — an unrecorded login is bad, a failed login because audit is sick is *worse*. So `auditService.record()` catches its own errors and only logs them at WARN.

### H3. What events do you audit?
`user.signup`, `user.login`, `expense.created`, `expense.deleted`, `payment.verified`, `password.resetRequested`, `password.reset`, `report.downloaded`. Each row carries event name, JSON payload, IP, user agent, and userId.

### H4. Why store IP and user agent?
Forensics. If a user reports their account was compromised, we want to be able to show "logged in from this IP at this time, downloaded a report at this time". Without those columns the audit table is half-useful.

### H5. How does logging work?
Winston with two transports. In development, colorized console output for readability. In production, JSON to stdout (one line per log) so the container runtime / log aggregator (CloudWatch, Datadog, ELK) can index it.

### H6. What metrics would you add for production?
Per-route p50/p95 latency, error rate, payment success rate, active sessions, DB pool utilization, Razorpay webhook failures (when added). Prometheus + Grafana, or a hosted equivalent.

---

## I. Frontend

### I1. Why React and Vite?
Vite has the fastest dev server (esbuild for transforms) and the smallest config surface. React is the lingua franca — the SPA is small enough that even SolidJS would work, but React has the deepest ecosystem for things like Razorpay's Checkout JS interop.

### I2. Why Tailwind?
Co-located styles, no naming bikeshed, design system encoded in the config. The trade-off is JSX gets className-heavy; for a 7-page SPA that's fine. For a 200-page SPA I'd extract repeating patterns into headless components.

### I3. How is auth state managed?
Plain React Context (`AuthProvider` in `stores/auth.tsx`). Token + user are persisted to `localStorage` so a refresh keeps the session. Axios interceptors auto-attach the Bearer header on every request and route to `/login` on a 401.

### I4. Why localStorage for the token? Isn't that XSS-able?
Yes — if you have an XSS vulnerability, localStorage is exfiltrated. The mitigations are: helmet's CSP, react auto-escaping all output by default, no `dangerouslySetInnerHTML`. Cookie-based tokens have their own footguns (CSRF). For a portfolio app the trade-off is acceptable; for a banking app I'd use httpOnly + SameSite=Strict cookies and add CSRF tokens.

### I5. Why does the dashboard re-fetch after every filter change?
Filters are part of the URL query state (`useState`). When they change, `useCallback`-memoized `fetchExpenses` gets a new reference, `useEffect` fires, server returns the new page. Server-side filtering keeps the client thin and means pagination metadata (totalPages) stays accurate.

### I6. How does the Razorpay checkout integrate?
The `checkout.js` script is loaded once via `<script>` in `index.html`. The Premium page calls `POST /api/payments/order` to get an order id, then `new window.Razorpay({ ... }).open()` opens the checkout modal. The `handler` callback fires on success and posts to `/api/payments/verify`.

---

## J. Scaling, reliability, and what comes next

### J1. What's the current bottleneck at 100K users?
MySQL writes — specifically the `audit_logs` table, which gets a row per business event. Mitigation: batch audit inserts (queue them up and flush every 100 ms) once writes get hot. Until then it's fine: every event is a single small insert, no contention.

### J2. How would you scale the report generation past ~10K rows per user?
Today it's inline — the request blocks on a query + CSV serialization. For larger reports I'd push to a queue (BullMQ on Redis, or SQS), have a worker process the export, then email the user a link when it's done. The HTTP request would return immediately with a job id.

### J3. What if MySQL goes down?
Boot fails — `connect()` throws and the process exits. Docker restarts the container per its restart policy. In a multi-instance deploy the load balancer health-checks `/healthz` (which currently doesn't ping the DB) and would route around dead boxes. I'd improve the health check to also try a `SELECT 1` so we don't leave broken backends in rotation.

### J4. How would you do blue-green deploys?
Two stacks (blue and green) behind a router. New version goes to green, gets traffic-shifted gradually (1% → 10% → 50% → 100%). If error rates spike, instant rollback to blue. The DB schema changes need to be backward-compatible during the cut-over (add column → backfill → switch reads → drop old column, never the all-at-once `ALTER TABLE`).

### J5. How would you add a "subscribe monthly" plan?
Razorpay has a Subscription API. Storage: a `Subscription` table with `userId`, `razorpaySubscriptionId`, `status`, `currentPeriodEnd`. A webhook endpoint receives `subscription.charged` / `subscription.cancelled` events, idempotently updates the row, and adjusts `User.isPremium` based on `currentPeriodEnd > now`.

### J6. What would the next 6 months of work look like?
Refunds endpoint + webhook → email verification on signup → 2FA → recurring subscriptions → admin dashboard → stricter audit (immutable hashed event chain) → S3 lifecycle policy on receipts → archive job for `audit_logs` and `download_history` (the Group-Chat-App in this portfolio shows the hot/warm/cold pattern).

---

## K. Mistakes & lessons

### K1. What did you change from v1 and why?
- **Payment verification** — added HMAC-SHA256 + timingSafeEqual. v1 trusted client `status`, anyone could become premium for free.
- **Stale `isPremium` JWT claim** — re-fetch from DB instead. v1 left users premium after refunds.
- **Group-admin middleware** (in the Group-Chat-App, but same lesson) — `req.params || req.body` is always truthy because `req.params` is an object. Subtle bug, broke the role check.
- **Hardcoded keys in source** — moved to env, `.env` gitignored, `git filter-repo` to scrub history.
- **`{ alter: true }` in prod-shaped code** — gated behind `NODE_ENV === 'development'`.
- **Three competing email packages** (`@sendgrid/mail`, `sib-api-v3-sdk`, `nodemailer`) — kept just nodemailer behind an `emailService` abstraction.

### K2. What's still wrong / unfinished?
- Razorpay webhook is not wired (only client-driven verify). For production, webhooks are the source of truth.
- No automated tests — would add Jest + supertest for happy paths, payment verify, and reset-password edge cases.
- `audit_logs` grows forever — needs an archive job.
- Frontend has no error boundary — a render crash whites out the page.

### K3. If you could re-do one architectural decision, what would it be?
I'd add tests from day one. The whole "fix v1's payment bug" episode would have been a 5-minute red-test-green-test cycle instead of careful manual verification. Adding tests now is a backfill, and backfilled tests are always weaker than tests written alongside the code.

### K4. What's your favorite line of code in this repo?
The HMAC verify in `paymentService.js`. Six lines that fix what was probably the worst bug in v1, and they're each there for a specific reason — the ordered concatenation is Razorpay's contract, the buffers are because `timingSafeEqual` needs equal-length byte arrays, and the constant-time compare is because string comparison leaks via timing. Every line says something.

---

## L. Quick-fire system design

### L1. How would you add support for multiple currencies?
`Expense.currency VARCHAR(3) DEFAULT 'INR'`. Display layer converts at the user's chosen base currency using a daily-cached FX rate. Storage stays as paise-of-the-currency (`amount: 50000` could be 500.00 INR or 500.00 USD).

### L2. How would you add OAuth login (Google/GitHub)?
A `social_accounts` table with `(userId, provider, providerUserId)`. New `/api/auth/oauth/:provider/callback` endpoint exchanges the OAuth code for a profile, finds-or-creates a `User` row, and issues a JWT just like password login does. Existing users would link by email.

### L3. How would you add an admin dashboard?
A `Users.role ENUM('user','admin')` column. `requireAdmin` middleware in the same shape as `requirePremium`. Admin routes mounted at `/api/admin/*`. The actual UI is a separate React route guarded by the role check.

### L4. How would you handle GDPR / "delete my data"?
- Hard-delete: cascade delete `User` → expenses, orders, reset requests.
- Soft-delete-then-hard: flip a `deletedAt` timestamp, schedule a job 30 days later to actually purge. Lets users undo.
- Audit log: keep the rows but null the userId (already wired via `ON DELETE SET NULL`). The event happened, we just no longer link it to a person.
- S3 receipts: delete the actual objects, not just the DB rows.

### L5. How would you do search?
Today: filter by category + date. If users wanted full-text search on `description`, I'd add a MySQL FULLTEXT index. At larger scale I'd move that to OpenSearch / Meilisearch with a sync job from MySQL.
