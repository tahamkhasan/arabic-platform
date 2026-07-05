'use client'
import { useState } from 'react'
import type { LessonItem } from '@/types/lessons'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import LessonQuizManager from '@/components/lessons/quiz/LessonQuizManager'

// ── تعريف الفروع الأربعة لعرضها في القائمة المنسدلة ────────────
const SECTION_DEFS: { key: 'comprehension' | 'tharwa' | 'balagha' | 'nahw'; label: string; icon: string }[] = [
  { key: 'comprehension', label: 'الفهم والاستيعاب', icon: '📖' },
  { key: 'tharwa', label: 'الثروة اللغوية', icon: '📚' },
  { key: 'balagha', label: 'البلاغة', icon: '🎨' },
  { key: 'nahw', label: 'النحو', icon: '🧩' },
]

export default function LessonCard({
  lesson,
  isArabic,
  deleting,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  lesson: LessonItem
  isArabic?: boolean
  deleting: boolean
  onEdit: (lesson: LessonItem) => void
  onDelete: (lesson: LessonItem) => void
  onToggleActive: (lesson: LessonItem) => void
}) {
  const [showQuiz, setShowQuiz] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const fileCount = (lesson.file_urls || []).length

  return (
    <div
      style={{
        background: BRAND.bgSoft,
        borderRadius: BRAND.radiusLg,
        border: `1.5px solid ${BRAND.border}`,
        boxShadow: BRAND.shadow,
        padding: BRAND.spaceMd,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: BRAND.spaceMd,
        flexWrap: 'wrap',
        opacity: lesson.is_active ? 1 : 0.6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 220 }}>
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: BRAND.radiusSm,
            background: 'rgba(140,20,40,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          ✏️
        </span>
        <div>
          {/* عنوان البطاقة — Calibri، مطابقة لمتطلب الخطوة ٢ تحديداً */}
          <div
            style={{
              fontSize: 15,
              fontWeight: BRAND.weightBlack,
              color: BRAND.text,
              fontFamily: BRAND.fontHeading,
            }}
          >
            {lesson.order_num}. {lesson.name}
            {!lesson.is_active ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: BRAND.weightSemibold,
                  color: BRAND.crimson,
                  marginRight: 8,
                  fontFamily: BRAND.fontBody,
                }}
              >
                (مخفي)
              </span>
            ) : null}
          </div>
          {lesson.description ? (
            <div style={{ fontSize: 12, color: BRAND.sub, marginTop: 2, fontFamily: BRAND.fontBody }}>
              {lesson.description}
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {lesson.video_url ? (
              <span style={{ fontSize: 11, color: BRAND.crimson, fontWeight: BRAND.weightBold, fontFamily: BRAND.fontBody }}>
                🎬 يحتوي فيديو
              </span>
            ) : null}
            {fileCount > 0 ? (
              <span style={{ fontSize: 11, color: BRAND.orange, fontWeight: BRAND.weightBold, fontFamily: BRAND.fontBody }}>
                📎 {fileCount} ملف مصاحب
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        {isArabic ? (
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              padding: '8px 14px',
              borderRadius: BRAND.radiusSm,
              border: `1.5px solid ${expanded ? '#1E5AA0' : BRAND.border}`,
              background: expanded ? 'rgba(30,90,160,0.08)' : 'transparent',
              color: expanded ? '#1E5AA0' : BRAND.sub,
              fontSize: 13,
              fontWeight: BRAND.weightBold,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {expanded ? '📂 إخفاء الفروع' : '📂 عرض الفروع'}
          </button>
        ) : null}
        <button
          onClick={() => onToggleActive(lesson)}
          style={{
            padding: '8px 14px',
            borderRadius: BRAND.radiusSm,
            border: `1.5px solid ${lesson.is_active ? BRAND.border : BRAND.crimson}`,
            background: lesson.is_active ? 'transparent' : 'rgba(140,20,40,0.10)',
            color: lesson.is_active ? BRAND.sub : BRAND.crimson,
            fontSize: 13,
            fontWeight: BRAND.weightBold,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {lesson.is_active ? '🙈 إخفاء' : '👁️ إظهار'}
        </button>
        <Button variant="secondary" size="sm" onClick={() => onEdit(lesson)}>
          ✏️ تعديل
        </Button>
        <Button variant="primary" size="sm" onClick={() => setShowQuiz(true)}>
          🎯 الاختبار
        </Button>
        <Button variant="danger" size="sm" disabled={deleting} onClick={() => onDelete(lesson)}>
          🗑️
        </Button>
      </div>

      {showQuiz ? (
        <LessonQuizManager
          lesson={{ id: lesson.id, name: lesson.name, content: lesson.content }}
          onClose={() => setShowQuiz(false)}
        />
      ) : null}

      {/* ── القائمة الموسَّعة: فروع الدرس الأربعة + حالة الاختبار ── */}
      {expanded ? (
        <div
          style={{
            width: '100%',
            marginTop: 4,
            padding: 14,
            borderRadius: BRAND.radiusMd,
            background: 'rgba(30,90,160,0.04)',
            border: '1px solid rgba(30,90,160,0.16)',
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: BRAND.weightBlack, color: '#1E5AA0', marginBottom: 2 }}>
            🗂️ {lesson.name} — الفروع
          </div>

          {SECTION_DEFS.map(({ key, label, icon }) => {
            const url = (lesson as any)[`${key}_file_url`] as string | null
            const name = (lesson as any)[`${key}_file_name`] as string | null
            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#fff',
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 12,
                  gap: 10,
                }}
              >
                <span style={{ fontWeight: BRAND.weightBold, color: BRAND.text, flexShrink: 0 }}>{icon} {label}</span>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#059669', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', direction: 'ltr' }}
                  >
                    ✅ {name || 'فتح الملف'}
                  </a>
                ) : (
                  <span style={{ color: BRAND.crimson, flex: 1, textAlign: 'left' }}>⚠️ غير مرفوع</span>
                )}
                <button
                  onClick={() => onEdit(lesson)}
                  style={{ background: 'none', border: 'none', color: '#1E5AA0', cursor: 'pointer', fontSize: 11, fontWeight: BRAND.weightBold, flexShrink: 0 }}
                >
                  تعديل
                </button>
              </div>
            )
          })}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 8,
              background: '#fff',
              border: `1px solid ${BRAND.border}`,
              fontSize: 12,
              gap: 10,
              marginTop: 4,
            }}
          >
            <span style={{ fontWeight: BRAND.weightBold, color: BRAND.text }}>🎯 الاختبار المحفوظ لهذا الدرس</span>
            <button
              onClick={() => setShowQuiz(true)}
              style={{ background: 'none', border: 'none', color: '#1E5AA0', cursor: 'pointer', fontSize: 11, fontWeight: BRAND.weightBold }}
            >
              فتح / تعديل
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
