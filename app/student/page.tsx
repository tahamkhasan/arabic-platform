'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import { STAGE_LABELS, GRADES_BY_STAGE, TRACK_LABELS } from '@/lib/constants/stages'
import type { Tab, Subject, Lesson } from '@/types/student.types'
import { useStudentBootstrap } from '@/hooks/useStudentBootstrap'
import { useStudentCatalog } from '@/hooks/useStudentCatalog'
import { useStudentPractice } from '@/hooks/useStudentPractice'
import { useStudentAssignments } from '@/hooks/useStudentAssignments'
import { useStudentMessaging } from '@/hooks/useStudentMessaging'
import { useStudentMedia } from '@/hooks/useStudentMedia'
import { T } from '@/components/student/studentTheme'
import StudentSidebar from '@/components/student/StudentSidebar'
import StudentHero from '@/components/student/StudentHero'
import HomeTab from '@/components/student/tabs/HomeTab'
import AssignmentsTab from '@/components/student/tabs/AssignmentsTab'
import LessonsTab from '@/components/student/tabs/LessonsTab'
import PracticeTab from '@/components/student/tabs/PracticeTab'
import MessagesTab from '@/components/student/tabs/MessagesTab'
import MediaTab from '@/components/student/tabs/MediaTab'
import StudentModals from '@/components/student/StudentModals'

export default function StudentPage() {
  const router = useRouter()
  const accentColor = BRAND.deep
  const [tab, setTab] = useState<Tab>('home')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const boot = useStudentBootstrap()
  const catalog = useStudentCatalog(boot.user)
  const practice = useStudentPractice(boot.user, catalog.selSubject, catalog.selLesson)
  const assignmentsHook = useStudentAssignments(boot.user, boot.accessToken, tab)
  const messaging = useStudentMessaging(boot.user, tab)
  const mediaHook = useStudentMedia(boot.user, tab)

  function openSubject(subject: Subject) {
    catalog.setSelSubject(subject)
    catalog.setSelUnit(null)
    catalog.setSelLesson(null)
    practice.resetPractice()
    setTab('lessons')
  }

  function openLessonForPractice(lesson: Lesson) {
    catalog.setSelLesson(lesson)
    setTab('practice')
  }

  const pendingCount = assignmentsHook.assignments.filter(a => !a.submitted).length
  const completedAssignments = assignmentsHook.assignments.filter(a => a.submitted).length
  const currentLessonName = catalog.selLesson?.name ?? 'اختر درسًا لتبدأ'
  const currentSubjectName = catalog.selSubject?.name ?? 'المادة غير محددة'

  const currentStageLabel = boot.selectedStage ? STAGE_LABELS[boot.selectedStage] : ''
  const currentGradeLabel =
    boot.selectedStage && boot.selectedGrade
      ? GRADES_BY_STAGE[boot.selectedStage].find(g => g.id === boot.selectedGrade)?.label ?? boot.selectedGrade
      : ''
  const currentTrackLabel = boot.selectedTrack ? TRACK_LABELS[boot.selectedTrack] : ''

  if (boot.booting || !boot.user) return null

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${T.bg} 0%, ${T.pageBg} 100%)`,
        color: T.textCol,
        fontFamily: T.fontBody,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${T.bg}; }
        .student-shell { animation: fadeIn .25s ease; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .student-app-shell { display: flex; min-height: 100vh; }
        .student-sidebar { display: flex; }
        .student-topbar-mobile { display: none; }
        .student-bottom-nav { display: none; }
        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .quick-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .practice-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .double-grid { grid-template-columns: 1fr !important; }
          .student-sidebar { display: none !important; }
          .student-topbar-mobile { display: flex !important; }
          .student-bottom-nav { display: flex !important; }
          .student-main-area { padding-bottom: 96px !important; }
        }
        @media (max-width: 640px) {
          .quick-grid { grid-template-columns: 1fr !important; }
          .practice-grid { grid-template-columns: 1fr !important; }
          .subject-grid { grid-template-columns: 1fr !important; }
          .summary-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="student-app-shell">
        <StudentSidebar
          tab={tab}
          onTabChange={setTab}
          pendingCount={pendingCount}
          unreadCount={messaging.unreadCount}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
          onLogout={boot.handleLogout}
          onOpenChat={() => router.push('/student/chat')}
          userId={boot.user.id}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <main className="student-shell student-main-area" style={{ maxWidth: 1200, margin: '0 auto', padding: '22px 20px 40px' }}>
            {/* ── الهيرو يظهر فقط في تبويب "الرئيسية" — استدعاء واحد لا غير ── */}
            {tab === 'home' && (
              <StudentHero
                userName={boot.user.name}
                stageLabel={currentStageLabel}
                gradeLabel={currentGradeLabel}
                trackLabel={currentTrackLabel}
                subjectName={currentSubjectName}
                lessonName={currentLessonName}
                pendingCount={pendingCount}
                completedCount={completedAssignments}
                unreadCount={messaging.unreadCount}
                subjectsCount={catalog.subjects.length}
                quizzesCount={assignmentsHook.quizzesAvailable.length}
                hasSelectedLesson={!!catalog.selLesson}
                onGoHome={() => setTab('home')}
                onGoAssignments={() => setTab('assignments')}
                onGoPractice={() => setTab('practice')}
              />
            )}

            {tab === 'home' && (
              <HomeTab
                subjects={catalog.subjects}
                selSubject={catalog.selSubject}
                selUnit={catalog.selUnit}
                selLesson={catalog.selLesson}
                pendingCount={pendingCount}
                unreadCount={messaging.unreadCount}
                onOpenSubject={openSubject}
                onGoLessons={() => setTab('lessons')}
                onGoPractice={() => setTab('practice')}
                onGoAssignments={() => setTab('assignments')}
                onGoMessages={() => setTab('messages')}
                onGoChat={() => router.push('/student/chat')}
              />
            )}

            {tab === 'assignments' && (
              <AssignmentsTab
                quizzesAvailable={assignmentsHook.quizzesAvailable}
                assignments={assignmentsHook.assignments}
                onStartQuiz={id => router.push(`/student/quizzes/${id}`)}
                onOpenAssignment={a => {
                  assignmentsHook.setOpenAssign(a)
                  assignmentsHook.setAnswerText('')
                  assignmentsHook.setSubmitDone(false)
                }}
              />
            )}

            {tab === 'lessons' && (
              <LessonsTab
                selectedStage={boot.selectedStage}
                selectedGrade={boot.selectedGrade}
                selectedTrack={boot.selectedTrack}
                subjects={catalog.subjects}
                selSubject={catalog.selSubject}
                units={catalog.units}
                selUnit={catalog.selUnit}
                lessons={catalog.lessons}
                selLesson={catalog.selLesson}
                onOpenSubject={openSubject}
                onSelectUnit={u => {
                  catalog.setSelUnit(u)
                  catalog.setSelLesson(null)
                }}
                onBackToSubjects={() => catalog.setSelSubject(null)}
                onSelectLesson={l => catalog.setSelLesson(l)}
                onBackToUnits={() => catalog.setSelUnit(null)}
                onBackToLessons={() => catalog.setSelLesson(null)}
                onOpenMedia={mediaHook.setOpenMedia}
                onPractice={openLessonForPractice}
              />
            )}

            {tab === 'practice' && (
              <PracticeTab
                selSubject={catalog.selSubject}
                selUnit={catalog.selUnit}
                selLesson={catalog.selLesson}
                practiceTool={practice.practiceTool}
                onSelectTool={practice.setPracticeTool}
                onRunTool={practice.handlePractice}
                onBackToLesson={() => setTab('lessons')}
                loading={practice.practiceLoading || practice.quizLoading || practice.flashLoading}
                practiceError={practice.practiceError}
                quizError={practice.quizError}
                flashError={practice.flashError}
                practiceOutput={practice.practiceOutput}
              />
            )}

            {tab === 'messages' && (
              <MessagesTab
                messages={messaging.messages}
                teacherId={messaging.teacherId}
                currentUserId={boot.user.id}
                newMsg={messaging.newMsg}
                onNewMsgChange={messaging.setNewMsg}
                sendingMsg={messaging.sendingMsg}
                onSend={messaging.handleSendMessage}
              />
            )}

            {tab === 'media' && <MediaTab media={mediaHook.media} onOpenMedia={mediaHook.setOpenMedia} />}
          </main>
        </div>
      </div>

      <StudentModals
        openAssign={assignmentsHook.openAssign}
        onCloseAssign={() => assignmentsHook.setOpenAssign(null)}
        submitDone={assignmentsHook.submitDone}
        answerText={assignmentsHook.answerText}
        onAnswerChange={assignmentsHook.setAnswerText}
        submitting={assignmentsHook.submitting}
        onSubmitAssignment={assignmentsHook.handleSubmitAssignment}
        showQuiz={practice.showQuiz}
        quizData={practice.quizData}
        onCloseQuiz={() => practice.setShowQuiz(false)}
        showFlash={practice.showFlash}
        flashData={practice.flashData}
        onCloseFlash={() => practice.setShowFlash(false)}
        openMedia={mediaHook.openMedia}
        onCloseMedia={() => mediaHook.setOpenMedia(null)}
        accentColor={accentColor}
      />
    </div>
  )
}