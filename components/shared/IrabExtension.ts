// ============================================================
// components/shared/IrabExtension.ts
// ============================================================
// Node مخصَّص لـ Tiptap يمثّل "كلمة مُعرَبة" — يُخزَّن كعنصر inline
// داخل المستند (لا مجرّد HTML خام مُلصَق)، فيبقى قابلاً للتحديد
// والحذف والتعديل ضمن قواعد المحرر، ويُحفَظ في HTML بصيغة:
//
//   <span class="irab-word" data-word="الطالبُ" data-irab="مبتدأ
//   مرفوع">الطالبُ<sup class="irab-tag">مبتدأ</sup></span>
//
// التنسيق البصري (الخط المنقَّط + حجم الـsup) في RichTextEditor.tsx
// عبر CSS عام، لا داخل هذا الملف — فصل المنطق عن المظهر.
// ============================================================

import { Node, mergeAttributes } from '@tiptap/core'

export interface IrabOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    irab: {
      /** يُدرج كلمة مُعرَبة في موضع المؤشر الحالي */
      insertIrabWord: (attrs: { word: string; irab: string; mark?: string }) => ReturnType
    }
  }
}

export const IrabExtension = Node.create<IrabOptions>({
  name: 'irabWord',
  group: 'inline',
  inline: true,
  atom: true, // وحدة واحدة غير قابلة للتفكيك أثناء التحرير (كالصور)

  addOptions() {
    return { HTMLAttributes: {} }
  },

  addAttributes() {
    return {
      word: { default: '' },
      irab: { default: '' },
      mark: { default: '' }, // علامة الإعراب الاختيارية (مثل "الضمة الظاهرة")
    }
  },

  parseHTML() {
    return [{ tag: 'span.irab-word' }]
  },

  renderHTML({ node, HTMLAttributes }: { node: any; HTMLAttributes: Record<string, any> }) {
    const { word, irab, mark } = node.attrs
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'irab-word',
        'data-word': word,
        'data-irab': irab,
        'data-mark': mark || '',
        title: mark ? `${irab} — ${mark}` : irab, // تلميح عند التمرير بالماوس
      }),
      word,
      ['sup', { class: 'irab-tag' }, irab],
    ]
  },

  addCommands() {
    return {
      insertIrabWord:
        (attrs: { word: string; irab: string; mark?: string }) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
    }
  },
})