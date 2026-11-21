
const jwt = require("jsonwebtoken");
const db = require("../database");

// ==========================================
// requireAuth
// Checks whether the user is logged in
// ==========================================

function requireAuth(req, res, next) {
    try {
        // Get JWT from the authentication cookie
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                message: "Authentication required. Please log in."
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Get current user details from SQLite
        const user = db.prepare(`
            SELECT id, full_name, email, role
            FROM users
            WHERE id = ?
        `).get(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: "User account not found."
            });
        }

        // Attach user information to the request
        req.user = user;

        // Allow request to continue
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired authentication token."
        });
    }
}


// ==========================================
// requireRole
// Checks whether the user has permission
// ==========================================

function requireRole(...allowedRoles) {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission to access this resource."
            });
        }

        next();
    };
}


// Export middleware functions
module.exports = {
    requireAuth,
    requireRole
};
