# Next.js + Supabase Starter App

A full-stack starter application demonstrating authentication, protected routes, a user profile system with avatar uploads, and automated database migrations — built with Next.js 16 (App Router), Supabase, TypeScript, and Tailwind CSS.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Authentication Flow](#authentication-flow)
- [Authentication Patterns](#authentication-patterns)
- [Code Organization](#code-organization)
- [Using This as a Starter](#using-this-as-a-starter)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [GitHub Actions Setup](#github-actions-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/) | v18 or later | v22 recommended |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | any recent version | Must be running before setup |
| [Git](https://git-scm.com/) | any | For cloning and CI/CD |

The Supabase CLI is installed automatically as a dev dependency — no global install needed.

---

## Quick Start

```bash
git clone <repo-url>
cd starter-app
bash setup.sh
npm run dev
```

The setup script handles everything in one shot:

1. Installs npm dependencies
2. Starts the local Supabase instance (skips if already running)
3. Extracts the local API URL and anon key
4. Writes `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
5. Applies all database migrations via `supabase db reset`

The script is **idempotent** — safe to run multiple times without side effects.

---

## Manual Setup

If you prefer to run each step yourself instead of using `setup.sh`:

**1. Install dependencies**
```bash
npm install
```

**2. Start Docker Desktop**, then start the local Supabase instance:
```bash
npx supabase start --ignore-health-check
```
> The `--ignore-health-check` flag is required on Windows because the analytics container's health check fails when Docker's daemon is not exposed on TCP. It is harmless on macOS/Linux.

**3. Copy credentials** from the startup output (or run `npx supabase status -o env` at any time):
```
API_URL="http://127.0.0.1:54321"
PUBLISHABLE_KEY="sb_publishable_..."
```

**4. Create `.env.local`** in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your PUBLISHABLE_KEY value>
```

**5. Apply migrations**
```bash
npx supabase db reset
```

---

## Running the App

```bash
npm run dev
```

| URL | What it is |
|---|---|
| `http://localhost:3000` | The Next.js application |
| `http://localhost:54323` | Supabase Studio (local database UI) |

---

## Project Structure

```
.
├── app/
│   ├── components/
│   │   ├── AvatarUpload.tsx   # Client component — avatar file upload
│   │   ├── ProfileForm.tsx    # Client component — full_name update form
│   │   └── SignOutButton.tsx  # Client component — calls supabase.auth.signOut()
│   ├── hooks/
│   │   └── useAuth.ts         # Client hook — subscribes to onAuthStateChange
│   ├── dashboard/page.tsx     # Protected page — shows email, links to profile
│   ├── home/page.tsx          # Public page — auth-aware landing page
│   ├── login/page.tsx         # Email + password sign-in form
│   ├── profile/page.tsx       # Protected page — displays and edits profile
│   ├── signup/page.tsx        # Email + password sign-up form
│   ├── globals.css            # Global styles (Tailwind + Geist font)
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Root route — redirects to /home
├── lib/
│   └── supabase/
│       ├── auth.ts            # getUser() — canonical server-side auth helper
│       ├── client.ts          # createClient() — browser Supabase client
│       ├── proxy.ts           # updateSession() — middleware session refresh
│       └── server.ts          # createClient() — server-side Supabase client
├── supabase/
│   ├── migrations/
│   │   └── 20240101000000_create_profiles.sql  # Profiles table, RLS, triggers
│   ├── schemas/
│   │   └── profiles.sql       # Declarative schema (source of truth for db diff)
│   ├── seed.sql               # Creates avatars storage bucket + storage RLS
│   └── config.toml            # Supabase local dev configuration
├── __tests__/
│   ├── SignOutButton.test.tsx
│   └── lib/supabase/
│       ├── auth.test.ts
│       └── client.test.ts
├── .github/
│   └── workflows/
│       └── migrate.yml        # CI: applies migrations on push to main
├── middleware.ts              # Refreshes auth session on every request
├── setup.sh                   # One-command local setup script
└── vitest.config.ts           # Test configuration
```

---

## Environment Variables

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Base URL for the Supabase API | Run `npx supabase status -o env`, use `API_URL` value |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon/publishable key for browser clients | Run `npx supabase status -o env`, use `PUBLISHABLE_KEY` value |

Both variables are written automatically by `setup.sh`. For production, use your hosted Supabase project's URL and anon key from the Supabase dashboard under **Project Settings → API**.

---

## Database Schema

### `public.profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Foreign key → `auth.users(id) ON DELETE CASCADE` |
| `email` | `text` | Copied from `auth.users` on sign-up |
| `full_name` | `text` | Set by the user via the profile form |
| `avatar_url` | `text` | Public URL of the user's avatar in Supabase Storage |
| `updated_at` | `timestamptz` | Automatically set to `now()` on every update |

### Triggers

**`on_auth_user_created`** — fires `AFTER INSERT ON auth.users`

Calls `handle_new_user()`, which inserts a new row into `public.profiles` with the new user's `id` and `email`. This means every registered user automatically gets a profile row — no manual insert required.

**`profiles_set_updated_at`** — fires `BEFORE UPDATE ON public.profiles`

Calls `set_updated_at()`, which sets `updated_at = now()`. This keeps the timestamp accurate without any application-level code.

### Row Level Security

RLS is enabled on `profiles`. The policies are:

- **SELECT** — authenticated users can read only their own row (`auth.uid() = id`)
- **UPDATE** — authenticated users can update only their own row (`auth.uid() = id`)
- No INSERT policy — inserts are handled exclusively by the `on_auth_user_created` trigger
- No DELETE policy — deletes cascade automatically from `auth.users`

### Storage

A public `avatars` bucket is created by `supabase/seed.sql`. Storage RLS policies restrict uploads and deletes to the authenticated user who owns the path (`{userId}/avatar`).

---

## Authentication Flow

Here is the complete lifecycle for a new user:

1. **Sign up** — user submits email + password on `/signup`. The app calls `supabase.auth.signUp()`.
2. **Trigger fires** — Supabase inserts the user into `auth.users`, which fires the `on_auth_user_created` trigger. The trigger inserts a corresponding row into `public.profiles` with the user's `id` and `email`.
3. **Session issued** — Supabase returns a session (access token + refresh token). The `@supabase/ssr` client stores these in cookies.
4. **Redirect to dashboard** — the sign-up page redirects to `/dashboard`. The middleware (`middleware.ts`) calls `updateSession()` on every request to silently refresh the access token before it expires.
5. **Profile page** — the user navigates to `/profile`, edits their `full_name`, and uploads an avatar. Both operations write to the `profiles` table via the browser Supabase client.
6. **Sign out** — clicking "Sign Out" calls `supabase.auth.signOut()`, which clears the session cookies. The user is redirected to `/home`.
7. **Sign in** — on `/login`, `supabase.auth.signInWithPassword()` reissues the session and redirects back to `/dashboard`.

---

## Authentication Patterns

There are two canonical ways to check auth in this codebase, depending on whether the code runs on the server or the client.

### Server Components and Route Handlers

Use `getUser()` from `lib/supabase/auth.ts`:

```typescript
import { getUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  // user is guaranteed non-null here
}
```

`getUser()` calls `supabase.auth.getUser()`, which validates the JWT against the Supabase auth server. It cannot be spoofed by a tampered cookie, making it safe for access-control decisions.

### Client Components

Use the `useAuth()` hook from `app/hooks/useAuth.ts`:

```typescript
"use client";
import { useAuth } from "@/app/hooks/useAuth";

export default function MyComponent() {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Not signed in</p>;
  return <p>Hello, {user.email}</p>;
}
```

`useAuth()` subscribes to `onAuthStateChange`, so it updates automatically when the session changes (sign-in, sign-out, token refresh).

---

## Code Organization

| Location | What lives here | Why |
|---|---|---|
| `app/components/` | Shared client components | Co-located with the app for easy import; all marked `"use client"` |
| `app/hooks/` | Client-side React hooks | Separated from components to make them independently importable and testable |
| `lib/supabase/` | Supabase client factories and auth utilities | Outside `app/` because they are used by both app code and tests |
| `supabase/schemas/` | Declarative SQL table definitions | Used by `supabase db diff` to generate migrations; not applied directly |
| `supabase/migrations/` | Versioned migration files | Applied in order by `supabase db reset` / `supabase db push` |
| `supabase/seed.sql` | Seed data and storage setup | Applied after migrations on `db reset`; idempotent (`ON CONFLICT DO NOTHING`) |

---

## Using This as a Starter

1. **Clone and rename** the repository for your project
2. **Update `package.json`**: change `"name"` and `"version"`
3. **Update `app/layout.tsx`**: change the `metadata.title` and `metadata.description`
4. **Update `supabase/config.toml`**: change `project_id` to match your project name
5. **Extend the schema**: add columns to `supabase/schemas/profiles.sql` or create new schema files; generate a migration with `npx supabase db diff --schema public -f <migration_name>`
6. **Add your pages** under `app/` following the same Server Component + `getUser()` pattern for protected routes
7. **Run `bash setup.sh`** to reinitialise the local database with your new schema

---

## Running Tests

```bash
npm test          # Run all tests once
npm run test:ui   # Open the Vitest browser UI
```

Tests live in `__tests__/` and mirror the source tree structure. The setup uses:

- **Vitest** — test runner
- **jsdom** — browser environment simulation
- **@testing-library/react** — component rendering and queries
- **@testing-library/jest-dom** — extended DOM matchers (`toBeInTheDocument`, etc.)

### Adding New Tests

- Component tests go in `__tests__/` (e.g., `__tests__/MyComponent.test.tsx`)
- Use `vi.mock()` to isolate Supabase calls — see `__tests__/SignOutButton.test.tsx` for an example
- Use `vi.hoisted()` for any mock variables referenced inside a `vi.mock()` factory to avoid temporal dead-zone errors

---

## Deployment

### 1. Create a hosted Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and note:
- **Project URL** (e.g., `https://abcdefgh.supabase.co`)
- **Anon public key** (under Project Settings → API)

### 2. Apply migrations to the hosted project

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 3. Deploy to Vercel

1. Push your code to GitHub
2. Import the repository on [vercel.com](https://vercel.com)
3. Add the following environment variables in Vercel's project settings:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your hosted Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your hosted Supabase anon key |

4. Deploy — Vercel will build and serve the app automatically on every push.

---

## GitHub Actions Setup

The repository includes `.github/workflows/migrate.yml`, which automatically applies database migrations to your hosted Supabase project on every push to `main`.

### Required Secrets

Add these three secrets to your GitHub repository under **Settings → Secrets and variables → Actions**:

| Secret | Where to find it |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) — generate a personal access token |
| `SUPABASE_PROJECT_ID` | Supabase project **Settings → General** — the "Reference ID" field |
| `SUPABASE_DB_PASSWORD` | The password you set when creating the Supabase project; reset it under **Settings → Database** if forgotten |

### How It Works

On each push to `main`, the workflow:
1. Checks out the repository
2. Installs Node.js 22 and project dependencies
3. Installs the Supabase CLI via `supabase/setup-cli@v1`
4. Links to your remote project with `supabase link`
5. Pushes any unapplied migrations with `supabase db push`

---

## Troubleshooting

**Docker is not running**
> `Error: Cannot connect to the Docker daemon`

Start Docker Desktop and wait for it to report "running" before running `setup.sh` or `npx supabase start`.

---

**Port conflict on `supabase start`**
> `Error: port 54322 is already allocated`

Another Supabase project is running. Stop it first:
```bash
npx supabase stop --project-id <other-project-name>
```
Then retry.

---

**Windows health check failure kills containers**
> `supabase start` exits immediately on Windows

The analytics container's health check requires Docker's daemon to be exposed on TCP, which is off by default. Use:
```bash
npx supabase start --ignore-health-check
```
The `setup.sh` script already includes this flag automatically.

---

**Credential extraction fails in `setup.sh`**
> `ERROR: Could not extract Supabase credentials.`

Run the following to inspect the raw output and check for unexpected formatting:
```bash
npx supabase status -o env
```
The script expects `API_URL=` and `PUBLISHABLE_KEY=` lines. If those are absent, your Supabase CLI may need updating: `npm install supabase@latest --save-dev`.

---

**`supabase db reset` fails with a storage timeout**
> `context deadline exceeded` or storage API errors

This is a known transient issue on Windows immediately after container startup. The `setup.sh` script automatically retries once after 10 seconds. If running `db reset` manually, wait a few seconds and try again.

---

**RLS blocking queries — getting `null` data despite being logged in**

This usually means the RLS policy condition is not satisfied. Check:
1. You are actually authenticated (the request has a valid session cookie)
2. The policy uses `auth.uid() = id` and your `id` column matches the user's UUID
3. You are using the **server client** (from `lib/supabase/server.ts`) in Server Components, not the browser client — the server client reads cookies from the request, while the browser client cannot access server-side cookies
