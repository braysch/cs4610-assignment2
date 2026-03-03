-- Seed data for local development.
-- Add INSERT statements here to pre-populate tables when running `npx supabase db reset`.

-- ============================================================
-- Storage buckets
-- ============================================================

-- Avatars bucket: public read, image uploads only, 5 MB limit.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

-- ============================================================
-- Storage RLS policies
-- ============================================================

-- Anyone can read from the avatars bucket (it is public).
create policy "Public read access for avatars"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar.
-- The path convention is: avatars/{user_id}/avatar
create policy "Authenticated users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update (replace) their own avatar.
create policy "Authenticated users can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own avatar.
create policy "Authenticated users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
