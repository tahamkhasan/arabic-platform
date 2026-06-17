// components/MidadLogo.tsx

interface Props {
  size?: number
  variant?: 'full' | 'icon' | 'text'
  dark?: boolean
}

export default function MidadLogo({
  size = 40,
  variant = 'full',
  dark = false,
}: Props) {
  const iconSize = size

  const textPrimary = dark ? '#F8F4EE' : '#1F1720'
  const textSecondary = dark ? 'rgba(248,244,238,0.78)' : 'rgba(111,91,91,0.82)'

  const Icon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="midad-bg" x1="8" y1="8" x2="92" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7B1A1A" />
          <stop offset="55%" stopColor="#C0392B" />
          <stop offset="100%" stopColor="#E07A24" />
        </linearGradient>

        <linearGradient id="midad-drop" x1="62" y1="56" x2="82" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F4C95D" />
          <stop offset="100%" stopColor="#E7A93B" />
        </linearGradient>

        <filter id="midad-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="rgba(79,19,19,0.18)" />
        </filter>
      </defs>

      <rect x="6" y="6" width="88" height="88" rx="24" fill="url(#midad-bg)" filter="url(#midad-shadow)" />

      <path
        d="M27 60V43C27 33.5 34.5 27 44 27C49.8 27 54.6 29.2 58 33.3C61.4 29.2 66.2 27 72 27C81.5 27 89 33.5 89 43V60"
        stroke="#FFF9F2"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M27 60H38"
        stroke="#FFF9F2"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M78 60H89"
        stroke="#FFF9F2"
        strokeWidth="7"
        strokeLinecap="round"
      />

      <path
        d="M69.5 63.5C69.5 58.7 73 55 77 55C81 55 84.5 58.7 84.5 63.5C84.5 69.3 79.9 74 77 77.4C74.1 74 69.5 69.3 69.5 63.5Z"
        fill="url(#midad-drop)"
      />

      <circle cx="73.5" cy="61.5" r="1.9" fill="#FFF3D6" opacity="0.95" />
      <circle cx="83.5" cy="71" r="1.8" fill="#F6C768" opacity="0.72" />
      <circle cx="69.5" cy="79.5" r="1.6" fill="#E7A93B" opacity="0.58" />
    </svg>
  )

  if (variant === 'icon') {
    return <Icon />
  }

  if (variant === 'text') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1,
          direction: 'rtl',
        }}
      >
        <span
          style={{
            fontSize: size * 0.56,
            fontWeight: 900,
            color: textPrimary,
            fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
            letterSpacing: 0.2,
          }}
        >
          مِداد
        </span>
        <span
          style={{
            fontSize: size * 0.22,
            color: textSecondary,
            fontWeight: 700,
            marginTop: 5,
            fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
          }}
        >
          العربية بذكاء
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.26,
        direction: 'rtl',
      }}
    >
      <Icon />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontSize: size * 0.46,
            fontWeight: 900,
            color: textPrimary,
            fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
            letterSpacing: 0.2,
            whiteSpace: 'nowrap',
          }}
        >
          مِداد
        </span>

        <span
          style={{
            fontSize: size * 0.2,
            color: textSecondary,
            fontWeight: 700,
            marginTop: 4,
            fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          العربية بذكاء
        </span>
      </div>
    </div>
  )
}