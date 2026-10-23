const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    errors?: string[];
} & T;

async function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const errors = data.errors as string[] | undefined;
        throw new Error(errors?.join(" ") || data.message || "Request failed.");
    }

    return data as ApiResponse<T>;
}

export interface BookingPayload {
    name: string;
    address: string;
    phone: string;
    date: string;
    time: string;
    service: string;
    message: string;
}

export interface ContactPayload {
    name: string;
    email: string;
    message: string;
}

export interface SlotState {
    time: string;
    available: boolean;
    reason?: "booked" | "too_close" | "day_full";
}

export interface Availability {
    date: string;
    maxPerDay: number;
    freeHoursBetween: number;
    fullyBooked: boolean;
    slots: SlotState[];
}

// Public: which times are still free on a given day (YYYY-MM-DD).
export async function fetchAvailability(date: string): Promise<Availability> {
    const res = await fetch(
        `${API_URL}/bookings/availability?date=${encodeURIComponent(date)}`
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || "Could not load available times.");
    }
    return data as Availability;
}

export function createBooking(payload: BookingPayload) {
    return post<{ booking: unknown }>("/bookings", payload);
}

export function sendContactMessage(payload: ContactPayload) {
    return post<{ entry: unknown }>("/contact", payload);
}

// ---- Admin ----

export interface Booking {
    id: string;
    createdAt: string;
    name: string;
    address: string;
    phone: string;
    date: string;
    time: string;
    service: string;
    message: string;
    status: "pending" | "confirmed" | "done" | "cancelled";
}

export interface ContactMessage {
    id: string;
    createdAt: string;
    name: string;
    email: string;
    message: string;
}

export interface AdminCreds {
    username: string;
    password: string;
}

const ADMIN_CREDS_STORAGE = "cleanpro_admin_creds";

export function getStoredAdminCreds(): AdminCreds | null {
    const raw = localStorage.getItem(ADMIN_CREDS_STORAGE);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as AdminCreds;
    } catch {
        return null;
    }
}

export function storeAdminCreds(creds: AdminCreds) {
    localStorage.setItem(ADMIN_CREDS_STORAGE, JSON.stringify(creds));
}

export function clearAdminCreds() {
    localStorage.removeItem(ADMIN_CREDS_STORAGE);
}

function adminHeaders(creds: AdminCreds) {
    return {
        "x-admin-user": creds.username,
        "x-admin-key": creds.password
    };
}

async function adminGet<T>(path: string, creds: AdminCreds): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_URL}${path}`, { headers: adminHeaders(creds) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || "Request failed.");
    }
    return data as ApiResponse<T>;
}

export async function adminLogin(creds: AdminCreds): Promise<boolean> {
    const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: adminHeaders(creds)
    });

    if (res.ok) return true;

    // Surface the server's real message (e.g. ".env not set" vs "wrong
    // password") instead of always saying "wrong password".
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Login failed (HTTP ${res.status}).`);
}

export function fetchBookings(creds: AdminCreds) {
    return adminGet<{ bookings: Booking[]; count: number }>("/bookings", creds);
}

export function fetchContacts(creds: AdminCreds) {
    return adminGet<{ contacts: ContactMessage[]; count: number }>("/contact", creds);
}

export async function updateBookingStatus(
    creds: AdminCreds,
    id: string,
    status: Booking["status"]
): Promise<Booking> {
    const res = await fetch(`${API_URL}/bookings/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...adminHeaders(creds)
        },
        body: JSON.stringify({ status })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || "Request failed.");
    }
    return data.booking as Booking;
}
