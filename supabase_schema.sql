-- ==============================================================================
-- Feastify Supabase Schema
-- Run this in your Supabase project's SQL Editor (https://supabase.com/dashboard)
-- Pair with Supabase Auth (email/password is enough to start).
-- ==============================================================================

-- 1. Profiles (one row per auth.users, created on signup by the app)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('student', 'organizer', 'admin')) default 'student',
  state text,
  city text,
  college text,
  branch text,
  year text,
  phone text
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by any signed-in user" on public.profiles;
create policy "Profiles are readable by any signed-in user"
  on public.profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Events
create table if not exists public.events (
  id text primary key,
  club_id text not null,
  club_name text not null,
  title text not null,
  tagline text not null,
  description text not null,
  rules text[] not null default '{}',
  category text not null,
  scope text not null check (scope in ('internal', 'external', 'both')),
  state text not null,
  city text not null,
  venue text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  registration_deadline timestamptz not null,
  capacity int not null check (capacity > 0),
  fee int not null default 0 check (fee >= 0),
  team_min int not null default 1,
  team_max int not null default 1,
  banner_hue int not null default 200,
  status text not null check (status in ('draft', 'published')) default 'published',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.events enable row level security;

drop policy if exists "Published events are public" on public.events;
create policy "Published events are public"
  on public.events for select
  using (status = 'published' or created_by = auth.uid());

drop policy if exists "Organizers can create events" on public.events;
create policy "Organizers can create events"
  on public.events for insert
  with check (
    auth.uid() = created_by
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('organizer', 'admin'))
  );

drop policy if exists "Organizers manage their own events" on public.events;
create policy "Organizers manage their own events"
  on public.events for update
  using (created_by = auth.uid());

-- 3. Teams
create table if not exists public.teams (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  name text not null,
  join_code text not null,
  created_by uuid not null references public.profiles(id),
  member_ids uuid[] not null default '{}'
);

alter table public.teams enable row level security;

drop policy if exists "Teams are readable by any signed-in user" on public.teams;
create policy "Teams are readable by any signed-in user"
  on public.teams for select
  using (auth.role() = 'authenticated');

drop policy if exists "Signed-in users can create teams" on public.teams;
create policy "Signed-in users can create teams"
  on public.teams for insert
  with check (auth.uid() = created_by);

drop policy if exists "Team members can update their team" on public.teams;
create policy "Team members can update their team"
  on public.teams for update
  using (auth.uid() = any (member_ids) or auth.uid() = created_by);

-- 4. Registrations
create table if not exists public.registrations (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  team_id text references public.teams(id) on delete set null,
  status text not null check (status in ('confirmed', 'waitlisted', 'cancelled')),
  checked_in_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.registrations enable row level security;

drop policy if exists "Users see their own registrations" on public.registrations;
create policy "Users see their own registrations"
  on public.registrations for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.events e where e.id = event_id and e.created_by = auth.uid())
  );

drop policy if exists "Users register themselves" on public.registrations;
create policy "Users register themselves"
  on public.registrations for insert
  with check (user_id = auth.uid());

drop policy if exists "Users cancel their own registration; organizers check in" on public.registrations;
create policy "Users cancel their own registration; organizers check in"
  on public.registrations for update
  using (
    user_id = auth.uid()
    or exists (select 1 from public.events e where e.id = event_id and e.created_by = auth.uid())
  );

-- 5. Helpful indexes
create index if not exists idx_events_status_start on public.events (status, start_at);
create index if not exists idx_events_city on public.events (city);
create index if not exists idx_registrations_event on public.registrations (event_id, status);
create index if not exists idx_registrations_user on public.registrations (user_id);
create index if not exists idx_teams_event_code on public.teams (event_id, join_code);
