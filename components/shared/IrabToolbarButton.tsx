'use client'

// ============================================================
// components/shared/IrabToolbarButton.tsx
// ============================================================
// زر "إعراب" في شريط أدوات RichTextEditor — يفتح نافذة منبثقة
// صغيرة (popover) تحت الزر مباشرة بثلاثة حقول (كلمة، إعراب، علامة
// إعراب اختيارية)، ثم يُدرج عبر أمر Tiptap المخصَّص insertIrabWord.
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { BRAND } from '@/lib/constants/theme'

export default function IrabToolbarButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const [irab, setIrab] = useState('')
  const [mark, setMark] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // إغلاق النافذة عند الضغط خارجها
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleInsert() {
    if (!word.trim() || !irab.trim()) return
    editor.chain().focus().insertIrabWord({ word: word.trim(), irab: irab.trim(), mark: mark.trim() }).run()
    setWord('')
    setIrab('')
    setMark('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        title="إدراج إعراب"
        style={{
          height: 32,
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          borderRadius: 6,
          border: 'none',
          background: open ? `${BRAND.deep}18` : 'transparent',
          color: open ? BRAND.deep : BRAND.sub,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: BRAND.fontBody,
        }}
      >
        📐 إعراب
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 38,
            insetInlineStart: 0,
            zIndex: 50,
            width: 240,
            background: '#fff',
            border: `1.5px solid ${BRAND.border}`,
            borderRadius: 12,
            boxShadow: BRAND.shadow,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: BRAND.sub, display: 'block', marginBottom: 4 }}>
                الكلمة *
              </label>
              <input
                value={word}
                onChange={e => setWord(e.target.value)}
                placeholder="مثال: الطالبُ"
                autoFocus
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: 8,
                  border: `1px solid ${BRAND.border}`, fontSize: 13,
                  fontFamily: BRAND.fontBody, color: BRAND.text,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: BRAND.sub, display: 'block', marginBottom: 4 }}>
                الإعراب *
              </label>
              <input
                value={irab}
                onChange={e => setIrab(e.target.value)}
                placeholder="مثال: مبتدأ مرفوع"
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: 8,
                  border: `1px solid ${BRAND.border}`, fontSize: 13,
                  fontFamily: BRAND.fontBody, color: BRAND.text,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: BRAND.sub, display: 'block', marginBottom: 4 }}>
                علامة الإعراب (اختياري)
              </label>
              <input
                value={mark}
                onChange={e => setMark(e.target.value)}
                placeholder="مثال: الضمة الظاهرة"
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: 8,
                  border: `1px solid ${BRAND.border}`, fontSize: 13,
                  fontFamily: BRAND.fontBody, color: BRAND.text,
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleInsert}
              disabled={!word.trim() || !irab.trim()}
              style={{
                marginTop: 4, padding: '8px', borderRadius: 8, border: 'none',
                background: (!word.trim() || !irab.trim()) ? BRAND.border : BRAND.gradMain,
                color: '#fff', fontWeight: 800, fontSize: 13,
                cursor: (!word.trim() || !irab.trim()) ? 'not-allowed' : 'pointer',
                fontFamily: BRAND.fontBody,
              }}
            >
              إدراج
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
