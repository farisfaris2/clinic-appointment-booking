# Clinic Appointment API

Base URL (local): `http://localhost:5000`

All request and response bodies are JSON. Authentication uses a JWT stored in an **HttpOnly cookie** named `token`, so the browser sends it automatically.

## Quick facts

- Roles: `patient`, `doctor`, `admin`
- New registrations are always `patient`. Doctor and admin accounts come from seed data or an admin.
- Token lifetime: 1 hour
- Auth errors: `401` = not logged in or token invalid/expired, `403` = logged in but wrong role

### Frontend note

Because the token is a cookie, every fetch call must include credentials:

```js
fetch("http://localhost:5000/api/auth/me", { credentials: "include" });
```

If the frontend runs on a different origin, the server also needs `cors` configured with `credentials: true` and an explicit origin.

---

## Auth endpoints

### POST `/api/auth/register`

Create a patient account.

**Body**

```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "password": "at-least-8-chars"
}
```

**Rules**

- All three fields are required strings.
- Email must look like a valid email (stored lowercase).
- Password: at least 8 characters and at most 72 bytes.
- Any `role` sent by the client is ignored.

**Responses**

| Status | Meaning |
| --- | --- |
| 201 | Account created |
| 400 | Missing or invalid field |
| 409 | Email already registered |
| 500 | Server error |

**201 example**

```json
{
  "message": "Account created successfully!",
  "user": { "id": 1, "full_name": "Jane Doe", "email": "jane@example.com", "role": "patient" }
}
```

---

### POST `/api/auth/login`

Log in and receive the `token` cookie.

**Body**

```json
{ "email": "jane@example.com", "password": "at-least-8-chars" }
```

**Responses**

| Status | Meaning |
| --- | --- |
| 200 | Logged in, cookie set |
| 400 | Missing email or password |
| 401 | Wrong email or password (same message for both) |
| 500 | Server error |

**200 example**

```json
{
  "message": "Login successful!",
  "user": { "id": 1, "full_name": "Jane Doe", "email": "jane@example.com", "role": "patient" }
}
```

---

### POST `/api/auth/logout`

Clears the `token` cookie. No body needed.

**Response:** `200` with `{ "message": "Logout successful!" }`

---

### GET `/api/auth/me`

Returns the currently logged-in user. Use this on page load to restore the session.

**Requires:** logged in

**200 example**

```json
{
  "user": { "id": 1, "full_name": "Jane Doe", "email": "jane@example.com", "role": "patient" }
}
```

**401** if there is no cookie or the token is invalid or expired.

---

## Middleware

Both live in `server/middleware/auth.js`.

```js
const { requireAuth, requireRole } = require("../middleware/auth");
```

### `requireAuth`

Checks the `token` cookie, verifies the JWT, loads the user from the database and attaches it as `req.user`:

```js
req.user = { id, full_name, email, role }
```

Returns `401` if the token is missing, invalid or expired, or if the user no longer exists.

### `requireRole(...roles)`

Allows the request only if `req.user.role` is one of the listed roles. It accepts one or more roles. **Always put it after `requireAuth`.**

Returns `401` if `req.user` is not set, and `403` if the role is not allowed.

### Usage examples

```js
// Any logged-in user
router.get("/appointments/mine", requireAuth, handler);

// Doctors only
router.get("/appointments/schedule", requireAuth, requireRole("doctor"), handler);

// Patients or doctors
router.get("/slots", requireAuth, requireRole("patient", "doctor"), handler);

// Admins only
router.post("/doctors", requireAuth, requireRole("admin"), handler);
```

Inside a handler, use `req.user.id` and `req.user.role`:

```js
router.get("/appointments/mine", requireAuth, (req, res) => {
  const rows = db
    .prepare("SELECT * FROM appointments WHERE patient_id = ?")
    .all(req.user.id);
  res.json({ appointments: rows });
});
```

---

## Test routes (temporary)

Used to confirm role protection works. Remove before deploying.

| Route | Required role |
| --- | --- |
| GET `/api/auth/doctor-test` | doctor |
| GET `/api/auth/admin-test` | admin |

Expected results: `401` when logged out, `403` when logged in with the wrong role, `200` with a welcome message for the right role.

---

## Error format

Every error response has a single `message` field:

```json
{ "message": "You do not have permission to access this resource." }
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | Secret used to sign tokens (required, never commit the real value) |
| `PORT` | Server port (defaults to 5000) |
| `NODE_ENV` | Set to `production` to make the cookie `secure` (HTTPS only) |
