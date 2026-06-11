# Expense App — API Reference

Base URL (dev): `http://localhost:3000`

All endpoints accept and return `application/json`. Authenticated endpoints require a Bearer JWT in the `Authorization` header.

```
Authorization: Bearer <token>
```

Errors share a single shape:

```json
{
  "success": false,
  "message": "<human-readable>",
  "details": [ { "field": "...", "message": "..." } ]   // optional, on 400 validation errors
}
```

Success responses do not have a `success: true` wrapper — they return the payload directly.

---

## Health

### `GET /healthz`
Sanity check. No auth.

```bash
curl http://localhost:3000/healthz
```

```json
{ "status": "ok", "ts": 1777979469322 }
```

---

## Auth (`/api/auth`)

### `POST /api/auth/signup`
Create a new user. Returns a JWT.

**Body**
```json
{
  "name": "Jatin Gyass",
  "email": "jatin@example.com",
  "password": "Strong123"
}
```
Validation: `name` 2-50 chars, valid email, password >= 8 chars with at least one uppercase, lowercase, and number.

**Response 201**
```json
{
  "message": "Account created",
  "token": "eyJhbGciOi...",
  "user": { "id": 7, "name": "Jatin Gyass", "email": "jatin@example.com", "isPremium": false }
}
```

**Errors**
- 400 Validation failed
- 409 Email already in use

---

### `POST /api/auth/login`

**Body**
```json
{ "email": "jatin@example.com", "password": "Strong123" }
```

**Response 200**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOi...",
  "user": { "id": 7, "name": "Jatin Gyass", "email": "jatin@example.com", "isPremium": false }
}
```

**Errors**
- 401 Invalid email or password

Rate limit: `10 / 15 min` per IP.

---

### `POST /api/auth/check-email`
Used by the signup form for live validation.

**Body**
```json
{ "email": "jatin@example.com" }
```

**Response 200**
```json
{ "available": false }
```

---

### `POST /api/auth/forgot-password`
Always returns 200, even if the email isn't registered (prevents enumeration).

**Body**
```json
{ "email": "jatin@example.com" }
```

**Response 200**
```json
{ "message": "If that email is registered, a reset link has been sent." }
```

The email contains a link `${PASSWORD_RESET_URL}/<requestId>` (a UUIDv4). Token is valid for 30 minutes, single-use.

---

### `GET /api/auth/reset-password/:id`
Frontend calls this before showing the new-password form.

**Response 200**
```json
{ "valid": true }
```

**Errors**
- 400 Invalid or already-used reset link
- 400 Reset link has expired

---

### `POST /api/auth/reset-password`

**Body**
```json
{
  "requestId": "5b13d52a-2210-49e1-b0dd-7cd4fd0aa8a3",
  "newPassword": "NewStrong123"
}
```

**Response 200**
```json
{ "message": "Password reset successfully" }
```

**Errors**
- 400 Invalid / used / expired link
- 404 User not found

---

## Expenses (`/api/expenses`) — auth required

### `POST /api/expenses`
Add an income or expense.

**Body**
```json
{
  "amount": 50000,
  "description": "Lunch with team",
  "category": "Food",
  "kind": "expense",
  "occurredAt": "2026-05-10",
  "receiptUrl": null
}
```
- `amount` is in **paise** (₹500 → 50000).
- `kind` is `'income' | 'expense'` (default: `expense`).
- `category` ∈ `Food, Travel, Bills, Entertainment, Health, Shopping, Education, Salary, Bonus, Investment, Other`.
- `occurredAt` is optional; defaults to today.
- `receiptUrl` is optional, set to the URL returned by the upload flow.

**Response 201**
```json
{
  "message": "Expense added",
  "expense": {
    "id": 42,
    "userId": 7,
    "amount": 50000,
    "description": "Lunch with team",
    "category": "Food",
    "kind": "expense",
    "occurredAt": "2026-05-10",
    "receiptUrl": null,
    "createdAt": "2026-05-10T12:30:00.000Z",
    "updatedAt": "2026-05-10T12:30:00.000Z"
  }
}
```

---

### `GET /api/expenses`
List with pagination & filters.

**Query**
| Name      | Type    | Default | Notes                                                  |
|-----------|---------|---------|--------------------------------------------------------|
| page      | int     | 1       | 1-indexed                                              |
| limit     | int     | 10      | max 100                                                |
| kind      | string  | all     | `income`, `expense`, or `all`                          |
| category  | string  | all     | one of the categories or `all`                         |
| from      | date    | —       | inclusive; ISO-8601 like `2026-04-01`                  |
| to        | date    | —       | inclusive                                              |

```bash
curl "http://localhost:3000/api/expenses?page=1&limit=5&kind=expense&category=Food" \
     -H "Authorization: Bearer $TOKEN"
```

**Response 200**
```json
{
  "expenses": [ { ... }, { ... } ],
  "pagination": { "total": 42, "page": 1, "limit": 5, "totalPages": 9 }
}
```

---

### `DELETE /api/expenses/:id`

```bash
curl -X DELETE http://localhost:3000/api/expenses/42 \
     -H "Authorization: Bearer $TOKEN"
```

**Response 200**
```json
{ "message": "Expense deleted" }
```

**Errors**
- 404 Expense not found (also returned if the expense exists but belongs to another user — never leaks existence)

---

## Payments (`/api/payments`) — auth required

Rate limit on this prefix: `5 / minute` per IP.

### `POST /api/payments/order`
Creates a Razorpay order for the configured premium price (`PREMIUM_AMOUNT_PAISE`).

```bash
curl -X POST http://localhost:3000/api/payments/order \
     -H "Authorization: Bearer $TOKEN"
```

**Response 200**
```json
{
  "orderId": "order_SlipDEhTteYiYk",
  "amount": 50000,
  "currency": "INR",
  "keyId": "rzp_test_xxxxxx"
}
```

The `keyId` is the **public** Razorpay key id — safe to expose to the browser; it's used to open the checkout widget.

---

### `POST /api/payments/verify`
Called by the SPA after the Razorpay checkout JS callback.

**Body**
```json
{
  "razorpay_order_id": "order_SlipDEhTteYiYk",
  "razorpay_payment_id": "pay_SlipDpEMt7uXrM",
  "razorpay_signature": "ee9f...c7a2"
}
```

**Response 200 (first time)**
```json
{ "message": "Payment verified. Premium activated!", "isPremium": true }
```

**Response 200 (replay)**
```json
{ "message": "Payment already processed", "isPremium": true }
```

**Errors**
- 400 Payment signature verification failed (forged or tampered)
- 404 Order not found (orderId never created or belongs to a different user)

---

## Premium (`/api/premium`) — auth + isPremium required

`requirePremium` middleware gates the whole prefix. Non-premium users get 403.

### `GET /api/premium/leaderboard`
Top spenders, all-time, descending.

**Response 200**
```json
{
  "leaderboard": [
    { "id": 3, "name": "Jane",  "totalSpend": 120000 },
    { "id": 7, "name": "Jatin", "totalSpend":  80000 },
    { "id": 9, "name": "Asha",  "totalSpend":      0 }
  ]
}
```
`totalSpend` is in paise. Users with zero expenses still appear (LEFT JOIN).

---

### `GET /api/premium/report`
Generate a CSV of the calling user's expenses.

```bash
curl http://localhost:3000/api/premium/report \
     -H "Authorization: Bearer $TOKEN"
```

**Response 200**
```json
{
  "message": "Report generated",
  "fileUrl": "/uploads/reports_1778023456789_abc123_expenses_7_1778023456789.csv",
  "rowCount": 42
}
```

The CSV columns are `Date,Description,Category,Kind,Amount`. `Amount` is rupees (e.g. `500.00`).

In `STORAGE_DRIVER=local`, `fileUrl` is served by the static `/uploads` route. In `STORAGE_DRIVER=s3` it's an absolute S3 URL.

**Errors**
- 403 Premium membership required
- 404 No expenses to export

---

### `GET /api/premium/report/history`
Last 50 reports the user has generated.

**Response 200**
```json
{
  "history": [
    {
      "id": 12,
      "userId": 7,
      "fileUrl": "/uploads/reports_...csv",
      "rowCount": 42,
      "sizeBytes": 2345,
      "createdAt": "2026-05-10T12:34:56.000Z"
    }
  ]
}
```

---

## Files (`/api/...`) — auth required

### `GET /api/receipts/upload-url?filename=&filetype=`
Returns either a presigned S3 PUT URL (prod) or a local upload URL (dev). Both have the same shape.

```bash
curl "http://localhost:3000/api/receipts/upload-url?filename=lunch.jpg&filetype=image/jpeg" \
     -H "Authorization: Bearer $TOKEN"
```

**Response 200 (s3 driver)**
```json
{
  "url": "https://my-bucket.s3.ap-south-1.amazonaws.com/...",
  "fileUrl": "https://my-bucket.s3.ap-south-1.amazonaws.com/receipts/...",
  "key": "receipts/1778023456789_abc123_lunch.jpg",
  "method": "PUT",
  "maxBytes": 10485760
}
```

**Response 200 (local driver)**
```json
{
  "url": "/api/files/upload?key=receipts%2F...lunch.jpg",
  "fileUrl": "/uploads/...lunch.jpg",
  "key": "receipts/1778023456789_abc123_lunch.jpg",
  "method": "PUT",
  "maxBytes": 10485760
}
```

**Errors**
- 400 filename or filetype missing / unsupported mime

Allowed mime types and caps:

| Mime               | Max bytes  |
|--------------------|------------|
| image/jpeg         | 10 MB      |
| image/png          | 10 MB      |
| image/webp         | 10 MB      |
| application/pdf    | 25 MB      |
| text/csv           | 25 MB      |

---

### `PUT /api/files/upload?key=...`
**Local driver only.** Browser PUTs raw bytes here for local development. In `s3` mode this returns 404.

```bash
curl -X PUT "http://localhost:3000/api/files/upload?key=receipts/...lunch.jpg" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: image/jpeg" \
     --data-binary @lunch.jpg
```

**Response 200**
```json
{ "message": "uploaded", "fileUrl": "/uploads/...lunch.jpg" }
```

**Errors**
- 400 missing key / empty body / over size cap
- 400 invalid key (path traversal attempt)
- 404 Not found (when `STORAGE_DRIVER=s3`)

---

## Status code summary

| Code | When it appears                                         |
|------|---------------------------------------------------------|
| 200  | Success on read / update / verified replay              |
| 201  | Resource created (signup, expense)                      |
| 400  | Validation failed; bad signature; invalid key           |
| 401  | Missing / invalid / expired JWT                         |
| 403  | Authenticated but lacks premium membership              |
| 404  | Resource not found                                       |
| 409  | Email already in use                                     |
| 429  | Rate limit exceeded                                      |
| 500  | Unhandled exception (logged with full stack server-side) |

---

## Auth header tip — getting a token quickly

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}' \
  | jq -r .token)

curl http://localhost:3000/api/expenses -H "Authorization: Bearer $TOKEN" | jq .
```
