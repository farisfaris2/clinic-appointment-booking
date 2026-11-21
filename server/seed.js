// Seed script: creates 1 admin, 2 doctors and 1 patient.
// Run from the server folder with: node seed.js
// Safe to run more than once: existing emails are skipped.
//
// The two doctor emails match what Faris's db/setup-clinic.js --seed expects,
// so run this FIRST, then run: node db/setup-clinic.js --seed

const bcrypt = require("bcrypt");
const db = require("./database");

const SALT_ROUNDS = 12;

const seedUsers = [
    {
        full_name: "Sarah Thompson",
        email: "admin@clinic.test",
        password: "Admin12345!",
        role: "admin"
    },
    {
        full_name: "Dr. Maya Reyes",
        email: "maya@clinic.test",
        password: "Doctor12345!",
        role: "doctor"
    },
    {
        full_name: "Dr. Nino Beridze",
        email: "nino@clinic.test",
        password: "Doctor12345!",
        role: "doctor"
    },
    {
        full_name: "Michael Brown",
        email: "patient@clinic.test",
        password: "Patient12345!",
        role: "patient"
    }
];

const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (full_name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
`);

for (const user of seedUsers) {
    // Hash the password: the plain text is never stored
    const passwordHash = bcrypt.hashSync(user.password, SALT_ROUNDS);

    const result = insertUser.run(
        user.full_name,
        user.email.toLowerCase(),
        passwordHash,
        user.role
    );

    if (result.changes === 1) {
        console.log(`Created ${user.role}: ${user.email}`);
    } else {
        console.log(`Skipped ${user.role}: ${user.email} (already exists)`);
    }
}

console.log("Seeding finished.");
