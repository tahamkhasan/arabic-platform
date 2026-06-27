'use client'
import { useState } from 'react'
import type { LessonItem } from '@/types/lessons'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import LessonQuizManager from '@/components/lessons/quiz/LessonQuizManager'

export default function LessonCard({
  lesson,
  deleting,
  onEdit,
  onDelete,
}: {
  lesson: LessonItem
  deleting: boolean
  onEdit: (lesson: LessonItem) => void
  onDelete: (lesson: LessonItem) => void
}) {
  const [showQuiz, setShowQuiz] = useState(false)
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
                  color: BRAND.orange,
                  marginRight: 8,
                  fontFamily: BRAND.fontBody,
                }}
              >
                (معطّل)
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

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
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
    </div>
  )
}
