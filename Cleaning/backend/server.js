import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import bookingsRouter from "./routes/bookings.js";
import contactRouter from "./routes/contact.js";
import { requireAdmin } from "./utils/adminAuth.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : "*";

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/bookings", bookingsRouter);
app.use("/api/contact", contactRouter);

// POST /api/admin/login — just confirms the password is correct
app.post("/api/admin/login", requireAdmin, (_req, res) => {
    res.json({ success: true });
});

// 404 handler for unknown API routes
app.use("/api", (_req, res) => {
    res.status(404).json({ success: false, message: "Route not found." });
});

// --- Serve the built React frontend (my-app/dist) from this same server ---
// Run `npm run build` in my-app first (creates my-app/dist), then this
// backend serves the whole site on ONE port — no separate frontend server
// needed in production.
const FRONTEND_DIST = path.join(__dirname, "..", "my-app", "dist");

if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));

    // SPA fallback: any non-API route returns index.html
    app.get(/^(?!\/api).*/, (_req, res) => {
        res.sendFile(path.join(FRONTEND_DIST, "index.html"));
    });
} else {
    app.get("/", (_req, res) => {
        res.send(
            "Frontend build not found. Run 'npm run build' in my-app/, or run the " +
            "frontend separately with 'npm run dev' on http://localhost:5173."
        );
    });
}

// Central error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error." });
});

app.listen(PORT, () => {
    console.log(`CleanPro server running at http://localhost:${PORT}`);
});
