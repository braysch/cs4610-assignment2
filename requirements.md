# Assignment 2 Requirements

## Objectives

- [ ] Integrate Next.js with Supabase for authentication and database operations
- [ ] Implement automatic profile creation when a user signs up
- [ ] Configure Row Level Security (RLS) policies correctly on the profile model
- [ ] Use Supabase declarative schemas for database models
- [ ] Create a setup script that automates project initialization
- [ ] Understand best practices for Next.js + Supabase integration

---

## Application Requirements

### 1. Next.js Application Setup

- [ ] Create a new Next.js application (use the latest version)
- [ ] Configure TypeScript for type safety
- [ ] Set up proper project structure with organized folders (`components`, `lib`, `app`, etc.)
- [ ] Include basic styling (Tailwind CSS, CSS modules, or plain CSS)

### 2. Supabase Integration

- [ ] Install and configure the Supabase CLI and client libraries
- [ ] Set up Supabase for local development
- [ ] Create Supabase client utilities for both server and client components (using `@supabase/ssr`)
- [ ] Configure Next.js middleware for token refresh (`middleware.ts`)
- [ ] Set up environment variables for Supabase credentials

### 3. User Authentication

- [ ] Implement user sign-up functionality
- [ ] Implement user sign-in functionality
- [ ] Implement user sign-out functionality
- [ ] Create protected routes that require authentication
- [ ] Display user information when logged in
- [ ] Handle authentication state properly in both server and client components

### 4. Profile Model with Declarative Schema

- [ ] Design and create a `profiles` table that stores user profile information
- [ ] The table should have a primary key that references `auth.users(id)`
- [ ] Include an `updated_at` field that is automatically set when the row is updated (use a trigger)
- [ ] Define the profile table using a declarative schema in `supabase/schemas/profiles.sql`
- [ ] Generate a migration from the declarative schema using `npx supabase db diff`

### 5. Automatic Profile Creation

- [ ] Create a PostgreSQL trigger function that automatically creates a profile when a new user is inserted into `auth.users`. The trigger should:
  - Fire AFTER a new user is inserted into `auth.users`
  - Extract the user's email from the `auth.users` record
  - Insert a new row into the `profiles` table with the user's ID and email
- [ ] Include the trigger function and trigger in your migration file

### 6. Setup Script

Create a setup script (e.g., `setup.sh` or `setup.js`) that automates the entire project setup process.

**The script must:**

- [ ] Install all npm dependencies (`npm install`)
- [ ] Start the local Supabase instance (`npx supabase start`)
- [ ] Extract Supabase credentials (URL and anon key) from the `supabase start` output
- [ ] Create or update `.env.local` with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Run database migrations (`npx supabase db reset` or `npx supabase migration up`)
- [ ] Provide clear output showing what was done and the next steps

**The script must also:**

- [ ] Assume that Supabase is already initialized (i.e., the `supabase/` directory with migrations and schemas already exists)
- [ ] Be idempotent (safe to run multiple times)
- [ ] Handle cases where Supabase is already running
- [ ] Check if `.env.local` already exists and either skip or update it
- [ ] Provide helpful error messages if something goes wrong

**Conceptual example:**

```bash
#!/bin/bash
# setup.sh

echo "Setting up Next.js + Supabase Starter App..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Start Supabase (assumes supabase/ directory already exists)
echo "Starting Supabase..."
npx supabase start

# Extract credentials from supabase status output
SUPABASE_URL=$(npx supabase status | grep "API URL" | awk '{print $3}')
SUPABASE_ANON_KEY=$(npx supabase status | grep "anon key" | awk '{print $3}')

# Create .env.local
echo "Creating .env.local..."
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

# Run migrations
echo "Running migrations..."
npx supabase db reset

echo "Setup complete!"
echo "Next steps:"
echo "  1. Run 'npm run dev' to start the development server"
echo "  2. Visit http://localhost:3000"
echo "  3. Sign up for a new account to test authentication"
```

---

## Code Quality Requirements

- [ ] Use TypeScript throughout the application
- [ ] Follow Next.js 13+ App Router conventions (use `app/` directory, not `pages/`)
- [ ] Use `@supabase/ssr` for proper server-side rendering support
- [ ] All database schema changes must be in migration files (no manual SQL execution)
- [ ] Use declarative schemas in `supabase/schemas/` and generate migrations from them
- [ ] Include proper error handling for authentication and database operations
- [ ] Code should be well-organized and follow best practices
- [ ] Include comments in code where the logic is not self-evident

### Authentication Patterns

- [ ] Implement standardized, reusable ways of checking for user authentication that are consistent across the application. For example:
  - A custom hook (e.g., `useAuth()`) for client components
  - Helper functions for server components
- [ ] Document your authentication patterns in your README

### Code Organization

- [ ] Make explicit decisions about code organization and document them in your README. Cover:
  - Where reusable components (buttons, forms, etc.) are stored
  - Where custom hooks are located
  - How utility functions are organized
  - Any other notable architectural decisions

### Unit Testing

- [ ] Set up a unit testing framework (e.g., Jest, Vitest, or similar)
- [ ] Include example tests that demonstrate:
  - How to test React components
  - How to test utility functions
  - How to test authentication-related code
- [ ] Include instructions in your README on how to run tests and add new tests

---

## Required Pages

### Home Page

- [ ] Show a welcome message
- [ ] Display authentication status
- [ ] Link to login/signup if not authenticated
- [ ] Link to dashboard if authenticated

### Login Page

- [ ] Email and password login form
- [ ] Error handling for failed login attempts
- [ ] Redirect to dashboard on successful login

### Signup Page

- [ ] Email and password signup form
- [ ] Error handling for failed signup attempts
- [ ] Redirect to dashboard on successful signup

### Dashboard (Protected Route)

- [ ] Require authentication (redirect to login if not authenticated)
- [ ] Display user profile information
- [ ] Link to profile page
- [ ] Sign-out button

### Profile (Protected Route)

- [ ] Require authentication (redirect to login if not authenticated)
- [ ] Display current profile information
- [ ] Form to update profile information (e.g., `full_name` and any other fields in your profile model)
- [ ] Avatar upload functionality that:
  - Allows users to select and upload an image file
  - Stores the uploaded image (Supabase Storage or another storage solution)
  - Updates the `avatar_url` field in the `profiles` table
  - Displays the uploaded avatar
- [ ] Save/update button to persist changes
- [ ] Error handling for upload failures and validation errors

---

## Documentation Requirements

Your `README.md` should include:

- [ ] Project description and purpose
- [ ] Prerequisites (Node.js version, Docker for Supabase, etc.)
- [ ] Quick start instructions (how to run the setup script)
- [ ] Manual setup instructions (step-by-step alternative)
- [ ] Project structure explanation
- [ ] How to use this starter app for new projects
- [ ] Environment variables documentation
- [ ] Database schema overview
- [ ] Authentication flow explanation
- [ ] Authentication patterns used in the codebase
- [ ] Deployment instructions (how to deploy to production)
- [ ] GitHub Actions setup and configuration (how to set up the migration workflow)
- [ ] Troubleshooting section
- [ ] Instructions for running and adding tests

---

## Submission Checklist

- [ ] Read the assignment description fully and understand all requirements
- [ ] Create a new Next.js application with TypeScript
- [ ] Set up Supabase locally and configure it with your Next.js app
- [ ] Implement user authentication (sign up, sign in, sign out)
- [ ] Create the `profiles` table using a declarative schema
- [ ] Generate a migration from your declarative schema
- [ ] Add the trigger function and trigger for automatic profile creation
- [ ] Implement RLS policies on the `profiles` table
- [ ] Create the required pages (home, login, signup, dashboard, profile)
- [ ] Build and test the setup script
- [ ] Create a GitHub Actions workflow for automatic database migrations
- [ ] Write comprehensive documentation in `README.md` (including deployment instructions)
- [ ] Test the entire setup process from scratch (delete `node_modules` and `.env.local`, then run the setup script — **do not delete the `supabase/` directory**, as it contains your migrations and schemas)
- [ ] Before submitting, remove the `node_modules` folder
- [ ] Submit your project
