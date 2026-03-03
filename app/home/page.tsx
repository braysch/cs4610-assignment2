import { getUser } from "@/lib/supabase/auth";
import Link from "next/link";

export default async function HomePage() {
  const user = await getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Welcome
      </h1>

      {user ? (
        <>
          <p className="max-w-md text-zinc-600 dark:text-zinc-400">
            Signed in as{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {user.email}
            </span>
            .
          </p>
          <Link
            href="/dashboard"
            className="flex h-11 items-center justify-center rounded-md bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Go to Dashboard
          </Link>
        </>
      ) : (
        <>
          <p className="max-w-md text-zinc-600 dark:text-zinc-400">
            Please log in or create an account to continue.
          </p>
          <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="flex h-11 flex-1 items-center justify-center rounded-md bg-zinc-900 px-4 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="flex h-11 flex-1 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Sign Up
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
