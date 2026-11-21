
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Connect to the database
const db = new Database(path.join(__dirname, "clinic.db"));

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Read our SQL schema
const schema = fs.readFileSync(
    path.join(__dirname, "schema.sql"),
    "utf8"
);

// Execute the SQL instructions
db.exec(schema);

console.log("Database connected and users table created!");

// Export database connection
module.exports = db;
