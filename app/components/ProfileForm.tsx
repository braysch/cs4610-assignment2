"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  userId: string;
  email: string;
  fullName: string;
}

export default function ProfileForm({ userId, email, fullName: initialFullName }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    } else {
      setStatus("success");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Profile Information
      </h2>

      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</p>
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          {email}
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Full Name
        </label>
        <input
          id="full_name"
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="Your full name"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>

      {status === "success" && (
        <p className="text-sm text-green-600 dark:text-green-400">Profile updated successfully.</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {status === "saving" ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
