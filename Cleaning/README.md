# CleanPro — Full Stack

- `my-app/` — React + TypeScript + Vite frontend (your existing UI)
- `backend/` — Express API for bookings & contact form (new)

Everything lives in this one project folder. Two ways to run it:

## Option A — one command, dev mode (frontend + backend together)

```bash
npm install          # installs concurrently at the root
npm run install:all  # installs backend + frontend deps
npm run dev
```
This starts **both** servers at once from the project root:
- backend → http://localhost:5000
- frontend → http://localhost:5173 (talks to the backend automatically)

## Option B — one server, production mode (single port)

Builds the frontend and has the backend serve it directly — only one
process, one port, no CORS needed:

```bash
npm run install:all
npm start
```
Now the whole site (frontend **and** API) is at **http://localhost:5000**.

## Manual / two-terminal way (if you prefer)

**Terminal 1 — backend**
```bash
cd backend
npm install
cp .env.example .env
npm start
```

**Terminal 2 — frontend**
```bash
cd my-app
npm install
cp .env.example .env
npm run dev
```

## Admin panel — see customer bookings & messages

Open **http://localhost:5173/admin.html** (or your deployed site + `/admin.html`).

- Log in with the **name + password** set in `backend/.env`
  (`ADMIN_USERNAME` / `ADMIN_PASSWORD` — defaults are `admin` / `changeme123`, change them!).
- See every booking with name, email, phone, date/time, and message.
- Change a booking's status: Pending → Confirmed → Done / Cancelled.
- See every contact-form message too.
- "Refresh" button reloads the latest data from the server.

This is separate from the main site (`/`) so customers never see it.

## What changed in the frontend

- `src/api.ts` — small fetch helper that calls the backend.
- `src/assets/Components/Booking.tsx` — the booking form now submits to
  `POST /api/bookings` instead of only updating local state, and shows a
  real success/error message from the server.
- `src/assets/Components/Contact.tsx` — added an actual contact form that
  submits to `POST /api/contact`; filled in the previously-empty Email
  contact card.
- `src/index.css` — added `.error-message` and `.contact-form` styles.

## Deploying

Any host works for the backend (Render, Railway, Fly.io, a VPS, etc.).
Once deployed, set `VITE_API_URL` in the frontend's `.env` to the backend's
public URL, and `CORS_ORIGIN` in the backend's `.env` to the frontend's
public URL.
