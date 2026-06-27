-- ============================================================
-- دالة find_similar_manual_grades
-- تبحث عبر كل quiz_attempts (كل المعلمين، كل المواد) عن تصحيحات
-- يدوية سابقة (evaluations->question_id->>'manually_graded' = true)
-- على أسئلة مشابهة نصّياً لسؤال جديد، مرتّبة بالأكثر تشابهاً أولاً.
--
-- يتطلب: pg_trgm (مُفعَّل مسبقاً)
-- ============================================================

create or replace function find_similar_manual_grades(
  query_text text,
  result_limit int default 3
)
returns table (
  question_text text,
  student_answer text,
  was_correct boolean,
  score numeric,
  max_points numeric,
  feedback text,
  similarity_score real
)
language sql
stable
as $$
  select
    q.text as question_text,
    (ev.value->>'student_answer') as student_answer,
    (ev.value->>'is_correct')::boolean as was_correct,
    (ev.value->>'score')::numeric as score,
    q.points::numeric as max_points,
    (ev.value->>'immediate_feedback') as feedback,
    similarity(q.text, query_text) as similarity_score
  from quiz_attempts qa
  cross join lateral jsonb_each(qa.evaluations) as ev(key, value)
  join questions q on q.id = ev.key::uuid
  where
    qa.evaluations is not null
    and (ev.value->>'manually_graded')::boolean is true
    and q.text % query_text  -- عامل pg_trgm: يستبعد فورًا غير المتشابهين إطلاقاً (أداء أسرع)
  order by similarity_score desc
  limit result_limit;
$$;

-- ── فهرس GIN على نص الأسئلة لتسريع عامل % وترتيب similarity ──────
create index if not exists idx_questions_text_trgm
  on questions using gin (text gin_trgm_ops);