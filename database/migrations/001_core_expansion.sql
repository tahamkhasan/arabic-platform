-- ============================================================
-- ترحيل قاعدة البيانات 001: توسيع البنية الأساسية
-- منصة مِداد
-- ============================================================

-- حذف كل الجداول الجديدة (نظيف البداية)
DROP TABLE IF EXISTS student_achievements CASCADE;
DROP TABLE IF EXISTS parent_children CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS context_memory CASCADE;
DROP TABLE IF EXISTS flashcard_progress CASCADE;
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS shared_links CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS class_students CASCADE;
DROP TABLE IF EXISTS classrooms CASCADE;
DROP TABLE IF EXISTS generation_outputs CASCADE;
DROP TABLE IF EXISTS generation_logs CASCADE;

-- حذف أي فهارس عالقة
DROP INDEX IF EXISTS idx_gen_logs_user CASCADE;
DROP INDEX IF EXISTS idx_gen_logs_type CASCADE;
DROP INDEX IF EXISTS idx_gen_outputs_log CASCADE;
DROP INDEX IF EXISTS idx_classrooms_teacher CASCADE;
DROP INDEX IF EXISTS idx_quizzes_teacher CASCADE;
DROP INDEX IF EXISTS idx_quizzes_class CASCADE;
DROP INDEX IF EXISTS idx_quizzes_published CASCADE;
DROP INDEX IF EXISTS idx_shared_links_token CASCADE;
DROP INDEX IF EXISTS idx_questions_quiz CASCADE;
DROP INDEX IF EXISTS idx_questions_lesson CASCADE;
DROP INDEX IF EXISTS idx_questions_type CASCADE;
DROP INDEX IF EXISTS idx_quiz_attempts_quiz CASCADE;
DROP INDEX IF EXISTS idx_quiz_attempts_student CASCADE;
DROP INDEX IF EXISTS idx_flashcards_lesson CASCADE;
DROP INDEX IF EXISTS idx_fc_progress_student CASCADE;
DROP INDEX IF EXISTS idx_fc_progress_next CASCADE;
DROP INDEX IF EXISTS idx_ctx_mem_user CASCADE;
DROP INDEX IF EXISTS idx_ctx_mem_lesson CASCADE;
DROP INDEX IF EXISTS idx_ctx_mem_type CASCADE;
DROP INDEX IF EXISTS idx_assignments_teacher CASCADE;
DROP INDEX IF EXISTS idx_assignments_class CASCADE;
DROP INDEX IF EXISTS idx_submissions_assignment CASCADE;
DROP INDEX IF EXISTS idx_submissions_student CASCADE;
DROP INDEX IF EXISTS idx_chat_conv_user CASCADE;
DROP INDEX IF EXISTS idx_chat_msg_conv CASCADE;
DROP INDEX IF EXISTS idx_notifications_user CASCADE;
DROP INDEX IF EXISTS idx_notifications_unread CASCADE;

-- 1. سجل التوليدات
CREATE TABLE generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    lesson_id UUID,
    input_params JSONB DEFAULT '{}',
    output_summary TEXT DEFAULT '',
    output_format TEXT DEFAULT '',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gen_logs_user ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gen_logs_type ON generation_logs(type);

-- 2. مخرجات التوليدات
CREATE TABLE generation_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_log_id UUID NOT NULL REFERENCES generation_logs(id) ON DELETE CASCADE,
    output_text TEXT,
    output_html TEXT,
    output_json JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gen_outputs_log ON generation_outputs(generation_log_id);

-- 3. الفصول الدراسية
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON classrooms(teacher_id);

-- 4. ربط الطلاب بالفصول
CREATE TABLE class_students (
    class_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (class_id, student_id)
);

-- 5. الاختبارات
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    lesson_ids UUID[] NOT NULL DEFAULT '{}',
    config JSONB NOT NULL DEFAULT '{}',
    time_limit_minutes INT,
    shuffle_questions BOOLEAN NOT NULL DEFAULT true,
    shuffle_options BOOLEAN NOT NULL DEFAULT true,
    published BOOLEAN NOT NULL DEFAULT false,
    attempts_allowed INT NOT NULL DEFAULT 1 CHECK (attempts_allowed >= 1 AND attempts_allowed <= 10),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher ON quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_class ON quizzes(class_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_published ON quizzes(published) WHERE deleted_at IS NULL;

-- 6. روابط المشاركة
CREATE TABLE shared_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_log_id UUID REFERENCES generation_logs(id) ON DELETE SET NULL,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shared_links_token ON shared_links(token);

-- 7. بنك الأسئلة
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'multiple_choice', 'true_false', 'fill_blank', 'matching',
        'ordering', 'syntax_analysis', 'extraction', 'essay'
    )),
    text TEXT NOT NULL,
    image_url TEXT,
    options JSONB,
    correct_answer JSONB,
    explanation TEXT NOT NULL DEFAULT '',
    points INT NOT NULL DEFAULT 1 CHECK (points >= 1),
    hint TEXT,
    bloom_level TEXT CHECK (bloom_level IN (
        'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'
    )),
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    syntax_target TEXT,
    source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'manual')),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_lesson ON questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);

-- 8. محاولات الاختبار
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}',
    evaluations JSONB,
    score NUMERIC(5,2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at TIMESTAMPTZ,
    time_spent_seconds INT
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);

-- 9. بطاقات الحفظ
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    front JSONB NOT NULL,
    back JSONB NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_flashcards_lesson ON flashcards(lesson_id);

-- 10. تقدم البطاقات
CREATE TABLE flashcard_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interval_days INT NOT NULL DEFAULT 1 CHECK (interval_days >= 0),
    ease_factor NUMERIC(3,2) NOT NULL DEFAULT 2.50 CHECK (ease_factor >= 1.30 AND ease_factor <= 2.50),
    repetitions INT NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
    next_review DATE NOT NULL,
    last_review DATE,
    mastery_level TEXT NOT NULL DEFAULT 'new' CHECK (mastery_level IN ('new', 'learning', 'review', 'mastered')),
    times_right INT NOT NULL DEFAULT 0 CHECK (times_right >= 0),
    times_wrong INT NOT NULL DEFAULT 0 CHECK (times_wrong >= 0),
    UNIQUE(flashcard_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_fc_progress_student ON flashcard_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_fc_progress_next ON flashcard_progress(student_id, next_review);

-- 11. ذاكرة السياق التعليمي
CREATE TABLE context_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN (
        'generated_lesson', 'worksheet', 'quiz_attempt', 'chat_question',
        'mistake', 'flashcard_review'
    )),
    content_summary TEXT NOT NULL DEFAULT '',
    performance_signal NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (performance_signal >= -1 AND performance_signal <= 1),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ctx_mem_user ON context_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ctx_mem_lesson ON context_memory(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_ctx_mem_type ON context_memory(user_id, interaction_type);

-- 12. المهام
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('worksheet', 'quiz', 'reading', 'writing', 'other')),
    content_ref JSONB,
    due_date TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);

-- 13. تسليمات المهام
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB,
    score NUMERIC(5,2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    feedback TEXT,
    graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);

-- 14. محادثات الدردشة
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_id);

-- 15. رسائل الدردشة
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id, created_at);

-- 16. الإشعارات
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'assignment', 'quiz', 'grade', 'message', 'achievement', 'reminder', 'system'
    )),
    title TEXT NOT NULL,
    body TEXT,
    link TEXT,
    data JSONB,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- 17. الإنجازات
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title_ar TEXT NOT NULL,
    description_ar TEXT,
    icon TEXT NOT NULL DEFAULT '🏆',
    condition JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. إنجازات الطلاب
CREATE TABLE student_achievements (
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, achievement_id)
);

-- 19. ربط أولياء الأمور بالطلاب
CREATE TABLE parent_children (
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relation TEXT NOT NULL DEFAULT 'father' CHECK (relation IN ('father', 'mother', 'guardian')),
    PRIMARY KEY (parent_id, child_id)
);

-- 20. بذور الإنجازات
INSERT INTO achievements (code, title_ar, description_ar, icon, condition) VALUES
    ('first_lesson', 'البداية', 'أكمل أول درس', '🌱', '{"type": "lessons_completed", "value": 1}'),
    ('streak_7', 'مثابر', 'ادرس 7 أيام متتالية', '🔥', '{"type": "streak", "value": 7}'),
    ('streak_30', 'لا يُقهَر', 'ادرس 30 يوماً متتالياً', '💎', '{"type": "streak", "value": 30}'),
    ('perfect_quiz', 'كامل', 'احصل على 100% في اختبار', '💯', '{"type": "perfect_quiz", "value": 1}'),
    ('nahw_master', 'نحويّ', 'أتقن جميع دروس النحو', '📐', '{"type": "subject_mastery", "subject": "nahw", "value": 90}'),
    ('flashcard_100', 'حافظ', 'راجع 100 بطاقة حفظ', '🃏', '{"type": "flashcards_reviewed", "value": 100}'),
    ('error_fixer', 'مُصلح', 'صحّح 10 أخطاء سابقة بنجاح', '🔧', '{"type": "errors_corrected", "value": 10}'),
    ('early_bird', 'مبكّر', 'أكمل مهمة قبل موعدها بيوم', '🐦', '{"type": "early_submission", "value": 1}'),
    ('helper', 'مُساعِد', 'اسأل مداد 20 سؤالاً', '🤝', '{"type": "chat_questions", "value": 20}'),
    ('top_class', 'الأول في الفصل', 'كن الأعلى متوسطاً في فصلك', '🏆', '{"type": "class_rank", "value": 1}');