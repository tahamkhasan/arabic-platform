import type { NextRequest } from 'next/server'

// دالة مؤقتة: تعيد معلماً تجريبياً من متغير بيئة
// لاحقاً سنربطها بنظام التوثيق الحقيقي في مِداد
export async function getCurrentUserFromRequest(req: NextRequest) {
  const demoTeacherId = process.env.STUDIO_DEMO_TEACHER_ID

  if (!demoTeacherId) {
    // إذا لم يتم ضبط المعرّف، نعيد null ليتعامل الـ API مع الحالة كعدم تسجيل دخول
    return null
  }

  return {
    id: demoTeacherId,
    email: 'demo-teacher@midad.local',
  }
}