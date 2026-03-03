# Starter App

A Next.js application with Supabase authentication and a user profiles table.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Docker](https://www.docker.com/) (required for the local Supabase instance)
- [Supabase CLI](https://supabase.com/docs/guides/cli) — installed automatically as a dev dependency

## Setup

Run the setup script to install dependencies, start the local Supabase instance, configure environment variables, and apply database migrations:

```bash
bash setup.sh
```

The script will:
1. Install all npm dependencies (`npm install`)
2. Start the local Supabase instance (`npx supabase start`)
3. Extract the local API URL and anon key from the Supabase output
4. Write `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
5. Run all database migrations (`npx supabase db reset`)

The script is idempotent — safe to run multiple times. If Supabase is already running it skips the start step; if `.env.local` already exists it updates only the Supabase credentials.

## Running the app

After setup:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Supabase Studio** (local database UI) is available at [http://localhost:54323](http://localhost:54323).

## Project structure

```
app/
  components/       # Shared client components (e.g. SignOutButton)
  dashboard/        # Protected dashboard page
  home/             # Public landing page
  login/            # Login page
  signup/           # Sign-up page
  profile/          # Protected profile page
lib/
  supabase/
    client.ts       # Browser Supabase client
    server.ts       # Server-side Supabase client
    proxy.ts        # Middleware session refresh helper
supabase/
  schemas/
    profiles.sql    # Declarative schema for the profiles table
  migrations/       # SQL migrations applied on db reset
middleware.ts       # Next.js middleware for token refresh
setup.sh            # One-command project setup script
```

## Database schema

### profiles

| Column       | Type                     | Notes                              |
|--------------|--------------------------|------------------------------------|
| `id`         | `uuid` (PK)              | References `auth.users(id)`        |
| `email`      | `text`                   | Copied from `auth.users` on insert |
| `updated_at` | `timestamptz`            | Auto-set by trigger on update      |

A PostgreSQL trigger (`on_auth_user_created`) automatically inserts a row into `profiles` whenever a new user registers.
