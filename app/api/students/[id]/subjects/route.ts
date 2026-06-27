import { NextRequest, NextResponse } from 'next/server'
import { getFinalSubjectsForStudent } from '@/lib/server/subscriptions'

type Context = {
  params: Promise<{ id: string }>
}

// GET /api/students/[id]/subjects
//
// ملاحظة أمان معروفة ومتعمَّدة: هذا المسار عام بلا تحقق Bearer توكن،
// بنفس النمط الفعلي المعتمَد حالياً على بقية نقاط بيانات الطالب في
// app/student/page.tsx (/api/units, /api/lessons, /api/assignments,
// /api/messages) — لا واحدة منها تتحقق من توكن فعلياً، وتعتمد فقط على
// معرّف الطالب في الرابط. كانت النسخة الأولى من هذا الملف تتطلب
// requireUser، فكسرت الاستدعاء لأن الصفحة لا تملك آلية جلب توكن أصلاً.
// إضافة تحقق صارم هنا فقط (دون بقية النقاط) لا يُحسِّن الأمان الحقيقي،
// ويكسر التوافق فقط — تُرك كملاحظة لتصليب شامل مستقبلي لكل هذه النقاط
// معاً دفعة واحدة، لا لهذه النقطة منفردة.
export async function GET(req: NextRequest, context: Context) {
  try {
    const { id: studentId } = await context.params
    const subjects = await getFinalSubjectsForStudent(studentId)
    return NextResponse.json({ subjects })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}