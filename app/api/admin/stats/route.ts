// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const mockUsers = [
  { id: '1', role: 'admin', userType: 'admin', status: 'approved' },
  { id: '2', role: 'teacher', userType: 'teacher', status: 'approved' },
  { id: '3', role: 'teacher', userType: 'teacher', status: 'approved' },
  { id: '4', role: 'student', userType: 'student', status: 'approved' },
  { id: '5', role: 'student', userType: 'student', status: 'pending' },
  { id: '6', role: 'student', userType: 'student', status: 'approved' },
  { id: '7', role: 'staff', userType: 'staff', status: 'approved' },
  { id: '8', role: 'student', userType: 'student', status: 'suspended' },
]

const mockSubjects = [
  { id: '1', name: 'القراءة' },
  { id: '2', name: 'النحو' },
  { id: '3', name: 'الإملاء' },
  { id: '4', name: 'التعبير' },
]

const mockActivity = [
  { id: 1, status: 'success' },
  { id: 2, status: 'success' },
  { id: 3, status: 'pending' },
  { id: 4, status: 'warning' },
  { id: 5, status: 'success' },
  { id: 6, status: 'pending' },
]

export async function GET() {
  try {
    const totalUsers = mockUsers.length
    const totalStudents = mockUsers.filter(u => u.userType === 'student').length
    const totalTeachers = mockUsers.filter(
      u => u.userType === 'teacher' || u.role === 'teacher'
    ).length
    const totalAdmins = mockUsers.filter(u => u.role === 'admin').length
    const totalStaff = mockUsers.filter(u => u.userType === 'staff' || u.role === 'staff').length

    const approvedUsers = mockUsers.filter(u => u.status === 'approved').length
    const pendingUsers = mockUsers.filter(u => u.status === 'pending').length
    const suspendedUsers = mockUsers.filter(u => u.status === 'suspended').length

    const totalSubjects = mockSubjects.length

    const activityTotal = mockActivity.length
    const activitySuccess = mockActivity.filter(a => a.status === 'success').length
    const activityPending = mockActivity.filter(a => a.status === 'pending').length
    const activityWarning = mockActivity.filter(a => a.status === 'warning').length

    return NextResponse.json({
      totals: {
        users: totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
        admins: totalAdmins,
        staff: totalStaff,
        subjects: totalSubjects,
        activity: activityTotal,
      },
      users: {
        approved: approvedUsers,
        pending: pendingUsers,
        suspended: suspendedUsers,
      },
      activity: {
        success: activitySuccess,
        pending: activityPending,
        warning: activityWarning,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء جلب إحصاءات الأدمن.' },
      { status: 500 }
    )
  }
}