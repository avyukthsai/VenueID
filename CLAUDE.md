# Venue ID — Claude Context

## What This App Does

**Venue ID** is an AI-powered venue recommendation platform. Users describe an event (type, location, date, audience) and the app returns 3 ideal venue matches, grounded in real data from Foursquare and Ticketmaster APIs, with match scores and detailed venue info.

## Project Structure

```
venue_id/
├── backend/          — Express.js API server (Node.js)
│   ├── server.js     — Main server (892 lines): AI orchestration, search limits, share links
│   ├── supabase.js   — Supabase client (service key)
│   ├── searches.js   — Search history CRUD endpoints
│   ├── shares.js     — Share link endpoints
│   └── services/
│       ├── foursquare.js    — Foursquare Places API v3 integration
│       └── ticketmaster.js  — Ticketmaster Discovery API v2 integration
│
└── client/           — React 19 + Vite frontend
    └── src/
        ├── main.jsx        — React Router setup with Clerk auth provider
        ├── App.jsx         — Main search interface (852 lines)
        ├── HistoryPage.jsx — Saved searches for authenticated users
        ├── SharePage.jsx   — Public share link viewer
        ├── components/
        │   └── Navbar.jsx  — Nav with Clerk auth buttons
        └── supabase.js     — Supabase client (anon key)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router v7, pure CSS |
| Auth | Clerk (`@clerk/react`) |
| Backend | Express.js v5, Node.js |
| AI | Google Gemini Flash (`@google/generative-ai`) |
| Database | Supabase (PostgreSQL) |
| External APIs | Foursquare Places v3, Ticketmaster Discovery v2 |
| HTTP | Axios |

## Database Tables (Supabase)

- **`saved_searches`** — `id, user_id, search_params (JSON), results (text), created_at`
- **`shared_searches`** — `id, token, search_params (JSON), results (text), expires_at, created_at`
- **`user_search_counts`** — `user_id, search_count` (max 5 when limit enabled)
- **`waitlist`** — `email, created_at`

## Backend API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/venues/stream` | Main: generate venue recommendations (JSON) |
| POST | `/generate-venue` | Legacy: generate recommendations (text format) |
| POST | `/api/searches` | Save search to history |
| GET | `/api/searches/:userId` | Get user's saved searches |
| DELETE | `/api/searches/:id` | Delete a saved search |
| POST | `/api/shares` | Create shareable link |
| GET | `/api/shares/:token` | Get shared search by token |
| GET | `/api/searches/count/:userId` | Get user search count |
| POST | `/api/waitlist` | Join waitlist |
| GET | `/test` | Health check |

## Key Features

- Dual API fetch (Foursquare + Ticketmaster in parallel, deduplicated)
- Gemini AI grounds recommendations in real venue data (prevents hallucinations)
- Match score: capacity 40%, event type 30%, location 15%, features 15%
- Search limit: toggled via `SEARCH_LIMIT_ENABLED` env var (currently `false`)
- Share links: crypto token-based with optional expiration
- Clerk handles all authentication; backend receives `userId` from frontend

## Environment Variables

**Backend (`backend/.env`):**
- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `TICKETMASTER_API_KEY`
- `FOURSQUARE_API_KEY`
- `SEARCH_LIMIT_ENABLED` — `"true"` or `"false"`

**Client (`client/.env.local`):**
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` — backend base URL

## Known Issues / Tech Debt

1. **Code duplication:** `/api/venues/stream` and `/generate-venue` in `server.js` are nearly identical — should be unified
2. **Monolithic components:** `App.jsx` (852 lines) and `server.js` (892 lines) need splitting
3. **No error boundaries** in React — a crash anywhere crashes the whole app
4. **Debug `console.log` statements** throughout backend — should use a logger or be removed
5. **No tests** — zero unit or integration test coverage
6. **No input sanitization** — user inputs passed directly to Gemini prompt
7. **No API rate limiting** on backend endpoints
8. **Share link cleanup** — expired records accumulate with no cleanup job
