
require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");

// Faris's database and appointment routes
const db = require("./database");
const { createClinicRouter } = require("./routes/clinic");

// Elister's authentication middleware
const { requireAuth, requireRole } = require("./middleware/auth");

const app = express();

// Allow the server to receive JSON data
app.use(express.json());

// Allow the server to read authentication cookies
app.use(cookieParser());

// Connect authentication routes
app.use("/api/auth", authRoutes);

// Connect clinic appointment routes
app.use("/api", createClinicRouter({
    db,
    requireAuth,
    requireRole
}));

// Test route
app.get("/", (req, res) => {
    res.send("Clinic Appointment API is running!");
});

// JSON error handler
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;

    if (status >= 500) {
        console.error(err);
    }

    res.status(status).json({
        message: status >= 500
            ? "Something went wrong on the server."
            : err.message
    });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
