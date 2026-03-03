import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Server-side auth helper — canonical way to get the current user in
 * Server Components and Route Handlers.
 *
 * Always use getUser() (not session data from cookies) for access-control
 * decisions. It validates the JWT against the Supabase auth server, so it
 * cannot be spoofed by a tampered cookie.
 *
 * Returns the authenticated User object, or null if no valid session exists.
 *
 * @example
 * // app/dashboard/page.tsx
 * import { getUser } from "@/lib/supabase/auth";
 * import { redirect } from "next/navigation";
 *
 * export default async function DashboardPage() {
 *   const user = await getUser();
 *   if (!user) redirect("/login");
 *   // ...
 * }
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
