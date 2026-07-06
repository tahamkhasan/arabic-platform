// ══════════════════════════════════════════════════════
// إصلاح وتحليل استجابات JSON من نماذج الذكاء الاصطناعي —
// كلا المزوّدين (Claude وGemini) قد يحيطان الرد بعلامات
// markdown، أو يُقطَع الرد قبل إغلاق كل الأقواس عند بلوغ
// الحد الأقصى للتوكنز. هذه الدالة مشتركة بين المزوّدين،
// منقولة من app/api/quizzes/generate-arabic/route.ts الأصلي
// دون أي تغيير في المنطق. ─────────────────────────────
// ══════════════════════════════════════════════════════
export function repairAndParseJson<T = any>(raw: string): T {
  const cleaned = raw.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    let repaired = cleaned
    const quoteCount = (repaired.match(/"/g) || []).length
    if (quoteCount % 2 !== 0) repaired += '"'

    const opens: Record<string, string> = { '{': '}', '[': ']' }
    const stack: string[] = []
    for (const ch of repaired) {
      if (ch === '{' || ch === '[') stack.push(opens[ch])
      else if (ch === '}' || ch === ']') stack.pop()
    }
    repaired += stack.reverse().join('')

    try {
      return JSON.parse(repaired) as T
    } catch {
      throw new Error(`تعذّر تحليل رد JSON حتى بعد محاولة الإصلاح: ${cleaned.slice(0, 300)}`)
    }
  }
}