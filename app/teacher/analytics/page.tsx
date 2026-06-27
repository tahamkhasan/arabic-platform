'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import { supabase } from '@/lib/supabase'

// ---- أنواع البيانات ----
interface WeakPoint {
  question_text: string
  question_type: string
  error_rate: number
  total_attempts: number
}

interface ClassPerformance {
  class_id: string
  class_name: string
  students_count: number
  avg_score: number
  quizzes_completed: number
}

// ── جديد: أداء المواد — مُفعَّل الآن فعلياً من الخادم ─────────────
interface SubjectPerformance {
  subject_name: string
  avg_score: number
  attempts: number
}

interface TrendPoint {
  label: string
  avg_score: number
}

interface AnalyticsData {
  total_students: number
  total_classes: number
  total_quizzes_completed: number
  overall_avg_score: number
  period_days: number
  classes: ClassPerformance[]
  weak_points: WeakPoint[]
  subject_performance: SubjectPerformance[]
  trend: TrendPoint[]
  recommendation: string
}

const T = {
  bg: '#F7F2EA',
  cardBg: '#FFFFFF',
  headerBg: 'rgba(247,242,234,0.95)',
  textCol: '#1a1a1a',
  subCol: '#6B7280',
  mutedCol: '#9CA3AF',
  borderCol: '#E5E5E5',
  primary: '#C32D2D',
  primarySoft: 'rgba(140, 20, 40, 0.06)',
  primaryDeep: '#780F1E',
  green: '#059669',
  greenSoft: 'rgba(5, 150, 105, 0.08)',
  red: '#DC2626',
  redSoft: 'rgba(220, 38, 38, 0.06)',
  yellow: '#D97706',
  yellowSoft: 'rgba(217, 119, 6, 0.08)',
  blue: '#2563EB',
  blueSoft: 'rgba(37, 99, 235, 0.06)',
}

function ScoreBar({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const height = size === 'sm' ? 6 : size === 'md' ? 10 : 14
  const color =
    score >= 80 ? T.green :
    score >= 60 ? T.blue :
    score >= 40 ? T.yellow :
    T.red

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height, background: '#F3F4F6', borderRadius: height / 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(score, 0)}%`, background: color, borderRadius: height / 2, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: size === 'sm' ? 12 : 14, fontWeight: 700, color, minWidth: size === 'sm' ? 28 : 36, textAlign: 'center' }}>
        {score}%
      </span>
    </div>
  )
}

function StatCard({ icon, label, value, color = T.primary }: { icon: string; label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: T.cardBg, border: '1px solid ' + T.borderCol, borderRadius: 12, padding: '16px 20px', minWidth: 150, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13, color: T.mutedCol, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
    </div>
  )
}

function WeakPointCard({ point, index }: { point: WeakPoint; index: number }) {
  const colors = [T.redSoft, T.yellowSoft, T.blueSoft, T.greenSoft, T.primarySoft]
  const bgColor = colors[index % colors.length]

  return (
    <div style={{ background: bgColor, border: '1px solid ' + T.borderCol, borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.textCol, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'rtl' }}>
          {point.question_text}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: point.error_rate >= 70 ? T.red : T.yellow, background: point.error_rate >= 70 ? T.redSoft : T.yellowSoft, padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>
          {point.error_rate}%
        </span>
      </div>
      <div style={{ fontSize: 12, color: T.mutedCol, display: 'flex', gap: 16 }}>
        <span>النوع: {point.question_type}</span>
        <span>محاولات: {point.total_attempts}</span>
      </div>
    </div>
  )
}

function ClassCard({ classData }: { classData: ClassPerformance }) {
  return (
    <div style={{ background: T.cardBg, border: '1px solid ' + T.borderCol, borderRadius: 12, padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: T.textCol, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
          {classData.class_name}
        </h3>
        <span style={{ fontSize: 12, background: T.blueSoft, color: T.blue, padding: '4px 10px', borderRadius: 6 }}>
          👥 {classData.students_count} طالب
        </span>
      </div>
      <ScoreBar score={classData.avg_score} />
      <div style={{ fontSize: 12, color: T.mutedCol, marginTop: 8, display: 'flex', gap: 16 }}>
        <span>اختبارات مُنجَزَت: {classData.quizzes_completed}</span>
      </div>
    </div>
  )
}

function WeakPointsSection({ points }: { points: WeakPoint[] }) {
  if (!points || points.length === 0) {
    return (
      <div style={{ background: T.greenSoft, border: '1px solid ' + T.green, borderRadius: 12, padding: '20px', textAlign: 'center' }}>
        <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>✅</span>
        <p style={{ color: T.green, margin: 0 }}>لا توجد نقاط ضعف — أداء الطلاب جيد!</p>
      </div>
    )
  }

  return (
    <div style={{ background: T.cardBg, border: '1px solid ' + T.borderCol, borderRight: '4px solid ' + T.red, borderRadius: 12, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textCol, margin: 0 }}>نقاط الضعف المكتشفة</h3>
        <span style={{ fontSize: 12, background: T.redSoft, color: T.red, padding: '2px 10px', borderRadius: 6 }}>{points.length} نقطة</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {points.map((point, i) => <WeakPointCard key={i} point={point} index={i} />)}
      </div>
    </div>
  )
}

function OverallSection({ data }: { data: AnalyticsData }) {
  const scoreColor =
    data.overall_avg_score >= 80 ? T.green :
    data.overall_avg_score >= 60 ? T.blue :
    data.overall_avg_score >= 40 ? T.yellow : T.red

  return (
    <div style={{ background: T.cardBg, border: '1px solid ' + T.borderCol, borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textCol, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid ' + T.borderCol }}>
        نظرة عامة — آخر {data.period_days} يوماً
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="👥" label="إجمالي الطلاب" value={data.total_students} />
        <StatCard icon="🏫" label="الفصول" value={data.total_classes} />
        <StatCard icon="📝" label="اختبارات مُنجَزَت" value={data.total_quizzes_completed} />
        <StatCard icon="📊" label="المتوسط العام" value={`${data.overall_avg_score}%`} color={scoreColor} />
      </div>
      <ScoreBar score={data.overall_avg_score} size="lg" />
    </div>
  )
}

function TrendSection({ trend }: { trend: TrendPoint[] }) {
  if (!trend || trend.length === 0) return null
  const maxScore = Math.max(...trend.map(t => t.avg_score), 1)
  return (
    <div style={{ background: T.cardBg, border: '1px solid ' + T.borderCol, borderRadius: 12, padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textCol, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid ' + T.borderCol }}>
        📈 اتجاه الأداء (آخر 7 أسابيع)
      </h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 180 }}>
        {trend.map((point, i) => {
          const height = Math.max((point.avg_score / maxScore) * 100, 4)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: T.mutedCol, whiteSpace: 'nowrap' }}>{point.label}</span>
              <div style={{ width: '100%', height, background: point.avg_score > 0 ? (point.avg_score >= 70 ? T.green : point.avg_score >= 40 ? T.yellow : T.red) : '#F3F4F6', borderRadius: 6, transition: 'height 0.3s ease' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.textCol }}>{point.avg_score > 0 ? `${point.avg_score}%` : '—'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ClassesSection({ classes }: { classes: ClassPerformance[] }) {
  if (!classes || classes.length === 0) return null
  const sorted = [...classes].sort((a, b) => b.avg_score - a.avg_score)
  return (
    <div style={{ background: T.cardBg, border: '1px solid ' + T.borderCol, borderRadius: 12, padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textCol, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid ' + T.borderCol }}>
        🏫 أداء الفصول (مرتبة تصاعدياً)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {sorted.map((c) => <ClassCard key={c.class_id} classData={c} />)}
      </div>
    </div>
  )
}

// ── جديد: قسم أداء المواد ─────────────────────────────────────────
function SubjectPerformanceSection({ subjects }: { subjects: SubjectPerformance[] }) {
  if (!subjects || subjects.length === 0) return null
  return (
    <div style={{ background: T.cardBg, border: '1px solid ' + T.borderCol, borderRadius: 12, padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textCol, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid ' + T.borderCol }}>
        📚 أداء المواد
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {subjects.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.textCol, minWidth: 120 }}>{s.subject_name}</span>
            <div style={{ flex: 1 }}><ScoreBar score={s.avg_score} size="sm" /></div>
            <span style={{ fontSize: 11, color: T.mutedCol, minWidth: 70, textAlign: 'left' }}>{s.attempts} محاولة</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== المحتوى الرئيسي =====
function AnalyticsContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [accessToken, setAccessToken] = useState('')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  // ── مُصحَّح: مصادقة موحَّدة (mosaed_user + Supabase session)،
  // بدل localStorage.getItem('user') الذي لم يكن يعمل أبداً ────────
  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) { router.replace('/'); return }
    try {
      const u = JSON.parse(saved)
      if (u.user_type === 'student') { router.replace('/student'); return }
      setUser(u)
    } catch { router.replace('/') }
  }, [router])

  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) setAccessToken(data.session.access_token)
    })
  }, [user])

  useEffect(() => {
    if (!accessToken) return
    setLoading(true)
    fetch(`/api/teacher-analytics?period=${period}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data)
        else if (res.data) setData(res.data) // توافق مع success() القديمة التي قد لا تُرجع success صريحة
      })
      .catch(err => console.error('Analytics error:', err))
      .finally(() => setLoading(false))
  }, [period, accessToken])

  if (!user) return null

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif', color: T.mutedCol }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid ' + T.borderCol, borderTopColor: T.primary, borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: 16 }}>جارٍ تحميل التحليلات...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif', color: T.mutedCol }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <p>لا توجد بيانات كافية بعد — أنشئ اختباراً واستخدمه مع طلابك</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Cairo, sans-serif', color: T.textCol, padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => router.push('/teacher')} style={{ padding: '10px 16px', borderRadius: 12, border: `1.5px solid ${T.borderCol}`, background: T.cardBg, color: T.textCol, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>→ رجوع</button>
        <div />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.primaryDeep, marginBottom: 8 }}>📊 لوحة التحليلات</h1>
        <p style={{ color: T.subCol, fontSize: 15, margin: 0 }}>تتبع أداء فصولك واكتشف نقاط الضعف تلقائياً</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
        {[
          { label: 'آخر 7 أيام', value: '7' },
          { label: 'آخر 30 يوم', value: '30' },
          { label: 'آخر 90 يوم', value: '90' },
        ].map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            style={{ padding: '8px 20px', borderRadius: 20, border: period === p.value ? `2px solid ${T.primary}` : '1px solid ' + T.borderCol, background: period === p.value ? T.primarySoft : 'transparent', color: period === p.value ? T.primaryDeep : T.subCol, fontFamily: 'Cairo, sans-serif', fontSize: 14, fontWeight: period === p.value ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        <OverallSection data={data} />
        <WeakPointsSection points={data.weak_points} />
        <SubjectPerformanceSection subjects={data.subject_performance} />
        <TrendSection trend={data.trend} />
        <ClassesSection classes={data.classes} />

        {data.recommendation && (
          <div style={{ background: T.blueSoft, border: '1px solid ' + T.blue, borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
            <div>
              <p style={{ fontWeight: 700, color: T.textCol, marginBottom: 4, fontSize: 14 }}>توصية ذكية</p>
              <p style={{ color: T.subCol, fontSize: 14, margin: 0, lineHeight: 1.7 }}>{data.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F7F2EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif', color: '#6B7280' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <p>جارٍ تحميل التحليلات...</p>
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  )
}
