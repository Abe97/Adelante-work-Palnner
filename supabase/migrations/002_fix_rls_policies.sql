-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Fix infinite recursion in RLS policies
--
-- PROBLEMA: La policy "Admin full access" su profiles fa:
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
-- Questa subquery su profiles deve a sua volta passare dalla stessa policy,
-- causando una ricorsione infinita → errore e profilo sempre NULL.
--
-- SOLUZIONE: Creare una funzione SECURITY DEFINER che legge il ruolo
-- bypassando RLS, poi usarla in tutte le policy admin.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Funzione helper: legge il ruolo dell'utente corrente senza RLS
--    SECURITY DEFINER = eseguita con i permessi del owner (postgres), bypassa RLS
create or replace function get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from profiles where id = auth.uid()
$$;

-- 2. Drop delle policy esistenti su profiles (che causano la ricorsione)
drop policy if exists "Admin full access" on profiles;

-- 3. Nuova policy profiles: ogni utente legge/aggiorna solo il proprio profilo
--    Gli admin usano la funzione SECURITY DEFINER per evitare la ricorsione
create policy "Users read own profile" on profiles
  for select using (id = auth.uid());

create policy "Users update own profile" on profiles
  for update using (id = auth.uid());

create policy "Admin full access on profiles" on profiles
  for all using (get_my_role() = 'admin');

-- 4. Drop e ricrea le policy admin sulle altre tabelle usando get_my_role()
drop policy if exists "Admin full access" on clients;
drop policy if exists "Admin full access" on projects;
drop policy if exists "Admin full access" on project_members;
drop policy if exists "Admin full access" on tasks;
drop policy if exists "Admin full access" on time_logs;

create policy "Admin full access" on clients
  for all using (get_my_role() = 'admin');

create policy "Admin full access" on projects
  for all using (get_my_role() = 'admin');

create policy "Admin full access" on project_members
  for all using (get_my_role() = 'admin');

create policy "Admin full access" on tasks
  for all using (get_my_role() = 'admin');

create policy "Admin full access" on time_logs
  for all using (get_my_role() = 'admin');

-- 5. Assicura che i member possano leggere tutti i profili
--    (serve per visualizzare nome/avatar negli assegnatari delle task)
create policy "Members read all profiles" on profiles
  for select using (auth.uid() is not null);

-- 6. Assicura che i member possano leggere i clienti
--    (serve per visualizzare il nome cliente nei progetti)
create policy "Members read clients" on clients
  for select using (auth.uid() is not null);

-- 7. Assicura che i member possano leggere i project_members
--    (serve per verificare l'appartenenza ai progetti)
create policy "Members read project_members" on project_members
  for select using (auth.uid() is not null);

-- 8. Assicura che i member possano aggiungere/modificare/leggere task
--    nei progetti di cui fanno parte
create policy "Member insert tasks in own projects" on tasks
  for insert with check (
    exists (
      select 1 from project_members
      where project_id = tasks.project_id
        and user_id = auth.uid()
    )
  );

create policy "Member update own tasks" on tasks
  for update using (
    assigned_to = auth.uid()
    or exists (
      select 1 from project_members
      where project_id = tasks.project_id
        and user_id = auth.uid()
    )
  );
