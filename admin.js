-- Digital Skills Assessment Supabase Schema
-- Run this in Supabase SQL Editor after creating your project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  group_course text not null default 'Unassigned',
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  must_reset_password boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_text text not null,
  score int not null check (score between 0 and 3),
  display_order int not null default 0
);

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total_score int not null,
  max_score int not null,
  percentage int not null,
  category_scores jsonb not null default '{}',
  recommendations jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  question text not null,
  category text not null,
  selected_answer_text text not null,
  selected_score int not null check (selected_score between 0 and 3)
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_answers enable row level security;

drop policy if exists "profiles select own or admin" on public.profiles;
create policy "profiles select own or admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles update own reset or admin" on public.profiles;
create policy "profiles update own reset or admin" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "questions select active or admin" on public.questions;
create policy "questions select active or admin" on public.questions
for select using (is_active = true or public.is_admin());

drop policy if exists "questions admin all" on public.questions;
create policy "questions admin all" on public.questions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "answers select via active questions or admin" on public.answers;
create policy "answers select via active questions or admin" on public.answers
for select using (
  public.is_admin() or exists (
    select 1 from public.questions q where q.id = question_id and q.is_active = true
  )
);

drop policy if exists "answers admin all" on public.answers;
create policy "answers admin all" on public.answers
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "attempts own insert" on public.assessment_attempts;
create policy "attempts own insert" on public.assessment_attempts
for insert with check (user_id = auth.uid());

drop policy if exists "attempts select own or admin" on public.assessment_attempts;
create policy "attempts select own or admin" on public.assessment_attempts
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "attempts admin delete" on public.assessment_attempts;
create policy "attempts admin delete" on public.assessment_attempts
for delete using (public.is_admin());

drop policy if exists "answers own insert" on public.assessment_answers;
create policy "answers own insert" on public.assessment_answers
for insert with check (
  exists (select 1 from public.assessment_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);

drop policy if exists "answers select own or admin" on public.assessment_answers;
create policy "answers select own or admin" on public.assessment_answers
for select using (
  public.is_admin() or exists (select 1 from public.assessment_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);

-- Seed starter questions. You can edit/delete these in the admin dashboard.
insert into public.questions (id, category, question, display_order)
values
  ('00000000-0000-0000-0000-000000000001', 'Digital Communication', 'How confident are you using email, Teams, or Zoom professionally?', 1),
  ('00000000-0000-0000-0000-000000000002', 'Productivity Tools', 'How well can you use spreadsheets such as Excel or Google Sheets?', 2)
on conflict (id) do nothing;

insert into public.answers (question_id, answer_text, score, display_order)
values
  ('00000000-0000-0000-0000-000000000001', 'I avoid them where possible', 0, 1),
  ('00000000-0000-0000-0000-000000000001', 'I can use basic features', 1, 2),
  ('00000000-0000-0000-0000-000000000001', 'I use them confidently', 2, 3),
  ('00000000-0000-0000-0000-000000000001', 'I train or support others with them', 3, 4),
  ('00000000-0000-0000-0000-000000000002', 'Very little experience', 0, 1),
  ('00000000-0000-0000-0000-000000000002', 'Basic editing and formatting', 1, 2),
  ('00000000-0000-0000-0000-000000000002', 'Formulas, filtering, and charts', 2, 3),
  ('00000000-0000-0000-0000-000000000002', 'Advanced analysis or dashboards', 3, 4)
on conflict do nothing;
