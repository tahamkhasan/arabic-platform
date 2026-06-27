'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import { supabase } from '@/lib/supabase'

interface User { id: string; name: string; role: string; user_type: string; status?: string; theme_color?: string }

interface QuizListItem {
  id: string
  title: string
  published: boolean
  questions_count: number
  created_at: string
  updated_at: string
}

export default function TeacherQuizzesPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [themeColor, setThemeColor] = useState<string>(BRAND.red)

  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) { router.replace('/'); return }
    try {
      const u = JSON.parse(saved) as User
      if (u.user_type === 'student') { router.replace('/student'); return }
      if (u.status === 'pending' || u.status === 'suspended') { router.replace('/pending-approval'); return }
      setUser(u)
      if (u.theme_color) setThemeColor(u.theme_color)
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
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('status', filter)
    fetch(`/api/quizzes?${params.toString()}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setQuizzes(d.data?.items ?? d.items ?? []))
      .catch(() => setQuizzes([]))
      .finally(() => setLoading(false))
  }, [accessToken, filter])

  const T = {
    bg: BRAND.bg, cardBg: BRAND.bgSoft, text: BRAND.text, sub: BRAND.sub, border: BRAND.border,
  }

  if (!user) return null

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: BRAND.fontBody, paddingBottom: 90 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(247,242,234,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push('/teacher')} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: themeColor, color: '#1a1a2e', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>→ رجوع</button>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: themeColor, background: `${themeColor}16`, padding: '4px 12px', borderRadius: 8, margin: 0, fontFamily: BRAND.fontHeading }}>🎯 الاختبارات</h1>
        </div>
        <button
          onClick={() => router.push('/teacher/quizzes/new')}
          style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${themeColor},${BRAND.gold})`, color: '#1a1a2e', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ＋ اختبار جديد
        </button>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {([['all', 'الكل'], ['draft', 'مسودات'], ['published', 'منشورة']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding: '8px 18px', borderRadius: 10, border: `2px solid ${filter === val ? themeColor : T.border}`, background: filter === val ? `${themeColor}18` : 'transparent', color: filter === val ? themeColor : T.sub, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
              {label}
            </button>
          ))}
        </div>

        {!accessToken || loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: T.sub }}>⏳ جارٍ التحميل...</div>
        ) : quizzes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: T.cardBg, borderRadius: 18, border: `1.5px solid ${T.border}` }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🎯</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: T.text, marginBottom: 8, fontFamily: BRAND.fontHeading }}>لا توجد اختبارات بعد</h3>
            <p style={{ fontSize: 14, color: T.sub }}>أنشئ أول اختبار تفاعلي لطلابك.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {quizzes.map(q => (
              <div key={q.id} onClick={() => router.push(`/teacher/quizzes/${q.id}`)}
                style={{ padding: '16px 18px', borderRadius: 14, background: T.cardBg, border: `1.5px solid ${T.border}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4 }}>{q.title}</div>
                  <div style={{ fontSize: 12, color: T.sub }}>{q.questions_count} سؤال • {new Date(q.created_at).toLocaleDateString('ar-KW', { month: 'short', day: 'numeric' })}</div>
                </div>
                <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, fontWeight: 700, background: q.published ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)', color: q.published ? '#059669' : '#D97706' }}>
                  {q.published ? '✅ منشور' : '📝 مسودة'}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
