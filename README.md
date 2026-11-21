# Clinic Appointment Booking

Clinic Appointment Booking System - Web Programming Project

## Backend setup

1. cd server
2. npm install (if it fails on Windows with a Python error, use: npm install --ignore-scripts)
3. copy .env.example to .env and set JWT_SECRET to a long random string
4. npm run seed
5. npm run dev

The server runs at http://localhost:5000

## Test accounts (demo only)

| Role    | Email               | Password      |
|---------|---------------------|---------------|
| Admin   | admin@clinic.test   | Admin12345!   |
| Doctor  | maya@clinic.test    | Doctor12345!  |
| Doctor  | nino@clinic.test    | Doctor12345!  |
| Patient | patient@clinic.test | Patient12345! |

API documentation: see API.md