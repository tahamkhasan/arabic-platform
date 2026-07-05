'use client'
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

  // ── الجيولوجيا / علم الأرض ─────────────────────────────────
  if (n.includes('جيولوج') || n.includes('صخور') || n.includes('الأرض'))
    return 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=80&auto=format&fit=crop'

  // ── علم النفس والاجتماع ────────────────────────────────────
  if (n.includes('نفس') || n.includes('اجتماع'))
    return 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80&auto=format&fit=crop'

  // ── الفلسفة ────────────────────────────────────────────────
  if (n.includes('فلسف'))
    return 'https://images.unsplash.com/photo-1495465798138-718f86d1a4bc?w=800&q=80&auto=format&fit=crop'

  // ── الإحصاء ───────────────────────────────────────────────
  if (n.includes('إحصاء') || n.includes('احصاء'))
    return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop'

  // ── التاريخ الإسلامي / تاريخ الكويت / تاريخ العالم ────────
  if (n.includes('تاريخ'))
    return 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&q=80&auto=format&fit=crop'

  // ── الجغرافيا / قضايا البيئة / الاقتصاد ───────────────────
  if (n.includes('جغراف') || n.includes('بيئة') || n.includes('اقتصاد') || n.includes('تنمية'))
    return 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80&auto=format&fit=crop'

  // ── الاجتماعيات (تاريخ + جغرافيا معاً) ────────────────────
  if (n.includes('اجتماعيات'))
    return 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80&auto=format&fit=crop'

  // ── القرآن الكريم / التربية الإسلامية ──────────────────────
  if (n.includes('قرآن') || n.includes('إسلام') || n.includes('اسلام'))
    return 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&q=80&auto=format&fit=crop'

  // ── اللغة الفرنسية ─────────────────────────────────────────
  if (n.includes('فرنس') || n.includes('french'))
    return 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80&auto=format&fit=crop'

  // ── اللغة الإنجليزية ───────────────────────────────────────
  if (n.includes('إنجليز') || n.includes('انجليز') || n.includes('english'))
    return 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=80&auto=format&fit=crop'

  // ── اللغة العربية / الأدب العربي ───────────────────────────
  if (n.includes('عرب') || n.includes('أدب'))
    return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80&auto=format&fit=crop'

  // ── الرياضيات ──────────────────────────────────────────────
  if (n.includes('رياض') || n.includes('حساب') || n.includes('math'))
    return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80&auto=format&fit=crop'

  // ── الفيزياء ───────────────────────────────────────────────
  if (n.includes('فيزياء') || n.includes('physics'))
    return 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&q=80&auto=format&fit=crop'

  // ── الكيمياء ───────────────────────────────────────────────
  if (n.includes('كيمياء') || n.includes('chem'))
    return 'https://images.unsplash.com/photo-1532094349884-543559059c4a?w=800&q=80&auto=format&fit=crop'

  // ── الأحياء / البيولوجيا ───────────────────────────────────
  if (n.includes('أحياء') || n.includes('biology') || n.includes('بيولوج'))
    return 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=800&q=80&auto=format&fit=crop'

  // ── العلوم (ابتدائي/متوسط — مادة عامة تشمل فيزياء+كيمياء+أحياء)
  if (n.includes('علوم') || n.includes('science'))
    return 'https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=800&q=80&auto=format&fit=crop'

  // ── الحاسب / التقنية ───────────────────────────────────────
  if (n.includes('حاسب') || n.includes('تقني') || n.includes('computer'))
    return 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80&auto=format&fit=crop'

  // ── افتراضي ────────────────────────────────────────────────
  return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80&auto=format&fit=crop'
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
        <img
          src={getSubjectImage(subject.name)}
          alt={subject.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {subject.icon && (
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
