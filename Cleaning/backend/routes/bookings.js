import { Router } from "express";
import { appendOne, readAll, updateOne } from "../utils/jsonStore.js";
import { requireAdmin } from "../utils/adminAuth.js";
import {
    FREE_HOURS_BETWEEN,
    MAX_BOOKINGS_PER_DAY,
    getSlotStates,
    isValidDate,
    reasonMessage
} from "../utils/schedule.js";

const router = Router();
const FILE = "bookings.json";


function validateBooking(body) {
    const errors = [];

    if (!body.name || !body.name.trim()) {
        errors.push("Name is required.");
    }

    if (!body.address || !body.address.trim()) {
        errors.push("Address is required.");
    }

    if (!body.date) {
        errors.push("Date is required.");
    } else if (!isValidDate(body.date)) {
        errors.push("Date must be in YYYY-MM-DD format.");
    }

    if (!body.time) {
        errors.push("Time is required.");
    }

    return errors;
}

// Booking check + save must happen one at a time, otherwise two customers
// sending the same slot at the same moment could both get through.
let queue = Promise.resolve();
function runExclusive(task) {
    const run = queue.then(task);
    queue = run.catch(() => {});
    return run;
}

// GET /api/bookings/availability?date=YYYY-MM-DD — which times are free
// (public; returns NO customer details, only slot states)
router.get("/availability", async (req, res, next) => {
    try {
        const { date } = req.query;

        if (!isValidDate(date)) {
            return res.status(400).json({
                success: false,
                message: "Query parameter 'date' is required (YYYY-MM-DD)."
            });
        }

        const bookings = await readAll(FILE);
        const slots = getSlotStates(bookings, date);

        res.json({
            success: true,
            date,
            maxPerDay: MAX_BOOKINGS_PER_DAY,
            freeHoursBetween: FREE_HOURS_BETWEEN,
            fullyBooked: slots.every((s) => !s.available),
            slots
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/bookings — create a new booking (public, customers use this)
router.post("/", async (req, res, next) => {
    try {
        const { name, address, phone, date, time, service, message } = req.body || {};

        const errors = validateBooking({ name, address, date, time });
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const outcome = await runExclusive(async () => {
            const bookings = await readAll(FILE);
            const slot = getSlotStates(bookings, date).find((s) => s.time === time);

            if (!slot) {
                return { status: 400, body: { success: false, errors: ["Please choose one of the listed times."] } };
            }

            if (!slot.available) {
                return { status: 409, body: { success: false, reason: slot.reason, message: reasonMessage(slot.reason) } };
            }

            const booking = await appendOne(FILE, {
                name: name.trim(),
                address: address.trim(),
                phone: phone ? phone.trim() : "",
                date,
                time,
                service: service || "House Cleaning",
                message: message ? message.trim() : "",
                status: "pending"
            });

            return {
                status: 201,
                body: {
                    success: true,
                    message: `Booking received! ${booking.name} is scheduled for ${booking.date} at ${booking.time}.`,
                    booking
                }
            };
        });

        return res.status(outcome.status).json(outcome.body);
    } catch (err) {
        next(err);
    }
});

// GET /api/bookings — list all bookings (admin only)
router.get("/", requireAdmin, async (_req, res) => {
    const bookings = await readAll(FILE);
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, count: bookings.length, bookings });
});

// PATCH /api/bookings/:id — update a booking's status (admin only)
router.patch("/:id", requireAdmin, async (req, res) => {
    const { status } = req.body || {};
    const allowed = ["pending", "confirmed", "done", "cancelled"];

    if (!allowed.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Status must be one of: ${allowed.join(", ")}`
        });
    }

    const updated = await updateOne(FILE, req.params.id, { status });

    if (!updated) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    res.json({ success: true, booking: updated });
});

export default router;
