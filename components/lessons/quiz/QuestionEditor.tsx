'use client'

import { BRAND } from '@/lib/constants/theme'
import dynamic from 'next/dynamic'
 
     // dynamic import بدون SSR — يمنع تحميل Tiptap في كل صفحة لا
     // تستخدمه، ويحل مشاكل hydration المعروفة مع محررات WYSIWYG
     const RichTextEditor = dynamic(() => import('@/components/shared/RichTextEditor'), {
       ssr: false,
       loading: () => (
         <div style={{ padding: 12, fontSize: 13, color: BRAND.sub, border: `1px solid ${BRAND.border}`, borderRadius: 12 }}>
           ⏳ جارٍ تحميل المحرر...
         </div>
       ),
     })

import type { QuizQuestion } from '@/types/lesson-quiz'

type Props = {
  index: number
  question: QuizQuestion
  onChange: (patch: Partial<QuizQuestion>) => void
  onRemove: () => void
}

const TYPE_LABELS: Record<QuizQuestion['type'], string> = {
  multiple: 'اختيار من متعدد',
  truefalse: 'صح / خطأ',
  fill: 'تكملة',
}

export default function QuestionEditor({ index, question, onChange, onRemove }: Props) {
  function handleTypeChange(type: QuizQuestion['type']) {
    if (type === 'multiple') {
      onChange({
        type,
        options: question.options?.length ? question.options : ['', '', '', ''],
        correct: 0,
      })
    } else if (type === 'truefalse') {
      onChange({ type, options: undefined, correct: true })
    } else {
      onChange({ type, options: undefined, correct: '' })
    }
  }

  return (
    <div
      style={{
        border: `1px solid ${BRAND.border}`,
        borderRadius: BRAND.radiusMd,
        padding: 16,
        marginBottom: 14,
        background: BRAND.bgCard,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 14, color: BRAND.text, fontFamily: BRAND.fontBody }}>السؤال {index + 1}</strong>
        <button
          type="button"
          onClick={onRemove}
          style={{ border: 'none', background: 'transparent', color: BRAND.crimson, cursor: 'pointer', fontSize: 14, fontWeight: BRAND.weightBold, fontFamily: BRAND.fontBody }}
        >
          🗑️ حذف
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['multiple', 'truefalse', 'fill'] as const).map(t => {
          const active = question.type === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              style={{
                padding: '6px 12px',
                borderRadius: BRAND.radiusPill,
                fontSize: 13,
                cursor: 'pointer',
                border: active ? `1px solid ${BRAND.crimson}` : `1px solid ${BRAND.border}`,
                background: active ? 'rgba(140,20,40,0.08)' : 'transparent',
                color: active ? BRAND.crimson : BRAND.sub,
                fontWeight: active ? BRAND.weightBold : BRAND.weightRegular,
                fontFamily: BRAND.fontBody,
              }}
            >
              {TYPE_LABELS[t]}
            </button>
          )
        })}
      </div>

      <textarea
        value={question.question}
        onChange={e => onChange({ question: e.target.value })}
        placeholder="نص السؤال..."
        rows={2}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: BRAND.radiusSm,
          border: `1px solid ${BRAND.border}`,
          fontFamily: BRAND.fontBody,
          fontSize: 14,
          marginBottom: 10,
          resize: 'vertical',
          color: BRAND.text,
          background: '#fff',
        }}
      />

      {question.type === 'multiple' && (
        <div style={{ marginBottom: 10 }}>
          {(question.options || []).map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correct === i}
                onChange={() => onChange({ correct: i })}
              />
              <input
                value={opt}
                onChange={e => {
                  const next = [...(question.options || [])]
                  next[i] = e.target.value
                  onChange({ options: next })
                }}
                placeholder={`الخيار ${i + 1}`}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: BRAND.radiusSm,
                  border: `1px solid ${BRAND.border}`,
                  fontFamily: BRAND.fontBody,
                  fontSize: 13,
                  color: BRAND.text,
                }}
              />
            </div>
          ))}
          <p style={{ fontSize: 12, color: BRAND.sub, margin: '4px 0 0' }}>✓ حدد الدائرة بجانب الإجابة الصحيحة</p>
        </div>
      )}

      {question.type === 'truefalse' && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: BRAND.text, fontFamily: BRAND.fontBody }}>
            <input
              type="radio"
              name={`tf-${question.id}`}
              checked={question.correct === true}
              onChange={() => onChange({ correct: true })}
            />
            ✅ صحيحة
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: BRAND.text, fontFamily: BRAND.fontBody }}>
            <input
              type="radio"
              name={`tf-${question.id}`}
              checked={question.correct === false}
              onChange={() => onChange({ correct: false })}
            />
            ❌ خاطئة
          </label>
        </div>
      )}

      {question.type === 'fill' && (
        <input
          value={typeof question.correct === 'string' ? question.correct : ''}
          onChange={e => onChange({ correct: e.target.value })}
          placeholder="الإجابة الصحيحة للتكملة..."
          style={{
            width: '100%',
            padding: 8,
            borderRadius: BRAND.radiusSm,
            border: `1px solid ${BRAND.border}`,
            fontFamily: BRAND.fontBody,
            fontSize: 13,
            marginBottom: 10,
            color: BRAND.text,
          }}
        />
      )}

       <div>
       <label style={{ fontSize: 12, fontWeight: 700, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
         شرح الإجابة الصحيحة
       </label>
       <RichTextEditor
         content={question.explanation || ''}
         onChange={(html) => onChange({ explanation: html })}
         placeholder="شرح الإجابة الصحيحة... (يمكنك استخدام أداة الإعراب 📐)"
         toolbar="minimal"
         maxHeight="160px"
       />
     </div>
 
    </div>
  )
}
