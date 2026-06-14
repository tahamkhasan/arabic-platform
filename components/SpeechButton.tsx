'use client'
import { useState, useEffect, useRef } from 'react'

interface SpeechButtonProps {
  text:        string
  themeColor?: string
}

export default function SpeechButton({
  text,
  themeColor = '#f9d423',
}: SpeechButtonProps) {
  const [isPlaying, setIsPlaying]   = useState(false)
  const [isPaused, setIsPaused]     = useState(false)
  const [supported, setSupported]   = useState(true)
  const [progress, setProgress]     = useState(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const intervalRef  = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSupported(false)
    }
    return () => {
      stopSpeech()
    }
  }, [])

  // إعادة ضبط عند تغيير النص
  useEffect(() => {
    stopSpeech()
  }, [text])

  function cleanText(raw: string): string {
    return raw
      .replace(/[#*_~`>|]/g, '')   // إزالة رموز Markdown
      .replace(/━+/g, '')           // إزالة الخطوط
      .replace(/\n{3,}/g, '\n\n')   // تقليل الأسطر الفارغة
      .trim()
  }

  function startSpeech() {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(cleanText(text))
    utterance.lang  = 'ar-SA'
    utterance.rate  = 0.9
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // اختيار صوت عربي إذا متاح
    const voices = window.speechSynthesis.getVoices()
    const arabicVoice = voices.find(v =>
      v.lang.startsWith('ar') || v.name.toLowerCase().includes('arab')
    )
    if (arabicVoice) utterance.voice = arabicVoice

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
      setProgress(0)
      // محاكاة شريط التقدم
      intervalRef.current = setInterval(() => {
        setProgress(p => Math.min(p + 0.5, 99))
      }, 300)
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setProgress(100)
      if (intervalRef.current) clearInterval(intervalRef.current)
      setTimeout(() => setProgress(0), 1000)
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setIsPaused(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  function pauseSpeech() {
    window.speechSynthesis.pause()
    setIsPaused(true)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  function resumeSpeech() {
    window.speechSynthesis.resume()
    setIsPaused(false)
    intervalRef.current = setInterval(() => {
      setProgress(p => Math.min(p + 0.5, 99))
    }, 300)
  }

  function stopSpeech() {
    window.speechSynthesis?.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setProgress(0)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  if (!supported) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

        {/* زر التشغيل / الإيقاف المؤقت */}
        {!isPlaying ? (
          <button
            onClick={startSpeech}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 10,
              border: `1.5px solid rgba(79,172,254,0.4)`,
              background: 'rgba(79,172,254,0.12)',
              color: '#4facfe', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 16 }}>🔊</span>
            <span>استمع</span>
          </button>
        ) : (
          <>
            {/* إيقاف مؤقت / استئناف */}
            <button
              onClick={isPaused ? resumeSpeech : pauseSpeech}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 10,
                border: `1.5px solid rgba(79,172,254,0.4)`,
                background: 'rgba(79,172,254,0.2)',
                color: '#4facfe', cursor: 'pointer',
                fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 16 }}>{isPaused ? '▶️' : '⏸️'}</span>
              <span>{isPaused ? 'استئناف' : 'إيقاف مؤقت'}</span>
            </button>

            {/* إيقاف كلي */}
            <button
              onClick={stopSpeech}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 10,
                border: '1.5px solid rgba(252,129,129,0.35)',
                background: 'rgba(252,129,129,0.1)',
                color: '#fc8181', cursor: 'pointer',
                fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 16 }}>⏹️</span>
              <span>إيقاف</span>
            </button>
          </>
        )}

        {/* مؤشر التشغيل */}
        {isPlaying && !isPaused && (
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 4, borderRadius: 2,
                background: '#4facfe',
                animation: `soundWave 0.8s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* شريط التقدم */}
      {(isPlaying || progress > 0) && (
        <div style={{ width: '100%', height: 3, background: 'rgba(79,172,254,0.15)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: 'linear-gradient(90deg,#4facfe,#00f2fe)',
            width: `${progress}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      <style>{`
        @keyframes soundWave {
          0%, 100% { height: 8px; }
          50%       { height: 20px; }
        }
      `}</style>
    </div>
  )
}