'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ar } from '@/lib/constants/ar'
import { BRAND } from '@/lib/constants/theme'

import { useRouteGuard } from '@/hooks/useRouteGuard'
import { signOutApp } from '@/lib/auth/auth.session'
import { writeStoredUser } from '@/lib/auth/auth.storage'
import { apiFetch } from '@/lib/auth/auth.fetch'

import { buildTeacherTabs } from '@/lib/teacher/teacher.tabs'
import type { TeacherTab } from '@/lib/teacher/teacher.types'

import useTeacherBaseData from './useTeacherBaseData'
import { useTeacherAssignments } from './useTeacherAssignments'
import { useTeacherClasses } from './useTeacherClasses'
import { useTeacherSubmissions } from './useTeacherSubmissions'
import { useTeacherMedia } from './useTeacherMedia'
import { useTeacherMessages } from './useTeacherMessages'
import { useTeacherStats } from './useTeacherStats'

const c = ar.common

export function useTeacherPageController() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const { user, accessToken, loading, authorized, setUser } = useRouteGuard('teacher')
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const [tab, setTab] = useState<TeacherTab>('assignments')

  useEffect(() => {
    if (!user) return
    setThemeMode(user.theme_mode === 'dark' ? 'dark' : 'light')
  }, [user])

  const teacherUser = user as any
  const token = accessToken ?? ''

  const baseData = useTeacherBaseData(teacherUser, token, tab)
  const assignmentsState = useTeacherAssignments({ user: teacherUser, accessToken: token, tab })
  const classesState = useTeacherClasses({ user: teacherUser, accessToken: token, tab })
  const submissionsState = useTeacherSubmissions({ user: teacherUser, accessToken: token, tab })
  const mediaState = useTeacherMedia({ user: teacherUser, accessToken: token, tab })
  const messagesState = useTeacherMessages({ user: teacherUser, accessToken: token, tab })
  const statsState = useTeacherStats({ user: teacherUser, accessToken: token, tab })

  const {
    subjects,
    students,
    insights,
    insightsDismissed,
    setInsightsDismissed,
    scopeGroups,
    scopeGroupsLoading,
  } = baseData

  const {
    assignments,
    quizzesList,
    aTitle,
    setATitle,
    aDescription,
    setADescription,
    aQuizId,
    setAQuizId,
    aTarget,
    setATarget,
    aTargetIds,
    setATargetIds,
    aDeadline,
    setADeadline,
    sendingA,
    aDone,
    aError,
    sendAssignment,
  } = assignmentsState

  const {
    classes,
    gName,
    setGName,
    gSubject,
    setGSubject,
    gLevel,
    setGLevel,
    creatingG,
    gDone,
    showNewG,
    setShowNewG,
    openClass,
    setOpenClass,
    loadingClassDetail,
    addingMember,
    classError,
    setClassError,
    createClass,
    openClassDetail,
    addToClass,
    removeFromClass,
    deleteClass,
  } = classesState

  const {
    submissions,
    openSub,
    setOpenSub,
    tGrade,
    setTGrade,
    tFeedback,
    setTFeedback,
    reviewing,
    reviewDone,
    pendingReviews,
    submitReview,
  } = submissionsState

  const {
    media,
    openMedia,
    setOpenMedia,
    mTitle,
    setMTitle,
    mType,
    setMType,
    mSubject,
    setMSubject,
    mLinkType,
    setMLinkType,
    mUrl,
    setMUrl,
    mFile,
    setMFile,
    uploadingM,
    mDone,
    mError,
    uploadMedia,
  } = mediaState

  const {
    selStudent,
    setSelStudent,
    msgList,
    newMsg,
    setNewMsg,
    sendingMsg,
    unread,
    sendMessage,
  } = messagesState

  const { stats, statsLoading } = statsState

  const isDark = themeMode === 'dark'

  const ui = useMemo(
    () => ({
      themeColor: BRAND.crimson,
      accent2: BRAND.orange,
      bg: isDark ? '#181413' : BRAND.bg,
      bgSoft: isDark ? '#201A18' : BRAND.bgSoft,
      panel: isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.82)',
      panelStrong: isDark ? 'rgba(255,255,255,0.065)' : 'rgba(255,255,255,0.90)',
      panelAlt: isDark ? '#241D1A' : '#FFFDFC',
      text: isDark ? '#F6F0E8' : BRAND.text,
      sub: isDark ? 'rgba(246,240,232,0.72)' : BRAND.sub,
      muted: isDark ? 'rgba(246,240,232,0.56)' : `${BRAND.sub}BB`,
      border: isDark ? 'rgba(255,255,255,0.08)' : BRAND.border,
      borderAccent: isDark ? 'rgba(140,20,40,0.18)' : 'rgba(140,20,40,0.14)',
      inputBg: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
      headerBg: isDark ? 'rgba(24,20,19,0.86)' : 'rgba(247,242,234,0.92)',
      shadow: isDark ? '0 18px 42px rgba(0,0,0,0.24)' : BRAND.shadow,
      glow: isDark ? '0 12px 28px rgba(140,20,40,0.12)' : '0 12px 28px rgba(140,20,40,0.08)',
      cardGlow: isDark ? '0 12px 32px rgba(0,0,0,0.18)' : '0 12px 30px rgba(0,0,0,0.05)',
      gradMain: BRAND.gradMain,
      gradBlue: BRAND.gradBlue,
      gradWarm: BRAND.gradWarm,
      successBg: 'rgba(5,150,105,0.10)',
      successBorder: 'rgba(5,150,105,0.28)',
      warnBg: 'rgba(217,119,6,0.10)',
      warnBorder: 'rgba(217,119,6,0.26)',
      dangerBg: 'rgba(180,40,40,0.10)',
      dangerBorder: 'rgba(180,40,40,0.28)',
    }),
    [isDark],
  )

  const TABS = useMemo(() => buildTeacherTabs({ pendingReviews, unread }), [pendingReviews, unread])
  const tabs = TABS

  const summaryCards = useMemo(
    () => [
      { icon: '📚', label: 'المواد', value: subjects.length, color: BRAND.orange },
      { icon: '🏫', label: 'الفصول', value: classes.length, color: BRAND.crimson },
      { icon: '📝', label: 'المهام', value: assignments.length, color: BRAND.gold },
      { icon: '📬', label: 'بانتظار المراجعة', value: pendingReviews, color: BRAND.deep },
    ],
    [subjects.length, classes.length, assignments.length, pendingReviews],
  )

  const availableStudentsForClass = useMemo(
    () =>
      openClass == null
        ? []
        : students.filter((s: any) => !openClass.students.some((m: any) => m.student_id === s.id)),
    [openClass, students],
  )

  async function toggleThemeMode() {
    if (!user) return

    const next: 'light' | 'dark' = themeMode === 'dark' ? 'light' : 'dark'
    const updated = {
      ...user,
      theme_mode: next,
    }

    setThemeMode(next)
    setUser(updated)
    writeStoredUser(updated)

    await apiFetch('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        userId: user.id,
        theme_mode: next,
      }),
    }).catch(() => {})
  }

  async function handleLogout() {
    await signOutApp()
    router.replace('/login')
  }

  return {
    c,
    BRAND,
    router,
    fileRef,

    user,
    accessToken,
    loading,
    authorized,
    setUser,

    themeMode,
    setThemeMode,
    isDark,
    ui,

    tab,
    setTab,

    baseData,
    assignmentsState,
    classesState,
    submissionsState,
    mediaState,
    messagesState,
    statsState,

    subjects,
    students,
    insights,
    insightsDismissed,
    setInsightsDismissed,
    scopeGroups,
    scopeGroupsLoading,

    assignments,
    quizzesList,
    aTitle,
    setATitle,
    aDescription,
    setADescription,
    aQuizId,
    setAQuizId,
    aTarget,
    setATarget,
    aTargetIds,
    setATargetIds,
    aDeadline,
    setADeadline,
    sendingA,
    aDone,
    aError,
    sendAssignment,

    classes,
    gName,
    setGName,
    gSubject,
    setGSubject,
    gLevel,
    setGLevel,
    creatingG,
    gDone,
    showNewG,
    setShowNewG,
    openClass,
    setOpenClass,
    loadingClassDetail,
    addingMember,
    classError,
    setClassError,
    createClass,
    openClassDetail,
    addToClass,
    removeFromClass,
    deleteClass,

    submissions,
    openSub,
    setOpenSub,
    tGrade,
    setTGrade,
    tFeedback,
    setTFeedback,
    reviewing,
    reviewDone,
    pendingReviews,
    submitReview,

    media,
    openMedia,
    setOpenMedia,
    mTitle,
    setMTitle,
    mType,
    setMType,
    mSubject,
    setMSubject,
    mLinkType,
    setMLinkType,
    mUrl,
    setMUrl,
    mFile,
    setMFile,
    uploadingM,
    mDone,
    mError,
    uploadMedia,

    selStudent,
    setSelStudent,
    msgList,
    newMsg,
    setNewMsg,
    sendingMsg,
    unread,
    sendMessage,

    stats,
    statsLoading,

    TABS,
    tabs,
    summaryCards,
    availableStudentsForClass,

    toggleThemeMode,
    handleLogout,
  }
}

export type TeacherPageController = ReturnType<typeof useTeacherPageController>