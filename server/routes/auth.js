const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

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

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address."
            });
        }

        if (
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and no more than 72 bytes."
            });
        }

        const existingUser = db.prepare(
            "SELECT id FROM users WHERE email = ?"
        ).get(normalizedEmail);

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = db.prepare(`
            INSERT INTO users (full_name, email, password_hash, role)
            VALUES (?, ?, ?, 'patient')
        `).run(name, normalizedEmail, passwordHash);

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


// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Please provide your email and password."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find the user
        const user = db.prepare(
            "SELECT * FROM users WHERE email = ?"
        ).get(normalizedEmail);

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // Compare entered password with stored password hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // Make sure the JWT secret exists
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from .env");
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        // Send token in an HttpOnly cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Login successful!",
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Something went wrong while logging in."
        });
    }
});


// POST /api/auth/logout
router.post("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    return res.status(200).json({
        message: "Logout successful!"
    });
});

// ==========================================
// GET /api/auth/me
// Get currently logged-in user
// ==========================================

router.get("/me", requireAuth, (req, res) => {
    return res.status(200).json({
        user: req.user
    });
});

// TEMPORARY ROUTE: Test doctor-only access
router.get("/doctor-test", requireAuth, requireRole("doctor"), (req, res) => {
    res.status(200).json({
        message: "Welcome, doctor! You have access."
    });
});

// TEMPORARY ROUTE: Test admin-only access
router.get("/admin-test", requireAuth, requireRole("admin"), (req, res) => {
    res.status(200).json({
        message: "Welcome, admin! You have access."
    });
});

module.exports = router;
