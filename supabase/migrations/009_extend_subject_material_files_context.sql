begin;

alter table public.subject_material_files
  add column if not exists stage text;

alter table public.subject_material_files
  add column if not exists grade text;

alter table public.subject_material_files
  add column if not exists track text;

alter table public.subject_material_files
  add column if not exists semester text;

alter table public.subject_material_files
  add column if not exists unit_id uuid
    references public.units(id)
    on delete set null;

alter table public.subject_material_files
  add column if not exists lesson_id uuid
    references public.lessons(id)
    on delete set null;

alter table public.subject_material_files
  add column if not exists source_type text
    not null default 'uploaded';

update public.subject_material_files
set source_type = 'uploaded'
where source_type is null
   or source_type not in ('uploaded', 'official_curriculum', 'teacher_reference');

alter table public.subject_material_files
  alter column source_type set default 'uploaded';

alter table public.subject_material_files
  alter column source_type set not null;

alter table public.subject_material_files
  drop constraint if exists subject_material_files_stage_check;

alter table public.subject_material_files
  add constraint subject_material_files_stage_check
  check (
    stage is null
    or stage in ('primary', 'middle', 'secondary')
  );

alter table public.subject_material_files
  drop constraint if exists subject_material_files_track_check;

alter table public.subject_material_files
  add constraint subject_material_files_track_check
  check (
    track is null
    or track in ('scientific', 'literary')
  );

alter table public.subject_material_files
  drop constraint if exists subject_material_files_source_type_check;

alter table public.subject_material_files
  add constraint subject_material_files_source_type_check
  check (
    source_type in (
      'uploaded',
      'official_curriculum',
      'teacher_reference'
    )
  );

create index if not exists idx_subject_material_files_stage_grade
  on public.subject_material_files(
    subject_id,
    stage,
    grade
  );

create index if not exists idx_subject_material_files_unit_id
  on public.subject_material_files(unit_id);

create index if not exists idx_subject_material_files_lesson_id
  on public.subject_material_files(lesson_id);

create index if not exists idx_subject_material_files_context_lookup
  on public.subject_material_files(
    subject_id,
    stage,
    grade,
    semester,
    unit_id,
    lesson_id
  );

commit;