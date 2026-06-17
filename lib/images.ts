// lib/images.ts — مكتبة الصور المجانية من Unsplash

export const IMAGES = {
  // ── صفحة الدخول ───────────────────────────────────────────
  loginBg: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=80&auto=format&fit=crop',
  // كتاب مفتوح مع إضاءة دافئة

  // ── المواد الدراسية ────────────────────────────────────────
  subjects: {
    arabic:   'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&q=80&auto=format&fit=crop',
    // كتاب عربي قديم
    quran:    'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&q=80&auto=format&fit=crop',
    // قرآن كريم
    literature:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop',
    // أدب وكتب
    default:  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80&auto=format&fit=crop',
    // كتب عامة
  },

  // ── أدوات التعلم ───────────────────────────────────────────
  tools: {
    explain:    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80&auto=format&fit=crop',
    // معلم يشرح
    worksheet:  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80&auto=format&fit=crop',
    // ورقة عمل وقلم
    quiz:       'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&q=80&auto=format&fit=crop',
    // اختبار
    flashcards: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80&auto=format&fit=crop',
    // بطاقات تعليمية
    game:       'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=400&q=80&auto=format&fit=crop',
    // لعبة تعليمية
    pptx:       'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80&auto=format&fit=crop',
    // عرض تقديمي
  },

  // ── لوحات الأدوار ─────────────────────────────────────────
  roles: {
    teacher:  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80&auto=format&fit=crop',
    // معلم في الفصل
    student:  'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&q=80&auto=format&fit=crop',
    // طالب يذاكر
    admin:    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&q=80&auto=format&fit=crop',
    // إدارة
  },

  // ── خلفيات ────────────────────────────────────────────────
  backgrounds: {
    pattern: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=60&auto=format&fit=crop',
    // نمط هندسي
    library: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&q=60&auto=format&fit=crop',
    // مكتبة
  }
}

// دالة مساعدة لاختيار صورة المادة
export function getSubjectImage(subjectName: string): string {
  const name = subjectName.toLowerCase()
  if (name.includes('عرب') || name.includes('لغة')) return IMAGES.subjects.arabic
  if (name.includes('قرآن') || name.includes('تجويد') || name.includes('إسلام')) return IMAGES.subjects.quran
  if (name.includes('أدب') || name.includes('نص')) return IMAGES.subjects.literature
  return IMAGES.subjects.default
}