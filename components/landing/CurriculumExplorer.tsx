'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import CurriculumView from '@/components/curriculum/CurriculumView'

// components/landing/CurriculumExplorer.tsx
// مستكشف منهج عام — يعمل بلا تسجيل دخول، يستخدم نقاط الـ API
// العامة الموجودة فعلاً: /api/subjects و /api/subjects/[id]/curriculum

type Subject = {
  id: string
  name: string
  icon?: string
  grade?: string
  stage?: string
}

// ──────────────────────────────────────────────────────────────
// المفتاح الصحيح للمرحلة الثانوية في قاعدة البيانات هو 'secondary'
// (وليس 'high') — تأكيد مباشر بعد فحص subjects.stage فعلياً. كان
// الزر يرسل 'high' سابقاً، فلا يطابق أي صفّ، فتظهر القائمة فارغة
// دائماً عند اختيار "ثانوي" تحديداً.
//
// كذلك أُضيف STAGE_ALIASES أدناه كطبقة حماية إضافية في الفلترة
// المحلية: حتى لو تبقّت بيانات قديمة بمفتاح عربي ('ثانوي'/'ابتدائي'
// /'متوسط') لم تُهاجَر بعد في بيئة أخرى، لا تُسقط هذه الصفوف بصمت من
// النتائج — يُطابق الفلتر القيمة الإنجليزية وما يرادفها عربياً معاً.
// ──────────────────────────────────────────────────────────────
const STAGE_TABS = [
  { id: '', label: 'الكل', icon: '🗂️' },
  { id: 'primary', label: 'ابتدائي', icon: '🧒' },
  { id: 'middle', label: 'متوسط', icon: '📘' },
  { id: 'secondary', label: 'ثانوي', icon: '🎓' },
] as const

const STAGE_ALIASES: Record<string, string[]> = {
  primary: ['primary', 'ابتدائي'],
  middle: ['middle', 'متوسط'],
  secondary: ['secondary', 'ثانوي'],
}

export default function CurriculumExplorer() {
  const router = useRouter()
  const [stage, setStage] = useState<string>('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [openSubject, setOpenSubject] = useState<Subject | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (stage) params.set('stage', stage)

    fetch(`/api/subjects?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        const all: Subject[] = d.subjects ?? []
        // طبقة حماية: إن أعاد الخادم نتائج غير مفلترة فعلياً (أو
        // كانت بعض الصفوف لا تزال بمفتاح عربي قديم لم يُهاجَر)،
        // نُطبّق فلترة محلية إضافية تقبل المرادفين معاً.
        if (!stage) {
          setSubjects(all)
        } else {
          const aliases = STAGE_ALIASES[stage] ?? [stage]
          setSubjects(all.filter(s => !s.stage || aliases.includes(s.stage)))
        }
      })
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false))
  }, [stage])

  function handleSelectLesson() {
    // المستخدم غير مسجَّل — فتح الدرس فعلياً يتطلب حساباً
    router.push('/login')
  }

  return (
    <div>
      {/* تبويبات المراحل */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
        {STAGE_TABS.map(tab => {
          const active = stage === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setStage(tab.id)}
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
              {tab.icon} {tab.label}
            </button>
          )
        })}
      </div>

      {/* شبكة المواد */}
      {loading ? (
        <p style={{ textAlign: 'center', color: BRAND.sub, fontFamily: BRAND.fontBody, padding: '40px 0' }}>
          ⏳ جارٍ التحميل...
        </p>
      ) : subjects.length === 0 ? (
        <p style={{ textAlign: 'center', color: BRAND.sub, fontFamily: BRAND.fontBody, padding: '40px 0' }}>
          لا توجد مواد منشورة لهذه المرحلة حتى الآن.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
            gap: 18,
          }}
        >
          {subjects.map(s => (
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
              {s.grade && (
                <div style={{ fontSize: 13, color: BRAND.sub }}>الصف {s.grade}</div>
              )}
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
