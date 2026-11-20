# Faris - database & CRUD integration

These files are additions to Elister's existing repo. **Do not replace** his `server/database.js`, `server/schema.sql`, `server/server.js`, `server/package.json`, `server/routes/auth.js`, or `server/clinic.db`.

## Install your part

1. Copy `server/db/` and `server/routes/clinic.js` to the matching paths in the **team repo**.
2. In the repository's `server` directory run `node db/setup-clinic.js`.
3. After Elister creates doctor-role users `maya@clinic.test`, `nino@clinic.test` and a patient account, run `node db/setup-clinic.js --seed`. Passwords/accounts are Elister's responsibility. This is repeatable for table creation; sample slots use a date 7 days in the future.
4. Elister must mount the router after he implements real authentication. The example below is **integration guidance**, not code to run until he supplies the middleware.

```js
const db = require('./database');
const { createClinicRouter } = require('./routes/clinic');
const { requireAuth, requireRole } = require('./middleware/auth'); // path to be agreed with Elister
app.use('/api', createClinicRouter({db, requireAuth, requireRole}));
```

`requireAuth` must attach `req.user = {id: Number, role: 'patient'|'doctor'|'admin'}`. `requireRole('doctor','admin')` etc. must block unauthorized actions on the server. Elister chooses the token / JWT implementation. Express 5 error handling should send appropriate error status and message.

## Useful endpoints

- GET `/api/specialties`, GET `/api/doctors`
- GET `/api/slots`, GET `/api/slots/:id`
- POST `/api/slots`, PUT `/api/slots/:id`, DELETE `/api/slots/:id` (doctor/admin)
- GET `/api/appointments`, GET `/api/appointments/:id`
- POST `/api/appointments` (patient)
- PUT `/api/appointments/:id` (patient/admin)
- DELETE `/api/appointments/:id` (cancel, patient/admin)
- PATCH `/api/appointments/:id/done` (doctor/admin)
- GET `/api/doctors/:id/schedule?date=YYYY-MM-DD` (doctor/admin)

Timestamps are UTC ISO (`2026-11-27T09:00:00.000Z`). Booking two active appointments in the same slot is rejected, and cancellation within 24 hours is rejected. No real JWT, registration, or UI is supplied in this package.

## Do not commit

`node_modules/`, `.env`, `server/clinic.db`, any `*.sqlite` or database WAL/SHM files. Keep source `schema.sql`/`clinic-schema.sql` and scripts committed.

## Integration note

Do not commit `clinic.db` already included in Elister's ZIP; it contains local account records. Consider adding it to the team `.gitignore`. Before the live demo, test real authorized requests, denied requests, and appointment flows in the integrated server. This package has not been end-to-end verified against Elister's future JWT middleware.
