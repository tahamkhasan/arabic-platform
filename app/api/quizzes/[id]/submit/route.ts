// ============================================================
// API: تسليم إجابات الاختبار + تصحيح فوري
// POST: يستقبل الإجابات ويُصحّحها ويرجع النتائج
//
// ── جديد: قبل تقييم fill_blank بالذكاء الاصطناعي، نبحث عن أقرب
// تصحيحات يدوية سابقة من أي معلم في أي مادة (manually_graded في
// quiz_attempts.evaluations) عبر تشابه نصّي (pg_trgm.similarity)
// على نص السؤال، ونحقن أفضل 3 كأمثلة في البرومبت — هذا يجعل
// المساعد يتعلّم تدريجياً من قرارات المعلمين الفعلية، بلا إعادة
// تدريب نموذج، فقط سياق ديناميكي لكل استدعاء. ────────────────────
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error, requireValidId } from '@/lib/api-response';
import { generateWithGemini } from '@/lib/gemini';
import { z } from 'zod';

function getFirstError(zodError: z.ZodError) {
  const firstIssue = zodError.issues?.[0];
  return firstIssue?.message || 'بيانات غير صالحة';
}

const submitSchema = z.object({
  attempt_id: z.string().uuid('معرّف المحاولة غير صالح'),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  time_spent_seconds: z.number().int().min(0).optional(),
});

async function getUser(token: string) {
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return null;
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', user.id)
    .single();
  if (!userData || userData.status !== 'approved') return null;
  return userData;
}

const AUTO_CORRECT_TYPES = [
  'multiple_choice',
  'true_false',
  'matching',
  'ordering',
];

function resolveOptionText(question: any, idOrText: string): string {
  if (question.type !== 'multiple_choice' || !Array.isArray(question.options)) {
    return idOrText;
  }
  const opt = question.options.find((o: any) => o.id === idOrText);
  return opt?.text ?? idOrText;
}

function evaluateClosedQuestion(
  question: any,
  studentAnswer: string | string[]
): {
  is_correct: boolean;
  score: number;
  immediate_feedback: string;
  detailed_explanation: string;
} {
  const correct = question.correct_answer;
  const points = question.points || 1;
  const explanation = question.explanation || '';

  if (question.type === 'multiple_choice') {
    const studentStr = typeof studentAnswer === 'string' ? studentAnswer : studentAnswer[0];
    const isCorrect = studentStr === correct;
    const correctText = resolveOptionText(question, correct);
    return {
      is_correct: isCorrect,
      score: isCorrect ? points : 0,
      immediate_feedback: isCorrect
        ? 'أحسنت! إجابة صحيحة ✅'
        : `إجابة خاطئة ❌ الإجابة الصحيحة: ${correctText}`,
      detailed_explanation: explanation,
    };
  }

  if (question.type === 'true_false') {
    const studentStr = typeof studentAnswer === 'string' ? studentAnswer : studentAnswer[0];
    let isCorrect = false;
    if (typeof correct === 'boolean') {
      isCorrect = (studentStr === 'true') === correct;
    } else {
      isCorrect = studentStr === String(correct);
    }
    return {
      is_correct: isCorrect,
      score: isCorrect ? points : 0,
      immediate_feedback: isCorrect
        ? 'أحسنت! إجابة صحيحة ✅'
        : `إجابة خاطئة ❌ الصحيح: ${correct === true || correct === 'true' ? 'صح' : 'خطأ'}`,
      detailed_explanation: explanation,
    };
  }

  if (question.type === 'matching') {
    const studentArr = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
    const correctArr = Array.isArray(correct) ? correct : [correct];
    const studentSorted = [...studentArr].sort().join(',');
    const correctSorted = [...correctArr].sort().join(',');
    const isCorrect = studentSorted === correctSorted;
    return {
      is_correct: isCorrect,
      score: isCorrect ? points : 0,
      immediate_feedback: isCorrect
        ? 'أحسنت! التوصيل صحيح ✅'
        : `التوصيل غير صحيح ❌ راجع التوصيل الصحيح`,
      detailed_explanation: explanation,
    };
  }

  if (question.type === 'ordering') {
    const studentArr = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
    const correctArr = Array.isArray(correct) ? correct : [correct];
    const isCorrect = JSON.stringify(studentArr) === JSON.stringify(correctArr);
    return {
      is_correct: isCorrect,
      score: isCorrect ? points : 0,
      immediate_feedback: isCorrect
        ? 'أحسنت! الترتيب صحيح ✅'
        : `الترتيب غير صحيح ❌ الترتيب الصحيح: ${correctArr.join(' ← ')}`,
      detailed_explanation: explanation,
    };
  }

  return {
    is_correct: false,
    score: 0,
    immediate_feedback: 'لم يتم التصحيح تلقائياً',
    detailed_explanation: explanation,
  };
}

// ── جديد: عيّنة تصحيح يدوي سابق (من أي معلم، أي مادة) لإغناء
// البرومبت ──────────────────────────────────────────────────────
interface ManualGradeExample {
  question_text: string
  student_answer: string
  was_correct: boolean
  score: number
  max_points: number
  feedback?: string
}

// ── جديد: يبحث في كل quiz_attempts عن محاولات لها evaluations
// تحتوي تصحيحاً يدوياً (manually_graded: true)، يربطها بنص السؤال
// الأصلي من questions، ويرتّبها بتشابه نصّي (pg_trgm) مع السؤال
// الحالي عبر RPC. عند أي فشل (الدالة غير موجودة بعد/خطأ شبكة)،
// يرجع مصفوفة فاضية بأمان — لا يُسقط التصحيح الحالي أبداً. ────────
async function findSimilarManualGrades(questionText: string, limit = 3): Promise<ManualGradeExample[]> {
  try {
    const { data, error: rpcError } = await supabaseAdmin.rpc('find_similar_manual_grades', {
      query_text: questionText,
      result_limit: limit,
    });
    if (rpcError || !data) return [];
    return (data as any[]).map((row) => ({
      question_text: row.question_text,
      student_answer: row.student_answer,
      was_correct: row.was_correct,
      score: row.score,
      max_points: row.max_points,
      feedback: row.feedback,
    }));
  } catch (err) {
    console.error('findSimilarManualGrades error (non-fatal):', err);
    return [];
  }
}

function buildExamplesBlock(examples: ManualGradeExample[]): string {
  if (examples.length === 0) return '';
  let block = '\n\n## أمثلة من قرارات معلمين سابقين على أسئلة مشابهة (استأنس بها، لا تتبعها حرفياً):\n';
  for (const ex of examples) {
    block += `- سؤال مشابه: "${ex.question_text}"\n  إجابة طالب: "${ex.student_answer}"\n  حكم المعلم: ${ex.was_correct ? 'صحيحة' : 'خاطئة'} (${ex.score}/${ex.max_points})${ex.feedback ? ` — ملاحظة: ${ex.feedback}` : ''}\n`;
  }
  return block;
}

async function evaluateFillBlankWithAI(
  questionText: string,
  correctAnswer: string | string[],
  studentAnswer: string
): Promise<{ is_correct: boolean; feedback: string }> {
  const acceptedAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];

  // ── جديد: جلب أمثلة تصحيح يدوي مشابهة عبر كل المواد ────────────
  const examples = await findSimilarManualGrades(questionText);
  const examplesBlock = buildExamplesBlock(examples);

  const systemPrompt = `أنت مصحّح دقيق لأسئلة ملء الفراغ في اللغة العربية (نحو وصرف وبلاغة).
مهمتك: الحكم هل إجابة الطالب صحيحة معنوياً وعلمياً، بصرف النظر عن:
- ترتيب الكلمات أو العناصر المذكورة (طالما كلها مذكورة وصحيحة)
- اختلاف حروف العطف أو علامات الترقيم (و / ، / -)
- التشكيل أو غيابه
لكن لا تتجاهل: نقصاً فعلياً في عنصر مطلوب، أو معلومة علمية خاطئة.${examplesBlock}
أرجع JSON فقط بهذه الصيغة بالضبط، بلا أي نص إضافي:
{"is_correct": true أو false, "feedback": "جملة قصيرة بالعربية تبرر الحكم"}`;

  const userPrompt = `السؤال: ${questionText}
الإجابة (أو الإجابات) المقبولة من المعلم: ${acceptedAnswers.join(' / ')}
إجابة الطالب: ${studentAnswer}`;

  try {
    const raw = await generateWithGemini(systemPrompt, userPrompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.is_correct === 'boolean') {
      return { is_correct: parsed.is_correct, feedback: String(parsed.feedback || '') };
    }
  } catch (err) {
    console.error('evaluateFillBlankWithAI error, falling back to literal match:', err);
  }

  const normalized = (s: string) => s.trim().replace(/[ًٍَُِّْ]/g, '');
  const studentNorm = normalized(studentAnswer);
  const isCorrect = acceptedAnswers.some((a) => {
    const aNorm = normalized(String(a));
    return aNorm === studentNorm || aNorm.includes(studentNorm) || studentNorm.includes(aNorm);
  });
  return { is_correct: isCorrect, feedback: '' };
}

function evaluateOpenQuestion(
  question: any,
  studentAnswer: string | string[]
): {
  is_correct: boolean;
  score: number;
  immediate_feedback: string;
  detailed_explanation: string;
  needs_ai_review: boolean;
} {
  return {
    is_correct: false,
    score: -1,
    immediate_feedback: 'جارٍ تحليل إجابتك... سيظهر التصحيح قريباً',
    detailed_explanation: question.explanation || '',
    needs_ai_review: true,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;

    try { requireValidId(quizId, 'quiz_id'); } catch (e: any) { return error(e.message, 400); }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    if (userData.role !== 'student') {
      return error('هذا المسار للطلاب فقط', 403);
    }

    const body = await req.json();
    const validation = submitSchema.safeParse(body);
    if (!validation.success) {
      return error(getFirstError(validation.error), 422);
    }

    const { attempt_id, answers, time_spent_seconds } = validation.data;

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, student_id, submitted_at')
      .eq('id', attempt_id)
      .eq('quiz_id', quizId)
      .single();

    if (attemptError || !attempt) {
      return error('المحاولة غير موجودة', 404);
    }

    if (attempt.student_id !== userData.id) {
      return error('هذه ليست محاولتك', 403);
    }

    if (attempt.submitted_at) {
      return error('تم تسليم هذه المحاولة مسبقاً', 400, 'ALREADY_SUBMITTED');
    }

    const { data: questions, error: qError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('sort_order', { ascending: true });

    if (qError || !questions || questions.length === 0) {
      return error('لم يتم العثور على أسئلة الاختبار', 500);
    }

    const evaluations: Record<string, any> = {};
    let totalEarned = 0;
    let totalPossible = 0;
    let correctCount = 0;
    let autoCorrectedCount = 0;
    let pendingAiCount = 0;

    for (const question of questions) {
      const qId = question.id;
      const studentAnswer = answers[qId];

      if (studentAnswer === undefined || studentAnswer === null ||
          (typeof studentAnswer === 'string' && studentAnswer.trim() === '')) {
        evaluations[qId] = {
          question_id: qId,
          student_answer: null,
          is_correct: false,
          score: 0,
          immediate_feedback: 'لم تُجب على هذا السؤال',
          detailed_explanation: question.explanation || '',
          should_reinforce: true,
        };
        totalPossible += question.points || 1;
        continue;
      }

      totalPossible += question.points || 1;
      const points = question.points || 1;

      if (question.type === 'fill_blank') {
        const studentStr = typeof studentAnswer === 'string' ? studentAnswer : studentAnswer[0];
        const aiResult = await evaluateFillBlankWithAI(question.text, question.correct_answer, studentStr);

        evaluations[qId] = {
          question_id: qId,
          student_answer: studentAnswer,
          is_correct: aiResult.is_correct,
          score: aiResult.is_correct ? points : 0,
          error_type: !aiResult.is_correct ? 'fill_blank' : undefined,
          immediate_feedback: aiResult.is_correct
            ? `أحسنت! إجابة صحيحة ✅${aiResult.feedback ? ' — ' + aiResult.feedback : ''}`
            : `إجابة خاطئة ❌${aiResult.feedback ? ' — ' + aiResult.feedback : ''} الإجابة المتوقَّعة: ${Array.isArray(question.correct_answer) ? question.correct_answer.join(' أو ') : question.correct_answer}`,
          detailed_explanation: question.explanation || '',
          hint_for_retry: !aiResult.is_correct ? question.hint || undefined : undefined,
          should_reinforce: !aiResult.is_correct,
          needs_ai_review: false,
          ai_graded: true,
        };

        if (aiResult.is_correct) {
          totalEarned += points;
          correctCount++;
        }
        autoCorrectedCount++;
        continue;
      }

      let result: any;
      if (AUTO_CORRECT_TYPES.includes(question.type)) {
        result = evaluateClosedQuestion(question, studentAnswer);
        autoCorrectedCount++;
      } else {
        result = evaluateOpenQuestion(question, studentAnswer);
        pendingAiCount++;
      }

      evaluations[qId] = {
        question_id: qId,
        student_answer: studentAnswer,
        is_correct: result.is_correct,
        score: result.score,
        error_type: !result.is_correct ? question.type : undefined,
        immediate_feedback: result.immediate_feedback,
        detailed_explanation: result.detailed_explanation,
        hint_for_retry: !result.is_correct ? question.hint || undefined : undefined,
        should_reinforce: !result.is_correct,
        needs_ai_review: result.needs_ai_review || false,
      };

      if (result.is_correct) {
        totalEarned += result.score;
        correctCount++;
      } else if (result.score > 0) {
        totalEarned += result.score;
      }
    }

    const finalScore: number = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

    const { error: updateError } = await supabaseAdmin
      .from('quiz_attempts')
      .update({
        answers,
        evaluations,
        score: finalScore,
        submitted_at: new Date().toISOString(),
        time_spent_seconds: time_spent_seconds || null,
      })
      .eq('id', attempt_id);

    if (updateError) {
      console.error('Error updating attempt:', updateError);
      return error('فشل حفظ النتائج', 500);
    }

    const wrongQuestions = questions.filter((q: any) => {
      const ev = evaluations[q.id];
      return ev && !ev.is_correct;
    });

    if (wrongQuestions.length > 0) {
      const wrongSummaries = wrongQuestions.map((q: any) => ({
        question_id: q.id,
        type: q.type,
        text: q.text.substring(0, 100),
      }));

      try {
        await supabaseAdmin.from('context_memory').insert({
          user_id: userData.id,
          lesson_id: quizId,
          interaction_type: 'mistake',
          content_summary: `أخطأ في ${wrongQuestions.length} سؤال في اختبار`,
          performance_signal: -Math.min(wrongQuestions.length / questions.length, 1),
          metadata: { wrong_questions: wrongSummaries },
        });
      } catch {
        // لا نُفشل إن فشلت ذاكرة السياق
      }
    }

    try {
      const { data: quiz } = await supabaseAdmin
        .from('quizzes')
        .select('teacher_id, title')
        .eq('id', quizId)
        .single();

      if (quiz) {
        await supabaseAdmin.from('notifications').insert({
          user_id: quiz.teacher_id,
          type: 'quiz',
          title: 'تسليم اختبار جديد',
          body: `سلّم الطالب اختبار "${quiz.title}" — الدرجة: ${finalScore}%`,
          link: `/teacher/quizzes/${quizId}`,
        });
      }
    } catch {
      // لا نُفشل إن فشلت الإشعار
    }

    return success({
      attempt_id: attempt_id,
      score: finalScore,
      score_label: `${finalScore}%`,
      correct_count: correctCount,
      total_questions: questions.length,
      auto_corrected: autoCorrectedCount,
      pending_ai: pendingAiCount,
      time_spent_seconds: time_spent_seconds || null,
      evaluations,
    });

  } catch (err: any) {
    console.error('Submit error:', err);
    return error('خطأ داخلي', 500);
  }
}