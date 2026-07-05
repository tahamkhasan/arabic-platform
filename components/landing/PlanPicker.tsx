'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'

const B = {
  text: BRAND.text,
  sub: BRAND.sub,
  muted: BRAND.muted,
  bg: BRAND.bg,
  bgSoft: BRAND.bgSoft,
  card: BRAND.bgCard,
  border: BRAND.border,
  borderStrong: BRAND.borderStrong,
  crimson: BRAND.crimson,
  deep: BRAND.deep,
  gold: BRAND.gold,
  orangeRed: BRAND.orangeRed,
  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
  shadow: BRAND.shadow,
  shadowBlue: BRAND.shadowBlue,
}

const HEADING = BRAND.fontHeading
const BODY = BRAND.fontBody

type Package = {
  id: string
  name: string
  stage?: string | null
  grade?: string | null
  track?: string | null
  subjectsCount?: number
}

type Subject = {
  id: string
  name: string
  icon?: string | null
  stage?: string | null
  grade?: string | null
  track?: string | null
}

type PickType = 'package' | 'subject'

const STAGE_LABELS: Record<string, string> = {
  primary: 'ابتدائي',
  ابتدائي: 'ابتدائي',
  middle: 'متوسط',
  متوسط: 'متوسط',
  secondary: 'ثانوي',
  ثانوي: 'ثانوي',
}

const TRACK_LABELS: Record<string, string> = {
  scientific: 'علمي',
  literary: 'أدبي',
  علمي: 'علمي',
  أدبي: 'أدبي',
}

function describeScope(stage?: string | null, grade?: string | null, track?: string | null): string {
  const parts: string[] = []
  if (stage) parts.push(STAGE_LABELS[stage] ?? stage)
  if (grade) parts.push(`الصف ${grade}`)
  if (track) parts.push(TRACK_LABELS[track] ?? track)
  return parts.join(' — ')
}

function selectableCardStyle(active: boolean): React.CSSProperties {
  return {
    textAlign: 'right',
    padding: 20,
    borderRadius: 20,
    border: `2px solid ${active ? B.crimson : B.border}`,
    background: active ? 'rgba(150,30,45,0.06)' : B.card,
    boxShadow: active ? '0 10px 28px rgba(150,30,45,0.16)' : B.shadow,
    cursor: 'pointer',
    fontFamily: BODY,
    transition: 'all 0.2s',
    width: '100%',
  }
}

export default function PlanPicker() {
  const router = useRouter()
  const [tab, setTab] = useState<PickType>('package')
  const [packages, setPackages] = useState<Package[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<PickType | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    Promise.all([
      fetch('/api/subject-packages').then(r => r.json()).catch(() => ({ items: [] })),
      fetch('/api/subjects').then(r => r.json()).catch(() => ({ subjects: [] })),
    ])
      .then(([pkgRes, subRes]) => {
        if (!mounted) return
        setPackages(pkgRes?.items ?? pkgRes?.packages ?? [])
        setSubjects(subRes?.subjects ?? [])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  function selectPlan(type: PickType, id: string) {
    setSelectedType(type)
    setSelectedId(id)
  }

  function goToRegister() {
    if (!selectedType || !selectedId) return
    router.push(`/register?type=${selectedType}&id=${selectedId}`)
  }

  const hasPackages = packages.length > 0
  const hasSubjects = subjects.length > 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
        <Button
          type="button"
          variant={tab === 'package' ? 'primary' : 'secondary'}
          size="md"
          title="عرض الباقات"
          onClick={() => setTab('package')}
        >
          📦 الباقات
        </Button>

        <Button
          type="button"
          variant={tab === 'subject' ? 'primary' : 'secondary'}
          size="md"
          title="عرض المواد المستقلة"
          onClick={() => setTab('subject')}
        >
          📚 مواد مستقلة
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: B.sub, fontFamily: BODY }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: `4px solid ${B.crimson}33`,
              borderTopColor: B.crimson,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 14px',
            }}
          />
          جارٍ تحميل الباقات والمواد...
        </div>
      ) : (
        <>
          {tab === 'package' &&
            (hasPackages ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
                  gap: 16,
                  marginBottom: 28,
                }}
              >
                {packages.map(pkg => {
                  const active = selectedType === 'package' && selectedId === pkg.id

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      aria-pressed={active}
                      title={`اختيار الباقة: ${pkg.name}`}
                      onClick={() => selectPlan('package', pkg.id)}
                      style={selectableCardStyle(active)}
                    >
                      <div style={{ fontSize: 28, marginBottom: 10 }}>📦</div>

                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 900,
                          fontFamily: HEADING,
                          color: B.text,
                          marginBottom: 6,
                        }}
                      >
                        {pkg.name}
                      </div>

                      <div style={{ fontSize: 13, color: B.sub, marginBottom: 8, fontFamily: BODY }}>
                        {describeScope(pkg.stage, pkg.grade, pkg.track) || 'باقة شاملة'}
                      </div>

                      {typeof pkg.subjectsCount === 'number' && (
                        <div
                          style={{
                            display: 'inline-flex',
                            fontSize: 12,
                            fontWeight: 800,
                            color: B.crimson,
                            background: 'rgba(150,30,45,0.08)',
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontFamily: BODY,
                          }}
                        >
                          {pkg.subjectsCount} مادة ضمن الباقة
                        </div>
                      )}

                      {active && (
                        <div
                          style={{
                            marginTop: 12,
                            fontSize: 13,
                            fontWeight: 900,
                            color: B.crimson,
                            fontFamily: BODY,
                          }}
                        >
                          ✅ مُحدَّدة
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: B.sub, fontFamily: BODY }}>
                لا توجد باقات متاحة حالياً — جرّب تبويب "مواد مستقلة".
              </div>
            ))}

          {tab === 'subject' &&
            (hasSubjects ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
                  gap: 16,
                  marginBottom: 28,
                }}
              >
                {subjects.map(subj => {
                  const active = selectedType === 'subject' && selectedId === subj.id

                  return (
                    <button
                      key={subj.id}
                      type="button"
                      aria-pressed={active}
                      title={`اختيار المادة: ${subj.name}`}
                      onClick={() => selectPlan('subject', subj.id)}
                      style={selectableCardStyle(active)}
                    >
                      <div style={{ fontSize: 28, marginBottom: 10 }}>{subj.icon || '📚'}</div>

                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 900,
                          fontFamily: HEADING,
                          color: B.text,
                          marginBottom: 6,
                        }}
                      >
                        {subj.name}
                      </div>

                      <div style={{ fontSize: 13, color: B.sub, fontFamily: BODY }}>
                        {describeScope(subj.stage, subj.grade, subj.track) || 'مادة مستقلة'}
                      </div>

                      {active && (
                        <div
                          style={{
                            marginTop: 12,
                            fontSize: 13,
                            fontWeight: 900,
                            color: B.crimson,
                            fontFamily: BODY,
                          }}
                        >
                          ✅ مُحدَّدة
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: B.sub, fontFamily: BODY }}>
                لا توجد مواد مستقلة متاحة حالياً — جرّب تبويب "الباقات".
              </div>
            ))}

          <div style={{ textAlign: 'center' }}>
            <Button
              type="button"
              variant={selectedId ? 'primary' : 'secondary'}
              size="lg"
              title="التسجيل"
              onClick={goToRegister}
              disabled={!selectedId}
            >
              {selectedId ? 'التسجيل بهذا الاختيار ←' : 'اختر باقة أو مادة أولاً'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}