# Clinic Appointment Booking

Clinic Appointment Booking System - Web Programming Project. Patients find doctors, book free time slots and cancel or reschedule up to 24 hours before a visit; doctors publish their availability, see their schedule and mark visits as done.

## Design

Figma: https://www.figma.com/design/Aj59Hpj8ZxFXFknzC0Cxa1/Clinic-Appointment-Booking

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express (REST API)
- Database: SQLite (better-sqlite3)
- Auth: bcrypt, JWT in an HttpOnly cookie, roles checked on the server

## Backend setup

Use Node.js 24 LTS. On Windows, npm install needs Visual Studio with the "Desktop development with C++" workload.

1. cd server
2. npm install
3. copy .env.example to .env and set JWT_SECRET to a long random string
4. npm run seed
5. node db/setup-clinic.js
6. node db/setup-clinic.js --seed
7. npm run dev

The server runs at http://localhost:5000

## Frontend setup

1. cd frontend
2. npm install
3. npm run dev

Open http://localhost:5173 (start the backend first).

## Test accounts (demo only)

| Role    | Email               | Password      |
|---------|---------------------|---------------|
| Admin   | admin@clinic.test   | Admin12345!   |
| Doctor  | maya@clinic.test    | Doctor12345!  |
| Doctor  | nino@clinic.test    | Doctor12345!  |
| Patient | patient@clinic.test | Patient12345! |

API documentation: see API.md