# Faris - Files to ADD to the team repository

This folder contains **only your missing database and CRUD contribution**, adapted to Elister's uploaded server. Copy the two folders `server/db/` and `server/routes/` into their matching locations in the team repository. They do not replace existing files. Also copy `docs/` if desired.

- `server/db/clinic-schema.sql`: four additional relational tables and indexes; no `users` table duplication.
- `server/db/setup-clinic.js`: creates these tables in Elister's existing `server/clinic.db`, and can add demo specialty/doctor/slot records after doctor-role accounts exist.
- `server/routes/clinic.js`: slot CRUD, appointment CRUD, double-book prevention, 24-hour cancellation, schedules.
- `docs/FARIS-API-INTEGRATION.md`: steps for Elister to mount the routes after he provides authentication.

**Run after copying** from the team repository's `server` folder:

```powershell
node db/setup-clinic.js
```

Once Elister has inserted doctor users:

```powershell
node db/setup-clinic.js --seed
```

This is not a separate standalone server. No changes to Elister's existing source files are included. Use a separate Git branch/pull request.
