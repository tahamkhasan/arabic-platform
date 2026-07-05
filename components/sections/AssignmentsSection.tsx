'use client'

import type { CSSProperties } from 'react'
import type { UITheme } from '../teacher.types'
import { Banner } from '../ui/Banner'
import { Field } from '../ui/Field'
import { SectionTitle } from '../ui/SectionTitle'
import { SelectionList } from '../ui/SelectionList'
import { AssignmentCard } from '../cards/AssignmentCard'
import { BRAND } from '@/lib/constants/theme'

export function AssignmentsSection({
  ui,
  sectionCard,
  smallCard,
  inputStyle,
  ghostBtn,
  primaryBtn,
  assignments,
  quizzesList,
  aTitle,
  setATitle,
  aDescription,
  setADescription,
  aQuizId,
  setAQuizId,
  aTarget,
  setATarget,
  aTargetIds,
  setATargetIds,
  aDeadline,
  setADeadline,
  sendingA,
  aDone,
  aError,
  sendAssignment,
  students,
  classes,
}: {
  ui: UITheme
  sectionCard: CSSProperties
  smallCard: CSSProperties
  inputStyle: CSSProperties
  ghostBtn: (active?: boolean) => CSSProperties
  primaryBtn: (enabled?: boolean) => CSSProperties
  assignments: any[]
  quizzesList: any[]
  aTitle: string
  setATitle: (value: string) => void
  aDescription: string
  setADescription: (value: string) => void
  aQuizId: string
  setAQuizId: (value: string) => void
  aTarget: 'all' | 'student' | 'class'
  setATarget: (value: 'all' | 'student' | 'class') => void
  aTargetIds: string[]
  setATargetIds: React.Dispatch<React.SetStateAction<string[]>>
  aDeadline: string
  setADeadline: (value: string) => void
  sendingA: boolean
  aDone: boolean
  aError: string
  sendAssignment: () => void
  students: any[]
  classes: any[]
}) {
  return (
    <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
      <SectionTitle icon="📝" title="إدارة المهام" ui={ui} />
      {aDone ? <Banner type="success" ui={ui} text="تم إرسال المهمة بنجاح." /> : null}
      {aError ? <Banner type="error" ui={ui} text={aError} /> : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="📌 عنوان المهمة" sub={ui.sub}>
          <input
            value={aTitle ?? ''}
            onChange={e => setATitle(e.target.value)}
            placeholder="مثال: واجب النص الأدبي"
            style={inputStyle}
          />
        </Field>

        <Field label="🗒️ وصف مختصر" sub={ui.sub}>
          <input
            value={aDescription ?? ''}
            onChange={e => setADescription(e.target.value)}
            placeholder="وصف أو توجيه قصير للطلاب"
            style={inputStyle}
          />
        </Field>

        <Field label="🧪 اختر الاختبار" sub={ui.sub}>
          <select value={aQuizId ?? ''} onChange={e => setAQuizId(e.target.value)} style={inputStyle}>
            <option value="">-- اختر اختبارًا --</option>
            {quizzesList.map((q: any) => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.questions_count} سؤال)
              </option>
            ))}
          </select>

          {quizzesList.length === 0 ? (
            <p style={{ fontSize: 12, color: ui.sub, marginTop: 6 }}>لا توجد اختبارات منشورة متاحة حاليًا.</p>
          ) : null}
        </Field>

        <Field label="🎯 نوع الاستهداف" sub={ui.sub}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            {[
              ['all', 'الجميع'],
              ['student', 'طلاب محددون'],
              ['class', 'فصول محددة'],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setATarget(val as 'all' | 'student' | 'class')
                  setATargetIds([])
                }}
                style={{ ...ghostBtn(aTarget === val), flex: 1, minWidth: 150 }}
              >
                {label}
              </button>
            ))}
          </div>

          {aTarget === 'student' && (
            <SelectionList
              items={students.map((s: any) => ({ id: s.id, title: s.name, sub: s.email }))}
              selected={aTargetIds}
              onToggle={id =>
                setATargetIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
              }
              ui={ui}
            />
          )}

          {aTarget === 'class' && (
            <SelectionList
              items={classes.map((g: any) => ({
                id: g.id,
                title: g.name,
                sub: `${g.students_count} طالب`,
              }))}
              selected={aTargetIds}
              onToggle={id =>
                setATargetIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
              }
              ui={ui}
            />
          )}

          {(aTarget === 'student' || aTarget === 'class') && aTargetIds.length > 0 && (
            <p style={{ fontSize: 11, color: ui.themeColor, marginTop: 6, fontWeight: 700 }}>
              ✅ تم تحديد {aTargetIds.length} عنصر
            </p>
          )}
        </Field>

        <Field label="⏰ الموعد النهائي (اختياري)" sub={ui.sub}>
          <input
            type="datetime-local"
            value={aDeadline ?? ''}
            onChange={e => setADeadline(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <button
          type="button"
          onClick={sendAssignment}
          disabled={sendingA || !(aTitle ?? '').trim() || !(aQuizId ?? '').trim()}
          style={primaryBtn(Boolean((aTitle ?? '').trim() && (aQuizId ?? '').trim()))}
        >
          {sendingA ? (
            <>
              <span
                style={{
                  width: 18,
                  height: 18,
                  border: '3px solid rgba(255,255,255,0.35)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              جارٍ الإرسال...
            </>
          ) : (
            '📤 إرسال المهمة'
          )}
        </button>
      </div>

      {assignments.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: ui.text,
              marginBottom: 14,
              fontFamily: BRAND.fontHeading,
            }}
          >
            📋 المهام المرسلة ({assignments.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {assignments.map((a: any) => (
              <AssignmentCard key={a.id} assignment={a} ui={ui} cardStyle={smallCard} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}