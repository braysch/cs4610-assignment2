-- profiles table (generated from declarative schema: supabase/schemas/profiles.sql)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;

-- Users can read only their own profile row.
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Users can update only their own profile row.
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT policy needed — inserts are handled by the handle_new_user trigger.
-- No DELETE policy needed — deletes cascade from auth.users.

-- ============================================================
-- Triggers
-- ============================================================

-- Function to automatically set updated_at on row update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger: keep updated_at current whenever a profile row is updated
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Function to create a profile automatically when a new auth user is inserted
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Trigger: fire after a new user is inserted into auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
