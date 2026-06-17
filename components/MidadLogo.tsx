// components/MidadLogo.tsx
// شعار منصة مِداد — حرف م + قطرة حبر مضيئة

interface Props {
  size?:    number
  variant?: 'full' | 'icon' | 'text'
  dark?:    boolean
}

export default function MidadLogo({ size = 40, variant = 'full', dark = true }: Props) {
  const iconSize = size
  const textColor = dark ? '#f1f5f9' : '#0f172a'

  const Icon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#1d6fe8" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f9d423" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* الخلفية — مربع مستدير */}
      <rect width="100" height="100" rx="22" fill="url(#grad1)" />

      {/* حرف م — مبسّط هندسياً */}
      <g transform="translate(50,50)" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        {/* القوس العلوي لحرف م */}
        <path d="M -24 8 C -24 -10 -8 -18 0 -18 C 8 -18 24 -10 24 8" />
        {/* الساقان */}
        <line x1="-24" y1="8" x2="-24" y2="20" />
        <line x1="24"  y1="8" x2="24"  y2="20" />
        {/* القاعدة */}
        <line x1="-24" y1="20" x2="-14" y2="20" />
        <line x1="14"  y1="20" x2="24"  y2="20" />
      </g>

      {/* قطرة الحبر المضيئة — أسفل يسار */}
      <g filter="url(#glow)">
        <circle cx="72" cy="72" r="10" fill="url(#grad2)" />
        <circle cx="72" cy="60" r="4"  fill="#fbbf24" opacity="0.9" />
      </g>

      {/* نقاط صغيرة حول القطرة */}
      <circle cx="84" cy="68" r="2.5" fill="#fbbf24" opacity="0.6" />
      <circle cx="68" cy="83" r="2"   fill="#f97316" opacity="0.5" />
    </svg>
  )

  if (variant === 'icon') return <Icon />

  if (variant === 'text') return (
    <div style={{ display:'flex', flexDirection:'column', lineHeight:1 }}>
      <span style={{
        fontSize: size * 0.55, fontWeight: 900, color: textColor,
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
        letterSpacing: 1,
      }}>
        مِداد
      </span>
      <span style={{
        fontSize: size * 0.22, color: 'rgba(148,163,184,0.8)',
        fontWeight: 600, marginTop: 2,
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
      }}>
        العربية بذكاء
      </span>
    </div>
  )

  // full — أيقونة + نص
  return (
    <div style={{ display:'flex', alignItems:'center', gap: size * 0.28 }}>
      <Icon />
      <div style={{ display:'flex', flexDirection:'column', lineHeight:1 }}>
        <span style={{
          fontSize: size * 0.45, fontWeight: 900, color: textColor,
          fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
          letterSpacing: 1,
        }}>
          مِداد
        </span>
        <span style={{
          fontSize: size * 0.2, color: 'rgba(148,163,184,0.7)',
          fontWeight: 600, marginTop: 3,
          fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
        }}>
          العربية بذكاء
        </span>
      </div>
    </div>
  )
}