'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import { STAGE_LABELS, GRADES_BY_STAGE, type StageKey } from '@/lib/constants/stages'
import CurriculumView from '@/components/curriculum/CurriculumView'

// components/landing/CurriculumExplorer.tsx
// مستكشف منهج عام — يعمل بلا تسجيل دخول، يستخدم نقاط الـ API
// العامة الموجودة فعلاً: /api/subjects و /api/subjects/[id]/curriculum
//
// ── مُعدَّل: المواد لا تظهر إطلاقاً حتى يختار الزائر المرحلة ثم
// الصف معاً (بدل الظهور الفوري لكل مواد المرحلة) — تصفح أكثر
// تدرّجاً واختصاراً بصرياً. ──────────────────────────────────

type SubjectOffering = { stage: string; grade: string; track?: string | null }

type Subject = {
  id: string
  name: string
  icon?: string
  grade?: string
  stage?: string
  offerings?: SubjectOffering[]
}

export default function CurriculumExplorer() {
  const router = useRouter()
  const [selectedStage, setSelectedStage] = useState<StageKey | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [openSubject, setOpenSubject] = useState<Subject | null>(null)

  useEffect(() => {
    if (!selectedStage) {
      setSubjects([])
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(`/api/subjects?stages=${selectedStage}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        setSubjects(d.subjects ?? [])
      })
      .catch(() => {
        if (!cancelled) setSubjects([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedStage])

  // ── مادة تُعتبر متاحة لهذا الصف إن كانت ضمن offerings الحديثة،
  // أو (كحل احتياطي) إن كان حقلها القديم subject.grade يطابق مباشرة ──
  const visibleSubjects = useMemo(() => {
    if (!selectedStage || !selectedGrade) return []
    return subjects.filter(s => {
      if (Array.isArray(s.offerings) && s.offerings.length > 0) {
        return s.offerings.some(o => o.stage === selectedStage && o.grade === selectedGrade)
      }
      return s.grade === selectedGrade
    })
  }, [subjects, selectedStage, selectedGrade])

  function handleSelectLesson() {
    // المستخدم غير مسجَّل — فتح الدرس فعلياً يتطلب حساباً
    router.push('/login')
  }

  function chooseStage(stage: StageKey) {
    setSelectedStage(stage)
    setSelectedGrade(null)
  }

  return (
    <div>
      {/* الخطوة ①: اختيار المرحلة */}
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, marginBottom: 14 }}>
          ① اختر المرحلة الدراسية
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {(Object.keys(STAGE_LABELS) as StageKey[]).map(stage => {
            const active = selectedStage === stage
            return (
              <button
                key={stage}
                onClick={() => chooseStage(stage)}
                style={{
                  padding: '10px 22px',
                  borderRadius: BRAND.radiusPill,
                  border: `1.5px solid ${active ? BRAND.crimson : BRAND.border}`,
                  background: active ? `${BRAND.crimson}14` : 'rgba(255,255,255,0.65)',
                  color: active ? BRAND.crimson : BRAND.sub,
                  fontWeight: active ? BRAND.weightBold : BRAND.weightSemibold,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: BRAND.fontBody,
                  transition: 'all 0.18s',
                }}
              >
                {STAGE_LABELS[stage]}
              </button>
            )
          })}
        </div>
      </div>

      {/* الخطوة ②: اختيار الصف — تظهر فقط بعد اختيار المرحلة */}
      {selectedStage && (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, marginBottom: 14 }}>
            ② اختر الصف
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {GRADES_BY_STAGE[selectedStage].map(g => {
              const active = selectedGrade === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGrade(g.id)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: BRAND.radiusPill,
                    border: `1.5px solid ${active ? BRAND.crimson : BRAND.border}`,
                    background: active ? `${BRAND.crimson}14` : 'rgba(255,255,255,0.65)',
                    color: active ? BRAND.crimson : BRAND.sub,
                    fontWeight: active ? BRAND.weightBold : BRAND.weightSemibold,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: BRAND.fontBody,
                    transition: 'all 0.18s',
                  }}
                >
                  {g.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* شبكة المواد — تظهر فقط بعد اختيار المرحلة والصف معاً */}
      {!selectedStage ? null : !selectedGrade ? (
        <p style={{ textAlign: 'center', color: BRAND.sub, fontFamily: BRAND.fontBody, padding: '16px 0 8px' }}>
          اختر الصف أعلاه لعرض المواد المتاحة.
        </p>
      ) : loading ? (
        <p style={{ textAlign: 'center', color: BRAND.sub, fontFamily: BRAND.fontBody, padding: '40px 0' }}>
          ⏳ جارٍ التحميل...
        </p>
      ) : visibleSubjects.length === 0 ? (
        <p style={{ textAlign: 'center', color: BRAND.sub, fontFamily: BRAND.fontBody, padding: '40px 0' }}>
          لا توجد مواد منشورة لهذا الصف حتى الآن.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
            gap: 18,
          }}
        >
          {visibleSubjects.map(s => (
            <button
              key={s.id}
              onClick={() => setOpenSubject(s)}
              className="card"
              style={{
                borderRadius: BRAND.radiusLg,
                padding: 22,
                textAlign: 'right',
                cursor: 'pointer',
                fontFamily: BRAND.fontBody,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon || '📚'}</div>
              <div style={{ fontSize: 16, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.text, marginBottom: 4 }}>
                {s.name}
              </div>
              <div style={{ fontSize: 13, color: BRAND.sub }}>الصف {selectedGrade}</div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 13,
                  fontWeight: BRAND.weightBold,
                  color: BRAND.crimson,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                استكشف المنهج ←
              </div>
            </button>
          ))}
        </div>
      )}

      {/* نافذة معاينة المنهج */}
      {openSubject && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            background: 'rgba(31,18,21,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setOpenSubject(null)
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '85vh',
              overflowY: 'auto',
              background: BRAND.bgSoft,
              borderRadius: BRAND.radiusXl,
              padding: 26,
              boxShadow: BRAND.shadow,
              direction: 'rtl',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                onClick={() => setOpenSubject(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: BRAND.sub,
                  fontSize: 22,
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <CurriculumView subjectId={openSubject.id} onSelectLesson={handleSelectLesson} />

            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: `1px solid ${BRAND.border}`,
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 14, color: BRAND.sub, marginBottom: 14, fontFamily: BRAND.fontBody }}>
                🔒 هذا عرض لمحتوى المنهج فقط — افتح الدروس والاختبارات بحساب مجاني
              </p>
              <button
                onClick={() => router.push('/login')}
                style={{
                  padding: '13px 32px',
                  borderRadius: BRAND.radiusMd,
                  border: 'none',
                  background: BRAND.gradMain,
                  color: '#fff',
                  fontWeight: BRAND.weightBlack,
                  fontSize: 15,
                  cursor: 'pointer',
                  fontFamily: BRAND.fontBody,
                  boxShadow: BRAND.shadowWarm,
                }}
              >
                سجّل مجاناً وابدأ الآن ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}