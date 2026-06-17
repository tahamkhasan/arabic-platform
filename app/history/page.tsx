'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ar } from '@/lib/constants/ar'
import PrintButton      from '@/components/PrintButton'
import SpeechButton     from '@/components/SpeechButton'
import WordExportButton from '@/components/WordExportButton'
import PptxButton       from '@/components/PptxButton'

// ── أنواع البيانات ────────────────────────────────────────────────
interface User {
  id: string; name: string; role: string
  theme_color?: string; theme_mode?: string
}

interface HistoryItem {
  id:          string
  tool:        string
  grade:       string
  stage:       string
  result:      string
  title:       string | null
  prompt:      string
  is_favorite: boolean
  is_cached:   boolean
  rating:      number | null
  created_at:  string
}

// ── ثوابت الأدوات ─────────────────────────────────────────────────
const TOOL_META: Record<string, { label: string; icon: string; color: string }> = {
  explain:   { label: 'شرح الدرس',      icon: '💡', color: '#f9d423' },
  worksheet: { label: 'ورقة عمل',        icon: '📋', color: '#4facfe' },
  game:      { label: 'لعبة لغوية',      icon: '🎮', color: '#43e97b' },
  plan:      { label: 'تحضير الدرس',     icon: '📖', color: '#a78bfa' },
  pptx:      { label: 'PowerPoint',      icon: '📊', color: '#f97316' },
  exam:      { label: 'اختبار',           icon: '📝', color: '#ec4899' },
}

const STAGE_LABEL: Record<string, string> = {
  primary: 'ابتدائي', middle: 'متوسط', high: 'ثانوي',
}

// ── دالة تنسيق التاريخ ────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH   = Math.floor(diffMin / 60)
  const diffD   = Math.floor(diffH / 24)

  if (diffMin < 1)  return 'الآن'
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`
  if (diffH   < 24) return `منذ ${diffH} ساعة`
  if (diffD   < 7)  return `منذ ${diffD} أيام`
  return d.toLocaleDateString('ar-KW', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── الصفحة الرئيسية ───────────────────────────────────────────────
export default function HistoryPage() {
  const router = useRouter()

  // ── المستخدم ──────────────────────────────────────────────────
  const [user,       setUser]       = useState<User | null>(null)
  const [themeColor, setThemeColor] = useState('#f9d423')
  const [isDark,     setIsDark]     = useState(true)

  // ── السجل ─────────────────────────────────────────────────────
  const [items,      setItems]      = useState<HistoryItem[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page,       setPage]       = useState(1)
  const [loading,    setLoading]    = useState(true)

  // ── الفلاتر ───────────────────────────────────────────────────
  const [filterTool,     setFilterTool]     = useState('all')
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [searchText,     setSearchText]     = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── العنصر المفتوح ────────────────────────────────────────────
  const [openItem,    setOpenItem]    = useState<HistoryItem | null>(null)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editTitle,   setEditTitle]   = useState('')
  const [deletingId,  setDeletingId]  = useState<string | null>(null)
  const [confirmDel,  setConfirmDel]  = useState<string | null>(null)

  // ── تحميل المستخدم ────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) { router.replace('/'); return }
    try {
      const u = JSON.parse(saved) as User
      setUser(u)
      if (u.theme_color) setThemeColor(u.theme_color)
      const mode = u.theme_mode ?? 'dark'
      setIsDark(
        mode === 'dark' ||
        (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      )
    } catch { router.replace('/') }
  }, [router])

  // ── جلب السجل ─────────────────────────────────────────────────
  const fetchHistory = useCallback(async (pg = 1) => {
    if (!user) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        userId:   user.id,
        page:     String(pg),
        tool:     filterTool,
        favorite: String(filterFavorite),
        search:   searchText,
      })
      const res  = await fetch(`/api/history?${params}`)
      const data = await res.json()
      setItems(data.items   ?? [])
      setTotal(data.total   ?? 0)
      setTotalPages(data.totalPages ?? 1)
      setPage(pg)
    } finally {
      setLoading(false)
    }
  }, [user, filterTool, filterFavorite, searchText])

  useEffect(() => { if (user) fetchHistory(1) }, [user, filterTool, filterFavorite])

  // ── بحث بتأخير 400ms ──────────────────────────────────────────
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { if (user) fetchHistory(1) }, 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [searchText])

  // ── تبديل المفضلة ─────────────────────────────────────────────
  async function toggleFavorite(item: HistoryItem) {
    const newVal = !item.is_favorite
    // تحديث فوري في الواجهة
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_favorite: newVal } : i))
    if (openItem?.id === item.id) setOpenItem({ ...openItem, is_favorite: newVal })

    await fetch('/api/history', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: item.id, userId: user?.id, action: 'favorite' }),
    })
  }

  // ── تعديل العنوان ─────────────────────────────────────────────
  async function saveTitle(item: HistoryItem) {
    if (!editTitle.trim()) { setEditingId(null); return }
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, title: editTitle } : i))
    if (openItem?.id === item.id) setOpenItem({ ...openItem, title: editTitle })
    setEditingId(null)

    await fetch('/api/history', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: item.id, userId: user?.id, action: 'rename', value: editTitle }),
    })
  }

  // ── حذف ───────────────────────────────────────────────────────
  async function deleteItem(id: string) {
    setDeletingId(id)
    setItems(prev => prev.filter(i => i.id !== id))
    setTotal(prev => prev - 1)
    if (openItem?.id === id) setOpenItem(null)
    setConfirmDel(null)

    await fetch('/api/history', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, userId: user?.id }),
    })
    setDeletingId(null)
  }

  // ── ألوان الثيم ───────────────────────────────────────────────
  const bg        = isDark ? '#0f0c29'                 : '#f0f4ff'
  const cardBg    = isDark ? 'rgba(255,255,255,0.06)'  : '#ffffff'
  const textCol   = isDark ? '#e2e8f0'                 : '#1a202c'
  const subCol    = isDark ? '#718096'                  : '#4a5568'
  const borderCol = isDark ? 'rgba(255,255,255,0.1)'   : 'rgba(0,0,0,0.1)'
  const inputBg   = isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.04)'

  if (!user) return null

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: bg, color: textCol }}>

      {/* ══ الرأس ══════════════════════════════════════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: isDark ? 'rgba(15,12,41,0.95)' : 'rgba(240,244,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${borderCol}`,
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', color: subCol, cursor: 'pointer', fontSize: 20, padding: 0 }}
            title="العودة للداشبورد"
          >
            ←
          </button>
          <span style={{ fontSize: 20 }}>📚</span>
          <div>
            <span style={{ fontSize: 15, fontWeight: 800, color: themeColor }}>سجل التوليدات</span>
            <br />
            <span style={{ fontSize: 11, color: subCol }}>
              {total > 0 ? `${total} توليد` : 'لا توجد توليدات بعد'}
            </span>
          </div>
        </div>
        <span style={{ fontSize: 12, color: subCol }}>🌙 {ar.common.platformName}</span>
      </header>

      {/* ══ شريط الفلاتر ══════════════════════════════════════ */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${borderCol}`,
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
      }}>

        {/* 🔍 بحث */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: subCol, fontSize: 14 }}>🔍</span>
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="ابحث في توليداتك..."
            style={{
              width: '100%', padding: '8px 36px 8px 12px',
              borderRadius: 10, border: `1px solid ${borderCol}`,
              background: inputBg, color: textCol,
              fontSize: 13, fontFamily: 'inherit', outline: 'none',
            }}
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: subCol, cursor: 'pointer', fontSize: 14 }}
            >✕</button>
          )}
        </div>

        {/* فلتر الأداة */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'الكل', icon: '🗂️' },
            ...Object.entries(TOOL_META).map(([id, m]) => ({ id, label: m.label, icon: m.icon }))
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilterTool(opt.id)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: `1px solid`,
                borderColor: filterTool === opt.id ? themeColor : borderCol,
                background:  filterTool === opt.id ? `${themeColor}20` : 'transparent',
                color:       filterTool === opt.id ? themeColor : subCol,
                cursor: 'pointer', fontSize: 12, fontWeight: 700,
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {/* فلتر المفضلة */}
        <button
          onClick={() => setFilterFavorite(f => !f)}
          style={{
            padding: '6px 14px', borderRadius: 8, border: `1px solid`,
            borderColor: filterFavorite ? '#f6c90e' : borderCol,
            background:  filterFavorite ? 'rgba(246,201,14,0.15)' : 'transparent',
            color:       filterFavorite ? '#f6c90e' : subCol,
            cursor: 'pointer', fontSize: 12, fontWeight: 700,
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
        >
          ⭐ المفضلة فقط
        </button>
      </div>

      {/* ══ المحتوى الرئيسي ════════════════════════════════════ */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>

        {/* حالة التحميل */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 14, color: subCol, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
              جارٍ التحميل...
            </div>
          </div>
        )}

        {/* حالة الفراغ */}
        {!loading && items.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: cardBg, borderRadius: 20, border: `1px solid ${borderCol}`,
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: textCol, marginBottom: 8 }}>
              {searchText || filterFavorite || filterTool !== 'all'
                ? 'لا توجد نتائج للفلتر الحالي'
                : 'سجلك فارغ حتى الآن'}
            </h3>
            <p style={{ color: subCol, fontSize: 14, marginBottom: 24 }}>
              {searchText || filterFavorite || filterTool !== 'all'
                ? 'جرّب تغيير معايير البحث أو الفلتر'
                : 'ابدأ بتوليد محتوى من الداشبورد وسيظهر هنا'}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '10px 24px', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg,${themeColor},#ff4e50)`,
                color: '#1a1a2e', fontWeight: 800, fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ✨ ابدأ التوليد الآن
            </button>
          </div>
        )}

        {/* شبكة البطاقات */}
        {!loading && items.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16, marginBottom: 24,
          }}>
            {items.map(item => {
              const meta = TOOL_META[item.tool] ?? { label: item.tool, icon: '📄', color: themeColor }
              const displayTitle = item.title || `${meta.icon} ${meta.label} — ${STAGE_LABEL[item.stage] ?? item.stage} — ${item.grade}`
              const preview = item.result?.slice(0, 140) + (item.result?.length > 140 ? '...' : '')

              return (
                <div
                  key={item.id}
                  style={{
                    background: cardBg, borderRadius: 16, padding: 16,
                    border: `1px solid ${item.is_favorite ? '#f6c90e55' : borderCol}`,
                    cursor: 'pointer', transition: 'all 0.2s',
                    position: 'relative',
                    boxShadow: item.is_favorite ? `0 0 0 1px #f6c90e33` : 'none',
                  }}
                  onClick={() => setOpenItem(item)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.2)`
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow = item.is_favorite ? `0 0 0 1px #f6c90e33` : 'none'
                  }}
                >
                  {/* رأس البطاقة */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '3px 8px',
                        borderRadius: 6, background: `${meta.color}22`, color: meta.color,
                      }}>
                        {meta.icon} {meta.label}
                      </span>
                      {item.is_cached && (
                        <span style={{ fontSize: 10, color: subCol }}>⚡</span>
                      )}
                    </div>

                    {/* زر المفضلة */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(item) }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 18, padding: '2px 4px', transition: 'transform 0.15s',
                      }}
                      title={item.is_favorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    >
                      {item.is_favorite ? '⭐' : '☆'}
                    </button>
                  </div>

                  {/* العنوان */}
                  {editingId === item.id ? (
                    <div onClick={e => e.stopPropagation()} style={{ marginBottom: 8 }}>
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveTitle(item)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        style={{
                          width: '100%', padding: '6px 10px', borderRadius: 8,
                          border: `1px solid ${themeColor}`,
                          background: inputBg, color: textCol,
                          fontSize: 13, fontFamily: 'inherit', outline: 'none',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button
                          onClick={() => saveTitle(item)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: themeColor, color: '#1a1a2e', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                        >حفظ</button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${borderCol}`, background: 'transparent', color: subCol, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                        >إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    <h3
                      style={{ fontSize: 13, fontWeight: 700, color: textCol, marginBottom: 8, lineHeight: 1.5 }}
                      title="انقر مرتين لتغيير العنوان"
                      onDoubleClick={e => {
                        e.stopPropagation()
                        setEditingId(item.id)
                        setEditTitle(item.title ?? displayTitle)
                      }}
                    >
                      {displayTitle}
                    </h3>
                  )}

                  {/* معاينة النص */}
                  <p style={{ fontSize: 12, color: subCol, lineHeight: 1.7, marginBottom: 12 }}>
                    {preview || 'لا يوجد محتوى'}
                  </p>

                  {/* تذييل البطاقة */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: subCol }}>
                      🕒 {formatDate(item.created_at)}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {item.rating === 1  && <span title="مفيد">👍</span>}
                      {item.rating === -1 && <span title="غير مفيد">👎</span>}

                      {/* زر تعديل العنوان */}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setEditingId(item.id)
                          setEditTitle(item.title ?? '')
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: subCol, fontSize: 13, padding: '2px 4px' }}
                        title="تعديل العنوان"
                      >✏️</button>

                      {/* زر الحذف */}
                      {confirmDel === item.id ? (
                        <span onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => deleteItem(item.id)}
                            style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: '#fc8181', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                          >تأكيد</button>
                          <button
                            onClick={() => setConfirmDel(null)}
                            style={{ padding: '3px 8px', borderRadius: 6, border: `1px solid ${borderCol}`, background: 'transparent', color: subCol, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                          >إلغاء</button>
                        </span>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDel(item.id) }}
                          disabled={deletingId === item.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fc8181', fontSize: 13, padding: '2px 4px', opacity: deletingId === item.id ? 0.5 : 1 }}
                          title="حذف"
                        >🗑️</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── ترقيم الصفحات ──────────────────────────────────── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
            <button
              onClick={() => fetchHistory(page - 1)}
              disabled={page === 1}
              style={{
                padding: '8px 16px', borderRadius: 10, border: `1px solid ${borderCol}`,
                background: 'transparent', color: page === 1 ? subCol : textCol,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700, opacity: page === 1 ? 0.4 : 1,
              }}
            >← السابق</button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => fetchHistory(p)}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: `1px solid`,
                  borderColor: p === page ? themeColor : borderCol,
                  background:  p === page ? `${themeColor}22` : 'transparent',
                  color:       p === page ? themeColor : textCol,
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                }}
              >{p}</button>
            ))}

            <button
              onClick={() => fetchHistory(page + 1)}
              disabled={page === totalPages}
              style={{
                padding: '8px 16px', borderRadius: 10, border: `1px solid ${borderCol}`,
                background: 'transparent', color: page === totalPages ? subCol : textCol,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700, opacity: page === totalPages ? 0.4 : 1,
              }}
            >التالي →</button>
          </div>
        )}
      </main>

      {/* ══ نافذة عرض التوليد ══════════════════════════════════ */}
      {openItem && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpenItem(null) }}
        >
          <div style={{
            width: '100%', maxWidth: 760, maxHeight: '90vh',
            background: isDark ? '#1a1a2e' : '#ffffff',
            borderRadius: 20, display: 'flex', flexDirection: 'column',
            border: `1px solid ${borderCol}`, overflow: 'hidden',
          }}>
            {/* رأس النافذة */}
            <div style={{
              padding: '16px 20px', borderBottom: `1px solid ${borderCol}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>
                  {TOOL_META[openItem.tool]?.icon ?? '📄'}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: themeColor }}>
                    {openItem.title || `${TOOL_META[openItem.tool]?.label ?? openItem.tool} — ${openItem.grade}`}
                  </div>
                  <div style={{ fontSize: 11, color: subCol }}>
                    {formatDate(openItem.created_at)} •{' '}
                    {STAGE_LABEL[openItem.stage] ?? openItem.stage} •{' '}
                    الصف {openItem.grade}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => toggleFavorite(openItem)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}
                  title={openItem.is_favorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                >
                  {openItem.is_favorite ? '⭐' : '☆'}
                </button>
                <button
                  onClick={() => setOpenItem(null)}
                  style={{ background: 'none', border: 'none', color: subCol, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}
                >✕</button>
              </div>
            </div>

            {/* النص */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{
                fontSize: 14, lineHeight: 2.0, color: textCol,
                whiteSpace: 'pre-wrap',
              }}>
                {openItem.result}
              </div>
            </div>

            {/* أدوات التصدير */}
            <div style={{
              padding: '12px 20px', borderTop: `1px solid ${borderCol}`,
              display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
              flexShrink: 0,
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            }}>
              {/* نسخ */}
              <CopyButton text={openItem.result} themeColor={themeColor} />

              <PrintButton
                content={openItem.result}
                title={openItem.title ?? `${TOOL_META[openItem.tool]?.label} — ${openItem.grade}`}
                grade={openItem.grade}
                themeColor={themeColor}
              />
              <WordExportButton
                content={openItem.result}
                title={openItem.title ?? `${TOOL_META[openItem.tool]?.label} — ${openItem.grade}`}
                grade={openItem.grade}
                themeColor={themeColor}
              />
              <PptxButton
                content={openItem.result}
                title={openItem.title ?? `${TOOL_META[openItem.tool]?.label} — ${openItem.grade}`}
                grade={openItem.grade}
                themeColor={themeColor}
              />
              <SpeechButton text={openItem.result} themeColor={themeColor} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

// ── مكوّن نسخ صغير ───────────────────────────────────────────────
function CopyButton({ text, themeColor }: { text: string; themeColor: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 8,
        border: `1px solid ${copied ? '#68d391' : themeColor + '44'}`,
        background: copied ? 'rgba(72,187,120,0.15)' : themeColor + '15',
        color: copied ? '#68d391' : themeColor,
        cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
      }}
    >
      {copied ? '✅ تم النسخ' : '📋 نسخ'}
    </button>
  )
}
