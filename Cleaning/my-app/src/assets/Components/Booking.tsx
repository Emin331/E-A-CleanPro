
import { useEffect, useState } from "react";
import { createBooking, fetchAvailability } from "../../api";
import type { Availability } from "../../api";

// Used only if the server can't be reached to load availability.
// The server still checks every booking, so this is just a fallback list.
const ALL_TIMES = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

const REASON_LABEL = {
    booked: "booked",
    too_close: "not available",
    day_full: "fully booked"
} as const;

function Booking() {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [message, setMessage] = useState("");

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [feedback, setFeedback] = useState("");

    // which times are free on the chosen date
    const [availability, setAvailability] = useState<Availability | null>(null);
    const [loadingTimes, setLoadingTimes] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!date) {
            setAvailability(null);
            return;
        }

        let cancelled = false;
        setLoadingTimes(true);

        fetchAvailability(date)
            .then((result) => {
                if (cancelled) return;
                setAvailability(result);
                // drop the chosen time if it just became unavailable
                setTime((current) =>
                    result.slots.some((s) => s.time === current && s.available)
                        ? current
                        : ""
                );
            })
            .catch(() => {
                if (!cancelled) setAvailability(null);
            })
            .finally(() => {
                if (!cancelled) setLoadingTimes(false);
            });

        return () => {
            cancelled = true;
        };
    }, [date, refreshKey]);

    async function handleBooking() {
        setStatus("loading");
        setFeedback("");

        try {
            const result = await createBooking({
                name,
                address,
                phone,
                date,
                time,
                service: "House Cleaning",
                message
            });

            setStatus("success");
            setFeedback(result.message || "Booking received!");

            // reset form after a successful booking
            setName("");
            setAddress("");
            setPhone("");
            setDate("");
            setTime("");
            setMessage("");
        } catch (err) {
            setStatus("error");
            setFeedback(
                err instanceof Error ? err.message : "Something went wrong. Please try again."
            );
            // someone else may have just taken that time — reload the list
            setRefreshKey((k) => k + 1);
        }
    }

    return (
        <section id="booking" className="section booking">

            <div className="container">

                <div className="section-heading">

                    <p className="label">
                        BOOK A CLEANING
                    </p>

                    <h2>
                        Choose Your Date & Time
                    </h2>

                    <p>
                        Select a date and time for your house cleaning.
                    </p>

                </div>

                <div className="booking-layout">

                    <div className="booking-info">

                        <div className="booking-info-icon">
                            🧹
                        </div>

                        <h3>
                            House Cleaning
                        </h3>

                        <p>
                            Professional house cleaning
                            for your home.
                        </p>

                        <div className="booking-feature">
                            ✓ Professional cleaners
                        </div>

                        <div className="booking-feature">
                            ✓ Reliable service
                        </div>

                        <div className="booking-feature">
                            ✓ Flexible booking
                        </div>

                        <div className="booking-feature">
                            ✓ Quality results
                        </div>

                    </div>

                    <div className="booking-form">

                        <div className="form-group">

                            <label>
                                Your Name
                            </label>

                            <input
                                type="text"
                                placeholder="Name Surname"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Address
                            </label>

                            <input
                                type="text"
                                placeholder="Street, building, apartment"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Phone Number
                            </label>

                            <input
                                type="tel"
                                placeholder="+48 000 000 00"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />

                        </div>

                        <div className="form-row">

                            <div className="form-group">

                                <label>
                                    📅 Choose Date
                                </label>

                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) =>
                                        setDate(e.target.value)
                                    }
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    🕐 Choose Time
                                </label>

                                <select
                                    value={time}
                                    disabled={!date || loadingTimes}
                                    onChange={(e) =>
                                        setTime(e.target.value)
                                    }
                                >

                                    <option value="">
                                        {!date
                                            ? "Choose a date first"
                                            : loadingTimes
                                                ? "Loading times..."
                                                : "Select time"}
                                    </option>

                                    {availability
                                        ? availability.slots.map((slot) => (
                                            <option
                                                key={slot.time}
                                                value={slot.time}
                                                disabled={!slot.available}
                                            >
                                                {slot.available
                                                    ? slot.time
                                                    : `${slot.time} — ${REASON_LABEL[slot.reason ?? "booked"]}`}
                                            </option>
                                        ))
                                        : date && !loadingTimes && ALL_TIMES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}

                                </select>

                            </div>

                        </div>

                        {availability?.fullyBooked && (
                            <div className="error-message" style={{ marginTop: 0, marginBottom: 17 }}>
                                This day is fully booked. Please choose another date.
                            </div>
                        )}

                        <p className="booking-hint">
                            Max {availability?.maxPerDay ?? 2} bookings per day, at
                            least {availability?.freeHoursBetween ?? 3} hours apart.
                        </p>

                        <div className="selected-service">
                            🧹 House Cleaning
                        </div>

                        <div className="form-group">

                            <label>
                                Additional Message
                            </label>

                            <textarea
                                rows={4}
                                placeholder="Tell us anything we should know..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />

                        </div>

                        <button
                            type="button"
                            className="booking-button"
                            onClick={handleBooking}
                            disabled={status === "loading"}
                        >
                            {status === "loading" ? "Booking..." : "Book Cleaning"}
                        </button>

                        {status === "success" && (
                            <div className="success-message">
                                ✓ {feedback}
                            </div>
                        )}

                        {status === "error" && (
                            <div className="error-message">
                                ✕ {feedback}
                            </div>
                        )}

                    </div>

                </div>

            </div>

        </section>
    );
}

export default Booking;
