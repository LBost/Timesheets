-- Supabase row-level security and auth.users foreign keys.
-- Apply after running the Drizzle migration in db/migrations/.
-- Safe to re-run: every statement is idempotent.

-- ---------------------------------------------------------------------------
-- Foreign keys to auth.users(id) (kept out of the Drizzle schema because
-- auth is a Supabase-managed schema we don't model in TS).
-- ---------------------------------------------------------------------------

alter table public.clients
  drop constraint if exists clients_user_id_fkey,
  add constraint clients_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.projects
  drop constraint if exists projects_user_id_fkey,
  add constraint projects_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.orders
  drop constraint if exists orders_user_id_fkey,
  add constraint orders_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.time_entries
  drop constraint if exists time_entries_user_id_fkey,
  add constraint time_entries_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.settings
  drop constraint if exists settings_user_id_fkey,
  add constraint settings_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Enable RLS and owner-only policies (user_id = auth.uid()) for every table.
-- ---------------------------------------------------------------------------

alter table public.clients enable row level security;
drop policy if exists "clients owner read"   on public.clients;
drop policy if exists "clients owner insert" on public.clients;
drop policy if exists "clients owner update" on public.clients;
drop policy if exists "clients owner delete" on public.clients;
create policy "clients owner read"   on public.clients for select using (user_id = auth.uid());
create policy "clients owner insert" on public.clients for insert with check (user_id = auth.uid());
create policy "clients owner update" on public.clients for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "clients owner delete" on public.clients for delete using (user_id = auth.uid());

alter table public.projects enable row level security;
drop policy if exists "projects owner read"   on public.projects;
drop policy if exists "projects owner insert" on public.projects;
drop policy if exists "projects owner update" on public.projects;
drop policy if exists "projects owner delete" on public.projects;
create policy "projects owner read"   on public.projects for select using (user_id = auth.uid());
create policy "projects owner insert" on public.projects for insert with check (user_id = auth.uid());
create policy "projects owner update" on public.projects for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "projects owner delete" on public.projects for delete using (user_id = auth.uid());

alter table public.orders enable row level security;
drop policy if exists "orders owner read"   on public.orders;
drop policy if exists "orders owner insert" on public.orders;
drop policy if exists "orders owner update" on public.orders;
drop policy if exists "orders owner delete" on public.orders;
create policy "orders owner read"   on public.orders for select using (user_id = auth.uid());
create policy "orders owner insert" on public.orders for insert with check (user_id = auth.uid());
create policy "orders owner update" on public.orders for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "orders owner delete" on public.orders for delete using (user_id = auth.uid());

alter table public.time_entries enable row level security;
drop policy if exists "time_entries owner read"   on public.time_entries;
drop policy if exists "time_entries owner insert" on public.time_entries;
drop policy if exists "time_entries owner update" on public.time_entries;
drop policy if exists "time_entries owner delete" on public.time_entries;
create policy "time_entries owner read"   on public.time_entries for select using (user_id = auth.uid());
create policy "time_entries owner insert" on public.time_entries for insert with check (user_id = auth.uid());
create policy "time_entries owner update" on public.time_entries for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "time_entries owner delete" on public.time_entries for delete using (user_id = auth.uid());

alter table public.settings enable row level security;
drop policy if exists "settings owner read"   on public.settings;
drop policy if exists "settings owner insert" on public.settings;
drop policy if exists "settings owner update" on public.settings;
drop policy if exists "settings owner delete" on public.settings;
create policy "settings owner read"   on public.settings for select using (user_id = auth.uid());
create policy "settings owner insert" on public.settings for insert with check (user_id = auth.uid());
create policy "settings owner update" on public.settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "settings owner delete" on public.settings for delete using (user_id = auth.uid());
