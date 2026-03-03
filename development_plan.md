# Development Plan

A phase-by-phase task list for building this Next.js + Supabase starter app from scratch.
Written as though starting from an empty directory.

---

## Phase 1 — Project Bootstrap

Set up the base Next.js application and folder structure.

- [x] Scaffold a new Next.js app with TypeScript enabled (`npx create-next-app@latest`)
- [x] Confirm the App Router (`app/` directory) is selected, not the Pages Router
- [x] Confirm Tailwind CSS is selected during scaffolding
- [x] Remove boilerplate content from `app/page.tsx`, `app/globals.css`, and `public/`
- [x] Create the core folder structure:
  - `app/components/` — shared client components
  - `app/home/`, `app/login/`, `app/signup/`, `app/dashboard/`, `app/profile/` — route segments
  - `lib/supabase/` — Supabase client utilities
  - `supabase/schemas/` — declarative SQL schemas
  - `supabase/migrations/` — generated migration files

---

## Phase 2 — Supabase Local Development Setup

Install Supabase tooling and get the local instance running.

- [x] Install Supabase packages: `@supabase/ssr`, `@supabase/supabase-js`, and `supabase` (CLI, as a dev dependency)
- [x] Initialize Supabase in the project (`npx supabase init`)
- [x] Start the local Supabase instance (`npx supabase start`) and verify it comes up
- [x] Note the local API URL and anon key from the startup output
- [x] Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] Add `.env.local` to `.gitignore`
- [x] Configure `supabase/config.toml`:
  - Set `project_id`
  - Point `[db.migrations].schema_paths` at `./schemas/profiles.sql`
  - Enable the `[storage]` section and configure an `avatars` storage bucket (public, image MIME types only)

---

## Phase 3 — Supabase Client Utilities & Middleware

Create the reusable Supabase client helpers and session-refresh middleware.

- [x] Create `lib/supabase/client.ts` — browser client using `createBrowserClient` from `@supabase/ssr`
- [x] Create `lib/supabase/server.ts` — server client using `createServerClient` from `@supabase/ssr`, reading cookies via `next/headers`
- [x] Create `lib/supabase/proxy.ts` — `updateSession()` helper that calls `supabase.auth.getClaims()` and returns the response unchanged (required for session refresh in middleware)
- [x] Create `middleware.ts` at the project root that calls `updateSession()` on every request, with a matcher that excludes static assets

---

## Phase 4 — Database Schema & Migrations

Design the `profiles` table, write the declarative schema, generate a migration, and apply it.

- [x] Write the declarative schema at `supabase/schemas/profiles.sql`:
  - `id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
  - `email text`
  - `full_name text`
  - `avatar_url text`
  - `updated_at timestamptz`
- [x] Generate a migration from the schema using `npx supabase db diff --schema public -f create_profiles`
- [x] Open the generated migration file and append:
  - `set_updated_at()` trigger function — sets `updated_at = now()` before each row update
  - `BEFORE UPDATE` trigger on `profiles` that calls `set_updated_at()`
  - `handle_new_user()` trigger function — inserts a row into `profiles` on new auth user, copying `id` and `email`
  - `AFTER INSERT ON auth.users` trigger that calls `handle_new_user()`
  - RLS policies on `profiles`:
    - Enable RLS: `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY`
    - SELECT policy: authenticated users can read their own row (`auth.uid() = id`)
    - UPDATE policy: authenticated users can update their own row (`auth.uid() = id`)
    - No INSERT/DELETE policies needed (inserts handled by trigger; deletes cascade from `auth.users`)
- [x] Add a storage migration or seed that creates the `avatars` bucket with public read access and restricts uploads to image MIME types
- [x] Apply all migrations: `npx supabase db reset`
- [x] Verify schema in Supabase Studio (`http://localhost:54323`)

---

## Phase 5 — Authentication Layer

Build reusable auth utilities and the sign-in/sign-up/sign-out flows.

- [x] Create `lib/supabase/auth.ts` (or `lib/auth.ts`) with a server-side helper:
  - `getUser()` — calls `supabase.auth.getUser()` and returns the user or `null`
  - Document that this is the canonical way to check auth in Server Components and Route Handlers
- [x] Create `app/hooks/useAuth.ts` — a client-side `useAuth()` hook that:
  - Uses `createClient()` from `lib/supabase/client.ts`
  - Subscribes to `onAuthStateChange` and exposes `{ user, loading }`
  - Document that this is the canonical way to check auth in Client Components
- [x] Create `app/login/page.tsx`:
  - Email + password form (controlled inputs)
  - Calls `supabase.auth.signInWithPassword()` on submit
  - Shows inline error message on failure
  - Redirects to `/dashboard` on success
- [x] Create `app/signup/page.tsx`:
  - Email + password form (controlled inputs)
  - Calls `supabase.auth.signUp()` on submit
  - Shows inline error message on failure
  - Redirects to `/dashboard` on success
- [x] Create `app/components/SignOutButton.tsx`:
  - Client component
  - Calls `supabase.auth.signOut()` on click
  - Redirects to `/home` on completion

---

## Phase 6 — Pages & UI

Build all required route segments with appropriate auth guards and content.

### Root redirect
- [x] `app/page.tsx` — redirect immediately to `/home`

### Home page (`app/home/page.tsx`)
- [x] Fetch the current user server-side using the server Supabase client
- [x] If authenticated: show welcome message and a link to `/dashboard`
- [x] If not authenticated: show welcome message and links to `/login` and `/signup`

### Login page (`app/login/page.tsx`)
- [x] *(Covered in Phase 5)*

### Signup page (`app/signup/page.tsx`)
- [x] *(Covered in Phase 5)*

### Dashboard page (`app/dashboard/page.tsx`)
- [x] Fetch user server-side; redirect to `/login` if not authenticated
- [x] Display the logged-in user's email
- [x] Link to `/profile`
- [x] Include `<SignOutButton />`

### Profile page (`app/profile/page.tsx`)
- [x] Fetch user server-side; redirect to `/login` if not authenticated
- [x] Query the `profiles` table for the current user's row (using the server client)
- [x] Display current `email`, `full_name`, and `avatar_url` (rendered as an `<img>` if present)
- [x] Build an update form (client component) with fields for `full_name`:
  - Pre-populate fields with current profile values
  - On submit, call `supabase.from('profiles').update(...)` using the browser client
  - Show success confirmation or inline error on result
- [x] Build an avatar upload section (client component):
  - File input that accepts images only
  - On file selection, upload to the `avatars` Supabase Storage bucket at path `{userId}/avatar`
  - On upload success, update `avatar_url` in the `profiles` table
  - Re-render the avatar preview immediately
  - Show error message on upload or update failure
- [x] Include a "Back to Dashboard" link and `<SignOutButton />`

---

## Phase 7 — Setup Script

Automate the full local setup in a single idempotent shell script.

- [x] Create `setup.sh` at the project root
- [x] Step 1: run `npm install`
- [x] Step 2: check if Supabase is already running (`npx supabase status`); if so skip start, else run `npx supabase start`
- [x] Step 3: capture the Supabase status output and parse `API URL` and `anon key` using `grep`/`awk`
- [x] Step 4: exit with a clear error message if credentials could not be extracted
- [x] Step 5: write credentials to `.env.local`, updating existing Supabase lines if the file already exists (idempotent)
- [x] Step 6: run `npx supabase db reset` to apply migrations
- [x] Step 7: print a summary of what was done and the next steps (URLs for the app and Studio)
- [x] Make the script executable (`chmod +x setup.sh`)
- [x] Test the script on a clean state (delete `node_modules` and `.env.local`, then run it)
- [x] Test idempotency (run the script a second time and verify it completes without errors)

---

## Phase 8 — Unit Testing

Set up a testing framework and write representative example tests.

- [x] Install Vitest and related packages: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- [x] Add a `vitest.config.ts` at the project root configured for jsdom and React
- [x] Add `"test": "vitest"` and `"test:ui": "vitest --ui"` scripts to `package.json`
- [x] Create `__tests__/` directory (or co-locate test files with `*.test.ts(x)` naming)
- [x] Write a component test — e.g., `SignOutButton.test.tsx`:
  - Verify it renders a button
  - Mock `createClient` and verify `signOut` is called on click
- [x] Write a utility test — e.g., `lib/supabase/client.test.ts`:
  - Verify `createClient()` returns an object with an `auth` property
  - (Use environment variable mocks for credentials)
- [x] Write an auth helper test — e.g., `lib/auth.test.ts`:
  - Mock the server Supabase client
  - Verify `getUser()` returns `null` when no session exists
  - Verify `getUser()` returns the user object when a session exists
- [x] Verify all tests pass with `npm test`

---

## Phase 9 — CI/CD (GitHub Actions)

Set up an automated workflow that applies database migrations on push.

- [x] Create `.github/workflows/migrate.yml`
- [x] Trigger: `push` to `main` (or `master`) branch
- [x] Steps:
  - Checkout the repository
  - Set up Node.js (pinned to v22, matching local environment)
  - Install dependencies (`npm ci`)
  - Install the Supabase CLI (via `supabase/setup-cli@v1` action)
  - Run `supabase db push` against the remote Supabase project using secrets
- [ ] Add the following secrets to the GitHub repository: *(manual — requires a remote Supabase project)*
  - `SUPABASE_ACCESS_TOKEN` — personal access token from Supabase
  - `SUPABASE_PROJECT_ID` — the project reference ID
  - `SUPABASE_DB_PASSWORD` — the database password
- [ ] Test the workflow by pushing a commit and verifying the Actions run succeeds
- [ ] Document the workflow and required secrets in the README *(covered in Phase 10)*

---

## Phase 10 — Documentation (README.md)

Write comprehensive documentation covering every aspect of the project.

- [ ] **Project description** — what this starter app is and what it demonstrates
- [ ] **Prerequisites** — Node.js version, Docker (for local Supabase), Git
- [ ] **Quick start** — single command (`bash setup.sh`) with brief explanation of what it does
- [ ] **Manual setup instructions** — step-by-step alternative to the script for users who prefer it
- [ ] **Running the app** — `npm run dev`, local URLs (app + Supabase Studio)
- [ ] **Project structure** — annotated directory tree covering `app/`, `lib/`, `supabase/`, `middleware.ts`, `setup.sh`
- [ ] **Environment variables** — table of all variables, what they are, where they come from
- [ ] **Database schema** — table for `profiles` (columns, types, notes); explain the two triggers
- [ ] **Authentication flow** — narrative walkthrough of sign-up → trigger → profile creation → session → sign-out
- [ ] **Authentication patterns** — document the two canonical approaches:
  - Server Components / Route Handlers: use `getUser()` from `lib/auth.ts` (or equivalent)
  - Client Components: use the `useAuth()` hook from `app/hooks/useAuth.ts`
- [ ] **Code organization decisions** — document where components, hooks, and utilities live and why
- [ ] **How to use this as a starter app** — steps for cloning and adapting it for a new project
- [ ] **Running and writing tests** — `npm test`, where tests live, how to add new ones
- [ ] **Deployment instructions** — how to deploy to Vercel (or similar); required environment variables for production; linking to a hosted Supabase project
- [ ] **GitHub Actions setup** — which secrets to add, where to find the values, how to enable the migration workflow
- [ ] **Troubleshooting** — common issues (Docker not running, port conflicts, credential extraction failures, RLS blocking queries) and their fixes
- [ ] Proofread the README end-to-end from the perspective of a new developer cloning the repo for the first time

---

## Phase 11 — Final Verification & Submission

- [ ] Run the full setup process from scratch: delete `node_modules` and `.env.local` (do **not** delete `supabase/`), then run `bash setup.sh`
- [ ] Verify the app starts with `npm run dev` and all pages load correctly
- [ ] Manually test the full user journey: sign up → dashboard → profile update → avatar upload → sign out → sign in → sign out
- [ ] Verify a new user's profile row is created automatically in the `profiles` table
- [ ] Run `npm test` and confirm all tests pass
- [ ] Verify the GitHub Actions migration workflow runs successfully
- [ ] Remove the `node_modules` folder before submitting
- [ ] Submit the project
