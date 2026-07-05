'use client'
import { useState } from 'react'
import type { SubjectFormState, SubjectItem } from '@/types/subjects'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import SubjectCard from './SubjectCard'
import SubjectFormModal from './SubjectFormModal'

type Props = {
  subjects: SubjectItem[]
  filteredSubjects: SubjectItem[]
  loading: boolean
  saving: boolean
  deleting: boolean
  msg: string
  search: string
  modalOpen: boolean
  editingSubject: SubjectItem | null
  form: SubjectFormState
  accessToken?: string
  onBack: () => void
  onRefresh: () => void
  onCreate: () => void
  onEdit: (subject: SubjectItem) => void
  onDelete: (subject: SubjectItem) => void
  onCloseModal: () => void
  onSubmit: () => void
  onSearchChange: (value: string) => void
  onFormChange: <K extends keyof SubjectFormState>(key: K, value: SubjectFormState[K]) => void
}

export default function SubjectsPageView(props: Props) {
  const {
    subjects, filteredSubjects, loading, saving, deleting, msg, search,
    modalOpen, editingSubject, form, accessToken,
    onBack, onRefresh, onCreate, onEdit, onDelete,
    onCloseModal, onSubmit, onSearchChange, onFormChange,
  } = props

  const [seeding,   setSeeding]   = useState(false)
  const [seedMsg,   setSeedMsg]   = useState('')

  async function handleSeed() {
    if (!confirm('سيتم إضافة جميع مواد المنهج الكويتي (ابتدائي/متوسط/ثانوي) التي لم تُضَف بعد. هل تريد المتابعة؟')) return
    setSeeding(true)
    setSeedMsg('')
    try {
      const res  = await fetch('/api/admin/seed-subjects', {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
      const data = await res.json()
      setSeedMsg(res.ok ? `✅ ${data.message}` : `❌ ${data.error || 'فشل التعبئة'}`)
      if (res.ok) setTimeout(() => { setSeedMsg(''); onRefresh() }, 2000)
    } catch {
      setSeedMsg('❌ تعذّر الاتصال بالخادم.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: BRAND.bg,
        color: BRAND.text,
        fontFamily: BRAND.fontBody,
        padding: '24px 16px 60px',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        select option { background: ${BRAND.bg} !important; color: ${BRAND.text} !important; }
        select { color-scheme: light; }
      `}</style>

      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* ── الهيدر ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.crimson }}>
              📚 إدارة المواد
            </div>
            <div style={{ fontSize: 13, color: BRAND.sub, marginTop: 4 }}>
              {subjects.length} مادة — يدعم التشعيب والمشاركة بين علمي وأدبي
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={onBack}>← رجوع للإدارة</Button>
            <Button variant="ghost" size="sm" onClick={onRefresh}>↻ تحديث</Button>
            {/* ── زر تعبئة المنهج الكويتي ── */}
            <button
              onClick={handleSeed}
              disabled={seeding}
              style={{
                padding: '8px 14px',
                borderRadius: BRAND.radiusSm,
                border: `1.5px solid rgba(5,150,105,0.4)`,
                background: seeding ? 'rgba(5,150,105,0.05)' : 'rgba(5,150,105,0.08)',
                color: '#059669',
                fontWeight: BRAND.weightBold,
                fontSize: 13,
                cursor: seeding ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {seeding ? '⏳ جارٍ التعبئة...' : '🌱 تعبئة المنهج الكويتي'}
            </button>
            <Button variant="primary" size="sm" onClick={onCreate}>＋ مادة جديدة</Button>
          </div>
        </div>

        {/* ── رسالة التعبئة ── */}
        {seedMsg && (
          <div style={{
            padding: '12px 16px', borderRadius: BRAND.radiusSm, marginBottom: 16,
            fontSize: 14, fontWeight: BRAND.weightBold,
            background: seedMsg.startsWith('✅') ? 'rgba(5,150,105,0.10)' : 'rgba(140,20,40,0.08)',
            color:      seedMsg.startsWith('✅') ? '#059669' : BRAND.crimson,
            border: `1px solid ${seedMsg.startsWith('✅') ? 'rgba(5,150,105,0.3)' : 'rgba(140,20,40,0.25)'}`,
          }}>
            {seedMsg}
          </div>
        )}

        {/* ── رسالة العمليات العادية ── */}
        {msg && !seedMsg && (
          <div style={{
            padding: '12px 16px', borderRadius: BRAND.radiusSm, marginBottom: 16,
            fontSize: 14, fontWeight: BRAND.weightBold,
            background: msg.startsWith('✅') ? 'rgba(5,150,105,0.10)' : 'rgba(140,20,40,0.08)',
            color:      msg.startsWith('✅') ? '#059669' : BRAND.crimson,
            border: `1px solid ${msg.startsWith('✅') ? 'rgba(5,150,105,0.3)' : 'rgba(140,20,40,0.25)'}`,
          }}>
            {msg}
          </div>
        )}

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="🔍 ابحث باسم المادة أو وصفها..."
          style={{
            width: '100%', padding: '12px 16px', borderRadius: BRAND.radiusMd,
            border: `1.5px solid ${BRAND.border}`, background: 'rgba(140,20,40,0.04)',
            color: BRAND.text, fontSize: 14, fontFamily: 'inherit', marginBottom: 20,
          }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: BRAND.sub }}>جارٍ تحميل المواد...</div>
        ) : filteredSubjects.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 60, background: BRAND.bgSoft,
            borderRadius: BRAND.radiusLg, border: `1px solid ${BRAND.border}`, color: BRAND.sub,
          }}>
            لا توجد مواد مطابقة. اضغط "＋ مادة جديدة" أو "🌱 تعبئة المنهج الكويتي".
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filteredSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                deleting={deleting}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        <SubjectFormModal
          open={modalOpen}
          form={form}
          editingSubject={editingSubject}
          saving={saving}
          deleting={deleting}
          onClose={onCloseModal}
          onSubmit={onSubmit}
          onChange={onFormChange}
        />
      </div>
    </div>
  )
}
