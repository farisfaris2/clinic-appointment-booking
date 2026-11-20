
const express = require("express");
const authRoutes = require("./routes/auth");

const app = express();

// Allow the server to receive JSON data
app.use(express.json());

// Connect authentication routes
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("Clinic Appointment API is running!");
});

// Start server
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
