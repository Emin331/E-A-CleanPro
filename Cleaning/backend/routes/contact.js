import { Router } from "express";
import { appendOne, readAll } from "../utils/jsonStore.js";
import { requireAdmin } from "../utils/adminAuth.js";

const router = Router();
const FILE = "contacts.json";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/", async (req, res) => {
    const { name, email, message } = req.body || {};
    const errors = [];

    if (!name || !name.trim()) errors.push("Name is required.");
    if (!email || !EMAIL_RE.test(email)) errors.push("A valid email is required.");
    if (!message || !message.trim()) errors.push("Message is required.");

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    const entry = await appendOne(FILE, {
        name: name.trim(),
        email: email.trim(),
        message: message.trim()
    });

    return res.status(201).json({
        success: true,
        message: "Thanks for reaching out! We'll get back to you shortly.",
        entry
    });
});

router.get("/", requireAdmin, async (_req, res) => {
    const contacts = await readAll(FILE);
    contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, count: contacts.length, contacts });
});

export default router;
