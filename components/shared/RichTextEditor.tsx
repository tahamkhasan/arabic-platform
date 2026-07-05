'use client'

// ============================================================
// components/shared/RichTextEditor.tsx
// ============================================================
// محرر نصوص غني مبني على Tiptap، بهوية بصرية مِداد (BRAND)، مع
// أداة "إعراب" مخصَّصة لا توجد في أي محرر نصوص عام تجارياً —
// تُدرج وسماً نحوياً منسَّقاً بصرياً (خط منقَّط أسفل الكلمة + تلميح
// صغير لنوع الإعراب فوقها)، يخدم طبيعة مِداد العربية النحوية.
//
// أول استخدام فعلي: حقل "شرح الإجابة" في
// components/lessons/quiz/QuestionEditor.tsx (اختبار مصغَّر داخل
// الدرس، نظام مستقل تماماً عن باني الاختبارات الرئيسي بـ8 أنواع).
//
// يُستورَد دائماً عبر dynamic import (ssr: false) في أي صفحة
// تستخدمه — لا يُحمَّل Tiptap إلا عند فتح المحرر فعلياً، تجنّباً
// لزيادة حجم كل صفحة لا تحتاجه.
// ============================================================

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useState } from 'react'
import { BRAND } from '@/lib/constants/theme'
import { IrabExtension } from './IrabExtension'
import IrabToolbarButton from './IrabToolbarButton'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  readOnly?: boolean
  placeholder?: string
  maxHeight?: string
  toolbar?: 'full' | 'minimal'
}

// ── شريط أدوات بسيط بأقل عدد أزرار ضرورية فقط (toolbar='minimal') —
// كافٍ تماماً لحقل "شرح الإجابة"، لا حاجة لجداول/صور في هذا الموضع
// الأول. يمكن توسيعه لـ'full' لاحقاً عند نقل المحرر لمواضع أخرى ──
function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        border: 'none',
        background: active ? `${BRAND.deep}18` : 'transparent',
        color: active ? BRAND.deep : BRAND.sub,
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: active ? 800 : 600,
        fontFamily: BRAND.fontBody,
      }}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor, mode }: { editor: Editor; mode: 'full' | 'minimal' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '6px 8px',
        background: '#F7F2EA',
        borderBottom: `1px solid ${BRAND.border}`,
        borderRadius: '12px 12px 0 0',
        flexWrap: 'wrap',
      }}
    >
      <ToolbarButton title="عريض" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton title="مائل" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton title="تسطير" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span style={{ textDecoration: 'underline' }}>U</span>
      </ToolbarButton>

      <div style={{ width: 1, height: 20, background: BRAND.border, margin: '0 4px' }} />

      <ToolbarButton title="قائمة نقطية" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        •≡
      </ToolbarButton>
      <ToolbarButton title="قائمة مرقّمة" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </ToolbarButton>

      <div style={{ width: 1, height: 20, background: BRAND.border, margin: '0 4px' }} />

      {/* ── أداة الإعراب المخصَّصة — الميزة الأهم في هذا المحرر ── */}
      <IrabToolbarButton editor={editor} />

      {mode === 'full' && (
        <>
          <div style={{ width: 1, height: 20, background: BRAND.border, margin: '0 4px' }} />
          <ToolbarButton title="محاذاة يمين" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            ⇥
          </ToolbarButton>
          <ToolbarButton title="محاذاة وسط" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            ↔
          </ToolbarButton>
        </>
      )}
    </div>
  )
}

export default function RichTextEditor({
  content,
  onChange,
  readOnly = false,
  placeholder = 'اكتب هنا...',
  maxHeight = '240px',
  toolbar = 'minimal',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: toolbar === 'full' ? undefined : false, // لا عناوين في الوضع المبسَّط
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      IrabExtension, // ── الإضافة المخصَّصة لأداة الإعراب ──
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    // مهم: يمنع خطأ "SSR hydration mismatch" الشائع مع Tiptap في Next.js
    immediatelyRender: false,
  })

  if (!editor) return null

  return (
    <div
      dir="rtl"
      style={{
        border: `1px solid ${BRAND.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <style>{`
        /* ── تنسيق بصري لأداة الإعراب — خط منقَّط + تلميح صغير ──
        لا يوجد محرر نصوص تجاري يحتوي هذا التنسيق، هوية مِداد فريدة ── */
        .irab-word {
          position: relative;
          border-bottom: 2px dotted ${BRAND.crimson};
          cursor: help;
          padding-bottom: 1px;
        }
        .irab-tag {
          font-size: 0.65em;
          color: ${BRAND.deep};
          font-weight: normal;
          margin-inline-start: 4px;
          vertical-align: super;
        }
        .ProseMirror {
          padding: 12px 14px;
          font-family: ${BRAND.fontBody};
          font-size: 14px;
          color: ${BRAND.text};
          min-height: 60px;
          max-height: ${maxHeight};
          overflow-y: auto;
          outline: none;
        }
        .ProseMirror p { margin: 0 0 8px; }
        .ProseMirror p:last-child { margin-bottom: 0; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: ${BRAND.sub};
          float: right;
          pointer-events: none;
          height: 0;
        }
      `}</style>
      {!readOnly && <Toolbar editor={editor} mode={toolbar} />}
      <EditorContent editor={editor} />
    </div>
  )
}
