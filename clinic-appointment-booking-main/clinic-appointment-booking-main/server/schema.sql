
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'patient'
        CHECK (role IN ('patient', 'doctor', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
