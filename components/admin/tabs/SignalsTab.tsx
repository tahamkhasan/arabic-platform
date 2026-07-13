'use client'
import { BRAND } from '@/lib/constants/theme'
import { T, sectionCard } from '../adminTheme'
import type { PlatformSignal, SignalEvidenceStudent, SignalEvidenceTeacher } from '@/types/admin.types'

interface SignalsTabProps {
  signals: PlatformSignal[]
  signalsLoading: boolean
  resolvingSignalId: string | null
  onResolve: (id: string, status: 'dismissed' | 'action_taken') => void
}

export default function SignalsTab({ signals, signalsLoading, resolvingSignalId, onResolve }: SignalsTabProps) {
  return (
    <div className="fade-in" style={sectionCard}>
      <h2 style={{ fontSize: 22, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.crimson, margin: '0 0 8px' }}>
        🔔 إشارات تستحق المراجعة
      </h2>
      <p style={{ fontSize: 13, color: T.subCol, margin: '0 0 20px' }}>
        رصد آلي فقط — لا فعل تلقائي. اختر تجاهل أو تم التدخل بعد المراجعة.
      </p>

      {signalsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: T.subCol }}>⏳ جارٍ رصد الإشارات...</div>
      ) : signals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.72)', borderRadius: BRAND.radiusMd, border: `1px solid ${T.borderCol}`, color: T.subCol }}>
          ✅ لا توجد إشارات حالياً — كل شيء يبدو طبيعياً
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {signals.map(sig => {
            const isResolving = resolvingSignalId === sig.id
            const isStudentSignal = sig.signal_type === 'student_struggling'
            const ev = sig.evidence as any

            return (
              <div
                key={sig.id}
                style={{
                  padding: '16px 18px',
                  borderRadius: BRAND.radiusMd,
                  background: 'rgba(255,255,255,0.72)',
                  border: `1.5px solid ${isStudentSignal ? 'rgba(220,100,40,0.3)' : 'rgba(140,20,40,0.3)'}`,
                  boxShadow: T.shadow,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: BRAND.weightBold, color: T.textCol }}>
                    {isStudentSignal ? '⚠️ تعثّر طلابي' : '🐢 معدّل استجابة بطيء'}
                  </div>
                  <span style={{ fontSize: 11, color: T.subCol }}>
                    {new Date(sig.created_at).toLocaleDateString('ar-KW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isStudentSignal ? (
                  <div style={{ fontSize: 13, color: T.textCol, lineHeight: 1.8, marginBottom: 14 }}>
                    <div style={{ marginBottom: 6 }}>
                      🏫 الفصل: <strong>{(ev as SignalEvidenceStudent).class_name}</strong> • المعلم:{' '}
                      <strong>{(ev as SignalEvidenceStudent).teacher_name}</strong>
                    </div>
                    {(ev as SignalEvidenceStudent).signals.map((s, i) => (
                      <div key={i} style={{ fontSize: 13, color: T.subCol, marginTop: 4 }}>
                        — {s.affected_count} طلاب ({s.affected_student_names.join('، ')}) أخطؤوا مراراً في <strong>{s.area_label}</strong>،
                        متوسط دقتهم {s.avg_accuracy}٪
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: T.textCol, lineHeight: 1.8, marginBottom: 14 }}>
                    المعلم <strong>{(ev as SignalEvidenceTeacher).teacher_name}</strong> متوسط استجابته{' '}
                    <strong>{(ev as SignalEvidenceTeacher).avg_response_hours} ساعة</strong> (المتوسط العام:{' '}
                    {(ev as SignalEvidenceTeacher).overall_avg_hours} ساعة — أبطأ بـ{(ev as SignalEvidenceTeacher).ratio}× تقريباً، بناءً على{' '}
                    {(ev as SignalEvidenceTeacher).graded_count} سؤالاً مصحَّحاً)
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    disabled={isResolving}
                    onClick={() => onResolve(sig.id, 'dismissed')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: `1px solid ${T.borderCol}`,
                      background: 'transparent',
                      color: T.subCol,
                      fontWeight: BRAND.weightBold,
                      fontSize: 12,
                      cursor: isResolving ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    تجاهل
                  </button>
                  <button
                    disabled={isResolving}
                    onClick={() => onResolve(sig.id, 'action_taken')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'rgba(140,20,40,0.14)',
                      color: BRAND.crimson,
                      fontWeight: BRAND.weightBold,
                      fontSize: 12,
                      cursor: isResolving ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {isResolving ? '...' : '✅ تم التدخل'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}