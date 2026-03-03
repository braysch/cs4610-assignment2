#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────────────────────
# Setup script for the Next.js + Supabase starter app.
# Safe to run multiple times (idempotent).
# Assumes the supabase/ directory with migrations already exists.
# ─────────────────────────────────────────────────────────────

echo ""
echo "=== Step 1: Installing npm dependencies ==="
npm install
echo "Done."

echo ""
echo "=== Step 2: Starting local Supabase ==="

# Check if Supabase is already running. supabase status exits 0 when healthy.
# If it is running, skip start. If not, start it.
#
# --ignore-health-check is required on Windows because the analytics container
# health check always fails (it needs the Docker daemon exposed on
# tcp://localhost:2375). The flag is harmless on Linux/macOS.
if npx supabase status > /dev/null 2>&1; then
  echo "Supabase is already running. Skipping start."
else
  echo "Starting Supabase (this may take a minute on first run)..."
  npx supabase start --ignore-health-check
fi

echo ""
echo "=== Step 3: Extracting Supabase credentials ==="

# `supabase status -o env` outputs reliable key=value pairs regardless of
# CLI version or terminal width. We use it instead of parsing the pretty table,
# which changed labels between CLI v1 and v2.
#
# Keys used:
#   API_URL         — the local REST/Auth API endpoint
#   PUBLISHABLE_KEY — the anon/publishable key for browser clients
SUPABASE_ENV=$(npx supabase status -o env 2>&1)
SUPABASE_URL=$(echo "$SUPABASE_ENV" | grep '^API_URL=' | cut -d'"' -f2)
SUPABASE_ANON_KEY=$(echo "$SUPABASE_ENV" | grep '^PUBLISHABLE_KEY=' | cut -d'"' -f2)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo ""
  echo "ERROR: Could not extract Supabase credentials."
  echo "  Make sure 'npx supabase start' completed successfully."
  echo "  You can run 'npx supabase status -o env' manually to inspect the output."
  exit 1
fi

echo "  NEXT_PUBLIC_SUPABASE_URL      = $SUPABASE_URL"
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY = (extracted)"

echo ""
echo "=== Step 4: Writing .env.local ==="

ENV_FILE=".env.local"

if [ -f "$ENV_FILE" ]; then
  echo ".env.local already exists. Updating Supabase credentials..."
  # Strip any existing NEXT_PUBLIC_SUPABASE_* lines, then append fresh values.
  grep -v '^NEXT_PUBLIC_SUPABASE_' "$ENV_FILE" > "${ENV_FILE}.tmp" || true
  mv "${ENV_FILE}.tmp" "$ENV_FILE"
else
  echo "Creating $ENV_FILE..."
  touch "$ENV_FILE"
fi

cat >> "$ENV_FILE" <<EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

echo "Wrote credentials to $ENV_FILE."

echo ""
echo "=== Step 5: Running database migrations ==="

# On Windows, db reset can exit non-zero due to a transient storage API
# timeout that occurs right after container restart, even though migrations
# and seed data are applied successfully. We retry once after a short delay.
set +e
npx supabase db reset
DB_RESET_EXIT=$?
set -e

if [ $DB_RESET_EXIT -ne 0 ]; then
  echo ""
  echo "Note: db reset exited with an error (often a transient storage API"
  echo "timeout on Windows). Retrying in 10 seconds..."
  sleep 10
  npx supabase db reset
fi

echo "Migrations applied."

echo ""
echo "════════════════════════════════════════════"
echo " Setup complete!"
echo "════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Run the development server:  npm run dev"
echo "  2. Open your browser at:        http://localhost:3000"
echo "  3. Supabase Studio is at:       http://localhost:54323"
echo ""
