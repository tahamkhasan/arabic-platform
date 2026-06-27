// app/api/activity/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type ActivityItem = {
  id: number
  user: string
  role: 'admin' | 'teacher' | 'student' | 'staff'
  action: string
  target: string
  status: 'success' | 'pending' | 'warning'
  time: string
  note?: string
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 1,
    user: 'admin@test.com',
    role: 'admin',
    action: 'اعتماد مستخدم جديد',
    target: 'teacher@test.com',
    status: 'success',
    time: 'منذ 5 دقائق',
    note: 'تم تحويله إلى معلم',
  },
  {
    id: 2,
    user: 'teacher@test.com',
    role: 'teacher',
    action: 'إضافة مادة تعليمية',
    target: 'درس الهمزة المتوسطة',
    status: 'success',
    time: 'منذ 18 دقيقة',
  },
  {
    id: 3,
    user: 'student@test.com',
    role: 'student',
    action: 'إرسال حل واجب',
    target: 'الواجب الأول',
    status: 'pending',
    time: 'منذ 32 دقيقة',
  },
  {
    id: 4,
    user: 'staff@test.com',
    role: 'staff',
    action: 'تحديث بيانات مستخدم',
    target: 'ملف الطالب الثاني عشر',
    status: 'warning',
    time: 'منذ ساعة',
    note: 'يحتاج مراجعة',
  },
  {
    id: 5,
    user: 'teacher2@test.com',
    role: 'teacher',
    action: 'إنشاء اختبار',
    target: 'اختبار النحو',
    status: 'success',
    time: 'منذ ساعتين',
  },
  {
    id: 6,
    user: 'student2@test.com',
    role: 'student',
    action: 'طلب الانضمام إلى مادة',
    target: 'القراءة',
    status: 'pending',
    time: 'اليوم',
  },
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const role = (searchParams.get('role') || 'all').trim().toLowerCase()
    const status = (searchParams.get('status') || 'all').trim().toLowerCase()

    const filtered = MOCK_ACTIVITY.filter(item => {
      const haystack =
        `${item.user} ${item.action} ${item.target} ${item.note || ''}`.toLowerCase()

      const matchSearch = !search || haystack.includes(search)
      const matchRole = role === 'all' || item.role === role
      const matchStatus = status === 'all' || item.status === status

      return matchSearch && matchRole && matchStatus
    })

    return NextResponse.json({
      items: filtered,
      total: filtered.length,
      filters: {
        search,
        role,
        status,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء جلب سجل النشاط.' },
      { status: 500 }
    )
  }
}