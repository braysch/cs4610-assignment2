"use client";

import { ChangeEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AvatarUploadProps {
  userId: string;
  avatarUrl: string | null;
}

export default function AvatarUpload({ userId, avatarUrl: initialAvatarUrl }: AvatarUploadProps) {
  // Track the display URL separately so we can append a cache-buster after upload.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const supabase = createClient();

    // Store each user's avatar at a fixed path so uploads replace the previous
    // file rather than accumulating. upsert: true overwrites if it exists.
    const filePath = `${userId}/avatar`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    // Derive the public URL for the uploaded file.
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Persist the URL in the profiles table.
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setUploading(false);
      return;
    }

    // Append a timestamp so the browser re-fetches the image even though the
    // path (and therefore URL) hasn't changed.
    setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
    setUploading(false);

    // Reset the file input so the same file can be re-uploaded if needed.
    event.target.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="self-start text-lg font-semibold text-zinc-900 dark:text-zinc-100">Avatar</h2>

      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt="User avatar"
          width={96}
          height={96}
          className="h-24 w-24 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 text-4xl text-zinc-400 dark:bg-zinc-800">
          ?
        </div>
      )}

      <label className="cursor-pointer rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
        {uploading ? "Uploading..." : "Choose Image"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="sr-only"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
