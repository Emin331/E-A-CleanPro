import { useEffect, useState, type FormEvent, type CSSProperties } from "react";
import {
    adminLogin,
    clearAdminCreds,
    fetchBookings,
    fetchContacts,
    getStoredAdminCreds,
    storeAdminCreds,
    updateBookingStatus,
    type AdminCreds,
    type Booking,
    type ContactMessage
} from "./api";

const STATUS_COLORS: Record<Booking["status"], string> = {
    pending: "#f0ad4e",
    confirmed: "#19a56a",
    done: "#3b82f6",
    cancelled: "#c0392b"
};

function LoginScreen({ onLoggedIn }: { onLoggedIn: (creds: AdminCreds) => void }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const creds: AdminCreds = { username, password };

        try {
            await adminLogin(creds);
            storeAdminCreds(creds);
            onLoggedIn(creds);
        } catch (err) {
            if (err instanceof TypeError) {
                // fetch() itself threw: wrong URL, CORS, or backend not running.
                setError(
                    "Could not reach the server. Check that the backend is running and VITE_API_URL is set correctly."
                );
            } else {
                setError(err instanceof Error ? err.message : "Login failed.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.loginWrap}>
            <form onSubmit={handleSubmit} style={styles.loginBox}>
                <h1 style={{ marginBottom: 4 }}>CleanPro Admin</h1>
                <p style={{ color: "#666", marginBottom: 20 }}>
                    Log in to view bookings and messages.
                </p>

                <label style={styles.label}>Name</label>
                <input
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                    autoFocus
                />

                <label style={styles.label}>Password</label>
                <div style={styles.passwordWrap}>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ ...styles.input, marginBottom: 0, paddingRight: 42 }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        style={styles.eyeButton}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? "🙈" : "👁️"}
                    </button>
                </div>

                <button type="submit" style={{ ...styles.button, marginTop: 20 }} disabled={loading}>
                    {loading ? "Checking..." : "Log in"}
                </button>
                {error && <p style={{ color: "#c0392b", marginTop: 12 }}>{error}</p>}
            </form>
        </div>
    );
}

const PAGE_SIZE = 20;

function Dashboard({ creds, onLogout }: { creds: AdminCreds; onLogout: () => void }) {
    const [tab, setTab] = useState<"bookings" | "contacts">("bookings");
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [contacts, setContacts] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [bookingSearch, setBookingSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | Booking["status"]>("all");
    const [bookingPage, setBookingPage] = useState(1);

    const [contactSearch, setContactSearch] = useState("");
    const [contactPage, setContactPage] = useState(1);

    async function load() {
        setLoading(true);
        setError("");
        try {
            const [bRes, cRes] = await Promise.all([
                fetchBookings(creds),
                fetchContacts(creds)
            ]);
            setBookings(bRes.bookings);
            setContacts(cRes.contacts);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load data.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleStatusChange(id: string, status: Booking["status"]) {
        try {
            const updated = await updateBookingStatus(creds, id, status);
            setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update status.");
        }
    }

    const filteredBookings = bookings.filter((b) => {
        const matchesStatus = statusFilter === "all" || b.status === statusFilter;
        const q = bookingSearch.trim().toLowerCase();
        const matchesSearch =
            !q ||
            b.name.toLowerCase().includes(q) ||
            (b.phone || "").toLowerCase().includes(q) ||
            (b.address || "").toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
    });
    const bookingTotalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
    const bookingPageSafe = Math.min(bookingPage, bookingTotalPages);
    const pagedBookings = filteredBookings.slice(
        (bookingPageSafe - 1) * PAGE_SIZE,
        bookingPageSafe * PAGE_SIZE
    );

    const filteredContacts = contacts.filter((c) => {
        const q = contactSearch.trim().toLowerCase();
        return (
            !q ||
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.message.toLowerCase().includes(q)
        );
    });
    const contactTotalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
    const contactPageSafe = Math.min(contactPage, contactTotalPages);
    const pagedContacts = filteredContacts.slice(
        (contactPageSafe - 1) * PAGE_SIZE,
        contactPageSafe * PAGE_SIZE
    );

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <h1 style={{ margin: 0 }}>CleanPro Admin</h1>
                <div>
                    <span style={{ marginRight: 12, color: "#666" }}>
                        Logged in as <strong>{creds.username}</strong>
                    </span>
                    <button style={styles.smallButton} onClick={load}>
                        Refresh
                    </button>
                    <button style={{ ...styles.smallButton, marginLeft: 8 }} onClick={onLogout}>
                        Log out
                    </button>
                </div>
            </header>

            <div style={styles.tabs}>
                <button
                    style={tab === "bookings" ? styles.tabActive : styles.tab}
                    onClick={() => setTab("bookings")}
                >
                    Bookings ({bookings.length})
                </button>
                <button
                    style={tab === "contacts" ? styles.tabActive : styles.tab}
                    onClick={() => setTab("contacts")}
                >
                    Messages ({contacts.length})
                </button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "#c0392b" }}>{error}</p>}

            {!loading && !error && tab === "bookings" && (
                <>
                    <div style={styles.filterBar}>
                        <input
                            type="text"
                            placeholder="Search by name, phone, or address…"
                            value={bookingSearch}
                            onChange={(e) => {
                                setBookingSearch(e.target.value);
                                setBookingPage(1);
                            }}
                            style={styles.filterInput}
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as "all" | Booking["status"]);
                                setBookingPage(1);
                            }}
                            style={styles.filterSelect}
                        >
                            <option value="all">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="done">Done</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <span style={styles.resultCount}>
                            {filteredBookings.length} result{filteredBookings.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    <div style={styles.tableWrap}>
                        {filteredBookings.length === 0 ? (
                            <p style={{ padding: 20 }}>No bookings match.</p>
                        ) : (
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Name</th>
                                        <th style={styles.th}>Contact</th>
                                        <th style={styles.th}>Address</th>
                                        <th style={styles.th}>Date / Time</th>
                                        <th style={styles.th}>Service</th>
                                        <th style={styles.th}>Message</th>
                                        <th style={styles.th}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedBookings.map((b) => (
                                        <tr key={b.id}>
                                            <td style={styles.td}>{b.name}</td>
                                            <td style={styles.td}>
                                                {b.phone}
                                            </td>
                                            <td style={styles.td}>{b.address}</td>
                                            <td style={styles.td}>
                                                {b.date} <br /> {b.time}
                                            </td>
                                            <td style={styles.td}>{b.service}</td>
                                            <td style={styles.td}>{b.message || "—"}</td>
                                            <td style={styles.td}>
                                                <select
                                                    value={b.status}
                                                    onChange={(e) =>
                                                        handleStatusChange(
                                                            b.id,
                                                            e.target.value as Booking["status"]
                                                        )
                                                    }
                                                    style={{
                                                        ...styles.statusSelect,
                                                        color: STATUS_COLORS[b.status]
                                                    }}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="done">Done</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {bookingTotalPages > 1 && (
                        <div style={styles.pagination}>
                            <button
                                style={styles.smallButton}
                                onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                                disabled={bookingPageSafe <= 1}
                            >
                                ← Prev
                            </button>
                            <span>
                                Page {bookingPageSafe} / {bookingTotalPages}
                            </span>
                            <button
                                style={styles.smallButton}
                                onClick={() =>
                                    setBookingPage((p) => Math.min(bookingTotalPages, p + 1))
                                }
                                disabled={bookingPageSafe >= bookingTotalPages}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}

            {!loading && !error && tab === "contacts" && (
                <>
                    <div style={styles.filterBar}>
                        <input
                            type="text"
                            placeholder="Search by name, email, or message…"
                            value={contactSearch}
                            onChange={(e) => {
                                setContactSearch(e.target.value);
                                setContactPage(1);
                            }}
                            style={styles.filterInput}
                        />
                        <span style={styles.resultCount}>
                            {filteredContacts.length} result{filteredContacts.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    <div style={styles.tableWrap}>
                        {filteredContacts.length === 0 ? (
                            <p style={{ padding: 20 }}>No messages match.</p>
                        ) : (
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Name</th>
                                        <th style={styles.th}>Email</th>
                                        <th style={styles.th}>Message</th>
                                        <th style={styles.th}>Received</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedContacts.map((c) => (
                                        <tr key={c.id}>
                                            <td style={styles.td}>{c.name}</td>
                                            <td style={styles.td}>{c.email}</td>
                                            <td style={styles.td}>{c.message}</td>
                                            <td style={styles.td}>
                                                {new Date(c.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {contactTotalPages > 1 && (
                        <div style={styles.pagination}>
                            <button
                                style={styles.smallButton}
                                onClick={() => setContactPage((p) => Math.max(1, p - 1))}
                                disabled={contactPageSafe <= 1}
                            >
                                ← Prev
                            </button>
                            <span>
                                Page {contactPageSafe} / {contactTotalPages}
                            </span>
                            <button
                                style={styles.smallButton}
                                onClick={() =>
                                    setContactPage((p) => Math.min(contactTotalPages, p + 1))
                                }
                                disabled={contactPageSafe >= contactTotalPages}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function AdminApp() {
    const [creds, setCreds] = useState<AdminCreds | null>(null);

    useEffect(() => {
        const stored = getStoredAdminCreds();
        if (stored) setCreds(stored);
    }, []);

    if (!creds) {
        return <LoginScreen onLoggedIn={setCreds} />;
    }

    return (
        <Dashboard
            creds={creds}
            onLogout={() => {
                clearAdminCreds();
                setCreds(null);
            }}
        />
    );
}

const styles: Record<string, CSSProperties> = {
    loginWrap: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8faf9",
        fontFamily: "system-ui, sans-serif"
    },
    loginBox: {
        background: "#fff",
        padding: 40,
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        width: 340
    },
    label: {
        display: "block",
        fontSize: 13,
        fontWeight: 600,
        color: "#444",
        marginBottom: 6
    },
    input: {
        width: "100%",
        padding: "12px 14px",
        borderRadius: 8,
        border: "1px solid #ddd",
        fontSize: 15,
        boxSizing: "border-box",
        marginBottom: 14
    },
    passwordWrap: {
        position: "relative",
        marginBottom: 14
    },
    eyeButton: {
        position: "absolute",
        right: 6,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 18,
        padding: 6,
        lineHeight: 1
    },
    button: {
        width: "100%",
        padding: "12px 14px",
        borderRadius: 8,
        border: "none",
        background: "#19a56a",
        color: "#fff",
        fontWeight: 600,
        fontSize: 15,
        cursor: "pointer"
    },
    smallButton: {
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
        fontSize: 14
    },
    page: {
        fontFamily: "system-ui, sans-serif",
        maxWidth: 1100,
        margin: "0 auto",
        padding: "30px 20px"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },
    tabs: {
        display: "flex",
        gap: 8,
        marginBottom: 20,
        borderBottom: "1px solid #eee"
    },
    tab: {
        padding: "10px 16px",
        border: "none",
        background: "none",
        cursor: "pointer",
        fontSize: 15,
        color: "#666"
    },
    tabActive: {
        padding: "10px 16px",
        border: "none",
        borderBottom: "3px solid #19a56a",
        background: "none",
        cursor: "pointer",
        fontSize: 15,
        fontWeight: 700,
        color: "#17221c"
    },
    filterBar: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
        flexWrap: "wrap"
    },
    filterInput: {
        flex: 1,
        minWidth: 220,
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid #ddd",
        fontSize: 14
    },
    filterSelect: {
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid #ddd",
        fontSize: 14,
        background: "#fff"
    },
    resultCount: {
        fontSize: 13,
        color: "#666",
        whiteSpace: "nowrap"
    },
    pagination: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        marginTop: 16,
        fontSize: 14,
        color: "#444"
    },
    tableWrap: {
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #eee",
        overflowX: "auto"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse"
    },
    th: {
        textAlign: "left",
        padding: "12px 14px",
        background: "#f8faf9",
        borderBottom: "1px solid #eee",
        fontSize: 13,
        color: "#666",
        textTransform: "uppercase",
        letterSpacing: 0.5
    },
    td: {
        padding: "12px 14px",
        borderBottom: "1px solid #f2f2f2",
        fontSize: 14,
        verticalAlign: "top"
    },
    statusSelect: {
        padding: "6px 10px",
        borderRadius: 6,
        border: "1px solid #ddd",
        fontWeight: 600,
        fontSize: 13
    }
};
