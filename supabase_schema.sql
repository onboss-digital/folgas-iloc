-- ==============================================================================
-- SCHEMA COMPLETO DO BANCO DE DADOS - FOLGAS ILOC (REGIME 5X2)
-- Para executar no SQL Editor do Supabase (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. TABELA DE COLABORADORES (EMPLOYEES)
create table if not exists public.employees (
  id text primary key,
  name text not null,
  email text unique not null,
  role text not null default 'Colaborador',
  team text not null default 'Operações de Loja',
  work_hours text not null default '08:00 às 17:00',
  status text not null default 'active' check (status in ('active', 'inactive')),
  avatar_url text,
  initials text,
  color_bg text default 'bg-blue-600',
  admission_date text,
  preferred_days_off integer[] default '{5,6}',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABELA DE ESCALAS SEMANAIS (SCHEDULES)
create table if not exists public.schedules (
  week_id text primary key, -- Ex: '2026-W44'
  week_number integer not null,
  year integer not null,
  start_date text not null,
  end_date text not null,
  is_published boolean default false not null,
  is_public_share_enabled boolean default false not null,
  published_at timestamp with time zone,
  share_token text unique,
  shifts jsonb not null default '{}'::jsonb,
  custom_hours jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABELA DE CONFIGURAÇÕES DA EMPRESA (COMPANY SETTINGS)
create table if not exists public.company_settings (
  id text primary key default 'default_settings',
  regime text not null default '5x2',
  operating_days integer not null default 7,
  min_staff_per_day integer not null default 2,
  weekly_rest_days integer not null default 2,
  rotate_shifts boolean not null default true,
  rotate_sundays boolean not null default true,
  operates_on_holidays boolean not null default true,
  start_day integer not null default 1,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ÍNDICES DE DESEMPENHO E CONSULTA
create index if not exists idx_employees_team on public.employees(team);
create index if not exists idx_employees_status on public.employees(status);
create index if not exists idx_schedules_share_token on public.schedules(share_token);
create index if not exists idx_schedules_is_published on public.schedules(is_published);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
alter table public.employees enable row level security;
alter table public.schedules enable row level security;
alter table public.company_settings enable row level security;

-- 6. POLÍTICAS DE SEGURANÇA (RLS) - EMPLOYEES
-- Leitura: Usuários autenticados veem todos; visitantes anônimos consultam apenas ativos no link público
drop policy if exists "employees_select_policy" on public.employees;
create policy "employees_select_policy"
  on public.employees for select
  to anon, authenticated
  using (status = 'active' or auth.role() = 'authenticated');

-- Inserção: Permitido para administrador ou novos cadastros
drop policy if exists "employees_insert_policy" on public.employees;
create policy "employees_insert_policy"
  on public.employees for insert
  to anon, authenticated
  with check (true);

-- Atualização: Administrador ou o próprio colaborador atualizando seu cadastro
drop policy if exists "employees_update_policy" on public.employees;
create policy "employees_update_policy"
  on public.employees for update
  to anon, authenticated
  using (true);

-- Exclusão: Somente administrador
drop policy if exists "employees_delete_policy" on public.employees;
create policy "employees_delete_policy"
  on public.employees for delete
  to authenticated
  using (auth.jwt() ->> 'email' = 'luizstaff@ilocmobile.com.br');

-- 7. POLÍTICAS DE SEGURANÇA (RLS) - SCHEDULES
-- Leitura pública para links compartilhados com share_token ativo e escala publicada
drop policy if exists "schedules_select_public_share" on public.schedules;
create policy "schedules_select_public_share"
  on public.schedules for select
  to anon, authenticated
  using (
    (is_published = true and is_public_share_enabled = true)
    or auth.role() = 'authenticated'
  );

-- Inserção e Atualização de Escalas
drop policy if exists "schedules_insert_policy" on public.schedules;
create policy "schedules_insert_policy"
  on public.schedules for insert
  to anon, authenticated
  with check (true);

drop policy if exists "schedules_update_policy" on public.schedules;
create policy "schedules_update_policy"
  on public.schedules for update
  to anon, authenticated
  using (true);

-- 8. POLÍTICAS DE SEGURANÇA (RLS) - COMPANY SETTINGS
-- Leitura: Qualquer usuário
drop policy if exists "settings_select_policy" on public.company_settings;
create policy "settings_select_policy"
  on public.company_settings for select
  to anon, authenticated
  using (true);

-- Edição: Administrador
drop policy if exists "settings_update_policy" on public.company_settings;
create policy "settings_update_policy"
  on public.company_settings for all
  to anon, authenticated
  using (true);

-- 9. DADOS INICIAIS BASE (PADRÃO ILOC)
insert into public.company_settings (id, regime, operating_days, min_staff_per_day, weekly_rest_days, rotate_shifts, rotate_sundays, operates_on_holidays, start_day)
values ('default_settings', '5x2', 7, 2, 2, true, true, true, 1)
on conflict (id) do update set
  regime = excluded.regime,
  operating_days = excluded.operating_days,
  min_staff_per_day = excluded.min_staff_per_day;
