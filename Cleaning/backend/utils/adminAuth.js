// Very simple username + password protection for the admin views.
// The frontend sends these back on every request as headers
// "x-admin-user" and "x-admin-key"; we compare them to ADMIN_USERNAME /
// ADMIN_PASSWORD from .env. Good enough for a small business site run by
// one or two people — swap for real auth (sessions/JWT) if this grows.
export function requireAdmin(req, res, next) {
    const providedUser = req.header("x-admin-user");
    const providedPass = req.header("x-admin-key");
    const expectedUser = process.env.ADMIN_USERNAME;
    const expectedPass = process.env.ADMIN_PASSWORD;

    if (!expectedUser || !expectedPass) {
        return res.status(500).json({
            success: false,
            message: "ADMIN_USERNAME / ADMIN_PASSWORD is not set on the server (.env)."
        });
    }

    if (providedUser !== expectedUser || providedPass !== expectedPass) {
        return res.status(401).json({ success: false, message: "Wrong username or password." });
    }

    next();
}
