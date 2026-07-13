'use client'
import { useState } from 'react'
import { BRAND } from '@/lib/constants/theme'

export type StudentSubject = {
  id: string
  name: string
  icon?: string | null
  teacherName: string | null
  unitsCount: number
}

const UNITS_BADGE_COLOR = '#2563EB'

// ── صور مميزة لكل مادة في المنهج الكويتي (ابتدائي/متوسط/ثانوي) ──
// الترتيب مهم: المواد الأكثر تحديداً تُطابَق أولاً قبل العامة
function getSubjectImage(name: string): string {
  const n = name.trim().toLowerCase()

  if (n.includes('جيولوج') || n.includes('صخور') || n.includes('الأرض'))
    return 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=80&auto=format&fit=crop'

  if (n.includes('نفس') || n.includes('اجتماع'))
    return 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80&auto=format&fit=crop'

  if (n.includes('فلسف'))
    return 'https://images.unsplash.com/photo-1495465798138-718f86d1a4bc?w=800&q=80&auto=format&fit=crop'

  if (n.includes('إحصاء') || n.includes('احصاء'))
    return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop'

  if (n.includes('تاريخ'))
    return 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&q=80&auto=format&fit=crop'

  if (n.includes('جغراف') || n.includes('بيئة') || n.includes('اقتصاد') || n.includes('تنمية'))
    return 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80&auto=format&fit=crop'

  if (n.includes('اجتماعيات'))
    return 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80&auto=format&fit=crop'

  if (n.includes('قرآن') || n.includes('إسلام') || n.includes('اسلام'))
    return 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&q=80&auto=format&fit=crop'

  if (n.includes('فرنس') || n.includes('french'))
    return 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80&auto=format&fit=crop'

  if (n.includes('إنجليز') || n.includes('انجليز') || n.includes('english'))
    return 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=80&auto=format&fit=crop'

  if (n.includes('عرب') || n.includes('أدب'))
    return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80&auto=format&fit=crop'

  if (n.includes('رياض') || n.includes('حساب') || n.includes('math'))
    return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80&auto=format&fit=crop'

  if (n.includes('فيزياء') || n.includes('physics'))
    return 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&q=80&auto=format&fit=crop'

  if (n.includes('كيمياء') || n.includes('chem'))
    return 'https://images.unsplash.com/photo-1532094349884-543559059c4a?w=800&q=80&auto=format&fit=crop'

  if (n.includes('أحياء') || n.includes('biology') || n.includes('بيولوج'))
    return 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=800&q=80&auto=format&fit=crop'

  if (n.includes('علوم') || n.includes('science'))
    return 'https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=800&q=80&auto=format&fit=crop'

  if (n.includes('حاسب') || n.includes('تقني') || n.includes('computer'))
    return 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80&auto=format&fit=crop'

  return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80&auto=format&fit=crop'
}

// ── ألوان بديلة (Gradient) تُستخدَم فقط إن فشل تحميل الصورة الحقيقية —
// بلا أي اعتماد على خادم خارجي، فلا يمكن أن تتعطّل مستقبلاً ──────────
function getFallbackGradient(name: string): string {
  const n = name.trim().toLowerCase()

  if (n.includes('كيمياء') || n.includes('chem'))
    return 'linear-gradient(135deg, #7C3AED, #2563EB)'
  if (n.includes('فيزياء') || n.includes('physics'))
    return 'linear-gradient(135deg, #2563EB, #059669)'
  if (n.includes('أحياء') || n.includes('biology'))
    return 'linear-gradient(135deg, #059669, #84CC16)'
  if (n.includes('رياض') || n.includes('حساب') || n.includes('math'))
    return 'linear-gradient(135deg, #EA580C, #D97706)'
  if (n.includes('عرب') || n.includes('أدب'))
    return `linear-gradient(135deg, ${BRAND.crimson}, ${BRAND.deep})`
  if (n.includes('إنجليز') || n.includes('انجليز') || n.includes('english'))
    return 'linear-gradient(135deg, #2563EB, #1D4ED8)'
  if (n.includes('قرآن') || n.includes('إسلام') || n.includes('اسلام'))
    return 'linear-gradient(135deg, #059669, #047857)'

  return `linear-gradient(135deg, ${BRAND.deep}, ${BRAND.crimson})`
}

export default function SubjectCard({
  subject,
  accentColor,
  onClick,
}: {
  subject: StudentSubject
  accentColor: string
  onClick: () => void
}) {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'right',
        padding: 0,
        borderRadius: 22,
        overflow: 'hidden',
        border: `1px solid ${BRAND.border}`,
        background: BRAND.bgSoft,
        boxShadow: BRAND.shadowWarm,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ height: 130, overflow: 'hidden', position: 'relative' }}>
        {imgFailed ? (
          // ── الحالة البديلة عند فشل تحميل الصورة — تدرّج لوني ثابت
          // بلا أي طلب شبكة، فلا يمكن أن يفشل بدوره ──────────────
          <div
            style={{
              width: '100%',
              height: '100%',
              background: getFallbackGradient(subject.name),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
            }}
          >
            {subject.icon || '📘'}
          </div>
        ) : (
          <img
            src={getSubjectImage(subject.name)}
            alt={subject.name}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        {subject.icon && !imgFailed && (
          <span style={{
            position: 'absolute', bottom: 8, right: 8, fontSize: 26,
            background: 'rgba(255,255,255,0.85)', borderRadius: 12, padding: '4px 8px',
          }}>
            {subject.icon}
          </span>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{
          fontSize: 16, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading,
          color: BRAND.text, marginBottom: 6,
        }}>
          {subject.name}
        </div>
        {subject.teacherName && (
          <div style={{ fontSize: 12, color: BRAND.sub, marginBottom: 4 }}>
            👨‍🏫 {subject.teacherName}
          </div>
        )}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12,
          fontWeight: BRAND.weightBold, color: UNITS_BADGE_COLOR,
          background: `${UNITS_BADGE_COLOR}10`, borderRadius: 999, padding: '4px 10px',
        }}>
          📖 {subject.unitsCount} وحدة
        </div>
      </div>
    </button>
  )
}