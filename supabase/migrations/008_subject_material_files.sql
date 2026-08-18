begin;

create extension if not exists pgcrypto;

create table if not exists public.subject_material_files (
  id uuid primary key default gen_random_uuid(),

  subject_id uuid not null
    references public.subjects(id)
    on delete cascade,

  title text not null,
  description text,

  file_url text not null,
  file_path text not null,
  file_name text not null,

  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),

  material_scope text not null default 'official'
    check (material_scope in ('official', 'teacher_private')),

  uploaded_by uuid not null
    references public.users(id)
    on delete cascade,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subject_material_files
  add column if not exists subject_id uuid
    references public.subjects(id)
    on delete cascade;

alter table public.subject_material_files
  add column if not exists title text;

alter table public.subject_material_files
  add column if not exists description text;

alter table public.subject_material_files
  add column if not exists file_url text;

alter table public.subject_material_files
  add column if not exists file_path text;

alter table public.subject_material_files
  add column if not exists file_name text;

alter table public.subject_material_files
  add column if not exists mime_type text;

alter table public.subject_material_files
  add column if not exists file_size bigint;

alter table public.subject_material_files
  add column if not exists material_scope text default 'official';

alter table public.subject_material_files
  add column if not exists uploaded_by uuid
    references public.users(id)
    on delete cascade;

alter table public.subject_material_files
  add column if not exists is_active boolean not null default true;

alter table public.subject_material_files
  add column if not exists created_at timestamptz not null default now();

alter table public.subject_material_files
  add column if not exists updated_at timestamptz not null default now();

update public.subject_material_files
set material_scope = 'official'
where material_scope is null
   or material_scope not in ('official', 'teacher_private');

alter table public.subject_material_files
  alter column material_scope set default 'official';

alter table public.subject_material_files
  alter column material_scope set not null;

alter table public.subject_material_files
  drop constraint if exists subject_material_files_material_scope_check;

alter table public.subject_material_files
  add constraint subject_material_files_material_scope_check
  check (material_scope in ('official', 'teacher_private'));

alter table public.subject_material_files
  drop constraint if exists subject_material_files_file_size_check;

alter table public.subject_material_files
  add constraint subject_material_files_file_size_check
  check (file_size is null or file_size >= 0);

create index if not exists idx_subject_material_files_subject_id
  on public.subject_material_files(subject_id);

create index if not exists idx_subject_material_files_uploaded_by
  on public.subject_material_files(uploaded_by);

create index if not exists idx_subject_material_files_subject_scope
  on public.subject_material_files(subject_id, material_scope);

create index if not exists idx_subject_material_files_subject_created
  on public.subject_material_files(subject_id, created_at desc);

create or replace function public.set_subject_material_files_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subject_material_files_updated_at
on public.subject_material_files;

create trigger trg_subject_material_files_updated_at
before update
on public.subject_material_files
for each row
execute function public.set_subject_material_files_updated_at();

alter table public.subject_material_files enable row level security;

drop policy if exists subject_material_files_select_own_or_admin
on public.subject_material_files;

drop policy if exists subject_material_files_insert_own_or_admin
on public.subject_material_files;

drop policy if exists subject_material_files_update_own_or_admin
on public.subject_material_files;

drop policy if exists subject_material_files_delete_own_or_admin
on public.subject_material_files;

create policy subject_material_files_select_own_or_admin
on public.subject_material_files
for select
to authenticated
using (
  public.isadmin()
  or uploaded_by = auth.uid()
);

create policy subject_material_files_insert_own_or_admin
on public.subject_material_files
for insert
to authenticated
with check (
  public.isadmin()
  or uploaded_by = auth.uid()
);

create policy subject_material_files_update_own_or_admin
on public.subject_material_files
for update
to authenticated
using (
  public.isadmin()
  or uploaded_by = auth.uid()
)
with check (
  public.isadmin()
  or uploaded_by = auth.uid()
);

create policy subject_material_files_delete_own_or_admin
on public.subject_material_files
for delete
to authenticated
using (
  public.isadmin()
  or uploaded_by = auth.uid()
);

grant select, insert, update, delete
on public.subject_material_files
to authenticated;

grant all
on public.subject_material_files
to service_role;

commit;