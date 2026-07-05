import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'

// ── دوال مساعدة ──────────────────────────────────────────────
function perGrade(name: string, icon: string, stage: string, grade: string) {
  return { name, icon, offerings: [{ stage, grade, track: null as null }] }
}
function scientificOnly(name: string, icon: string, grade: string) {
  return { name, icon, offerings: [{ stage: 'secondary', grade, track: 'scientific' as const }] }
}
function literaryOnly(name: string, icon: string, grade: string) {
  return { name, icon, offerings: [{ stage: 'secondary', grade, track: 'literary' as const }] }
}
function sharedTracks(name: string, icon: string, grade: string) {
  return {
    name, icon,
    offerings: [
      { stage: 'secondary', grade, track: 'scientific' as const },
      { stage: 'secondary', grade, track: 'literary'   as const },
    ],
  }
}

// ══════════════════════════════════════════════════════════════
// المنهج الكويتي الكامل — مادة مستقلة لكل صف
// الاستثناء الوحيد: المواد المشتركة بين علمي وأدبي في نفس الصف
// ══════════════════════════════════════════════════════════════
const KUWAIT_SUBJECTS = [

  // ── الابتدائي: صفوف 1-5 (مادة منفصلة لكل صف) ────────────────
  ...(['1','2','3','4','5'] as const).flatMap(g => [
    perGrade('اللغة العربية',      '📖', 'primary', g),
    perGrade('اللغة الإنجليزية',   '🇬🇧', 'primary', g),
    perGrade('التربية الإسلامية',   '🕌', 'primary', g),
    perGrade('الرياضيات',          '🔢', 'primary', g),
    perGrade('العلوم',              '🔬', 'primary', g),
    perGrade('الاجتماعيات',        '🗺️', 'primary', g),
  ]),

  // ── المتوسط: صفوف 6-9 (مادة منفصلة لكل صف) ─────────────────
  ...(['6','7','8','9'] as const).flatMap(g => [
    perGrade('اللغة العربية',      '📖', 'middle', g),
    perGrade('اللغة الإنجليزية',   '🇬🇧', 'middle', g),
    perGrade('التربية الإسلامية',   '🕌', 'middle', g),
    perGrade('الرياضيات',          '🔢', 'middle', g),
    perGrade('العلوم',              '🔬', 'middle', g),
    perGrade('الاجتماعيات',        '🗺️', 'middle', g),
  ]),

  // ── الثانوي الصف العاشر (بلا تشعيب) ─────────────────────────
  perGrade('اللغة العربية',                    '📖', 'secondary', '10'),
  perGrade('اللغة الإنجليزية',                 '🇬🇧', 'secondary', '10'),
  perGrade('التربية الإسلامية والقرآن الكريم', '📿', 'secondary', '10'),
  perGrade('الرياضيات',                        '🔢', 'secondary', '10'),
  perGrade('الفيزياء',                         '⚛️', 'secondary', '10'),
  perGrade('الكيمياء',                         '🧪', 'secondary', '10'),
  perGrade('الأحياء',                          '🌿', 'secondary', '10'),
  perGrade('تاريخ الكويت',                     '🏛️', 'secondary', '10'),

  // ── الحادي عشر: مشتركة بين التشعيبين ────────────────────────
  sharedTracks('اللغة العربية',                    '📖', '11'),
  sharedTracks('اللغة الإنجليزية',                 '🇬🇧', '11'),
  sharedTracks('التربية الإسلامية والقرآن الكريم', '📿', '11'),

  // ── الحادي عشر علمي فقط ──────────────────────────────────────
  scientificOnly('الرياضيات', '🔢', '11'),
  scientificOnly('الفيزياء',  '⚛️', '11'),
  scientificOnly('الكيمياء',  '🧪', '11'),
  scientificOnly('الأحياء',   '🌿', '11'),
  scientificOnly('الجيولوجيا','🪨', '11'),

  // ── الحادي عشر أدبي فقط ──────────────────────────────────────
  literaryOnly('الإحصاء',                    '📊', '11'),
  literaryOnly('التاريخ الإسلامي',            '📜', '11'),
  literaryOnly('مبادئ الجغرافيا والاقتصاد',  '🌍', '11'),
  literaryOnly('اللغة الفرنسية',              '🇫🇷', '11'),
  literaryOnly('علم النفس والاجتماع',         '🧠', '11'),

  // ── الثاني عشر: مشتركة بين التشعيبين ────────────────────────
  sharedTracks('اللغة العربية',                    '📖', '12'),
  sharedTracks('اللغة الإنجليزية',                 '🇬🇧', '12'),
  sharedTracks('التربية الإسلامية والقرآن الكريم', '📿', '12'),

  // ── الثاني عشر علمي فقط ──────────────────────────────────────
  scientificOnly('الرياضيات', '🔢', '12'),
  scientificOnly('الفيزياء',  '⚛️', '12'),
  scientificOnly('الكيمياء',  '🧪', '12'),
  scientificOnly('الأحياء',   '🌿', '12'),

  // ── الثاني عشر أدبي فقط ──────────────────────────────────────
  literaryOnly('اللغة الفرنسية',                     '🇫🇷', '12'),
  literaryOnly('الإحصاء',                            '📊', '12'),
  literaryOnly('تاريخ العالم الحديث والمعاصر',       '🌐', '12'),
  literaryOnly('الجغرافيا وقضايا البيئة والتنمية',   '🗺️', '12'),
  literaryOnly('الفلسفة',                            '💭', '12'),
]

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const supabase = getServiceClient()
  const results = { inserted: 0, skipped: 0, errors: [] as string[] }

  // ── جلب المواد الموجودة بمعلومات كافية لمنع التكرار الدقيق ──
  // المطابقة: name + grade من أول offering
  const { data: existing } = await supabase
    .from('subjects')
    .select('id, name')
  
  // جلب offerings الموجودة لمعرفة أي (name+grade) مضاف فعلاً
  const { data: existingOfferings } = await supabase
    .from('subject_offerings')
    .select('subject_id, grade, track')

  // بناء set من المفاتيح المركبة (name|grade|track)
  const existingKeys = new Set<string>()
  if (existing && existingOfferings) {
    for (const sub of existing) {
      const offs = existingOfferings.filter(o => o.subject_id === sub.id)
      for (const o of offs) {
        existingKeys.add(`${sub.name}|${o.grade}|${o.track ?? 'null'}`)
      }
    }
  }

  for (const subject of KUWAIT_SUBJECTS) {
    // فحص إن كانت كل offerings هذه المادة موجودة مسبقاً
    const allExist = subject.offerings.every(o =>
      existingKeys.has(`${subject.name}|${o.grade}|${o.track ?? 'null'}`)
    )
    if (allExist) {
      results.skipped++
      continue
    }

    try {
      const firstOffering = subject.offerings[0]

      const { data: inserted, error: insertErr } = await supabase
        .from('subjects')
        .insert({
          name:      subject.name,
          icon:      subject.icon,
          is_active: true,
          stage:     firstOffering.stage,
          grade:     firstOffering.grade,
        })
        .select('id')
        .single()

      if (insertErr || !inserted) {
        results.errors.push(`${subject.name} (${firstOffering.grade}): ${insertErr?.message ?? 'فشل'}`)
        continue
      }

      const { error: offeringsErr } = await supabase
        .from('subject_offerings')
        .insert(
          subject.offerings.map(o => ({
            subject_id: inserted.id,
            stage:      o.stage,
            grade:      o.grade,
            track:      o.track ?? null,
          }))
        )

      if (offeringsErr) {
        results.errors.push(`${subject.name} (offerings): ${offeringsErr.message}`)
      } else {
        results.inserted++
        // تسجيل المفاتيح الجديدة لمنع تكرارها لاحقاً في نفس الدفعة
        subject.offerings.forEach(o =>
          existingKeys.add(`${subject.name}|${o.grade}|${o.track ?? 'null'}`)
        )
      }
    } catch (err: any) {
      results.errors.push(`${subject.name}: ${err?.message ?? 'خطأ غير معروف'}`)
    }
  }

  return NextResponse.json({
    message: `تمت التعبئة: ${results.inserted} مادة جديدة، ${results.skipped} موجودة مسبقاً`,
    total: KUWAIT_SUBJECTS.length,
    ...results,
  })
}