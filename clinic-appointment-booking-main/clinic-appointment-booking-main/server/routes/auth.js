const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../database");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        // 1. Check required fields
        if (
            typeof full_name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !full_name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Please provide your name, email and password."
            });
        }

        const name = full_name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        // 2. Validate email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address."
            });
        }

        // 3. Validate password
        if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and no more than 72 bytes."
            });
        }

        // 4. Check whether email already exists
        const existingUser = db.prepare(
            "SELECT id FROM users WHERE email = ?"
        ).get(normalizedEmail);

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        // 5. Hash the password
        const passwordHash = await bcrypt.hash(password, 12);

        // 6. Save the new user
        const result = db.prepare(`
            INSERT INTO users (full_name, email, password_hash, role)
            VALUES (?, ?, ?, 'patient')
        `).run(name, normalizedEmail, passwordHash);

        // 7. Return successful response
        return res.status(201).json({
            message: "Account created successfully!",
            user: {
                id: result.lastInsertRowid,
                full_name: name,
                email: normalizedEmail,
                role: "patient"
            }
        });

    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        return res.status(500).json({
            message: "Something went wrong while registering."
        });
    }
});

module.exports = router;
