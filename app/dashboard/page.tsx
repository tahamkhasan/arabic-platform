'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const STAGES = [
  { id: 'primary', label: 'ابتدائي', icon: '🌱', grades: ['الأول','الثاني','الثالث','الرابع','الخامس'] },
  { id: 'middle',  label: 'متوسط',   icon: '📚', grades: ['السادس','السابع','الثامن','التاسع'] },
  { id: 'high',    label: 'ثانوي',   icon: '🎓', grades: ['العاشر','الحادي عشر','الثاني عشر'] },
]

const TOOLS = [
  { id: 'explain',   icon: '💡', label: 'شرح المادة',     desc: 'شرح مبسط مع أمثلة' },
  { id: 'exam',      icon: '📝', label: 'اختبار',          desc: 'أسئلة متنوعة مع درجات' },
  { id: 'worksheet', icon: '📋', label: 'ورقة عمل',        desc: 'أنشطة تفاعلية متنوعة' },
  { id: 'game',      icon: '🎮', label: 'لعبة لغوية',      desc: 'نشاط ممتع وتعليمي' },
]

const stageColors: Record<string, { from: string; to: string }> = {
  primary: { from: '#43e97b', to: '#38f9d7' },
  middle:  { from: '#4facfe', to: '#00f2fe' },
  high:    { from: '#f9d423', to: '#ff4e50' },
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser]           = useState<any>(null)
  const [stage, setStage]         = useState<string | null>(null)
  const [grade, setGrade]         = useState<string | null>(null)
  const [tool, setTool]           = useState<string | null>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [userInput, setUserInput] = useState('')
  const [output, setOutput]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [matLoading, setMatLoading] = useState(false)
  const [error, setError]         = useState('')
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) return router.push('/')
    setUser(JSON.parse(stored))
  }, [])

  useEffect(() => {
    if (stage && grade) fetchMaterials()
  }, [stage, grade])

  async function fetchMaterials() {
    setMatLoading(true)
    const res = await fetch(`/api/materials?stage=${stage}&grade=${grade}`)
    const data = await res.json()
    setMaterials(data.materials || [])
    setMatLoading(false)
  }

  // بناء المحتوى المرجعي من المواد المرفوعة
  function buildMaterialContext() {
    if (materials.length === 0) return ''
    return materials.map(m => {
      let ctx = `📌 ${m.title}`
      if (m.subject) ctx += ` (${m.subject})`
      ctx += `\n${m.content || ''}`
      if (m.file_urls?.length > 0) ctx += `\n[ملفات مرفقة: ${m.file_urls.length}]`
      return ctx
    }).join('\n\n━━━━━━━━━━━━━━━━\n\n')
  }

  async function handleGenerate() {
    if (!grade)            return setError('اختر الصف أولاً')
    if (!tool)             return setError('اختر الأداة أولاً')
    if (!userInput.trim()) return setError('حدد ما تريده بالضبط')
    setError(''); setOutput(''); setLoading(true)
    try {
      const material = buildMaterialContext()
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool, grade, stage,
          prompt: userInput,
          userId: user?.id,
          material,
        }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'حدث خطأ')
      setOutput(data.result)
    } catch { setError('خطأ في الاتصال. حاول مرة أخرى.') }
    setLoading(false)
  }

  function handleLogout() {
    localStorage.removeItem('user')
    localStorage.removeItem('session')
    router.push('/')
  }

  const currentStage = STAGES.find(s => s.id === stage)
  const hasMaterial  = materials.length > 0
  const toolData     = TOOLS.find(t => t.id === tool)

  return (
    <div dir="rtl" className="min-h-screen p-5 text-white"
      style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' }}>

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-black"
            style={{ background: 'linear-gradient(90deg,#f9d423,#ff4e50)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🌙 مساعد اللغة العربية
          </h1>
          <p className="text-xs text-gray-600">أهلاً {user?.name || user?.email} 👋</p>
        </div>
        <button onClick={handleLogout}
          className="px-3 py-2 rounded-xl text-xs font-bold text-gray-500 border border-white/10"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          خروج
        </button>
      </div>

      {/* Step 1: Stage */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 font-bold mb-2">① اختر المرحلة الدراسية</p>
        <div className="flex gap-2">
          {STAGES.map(s => {
            const active = stage === s.id
            const c = stageColors[s.id]
            return (
              <button key={s.id}
                onClick={() => { setStage(s.id); setGrade(null); setOutput(''); setError(''); setMaterials([]) }}
                className="flex-1 py-3 rounded-xl font-bold text-xs transition-all"
                style={{
                  background: active ? `linear-gradient(135deg,${c.from},${c.to})` : 'rgba(255,255,255,0.07)',
                  color: active ? '#1a1a2e' : '#718096',
                }}>
                <div className="text-lg mb-1">{s.icon}</div>
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Step 2: Grade */}
      {stage && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-bold mb-2">
            ② اختر الصف — <span style={{ color: stageColors[stage].from }}>{currentStage?.label}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {currentStage?.grades.map(g => {
              const active = grade === g
              const c = stageColors[stage]
              return (
                <button key={g}
                  onClick={() => { setGrade(g); setOutput(''); setError('') }}
                  className="px-3 py-2 rounded-lg text-xs font-bold transition-all border"
                  style={{
                    background: active ? `linear-gradient(135deg,${c.from},${c.to})` : 'rgba(255,255,255,0.05)',
                    color: active ? '#1a1a2e' : '#a0aec0',
                    borderColor: active ? 'transparent' : 'rgba(255,255,255,0.1)',
                  }}>
                  الصف {g}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Material Status */}
      {grade && (
        <div className="mb-4 p-3 rounded-xl border"
          style={{
            background: matLoading ? 'rgba(255,255,255,0.04)' : hasMaterial ? 'rgba(67,233,123,0.07)' : 'rgba(252,129,129,0.07)',
            borderColor: matLoading ? 'rgba(255,255,255,0.1)' : hasMaterial ? 'rgba(67,233,123,0.25)' : 'rgba(252,129,129,0.2)',
          }}>
          {matLoading ? (
            <p className="text-xs text-gray-400">⏳ جارٍ تحميل المادة العلمية...</p>
          ) : hasMaterial ? (
            <div>
              <p className="text-xs font-bold text-green-400 mb-2">
                🧠 المادة العلمية جاهزة — {materials.length} مادة محملة
              </p>
              <div className="space-y-1">
                {materials.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <span className="text-green-400 text-xs">✓</span>
                    <span className="text-xs text-gray-400">{m.title}</span>
                    {m.file_urls?.length > 0 && (
                      <span className="text-xs text-blue-400">({m.file_urls.length} ملف)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-400">
              ⚠️ لا توجد مواد لهذا الصف بعد — تواصل مع المدير لإضافتها
            </p>
          )}
        </div>
      )}

      {/* Step 3: Tool */}
      {grade && hasMaterial && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-bold mb-2">③ ماذا تريد؟</p>
          <div className="grid grid-cols-2 gap-2">
            {TOOLS.map(t => (
              <button key={t.id}
                onClick={() => { setTool(t.id); setOutput(''); setError('') }}
                className="py-3 px-2 rounded-xl font-bold text-sm transition-all text-right"
                style={{
                  background: tool === t.id ? 'rgba(249,212,35,0.12)' : 'rgba(255,255,255,0.05)',
                  color: tool === t.id ? '#f9d423' : '#718096',
                  border: tool === t.id ? '2px solid #f9d423' : '2px solid transparent',
                }}>
                <div className="text-xl mb-1">{t.icon}</div>
                <div className="font-black text-xs">{t.label}</div>
                <div className="text-xs opacity-60 mt-1">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Input */}
      {tool && grade && hasMaterial && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 font-bold mb-2">
            ④ حدد طلبك بدقة
          </p>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder={
              tool === 'explain'   ? `مثال: اشرح قاعدة المبتدأ والخبر مع أمثلة من المادة` :
              tool === 'exam'      ? `مثال: اختبار في النحو — 10 أسئلة متنوعة — الدرجة من 20` :
              tool === 'worksheet' ? `مثال: ورقة عمل عن الفعل المضارع — 5 أنشطة متنوعة` :
              `مثال: لعبة لتعلم المفردات — مناسبة لمجموعات`
            }
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10 resize-y"
            style={{ background: 'rgba(255,255,255,0.05)', fontFamily: 'inherit', lineHeight: '1.9' }}
          />
          <p className="text-xs text-gray-600 mt-1">
            💡 كلما كان طلبك أدق كانت النتيجة أفضل
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs text-center mb-3 p-2 rounded-xl"
          style={{ background: 'rgba(252,129,129,0.08)' }}>⚠️ {error}</p>
      )}

      {/* Generate Button */}
      {tool && grade && hasMaterial && (
        <button onClick={handleGenerate} disabled={loading}
          className="w-full py-4 rounded-xl font-black text-base mb-5 transition-all"
          style={{
            background: loading ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#f9d423,#ff4e50)',
            color: loading ? '#4a5568' : '#1a1a2e',
            boxShadow: loading ? 'none' : '0 6px 18px rgba(249,212,35,0.3)',
          }}>
          {loading ? '⏳ جارٍ الاستخراج من المادة...' : `✨ استخراج ${toolData?.label}`}
        </button>
      )}

      {/* Output */}
      {output && (
        <div className="rounded-2xl border p-4"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(249,212,35,0.2)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-yellow-400 font-bold text-sm">
              {toolData?.icon} {toolData?.label} — الصف {grade}
            </span>
            <button
              onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="px-3 py-1 rounded-lg text-xs font-bold border transition-all"
              style={{
                background: copied ? 'rgba(72,187,120,0.2)' : 'rgba(249,212,35,0.1)',
                borderColor: copied ? '#68d391' : 'rgba(249,212,35,0.3)',
                color: copied ? '#68d391' : '#f9d423',
              }}>
              {copied ? '✅ تم النسخ' : '📋 نسخ'}
            </button>
          </div>
          <div className="text-sm text-gray-200 whitespace-pre-wrap max-h-[500px] overflow-y-auto"
            style={{ lineHeight: '2.1' }}>
            {output}
          </div>
        </div>
      )}

      <p className="text-center text-gray-800 text-xs mt-5">
        منصة مساعد اللغة العربية • ابتدائي · متوسط · ثانوي
      </p>
    </div>
  )
}