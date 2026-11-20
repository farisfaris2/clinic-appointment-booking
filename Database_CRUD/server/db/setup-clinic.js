// Faris: add clinic tables to Elister's existing database (server/clinic.db).
const fs = require('fs');
const path = require('path');
const db = require('../database');

// Elister's database.js creates the users table and enables foreign keys.
db.exec(fs.readFileSync(path.join(__dirname, 'clinic-schema.sql'), 'utf8'));
console.log('Clinic tables ready in the shared clinic.db');

if (process.argv.includes('--seed')) {
  // No user creation here. Elister owns accounts and password hashing.
  const insertSpecialty = db.prepare('INSERT OR IGNORE INTO specialties(name) VALUES (?)');
  ['Family Medicine', 'Dermatology', 'Cardiology'].forEach(name => insertSpecialty.run(name));
  const addDoctor = db.prepare(`INSERT OR IGNORE INTO doctor_profiles(user_id,specialty_id,bio,room)
    SELECT u.id, s.id, ?, ? FROM users u JOIN specialties s ON s.name=?
    WHERE u.email=? AND u.role='doctor'`);
  addDoctor.run('General consultations and preventative care', 'A12', 'Family Medicine', 'maya@clinic.test');
  addDoctor.run('Skin care consultations', 'B04', 'Dermatology', 'nino@clinic.test');

  // Add future demo slots, only for existing doctor accounts.
  const slot = db.prepare(`INSERT OR IGNORE INTO time_slots(doctor_id,start_at,end_at)
    SELECT d.id, ?, ? FROM doctor_profiles d JOIN users u ON u.id=d.user_id
    WHERE u.email=? AND u.role='doctor'`);
  const base = new Date();
  base.setUTCDate(base.getUTCDate()+7);
  base.setUTCHours(9,0,0,0);
  const iso = d => d.toISOString();
  const addSlot = (email, hour) => {
    const start = new Date(base.getTime()+hour*3600000);
    const end = new Date(start.getTime()+3600000);
    slot.run(iso(start),iso(end),email);
  };
  addSlot('maya@clinic.test',0);
  addSlot('maya@clinic.test',1);
  addSlot('nino@clinic.test',2);
  console.log('Seed completed. Doctor profiles/slots appear only if doctor users exist.');
}
