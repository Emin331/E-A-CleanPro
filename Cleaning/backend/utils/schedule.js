// Booking rules in ONE place — change the numbers here and both the
// availability endpoint and the booking check follow.

// Bookable start times (must match what the customer sees in the form).
export const SLOTS = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

// At most this many bookings per calendar day.
export const MAX_BOOKINGS_PER_DAY = 2;

// Free hours that must separate two bookings on the same day.
// 3 → a 10:00 booking blocks 11:00, 12:00 and 13:00; 14:00 is the next
// possible start. (The same gap applies before it: 09:00 is blocked too.)
export const FREE_HOURS_BETWEEN = 3;

const MIN_START_DIFF_MINUTES = (FREE_HOURS_BETWEEN + 1) * 60;

// "01:00 PM" → 780 (minutes since midnight). Returns null if unreadable.
export function timeToMinutes(text) {
    const m = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i.exec(String(text || ""));
    if (!m) return null;
    let hours = Number(m[1]) % 12;
    if (m[3].toUpperCase() === "PM") hours += 12;
    return hours * 60 + Number(m[2]);
}

export function isValidDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return false;
    const d = new Date(`${date}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

// Cancelled bookings free up their slot; everything else still counts.
function activeOn(bookings, date) {
    return bookings.filter((b) => b.date === date && b.status !== "cancelled");
}

// Returns every slot for the day with { time, available, reason? }.
// reason: "booked" | "too_close" | "day_full"
export function getSlotStates(bookings, date) {
    const active = activeOn(bookings, date);
    const taken = active.map((b) => timeToMinutes(b.time)).filter((m) => m !== null);
    const dayFull = active.length >= MAX_BOOKINGS_PER_DAY;

    return SLOTS.map((time) => {
        const minutes = timeToMinutes(time);

        if (taken.includes(minutes)) {
            return { time, available: false, reason: "booked" };
        }
        if (dayFull) {
            return { time, available: false, reason: "day_full" };
        }
        if (taken.some((t) => Math.abs(t - minutes) < MIN_START_DIFF_MINUTES)) {
            return { time, available: false, reason: "too_close" };
        }
        return { time, available: true };
    });
}

export function reasonMessage(reason) {
    switch (reason) {
        case "day_full":
            return `This day is fully booked (max ${MAX_BOOKINGS_PER_DAY} bookings per day). Please choose another date.`;
        case "too_close":
            return `That time is too close to another booking — bookings must be at least ${FREE_HOURS_BETWEEN} hours apart. Please choose another time.`;
        default:
            return "That time is already booked. Please choose another time.";
    }
}
