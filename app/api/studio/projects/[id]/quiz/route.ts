import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correctAnswerIndex: number
}

function normalizeArabic(value: string): string {
  return value
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasArabicLetters(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value)
}

function isValidQuestion(value: unknown): value is QuizQuestion {
  if (!value || typeof value !== 'object') {
    return false
  }

  const question = value as Partial<QuizQuestion>

  if (
    typeof question.id !== 'string' ||
    !question.id.trim() ||
    typeof question.question !== 'string' ||
    question.question.trim().length < 8 ||
    !hasArabicLetters(question.question) ||
    !Array.isArray(question.options) ||
    question.options.length !== 4 ||
    typeof question.correctAnswerIndex !== 'number' ||
    !Number.isInteger(question.correctAnswerIndex) ||
    question.correctAnswerIndex < 0 ||
    question.correctAnswerIndex > 3
  ) {
    return false
  }

  const options = question.options.map((option) =>
    typeof option === 'string' ? option.trim() : ''
  )

  if (
    options.some((option) => option.length < 1 || !hasArabicLetters(option))
  ) {
    return false
  }

  const normalizedOptions = options.map(normalizeArabic)

  return new Set(normalizedOptions).size === normalizedOptions.length
}

function validateQuestions(value: unknown): QuizQuestion[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 30) {
    return null
  }

  const questions = value
    .filter(isValidQuestion)
    .map((question, index) => ({
      id: question.id.trim() || `q-${index + 1}`,
      question: question.question.trim(),
      options: question.options.map((option) => option.trim()),
      correctAnswerIndex: question.correctAnswerIndex,
    }))

  if (questions.length !== value.length) {
    return null
  }

  const questionKeys = questions.map((question) =>
    normalizeArabic(question.question)
  )

  if (new Set(questionKeys).size !== questionKeys.length) {
    return null
  }

  return questions
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  if (!projectId) {
    return NextResponse.json(
      { error: 'لم يتم تمرير معرّف المشروع.' },
      { status: 400 }
    )
  }

  try {
    const { data: quiz, error } = await supabaseAdmin
      .from('studio_quizzes')
      .select('id, project_id, title, questions, created_at, updated_at')
      .eq('project_id', projectId)
      .maybeSingle()

    if (error) {
      console.error('studio quiz GET error:', error)

      return NextResponse.json(
        { error: 'تعذر جلب اختبار المشروع.' },
        { status: 500 }
      )
    }

    if (!quiz) {
      return NextResponse.json(
        { error: 'لا يوجد اختبار محفوظ لهذا المشروع بعد.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ quiz }, { status: 200 })
  } catch (error) {
    console.error('studio quiz GET unexpected error:', error)

    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء جلب الاختبار.' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  if (!projectId) {
    return NextResponse.json(
      { error: 'لم يتم تمرير معرّف المشروع.' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json().catch(() => null)
    const questions = validateQuestions(body?.questions)

    if (!questions) {
      return NextResponse.json(
        {
          error:
            'بيانات الاختبار غير صالحة. تأكد من أن كل سؤال يحتوي أربعة بدائل مختلفة وإجابة صحيحة واحدة.',
        },
        { status: 400 }
      )
    }

    const { data: existingQuiz, error: existingQuizError } =
      await supabaseAdmin
        .from('studio_quizzes')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle()

    if (existingQuizError) {
      console.error('studio quiz PATCH fetch error:', existingQuizError)

      return NextResponse.json(
        { error: 'تعذر التحقق من الاختبار المحفوظ.' },
        { status: 500 }
      )
    }

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'لا يوجد اختبار محفوظ لتعديل أسئلته.' },
        { status: 404 }
      )
    }

    const { data: quiz, error: updateError } = await supabaseAdmin
      .from('studio_quizzes')
      .update({
        questions,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .select('id, project_id, title, questions, created_at, updated_at')
      .single()

    if (updateError || !quiz) {
      console.error('studio quiz PATCH update error:', updateError)

      return NextResponse.json(
        { error: 'تعذر حفظ تعديلات الاختبار.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'تم حفظ تعديلات الاختبار بنجاح.',
        quiz,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('studio quiz PATCH unexpected error:', error)

    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء حفظ الاختبار.' },
      { status: 500 }
    )
  }
}