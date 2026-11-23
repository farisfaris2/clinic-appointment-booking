-- Faris: extra clinic tables only. The users table belongs to Elister.
CREATE TABLE IF NOT EXISTS specialties (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS doctor_profiles (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
 specialty_id INTEGER NOT NULL REFERENCES specialties(id) ON DELETE RESTRICT,
 bio TEXT NOT NULL DEFAULT '',
 room TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS time_slots (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 doctor_id INTEGER NOT NULL REFERENCES doctor_profiles(id) ON DELETE RESTRICT,
 start_at TEXT NOT NULL,
 end_at TEXT NOT NULL,
 CHECK(end_at > start_at),
 UNIQUE(doctor_id,start_at)
);
CREATE TABLE IF NOT EXISTS appointments (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 slot_id INTEGER NOT NULL REFERENCES time_slots(id) ON DELETE RESTRICT,
 patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 status TEXT NOT NULL DEFAULT 'booked' CHECK(status IN ('booked','cancelled','done')),
 notes TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 cancelled_at TEXT
);
-- Cancelled records stay for audit; at most one active appointment per slot.
CREATE UNIQUE INDEX IF NOT EXISTS one_active_booking_per_slot
 ON appointments(slot_id) WHERE status IN ('booked','done');
CREATE INDEX IF NOT EXISTS idx_slots_doctor_start ON time_slots(doctor_id,start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
