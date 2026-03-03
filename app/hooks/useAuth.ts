"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
}

/**
 * Client-side auth hook — canonical way to get the current user in
 * Client Components.
 *
 * Fetches the initial session on mount, then stays in sync with auth state
 * changes (sign-in, sign-out, token refresh) via onAuthStateChange.
 *
 * @returns {{ user: User | null, loading: boolean }}
 *   - `user`    — the authenticated user, or null when signed out
 *   - `loading` — true during the initial session fetch; false once resolved
 *
 * @example
 * "use client";
 * import { useAuth } from "@/app/hooks/useAuth";
 *
 * export default function MyComponent() {
 *   const { user, loading } = useAuth();
 *   if (loading) return <p>Loading...</p>;
 *   if (!user) return <p>Not signed in.</p>;
 *   return <p>Hello, {user.email}</p>;
 * }
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Resolve the initial session without waiting for a state-change event.
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Stay in sync with sign-in, sign-out, and token-refresh events.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
