import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/app/components/ProfileForm";
import AvatarUpload from "@/app/components/AvatarUpload";
import SignOutButton from "@/app/components/SignOutButton";
import Link from "next/link";

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the user's row from the profiles table.
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 py-12 dark:bg-black">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Profile</h1>

      <div className="w-full max-w-md space-y-4">
        <AvatarUpload
          userId={user.id}
          avatarUrl={profile?.avatar_url ?? null}
        />
        <ProfileForm
          userId={user.id}
          email={profile?.email ?? user.email ?? ""}
          fullName={profile?.full_name ?? ""}
        />
      </div>

      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Back to Dashboard
        </Link>
        <SignOutButton />
      </div>
    </main>
  );
}
