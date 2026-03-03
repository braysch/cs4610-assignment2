# Manual Testing Checklist

Work through each section in order. Check off items as you go.

---

## Part 1 — Local Database

Uses the local Supabase instance running in Docker (`http://127.0.0.1:54321`).

### 1A. Environment Setup

- [x] Docker Desktop is open and running
- [x] Run `bash setup.sh` — confirm it completes without errors
- [x] Verify `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- [x] Start the dev server: `npm run dev`
- [x] Open `http://localhost:3000` — confirm the browser loads without a blank screen or error

---

### 1B. Home Page (unauthenticated)

- [x] Visit `http://localhost:3000` — confirm you are redirected to `/home`
- [x] Page shows a **"Welcome"** heading
- [x] Page shows a **"Login"** button and a **"Sign Up"** button
- [x] Page does **not** show "Go to Dashboard" or any email address

---

### 1C. Protected Route Redirects (unauthenticated)

- [x] Visit `http://localhost:3000/dashboard` directly — confirm you are redirected to `/login`
- [x] Visit `http://localhost:3000/profile` directly — confirm you are redirected to `/login`

---

### 1D. Sign Up

- [x] Visit `http://localhost:3000/signup`
- [x] Enter a new email and a password (at least 6 characters)
- [x] Submit the form
- [x] Expected: redirected to `/dashboard`
- [x] Dashboard shows **"Welcome,"** followed by your email address
- [x] Dashboard shows a **"Go to Profile"** link and a **"Sign Out"** button

**Verify the trigger fired — open Supabase Studio:**

- [x] Open `http://localhost:54323`
- [x] Navigate to **Table Editor → profiles**
- [x] Confirm a row exists with your `id`, `email`, and a null `full_name` and `avatar_url`
- [x] Confirm `updated_at` is null (it is only set on UPDATE, not INSERT)

---

### 1E. Home Page (authenticated)

- [x] Visit `http://localhost:3000/home`
- [x] Page shows **"Signed in as \<your email\>"**
- [x] Page shows a **"Go to Dashboard"** button
- [x] Page does **not** show "Login" or "Sign Up" buttons

---

### 1F. Profile Page — Update Full Name

- [x] From the dashboard, click **"Go to Profile"**
- [x] Page loads at `/profile` (no redirect to login)
- [x] The **Email** field is pre-populated with your email and is read-only
- [x] The **Full Name** field is empty
- [x] Type a name into Full Name and click **"Save"**
- [x] Expected: a success message appears ("Profile updated successfully." or similar)
- [x] Reload the page — confirm the Full Name field is pre-populated with what you typed

**Verify in Supabase Studio:**

- [x] Navigate to **Table Editor → profiles**
- [x] Confirm `full_name` now shows your entered name
- [x] Confirm `updated_at` is now set to a recent timestamp

---

### 1G. Profile Page — Avatar Upload

- [x] On `/profile`, find the **Avatar** section
- [x] Click **"Choose Image"** and select any image file (PNG, JPEG, GIF, or WebP)
- [FAILURE] Expected: button briefly shows "Uploading…", then the avatar preview updates with your image
- [x] No error message is shown

**Verify in Supabase Studio:**

- [x] Navigate to **Storage → avatars**
- [x] Confirm a folder named after your user ID exists, containing a file named `avatar`
- [x] Navigate to **Table Editor → profiles**
- [x] Confirm `avatar_url` now contains a URL ending in `/storage/v1/object/public/avatars/<userId>/avatar`

**Re-upload test (upsert):**

- [x] Upload a different image on the same profile page
- [x] Expected: avatar preview updates — no duplicate files should appear in Storage (same path, file is replaced)

---

### 1H. Sign Out

- [x] Click **"Sign Out"** from any page that has the button
- [x] Expected: redirected to `/home`
- [x] Home page shows **"Login"** and **"Sign Up"** buttons (not the authenticated view)
- [x] Visit `/dashboard` directly — confirm redirected to `/login`

---

### 1I. Sign In

- [x] Visit `http://localhost:3000/login`
- [x] Enter the same email and password used during sign-up
- [x] Submit the form
- [x] Expected: redirected to `/dashboard`
- [x] Dashboard shows your email address

**Wrong password test:**

- [x] Sign out, then go to `/login`
- [x] Enter the correct email but a wrong password
- [x] Expected: an inline error message appears (e.g. "Invalid login credentials") — no redirect

---

### 1J. Sign Out (final)

- [x] Sign out one final time
- [x] Confirm `/home` shows the unauthenticated view

---

### 1K. Automated Tests

- [x] Run `npm test` in the terminal
- [x] Expected output: **3 test files, 7 tests, all passing**

---

## Part 2 — GitHub Actions Verification

- [x] Open your repository on GitHub: `https://github.com/braysch/cs4610-assignment2`
- [x] Click the **Actions** tab
- [x] Confirm the **"Apply Database Migrations"** workflow appears
- [x] Click the most recent run and verify all steps completed with green checkmarks:
  - Checkout repository ✓
  - Set up Node.js ✓
  - Install dependencies ✓
  - Set up Supabase CLI ✓
  - Link Supabase project ✓
  - Push migrations to remote ✓
- [x] No steps show a red ✗

> If the workflow failed, check the step that failed for error details. Common causes:
> - `SUPABASE_ACCESS_TOKEN` secret is invalid or expired — regenerate at supabase.com/dashboard/account/tokens
> - `SUPABASE_PROJECT_ID` is wrong — must be the Reference ID (not the project name) from Project Settings → General
> - `SUPABASE_DB_PASSWORD` is wrong — reset under Project Settings → Database if needed

---

## Part 3 — Hosted Supabase Database

This section tests the app against your **remote** Supabase project instead of the local Docker instance.

### 3A. Switch to the Hosted Database

- [ ] Open `.env.local` and update both variables to your **hosted** project's values:

  ```
  NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your hosted anon key>
  ```

  Both values are available in the Supabase dashboard under **Project Settings → API**.

- [x] Stop and restart the dev server (`Ctrl+C`, then `npm run dev`) so the new env vars are picked up
- [x] Confirm the app loads at `http://localhost:3000`

---

### 3B. Verify Migrations Were Applied

- [x] Open the Supabase dashboard for your hosted project
- [x] Navigate to **Table Editor** — confirm a `profiles` table exists with columns: `id`, `email`, `full_name`, `avatar_url`, `updated_at`
- [x] Navigate to **Authentication → Policies** — confirm RLS is enabled on `profiles` with two policies (SELECT and UPDATE)
- [x] Navigate to **Storage** — confirm an `avatars` bucket exists and is marked **Public**

> If the table or bucket is missing, the GitHub Actions migration run did not complete successfully. Fix the Actions failure (Part 2) and re-run the workflow, or run `npx supabase db push` manually after linking your project.

---

### 3C. Full User Journey on Hosted Database

Repeat the core flow from Part 1 against the hosted database:

- [x] Sign up with a **new** email (different from what you used locally)
- [x] Confirm redirect to `/dashboard` and your email is shown
- [x] In the **hosted** Supabase Studio (dashboard.supabase.com → your project → Table Editor → profiles), confirm the profile row was auto-created by the trigger
- [x] Go to `/profile`, set a Full Name, click **Save** — confirm success message
- [FAILURE] Upload an avatar — confirm preview updates
- [FAILURE] In the hosted Supabase dashboard → **Storage → avatars**, confirm the file is present
- [x] Sign out — confirm redirect to `/home`
- [x] Sign in with the same credentials — confirm redirect to `/dashboard`
- [x] Sign out

---

### 3D. Restore Local Database

When done testing the hosted database, restore your local dev environment:

- [x] Update `.env.local` back to the local values:

  ```
  NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your local publishable key>
  ```

  Run `npx supabase status -o env` if you need the local key again.

- [x] Restart the dev server

---

## Part 4 — Bug Fix Verification

Targeted tests for the four issues fixed in Phase 12. Run these after the fixes have been pushed and the GitHub Actions workflow has re-applied migrations to the remote.

---

### 4A. Login Page Navigation Links

- [ ] Visit `http://localhost:3000/login`
- [ ] Confirm a **"← Home"** link appears at the bottom-left of the form card
- [ ] Confirm a **"Create an account"** link appears at the bottom-right of the form card
- [ ] Click **"← Home"** — confirm you are taken to `/home`
- [ ] Go back to `/login`, click **"Create an account"** — confirm you are taken to `/signup`

---

### 4B. Sign-Up Page Navigation Links

- [ ] Visit `http://localhost:3000/signup`
- [ ] Confirm a **"← Home"** link appears at the bottom-left of the form card
- [ ] Confirm an **"Already have an account?"** link appears at the bottom-right of the form card
- [ ] Click **"← Home"** — confirm you are taken to `/home`
- [ ] Go back to `/signup`, click **"Already have an account?"** — confirm you are taken to `/login`

---

### 4C. Avatar Renders Immediately After Upload (Local)

**Prerequisite:** local Supabase running, app pointed at `http://127.0.0.1:54321`.

- [ ] Sign in and navigate to `/profile`
- [ ] Click **"Choose Image"** and select an image file
- [ ] Confirm the button briefly shows **"Uploading…"**
- [ ] Confirm the avatar preview **updates immediately** after upload — the image should appear in the circular frame without a page reload
- [ ] Reload the page — confirm the avatar is still shown (URL was persisted to the `profiles` table)
- [ ] Upload a second, different image — confirm the preview updates again (upsert replaces, no duplicates in Storage)

---

### 4D. Avatars Bucket Created on Remote (Hosted Database)

**Prerequisite:** the new migration (`20240102000000_create_avatars_bucket.sql`) must have been pushed to the remote via GitHub Actions. Verify the workflow ran successfully after the fix was pushed.

- [ ] Open the hosted Supabase dashboard → **Storage**
- [ ] Confirm an **`avatars`** bucket now appears and is marked **Public**
- [ ] Click into the bucket — it should be empty (or contain avatars from earlier test runs)
- [ ] Switch `.env.local` to the hosted database values and restart the dev server
- [ ] Sign in with an existing hosted-database account and navigate to `/profile`
- [ ] Upload an avatar image — confirm the preview updates immediately (the `<img>` fix applies here too)
- [ ] In the hosted Supabase dashboard → **Storage → avatars** — confirm the file was created at `{userId}/avatar`
- [ ] Navigate to **Table Editor → profiles** — confirm `avatar_url` was updated
- [ ] Restore `.env.local` to local values and restart the dev server

---

## Part 5 — Pre-Submission Checklist

- [ ] All checkboxes in Parts 1–3 are checked
- [ ] `npm test` passes (7/7)
- [ ] `npm run build` completes without errors
- [ ] `.env.local` is **not** tracked by git (`git status` should not show it)
- [ ] `node_modules/` is **not** tracked by git
- [ ] Remove `node_modules` before submitting: `rm -rf node_modules`
- [ ] Submit the project per your course instructions
