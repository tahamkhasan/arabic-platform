'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ar } from '@/lib/constants/ar'
import { BRAND } from '@/lib/constants/theme'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { signOutApp } from '@/lib/auth/auth.session'
import { writeStoredUser } from '@/lib/auth/auth.storage'
import { supabase } from '@/lib/supabase'
import type { User, Subject, Unit, Lesson, Exam } from '@/types/dashboard.types'
import { useDashboardCatalog } from '@/hooks/useDashboardCatalog'
import { useDashboardGenerator } from '@/hooks/useDashboardGenerator'
import { LIGHT_THEME, DARK_THEME } from '@/components/dashboard/dashboardTheme'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import GeneratorPanel from '@/components/dashboard/GeneratorPanel'
import type { BranchKey } from '@/lib/dashboard/lessonBranches'
import { useLessonBranchMaterial } from '@/hooks/useLessonBranchMaterial'

const t = ar.dashboard
const TOOLS = t.tools as readonly { id: string; icon: string; label: string; desc: string }[]
const FIXED_BRAND_COLOR = BRAND.deep

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: guardLoading, authorized, setUser } = useRouteGuard('teacher')

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [selSubject, setSelSubject] = useState<Subject | null>(null)
  const [selUnit, setSelUnit] = useState<Unit | null>(null)
  const [selLesson, setSelLesson] = useState<Lesson | null>(null)
  const [selExam, setSelExam] = useState<Exam | null>(null)

  const [tool, setTool] = useState<string>(TOOLS[0]?.id ?? 'explain')
  const [examType, setExamType] = useState<'short' | 'final'>('short')
  const [details, setDetails] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<BranchKey>('general')

  useEffect(() => {
    if (!user) return
    setThemeMode(user.theme_mode === 'dark' ? 'dark' : 'light')
  }, [user])

  const catalog = useDashboardCatalog({ user: user as User | null, tool, selSubject, selUnit, examType })
  const generator = useDashboardGenerator({ user: user as User | null, selSubject, selLesson, selExam, tool, details })

  const isDark = themeMode === 'dark'
  const T = isDark ? DARK_THEME : LIGHT_THEME
  const themeColor = FIXED_BRAND_COLOR
  const isAdmin = user?.role === 'admin'
  const isExamTool = tool === 'exam'

  // ── مادة الفرع المختار (نحو/بلاغة/ثروة لغوية/فهم واستيعاب/عام) —
  // للاختبار دائماً "عام" (يغطي كل المهارات)، بغض النظر عن الفرع
  // المختار في الواجهة، لأن showBranchSelector يُخفى أصلاً للاختبار ──
  const branchMaterial = useLessonBranchMaterial(selLesson, isExamTool ? 'general' : selectedBranch)

  const toolData = useMemo(() => TOOLS.find(item => item.id === tool), [tool])

  const canGenerate = Boolean(selSubject && tool && (isExamTool ? selExam : selLesson))
  const isModified = generator.savedText !== generator.output && generator.savedText !== ''
  const displayText = generator.savedText || generator.output

  function handleToolChange(nextTool: string) {
    setTool(nextTool)
    setSelExam(null)
    setDetails('')
    generator.reset()
  }

  function handleSelectSubject(s: Subject) {
    setSelSubject(s)
    setSelUnit(null)
    setSelLesson(null)
    setSelExam(null)
    setDetails('')
    setSelectedBranch('general')
    generator.reset()
  }

  function handleSelectUnit(u: Unit) {
    setSelUnit(u)
    setSelLesson(null)
    setDetails('')
    setSelectedBranch('general')
    generator.reset()
  }

  function handleSelectLesson(l: Lesson) {
    setSelLesson(l)
    setDetails('')
    setSelectedBranch('general')
    generator.reset()
  }

  const toggleThemeMode = useCallback(async () => {
    if (!user) return

    const next: 'light' | 'dark' = themeMode === 'dark' ? 'light' : 'dark'
    setThemeMode(next)

    const updated = { ...user, theme_mode: next }
    setUser(updated)
    writeStoredUser(updated)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) return

      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ userId: user.id, theme_mode: next }),
      })
    } catch {}
  }, [setUser, themeMode, user])

  const handleLogout = useCallback(async () => {
    await signOutApp()
    router.replace('/login')
  }, [router])

  if (guardLoading) return null
  if (!authorized || !user) return null

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${T.bg} 0%, ${T.pageBg} 100%)`, color: T.textCol, fontFamily: BRAND.fontBody }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${T.bg}; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .result-fade { animation: fadeIn 0.35s ease; }
        textarea:focus, input:focus, button:focus { outline: none; }
        .dashboard-app-shell { display: flex; min-height: 100vh; }
        .dashboard-sidebar { display: flex; }
        .dashboard-mobile-nav { display: none; }
        .page-wrap { max-width: 1000px; margin: 0 auto; padding: 24px 18px 40px; }
        @media (max-width: 760px) {
          .dashboard-sidebar { display: none !important; }
          .dashboard-mobile-nav { display: flex !important; }
          .dashboard-main-area { padding-bottom: 96px !important; }
        }
      `}</style>

      <div className="dashboard-app-shell">
        <DashboardSidebar
          tool={tool}
          onToolChange={handleToolChange}
          isAdmin={isAdmin}
          isDark={isDark}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
          onToggleTheme={toggleThemeMode}
          onLogout={handleLogout}
          onGoHistory={() => router.push('/history')}
          onGoAdmin={() => router.push('/admin')}
          onGoAdminGenerator={() => router.push('/admin/generator')}
          onGoTeacher={() => router.push('/teacher')}
          themeColor={themeColor}
          T={T}
        />

        <div style={{ flex: 1, minWidth: 0 }} className="dashboard-main-area">
          <main className="page-wrap">
            <div
              style={{
                marginBottom: 20,
                padding: '18px 20px',
                borderRadius: 20,
                background: T.gradWarm,
                border: `1px solid ${T.borderCol}`,
                boxShadow: T.shadowSoft,
              }}
            >
              <div style={{ fontSize: 13, color: T.subCol, marginBottom: 4 }}>
                {isAdmin ? '✨ مساحة المدير لإدارة التوليد' : '✨ مساحة المعلم لإنتاج المحتوى'}
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>
                {toolData?.icon} {toolData?.label}
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: T.subCol, lineHeight: 1.8 }}>{toolData?.desc}</p>
            </div>

            <GeneratorPanel
              T={T}
              themeColor={themeColor}
              toolData={toolData}
              subjects={catalog.subjects}
              selSubject={selSubject}
              onSelectSubject={handleSelectSubject}
              units={catalog.units}
              selUnit={selUnit}
              onSelectUnit={handleSelectUnit}
              lessons={catalog.lessons}
              selLesson={selLesson}
              onSelectLesson={handleSelectLesson}
              isExamTool={isExamTool}
              examType={examType}
              onExamTypeChange={type => {
                setExamType(type)
                setSelExam(null)
              }}
              exams={catalog.exams}
              selExam={selExam}
              onSelectExam={setSelExam}
              details={details}
              onDetailsChange={setDetails}
              branchMaterial={branchMaterial}
              canGenerate={canGenerate}
              loading={generator.loading}
              onGenerate={() => generator.generate(branchMaterial.material)}
              error={generator.error}
              output={generator.output}
              genId={generator.genId}
              isEditing={generator.isEditing}
              isModified={isModified}
              editSaved={generator.editSaved}
              copied={generator.copied}
              displayText={displayText}
              editedText={generator.editedText}
              savingEdit={generator.savingEdit}
              textareaRef={generator.textareaRef}
              user={user as User}
              selectedBranch={selectedBranch}
              onSelectBranch={setSelectedBranch}
              onStartEditing={generator.startEditing}
              onCopy={() => generator.copyText(displayText)}
              onRestoreOriginal={generator.restoreOriginal}
              onCancelEditing={generator.cancelEditing}
              onSaveEdit={generator.saveEdit}
              onEditedTextChange={generator.setEditedText}
            />
          </main>
        </div>
      </div>
    </div>
  )
}