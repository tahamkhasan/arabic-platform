'use client'
import { BRAND } from '@/lib/constants/theme'
import { T, Empty, SectionCard } from '../studentTheme'
import type { Media } from '@/types/student.types'

interface MediaTabProps {
  media: Media[]
  onOpenMedia: (m: Media) => void
}

export default function MediaTab({ media, onOpenMedia }: MediaTabProps) {
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <SectionCard title="الوسائط التعليمية" sub="مرئيات ومواد صوتية من المعلم" icon="🎥" accent={BRAND.orange}>
        {media.length === 0 ? (
          <Empty icon="🎥" title="لا توجد وسائط حالياً" sub="عند إضافة وسائط جديدة من المعلم ستظهر هنا." />
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {media.map(item => (
              <div
                key={item.id}
                style={{
                  background: T.cardBg,
                  border: `1px solid ${T.borderCol}`,
                  borderRadius: 22,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  boxShadow: T.shadowCard,
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: T.titleCol, marginBottom: 6, fontFamily: T.fontHeading }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 13, color: T.subCol, lineHeight: 1.9 }}>
                    {item.type === 'video' ? 'محتوى مرئي' : 'محتوى صوتي'} • {item.link_type}
                  </div>
                </div>

                <button
                  onClick={() => onOpenMedia(item)}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 16,
                    border: 'none',
                    background: T.gradMain,
                    color: '#fff',
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontFamily: T.fontBody,
                  }}
                >
                  فتح الوسائط
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}