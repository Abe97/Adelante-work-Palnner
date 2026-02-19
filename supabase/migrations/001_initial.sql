-- Profili utente
create table profiles (
  id uuid references auth.users primary key,
  full_name text not null,
  email text not null,
  role text not null default 'member',
  avatar_url text,
  created_at timestamptz default now()
);

-- Clienti
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  logo_url text,
  notes text,
  is_archived boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Progetti
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  client_id uuid references clients(id) on delete cascade,
  status text default 'active',
  start_date date,
  end_date date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Assegnazioni progetto
create table project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (project_id, user_id)
);

-- Task
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  project_id uuid references projects(id) on delete cascade,
  assigned_to uuid references profiles(id),
  status text default 'todo',
  priority text default 'medium',
  due_date date,
  estimated_hours numeric(5,2) default 0,
  logged_hours numeric(5,2) default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Log ore
create table time_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id),
  hours numeric(4,2) not null,
  note text,
  logged_date date default current_date,
  created_at timestamptz default now()
);

-- RLS: abilita su tutte le tabelle
alter table profiles enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table tasks enable row level security;
alter table time_logs enable row level security;

-- Policy Admin: accesso completo
create policy "Admin full access" on profiles for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Admin full access" on clients for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Admin full access" on projects for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Admin full access" on project_members for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Admin full access" on tasks for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Admin full access" on time_logs for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Policy Member: vede solo i propri progetti
create policy "Member read own projects" on projects for select using (
  exists (select 1 from project_members where project_id = id and user_id = auth.uid())
);

create policy "Member read own tasks" on tasks for select using (
  assigned_to = auth.uid()
);

create policy "Member write own time_logs" on time_logs for all using (
  user_id = auth.uid()
);

-- Trigger: aggiorna logged_hours su tasks quando si aggiunge un time_log
create or replace function update_task_logged_hours()
returns trigger as $$
begin
  update tasks set
    logged_hours = (select coalesce(sum(hours), 0) from time_logs where task_id = NEW.task_id),
    updated_at = now()
  where id = NEW.task_id;
  return NEW;
end;
$$ language plpgsql;

create trigger on_time_log_insert
after insert or update or delete on time_logs
for each row execute function update_task_logged_hours();

-- Trigger: crea profilo automaticamente quando un utente si registra
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email)
  values (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
