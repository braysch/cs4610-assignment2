import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/auth";
import SignOutButton from "@/app/components/SignOutButton";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 dark:bg-black">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Logged in as{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.email}</span>
      </p>
      <div className="flex gap-3">
        <Link
          href="/profile"
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          View Profile
        </Link>
        <SignOutButton />
      </div>
    </main>
  );
}
