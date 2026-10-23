# CleanPro Backend

Simple Express API for the CleanPro cleaning-service website. Handles the
**Booking** form and the **Contact** form, storing submissions as JSON files
in `data/` (no database setup needed).

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Server runs at `http://localhost:5000` by default (change `PORT` in `.env`).

## Endpoints

| Method | Path             | Description                     |
|--------|------------------|----------------------------------|
| GET    | `/api/health`    | Health check                    |
| POST   | `/api/bookings`  | Create a booking                |
| GET    | `/api/bookings`  | List all bookings (admin only)  |
| PATCH  | `/api/bookings/:id` | Update a booking's status (admin only) |
| POST   | `/api/contact`   | Send a contact message          |
| GET    | `/api/contact`   | List all contact messages (admin only) |
| POST   | `/api/admin/login` | Check admin password         |

The "admin only" routes require `x-admin-user` and `x-admin-key` headers
matching `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`. The admin panel
in the frontend (`/admin.html`) handles this automatically once you log
in there with your name and password.

### POST /api/bookings

```json
{
  "name": "John Smith",
  "email": "john@email.com",
  "phone": "+48 000 000 00",
  "date": "2026-09-20",
  "time": "10:00 AM",
  "service": "House Cleaning",
  "message": "Please bring extra supplies."
}
```

### POST /api/contact

```json
{
  "name": "John Smith",
  "email": "john@email.com",
  "message": "Do you clean offices too?"
}
```

## Notes

- Data is stored in `data/bookings.json` and `data/contacts.json`. Swap
  `utils/jsonStore.js` for a real database (Postgres, MongoDB, etc.) later
  without touching the routes' logic much.
- CORS is restricted to `CORS_ORIGIN` in `.env` — add your deployed frontend
  URL there once you host it.
