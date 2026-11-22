# Football Control Panel

Modern admin web application for managing the **Football API** backend (`football-api`).

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + Radix UI / shadcn-style primitives + Lucide icons
- **Forms & Validation**: React Hook Form + Zod (aligned with backend schemas)
- **Data Fetching & Caching**: TanStack Query v5
- **Notifications**: Sonner
- **Session Security**: Server-side HttpOnly cookie session (`fcp_token`) via Next.js Route Handlers + transparent `/api/proxy/*` forwarding (zero JWT exposure in browser `localStorage`, zero backend modifications required)

## Project Structure

```text
football-control-panel/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Protected admin pages
│   │   │   ├── page.tsx          # Overview dashboard
│   │   │   ├── teams/            # Teams list & team details
│   │   │   ├── leagues/          # Leagues list, seasons & standings
│   │   │   ├── seasons/          # Dedicated seasons manager
│   │   │   ├── matches/          # Matches list, lifecycle console & events
│   │   │   └── settings/         # Admin profile & API health
│   │   ├── api/
│   │   │   ├── session/          # HttpOnly cookie login/logout/me handlers
│   │   │   └── proxy/[...path]/  # Authenticated server-side API proxy
│   │   └── login/                # Admin login page
│   ├── components/
│   │   ├── layout/               # Dark sidebar + responsive header shell
│   │   ├── shared/               # DataTable, SearchInput, Pagination, Dialogs, etc.
│   │   └── ui/                   # Reusable accessible UI primitives
│   ├── features/                 # Feature-scoped TanStack Query hooks & forms
│   ├── lib/                      # Centralized typed API client & utilities
│   ├── types/                    # Exact OpenAPI/backend TypeScript contracts
│   └── middleware.ts             # Route protection & auth redirects
├── .env.example
└── package.json
```

## Setup

1. Ensure the **Football API** backend is running (default: `http://localhost:3000/api`) and an admin account has been seeded (`npm run seed:admin` in `football-api`).

2. Install dependencies:
   ```bash
   cd football-control-panel
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Set `NEXT_PUBLIC_API_URL` if your backend runs on a different host/port:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

## Scripts

- **Development** (runs on port `3001` so it does not conflict with the API on port `3000`):
  ```bash
  npm run dev
  ```
  Open `http://localhost:3001`.

- **Typecheck**:
  ```bash
  npm run typecheck
  ```

- **Lint**:
  ```bash
  npm run lint
  ```

- **Production Build & Start**:
  ```bash
  npm run build
  npm start
  ```

## Authentication Flow

1. Unauthenticated requests to any dashboard page are redirected by `src/middleware.ts` to `/login`.
2. Submitting `/login` posts `{ email, password }` to `/api/session/login`, which authenticates against `POST {NEXT_PUBLIC_API_URL}/auth/login`, verifies `role === 'admin'`, and stores the JWT in an `HttpOnly`, `SameSite=Lax` cookie (`fcp_token`).
3. All client-side API requests go through `/api/proxy/*`, which attaches `Authorization: Bearer <token>` on the server side.
4. Expired or invalid tokens (`401`) automatically clear the cookie and redirect to `/login?reason=session_expired`.
