'use client'

import type { CSSProperties, ReactNode } from 'react'
import { BRAND } from '@/lib/constants/theme'
import { fmtDateShort, fmtDateTime, getEmbedUrl } from '@/lib/teacher/teacher.utils'
import type { TeacherSectionsRendererProps } from '@/types/teacher-page.types'
import { TeacherSubjectManagementTab } from '@/components/TeacherSubjectManagementTab'

type SelectionItem = {
  id: string
  title: string
  sub?: string | null
}

export function TeacherSectionsRenderer({ vm }: TeacherSectionsRendererProps) {
  const {
    router,
    tab,
    setTab,
    tabs,
    ui,
    isDark,
    accessToken,
    summaryCards,
    insightsDismissed,
    insights,
    setInsightsDismissed,
    styles,

    subjects,
    students,
    classes,
    assignments,
    quizzesList,
    pendingReviews,

    aTitle,
    setATitle,
    aDescription,
    setADescription,
    aQuizId,
    setAQuizId,
    aTarget,
    setATarget,
    aTargetIds,
    setATargetIds,
    aDeadline,
    setADeadline,
    sendingA,
    aDone,
    aError,
    sendAssignment,
    showNewG,
    setShowNewG,
    setClassError,
    classesState,
    scopeGroupsLoading,
    scopeGroups,

    submissions,
    setOpenSub,
    setTGrade,
    setTFeedback,

    media,
    mDone,
    mError,
    mTitle,
    setMTitle,
    mType,
    setMType,
    mSubject,
    setMSubject,
    mLinkType,
    setMLinkType,
    mUrl,
    setMUrl,
    mFile,
    setMFile,
    fileRef,
    uploadingM,
    uploadMedia,

    selStudent,
    setSelStudent,
    msgList,
    newMsg,
    setNewMsg,
    sendingMsg,
    sendMessage,
    user,

    stats,
    statsLoading,
    isHome,
  } = vm as typeof vm & { isHome: boolean }

  const { smallCard, ghostBtn, primaryBtn, inputStyle, sectionCard } = styles

  return (
    <main className="page-wrap">
      {isHome && (
      <section className="hero-grid" style={{ ...sectionCard, padding: 20, marginBottom: 18 }}>
        <div
          style={{
            ...smallCard,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 18,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.76)',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                background: isDark ? 'rgba(140,20,40,0.10)' : 'rgba(140,20,40,0.08)',
                border: `1px solid ${ui.borderAccent}`,
                color: ui.themeColor,
                fontSize: 13,
                fontWeight: 900,
                marginBottom: 16,
              }}
            >
              ✍️ مساحة المعلم لإنتاج المحتوى
            </div>

            <h1
              style={{
                fontSize: 'clamp(30px,4vw,54px)',
                lineHeight: 1.16,
                margin: '0 0 12px',
                fontFamily: BRAND.fontHeading,
                fontWeight: 900,
                color: ui.text,
              }}
            >
              اختر الدرس ثم
              <span
                style={{
                  color: ui.themeColor,
                  background: isDark ? 'rgba(140,20,40,0.10)' : 'rgba(140,20,40,0.07)',
                  padding: '0 8px',
                  borderRadius: 10,
                  marginRight: 8,
                  display: 'inline-block',
                }}
              >
                أنشئ شرحك واختبارك
              </span>
              <br />
              <span style={{ color: ui.accent2 }}>وخططك</span> من مكان واحد.
            </h1>

            <p style={{ fontSize: 15, color: ui.sub, lineHeight: 1.95, margin: 0, maxWidth: 680 }}>
              هذه الواجهة مخصصة لعمل المعلم اليومي: إرسال المهام، إدارة الفصول، متابعة الإجابات، إضافة الوسائط،
              ومراجعة الأداء داخل تصميم أوضح وأكثر هدوءًا في الوضع الليلي.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {[
              'إرسال المهام بسرعة',
              'متابعة الفصول والطلاب',
              'مراجعة الإجابات وتقديرها',
              'إدارة الوسائط والرسائل',
            ].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: ui.accent2,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 14, color: ui.sub, fontWeight: 700 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-grid">
          {summaryCards.map(card => (
            <div
              key={card.label}
              style={{
                ...smallCard,
                padding: 18,
                minHeight: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: card.color,
                    background: `${card.color}14`,
                    border: `1px solid ${card.color}26`,
                    borderRadius: 999,
                    padding: '5px 10px',
                  }}
                >
                  {card.label}
                </span>
                <span style={{ fontSize: 22 }}>{card.icon}</span>
              </div>

              <div style={{ fontSize: 38, fontWeight: 900, color: ui.text, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: ui.sub }}>{card.label}</div>
            </div>
          ))}
        </div>
      </section>
      )}

      {!isHome && (
      <>
      {!insightsDismissed && insights.length > 0 && (
        <section
          className="fade-in"
          style={{
            ...sectionCard,
            marginBottom: 18,
            padding: 18,
            background: isDark ? 'rgba(217,119,6,0.07)' : 'rgba(217,119,6,0.06)',
            borderColor: ui.warnBorder,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 900,
                color: BRAND.orange,
                margin: 0,
                fontFamily: BRAND.fontHeading,
              }}
            >
              🔎 إشارات تستحق الانتباه
            </h3>

            <button
              type="button"
              onClick={() => setInsightsDismissed(true)}
              style={{ background: 'none', border: 'none', color: ui.sub, fontSize: 18, cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {insights.map((ci: any) => (
              <div key={ci.class_id} style={{ ...smallCard, padding: '14px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: ui.text, marginBottom: 10 }}>
                  {ci.class_name}
                </div>

                {ci.signals?.length > 0 && (
                  <div style={{ display: 'grid', gap: 8, marginBottom: ci.struggling_students?.length > 0 ? 12 : 0 }}>
                    {ci.signals.map((s: any, i: number) => (
                      <div key={i} style={{ fontSize: 13, color: ui.text, lineHeight: 1.8 }}>
                        <strong>{s.affected_count}</strong> طالبًا يحتاجون دعمًا في <strong>{s.area_label}</strong>{' '}
                        بمتوسط دقة {s.avg_accuracy}%
                      </div>
                    ))}
                  </div>
                )}

                {ci.struggling_students?.length > 0 && (
                  <div style={{ fontSize: 13, color: BRAND.crimson, lineHeight: 1.8 }}>
                    أبرز الطلاب المحتاجين للدعم:{' '}
                    <strong>{ci.struggling_students.map((s: any) => s.name).join('، ')}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'assignments' && (
        <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
          <SectionTitle icon="📝" title="إدارة المهام" ui={ui} />
          {aDone ? <Banner type="success" ui={ui} text="تم إرسال المهمة بنجاح." /> : null}
          {aError ? <Banner type="error" ui={ui} text={aError} /> : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="📌 عنوان المهمة" sub={ui.sub}>
              <input
                value={aTitle ?? ''}
                onChange={e => setATitle(e.target.value)}
                placeholder="مثال: واجب النص الأدبي"
                style={inputStyle}
              />
            </Field>

            <Field label="🗒️ وصف مختصر" sub={ui.sub}>
              <input
                value={aDescription ?? ''}
                onChange={e => setADescription(e.target.value)}
                placeholder="وصف أو توجيه قصير للطلاب"
                style={inputStyle}
              />
            </Field>

            <Field label="🧪 اختر الاختبار" sub={ui.sub}>
              <select value={aQuizId ?? ''} onChange={e => setAQuizId(e.target.value)} style={inputStyle}>
                <option value="">-- اختر اختبارًا --</option>
                {quizzesList.map((q: any) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q.questions_count} سؤال)
                  </option>
                ))}
              </select>

              {quizzesList.length === 0 ? (
                <p style={{ fontSize: 12, color: ui.sub, marginTop: 6 }}>لا توجد اختبارات منشورة متاحة حاليًا.</p>
              ) : null}
            </Field>

            <Field label="🎯 نوع الاستهداف" sub={ui.sub}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                {[
                  ['all', 'الجميع'],
                  ['student', 'طلاب محددون'],
                  ['class', 'فصول محددة'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setATarget(val as 'all' | 'student' | 'class')
                      setATargetIds([])
                    }}
                    style={{ ...ghostBtn(aTarget === val), flex: 1, minWidth: 150 }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {aTarget === 'student' && (
                <SelectionList
                  items={students.map((s: any) => ({ id: s.id, title: s.name, sub: s.email }))}
                  selected={aTargetIds}
                  onToggle={id =>
                    setATargetIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
                  }
                  ui={ui}
                />
              )}

              {aTarget === 'class' && (
                <SelectionList
                  items={classes.map((g: any) => ({
                    id: g.id,
                    title: g.name,
                    sub: `${g.students_count} طالب`,
                  }))}
                  selected={aTargetIds}
                  onToggle={id =>
                    setATargetIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
                  }
                  ui={ui}
                />
              )}

              {(aTarget === 'student' || aTarget === 'class') && aTargetIds.length > 0 && (
                <p style={{ fontSize: 11, color: ui.themeColor, marginTop: 6, fontWeight: 700 }}>
                  ✅ تم تحديد {aTargetIds.length} عنصر
                </p>
              )}
            </Field>

            <Field label="⏰ الموعد النهائي (اختياري)" sub={ui.sub}>
              <input
                type="datetime-local"
                value={aDeadline ?? ''}
                onChange={e => setADeadline(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <button
              type="button"
              onClick={sendAssignment}
              disabled={sendingA || !(aTitle ?? '').trim() || !(aQuizId ?? '').trim()}
              style={primaryBtn(Boolean((aTitle ?? '').trim() && (aQuizId ?? '').trim()))}
            >
              {sendingA ? 'جارٍ الإرسال...' : '📤 إرسال المهمة'}
            </button>
          </div>

          {assignments.length > 0 && (
            <div style={{ marginTop: 30 }}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: ui.text,
                  marginBottom: 14,
                  fontFamily: BRAND.fontHeading,
                }}
              >
                📋 المهام المرسلة ({assignments.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {assignments.map((a: any) => (
                  <div key={a.id} style={{ ...smallCard, padding: '14px 16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: ui.text }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: ui.sub, marginTop: 4 }}>
                          🎯 {a.quiz_title || 'اختبار'} • {a.questions_count ?? 0} سؤال
                          {a.due_date && ` • ⏰ ${fmtDateShort(a.due_date)}`}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: 11,
                          color: ui.themeColor,
                          background: `${ui.themeColor}14`,
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontWeight: 700,
                        }}
                      >
                        {fmtDateShort(a.created_at)}
                      </span>
                    </div>

                    {a.description ? (
                      <p style={{ fontSize: 13, color: ui.sub, margin: '10px 0 0', lineHeight: 1.8 }}>
                        {a.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'classes' && (
        <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <SectionTitle icon="🏫" title={`الفصول (${classes.length})`} ui={ui} margin={0} />
            <button
              type="button"
              onClick={() => {
                setShowNewG(true)
                setClassError('')
              }}
              style={primaryBtn(true)}
            >
              ＋ فصل جديد
            </button>
          </div>

          {!accessToken ? (
            <LoadingBlock text="جارٍ التحقق من الجلسة..." sub={ui.sub} />
          ) : classes.length === 0 ? (
            <EmptyState
              icon="🏫"
              title="لا توجد فصول بعد"
              sub="أنشئ أول فصل لبدء تنظيم الطلاب والمهام."
              cardBg={ui.panelStrong}
              borderCol={ui.border}
              textCol={ui.text}
              subCol={ui.sub}
            />
          ) : (
            <div className="cards-grid">
              {classes.map((g: any) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => classesState.openClassDetail(g.id)}
                  style={{
                    ...smallCard,
                    padding: '18px 20px',
                    cursor: 'pointer',
                    textAlign: 'right',
                    fontFamily: 'inherit',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontSize: 32 }}>🏫</div>
                    <span
                      style={{
                        fontSize: 12,
                        background: `${ui.themeColor}14`,
                        color: ui.themeColor,
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontWeight: 700,
                      }}
                    >
                      {g.students_count} طالب
                    </span>
                  </div>

                  <div style={{ fontSize: 16, fontWeight: 800, color: ui.text, marginBottom: 6 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: ui.sub }}>
                    {g.subject_name ? g.subject_name : 'بلا مادة'} {g.level ? `• ${g.level}` : ''}
                  </div>

                  {!!g.open_assignments && (
                    <div style={{ fontSize: 12, color: ui.themeColor, marginTop: 8 }}>{g.open_assignments} مهمة مفتوحة</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'scope_students' && accessToken && (
        <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
          <TeacherSubjectManagementTab
            accessToken={accessToken}
            router={router}
            ui={ui}
            styles={styles}
          />
        </section>
      )}

      {tab === 'submissions' && (
        <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <SectionTitle icon="📬" title="الإجابات المرسلة" ui={ui} margin={0} />
            {pendingReviews > 0 ? (
              <span
                style={{
                  fontSize: 12,
                  background: BRAND.orange,
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontWeight: 800,
                }}
              >
                {pendingReviews} بانتظار المراجعة
              </span>
            ) : null}
          </div>

          {submissions.length === 0 ? (
            <EmptyState
              icon="📬"
              title="لا توجد إجابات بعد"
              sub="ستظهر هنا محاولات الطلاب عند تسليم المهام."
              cardBg={ui.panelStrong}
              borderCol={ui.border}
              textCol={ui.text}
              subCol={ui.sub}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {submissions.map((sub: any) => {
                const isPending =
                  sub.status === 'submitted' &&
                  (sub.teacher_grade === null || sub.teacher_grade === undefined)

                return (
                  <div
                    key={sub.id}
                    style={{
                      ...smallCard,
                      padding: '16px 18px',
                      borderColor: isPending ? ui.warnBorder : ui.border,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 10,
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: ui.text }}>
                          {sub.users?.name ?? 'طالب'}
                        </div>
                        <div style={{ fontSize: 12, color: ui.sub, marginTop: 3 }}>
                          {fmtDateTime(sub.submitted_at)}
                        </div>
                      </div>

                      <div style={{ textAlign: 'left' }}>
                        {sub.ai_grade !== null && sub.ai_grade !== undefined ? (
                          <div style={{ fontSize: 12, color: ui.themeColor, fontWeight: 700 }}>
                            AI: {sub.ai_grade}
                          </div>
                        ) : null}
                        {sub.teacher_grade !== null && sub.teacher_grade !== undefined ? (
                          <div style={{ fontSize: 13, color: BRAND.gold, fontWeight: 800 }}>
                            المعلم: {sub.teacher_grade}
                          </div>
                        ) : null}
                        {isPending ? (
                          <div style={{ fontSize: 12, color: BRAND.orange, fontWeight: 700 }}>بانتظار المراجعة</div>
                        ) : null}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: ui.inputBg,
                        border: `1px solid ${ui.border}`,
                        marginBottom: 12,
                        fontSize: 13,
                        color: ui.sub,
                        lineHeight: 1.7,
                      }}
                    >
                      {(sub.answer_text ?? '').slice(0, 150)}
                      {(sub.answer_text ?? '').length > 150 ? '...' : ''}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenSub(sub)
                        setTGrade(String(sub.teacher_grade ?? sub.ai_grade ?? ''))
                        setTFeedback(sub.teacher_feedback ?? sub.ai_feedback ?? '')
                      }}
                      style={{
                        ...ghostBtn(isPending),
                        color: isPending ? '#fff' : ui.themeColor,
                        background: isPending ? ui.gradMain : `${ui.themeColor}10`,
                        borderWidth: 0,
                        borderStyle: 'solid',
                        borderColor: 'transparent',
                      }}
                    >
                      {isPending ? '✍️ مراجعة الآن' : '👁️ عرض المراجعة'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'media' && (
        <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
          <SectionTitle icon="🎬" title="الوسائط التعليمية" ui={ui} />
          {mDone ? <Banner type="success" ui={ui} text="تم رفع الوسائط بنجاح." /> : null}
          {mError ? <Banner type="error" ui={ui} text={mError} /> : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 30 }}>
            <Field label="🏷️ عنوان الوسائط" sub={ui.sub}>
              <input
                value={mTitle ?? ''}
                onChange={e => setMTitle(e.target.value)}
                placeholder="مثال: شرح النص الأدبي"
                style={inputStyle}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="🎞️ النوع" sub={ui.sub}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['video', 'audio'] as const).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMType(val)}
                      style={{ ...ghostBtn(mType === val), flex: 1 }}
                    >
                      {val === 'video' ? 'فيديو' : 'صوت'}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="📚 المادة" sub={ui.sub}>
                <select value={mSubject ?? ''} onChange={e => setMSubject(e.target.value)} style={inputStyle}>
                  <option value="">-- اختر مادة --</option>
                  {subjects.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="🔗 طريقة الإضافة" sub={ui.sub}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                {(['link', 'upload'] as const).map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setMLinkType(val)
                      setMUrl('')
                      setMFile(null)
                    }}
                    style={{ ...ghostBtn(mLinkType === val), flex: 1, minWidth: 160 }}
                  >
                    {val === 'link' ? 'رابط خارجي' : 'رفع ملف'}
                  </button>
                ))}
              </div>

              {mLinkType === 'link' ? (
                <div>
                  <input
                    value={mUrl ?? ''}
                    onChange={e => setMUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... أو https://vimeo.com/..."
                    style={inputStyle}
                  />

                  {(mUrl ?? '') && getEmbedUrl(mUrl ?? '') ? (
                    <div
                      style={{
                        marginTop: 12,
                        borderRadius: 14,
                        overflow: 'hidden',
                        border: `1px solid ${ui.border}`,
                      }}
                    >
                      {mType === 'video' ? (
                        <iframe
                          src={getEmbedUrl(mUrl ?? '') ?? ''}
                          style={{ width: '100%', height: 220, border: 'none' }}
                          allowFullScreen
                          title="معاينة الوسائط"
                        />
                      ) : (
                        <div style={{ padding: 18 }}>
                          <audio controls src={getEmbedUrl(mUrl ?? '') ?? mUrl ?? ''} style={{ width: '100%' }} />
                        </div>
                      )}
                    </div>
                  ) : null}

                  <p style={{ fontSize: 12, color: ui.sub, marginTop: 8 }}>يدعم معاينة روابط YouTube وVimeo.</p>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={mType === 'video' ? 'video/*' : 'audio/*'}
                    style={{ display: 'none' }}
                    onChange={e => setMFile(e.target.files?.[0] ?? null)}
                  />

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: 20,
                      borderRadius: 14,
                      border: `2px dashed ${ui.border}`,
                      background: 'transparent',
                      color: ui.sub,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  >
                    {mFile ? mFile.name : mType === 'video' ? 'اختر ملف فيديو' : 'اختر ملفًا صوتيًا'}
                  </button>

                  {mFile ? (
                    <p style={{ fontSize: 12, color: ui.sub, marginTop: 6 }}>
                      {(mFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  ) : null}
                </div>
              )}
            </Field>

            <button
              type="button"
              onClick={uploadMedia}
              disabled={uploadingM || !(mTitle ?? '').trim() || (mLinkType === 'link' ? !(mUrl ?? '').trim() : !mFile)}
              style={primaryBtn(Boolean((mTitle ?? '').trim() && (mLinkType === 'link' ? (mUrl ?? '').trim() : mFile)))}
            >
              {uploadingM ? 'جارٍ الرفع...' : '⬆️ رفع الوسائط'}
            </button>
          </div>

          {media.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: ui.text,
                  marginBottom: 14,
                  fontFamily: BRAND.fontHeading,
                }}
              >
                الوسائط المتاحة ({media.length})
              </h3>

              <div className="cards-grid">
                {media.map((m: any) => {
                  const embed = m.embedUrl ?? m.embed_url ?? ''
                  const linkType = m.linkType ?? m.link_type ?? 'link'

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => vm.setOpenMedia(m)}
                      style={{
                        ...smallCard,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        textAlign: 'right',
                        fontFamily: 'inherit',
                        padding: 0,
                      }}
                    >
                      <div
                        style={{
                          height: 112,
                          background: `${ui.themeColor}10`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 40,
                          position: 'relative',
                        }}
                      >
                        {m.type === 'video' ? '🎬' : '🎧'}
                        {m.type === 'video' && linkType === 'link' && embed?.includes('youtube') ? (
                          <span
                            style={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              fontSize: 10,
                              background: BRAND.crimson,
                              color: '#fff',
                              padding: '2px 6px',
                              borderRadius: 6,
                              fontWeight: 700,
                            }}
                          >
                            YouTube
                          </span>
                        ) : null}
                      </div>

                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: ui.text, marginBottom: 4 }}>{m.title}</div>
                        <div style={{ fontSize: 11, color: ui.sub }}>{m.type === 'video' ? 'فيديو' : 'صوت'}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'messages' && (
        <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
          <SectionTitle icon="💬" title="الرسائل" ui={ui} />

          <div className="split-grid">
            <div style={{ ...smallCard, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${ui.border}`, fontSize: 13, fontWeight: 700, color: ui.sub }}>
                الطلاب ({students.length})
              </div>

              <div style={{ overflowY: 'auto', maxHeight: 500 }}>
                {students.length === 0 ? (
                  <p style={{ color: ui.sub, fontSize: 13, padding: 14, margin: 0 }}>لا يوجد طلاب.</p>
                ) : (
                  students.map((s: any) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelStudent(s)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        textAlign: 'right',
                        background: selStudent?.id === s.id ? `${ui.themeColor}10` : 'transparent',
                        border: 'none',
                        borderBottom: `1px solid ${ui.border}`,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        color: selStudent?.id === s.id ? ui.themeColor : ui.text,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: ui.sub, marginTop: 2 }}>{s.email}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div style={{ ...smallCard, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {!selStudent ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ui.sub, fontSize: 14 }}>
                  اختر طالبًا لبدء المحادثة.
                </div>
              ) : (
                <>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: `1px solid ${ui.border}`,
                      fontSize: 14,
                      fontWeight: 700,
                      color: ui.themeColor,
                      background: `${ui.themeColor}08`,
                    }}
                  >
                    {selStudent.name}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      padding: 14,
                      overflowY: 'auto',
                      maxHeight: 360,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {msgList.length === 0 ? (
                      <p style={{ color: ui.sub, fontSize: 13, textAlign: 'center', margin: 'auto' }}>لا توجد رسائل بعد.</p>
                    ) : (
                      msgList.map((msg: any) => {
                        const currentUserId = user?.id
                        const isMe = msg.from_id === currentUserId
                        return (
                          <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-start' : 'flex-end' }}>
                            <div
                              style={{
                                maxWidth: '76%',
                                padding: '10px 14px',
                                borderRadius: isMe ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                                background: isMe ? `${ui.themeColor}14` : ui.inputBg,
                                border: `1px solid ${isMe ? ui.borderAccent : ui.border}`,
                              }}
                            >
                              <p style={{ fontSize: 14, color: ui.text, margin: 0, lineHeight: 1.7 }}>{msg.content}</p>
                              <p style={{ fontSize: 10, color: ui.sub, margin: '4px 0 0' }}>
                                {new Date(msg.created_at).toLocaleTimeString('ar-KW', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      borderTop: `1px solid ${ui.border}`,
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <input
                      value={newMsg ?? ''}
                      onChange={e => setNewMsg(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') sendMessage()
                      }}
                      placeholder="اكتب رسالتك..."
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={sendingMsg || !(newMsg ?? '').trim()}
                      style={{ ...primaryBtn(Boolean((newMsg ?? '').trim())), padding: '10px 16px', minWidth: 68 }}
                    >
                      {sendingMsg ? '...' : 'إرسال'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'students' && (
        <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
          <SectionTitle icon="🎓" title={`الطلاب (${students.length})`} ui={ui} />

          {students.length === 0 ? (
            <EmptyState
              icon="🎓"
              title="لا يوجد طلاب"
              sub="سيظهر الطلاب هنا عند ربطهم بنطاق المعلم أو بالفصول."
              cardBg={ui.panelStrong}
              borderCol={ui.border}
              textCol={ui.text}
              subCol={ui.sub}
            />
          ) : (
            <div className="cards-grid">
              {students.map((s: any) => (
                <div key={s.id} style={{ ...smallCard, padding: '16px 18px' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>👤</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: ui.text, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: ui.sub, marginBottom: 8 }}>{s.email}</div>

                  {s.allowed_grades?.length ? (
                    <div style={{ fontSize: 12, color: ui.themeColor, fontWeight: 700 }}>{s.allowed_grades.join('، ')}</div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setSelStudent(s)
                      setTab('messages')
                    }}
                    style={{ ...ghostBtn(true), width: '100%', marginTop: 12 }}
                  >
                    مراسلة الطالب
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'stats' && (
        <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
          <SectionTitle icon="📈" title="الإحصاءات" ui={ui} />

          {statsLoading ? (
            <LoadingBlock text="جارٍ تحميل الإحصاءات..." sub={ui.sub} accent={ui.themeColor} />
          ) : !stats ? (
            <EmptyState
              icon="📈"
              title="لا توجد إحصاءات متاحة"
              sub="ستظهر الإحصاءات بعد وجود نشاطات ونتائج كافية."
              cardBg={ui.panelStrong}
              borderCol={ui.border}
              textCol={ui.text}
              subCol={ui.sub}
            />
          ) : (
            <>
              <div className="stats-top-grid">
                {[
                  { icon: '👥', label: 'الطلاب', value: stats.summary?.totalStudents ?? 0, color: BRAND.crimson },
                  { icon: '📝', label: 'المهام', value: stats.summary?.totalAssignments ?? 0, color: BRAND.orangeRed },
                  { icon: '📬', label: 'الإجابات', value: stats.summary?.totalSubmissions ?? 0, color: BRAND.gold },
                  { icon: '⭐', label: 'متوسط الدرجات', value: stats.summary?.avgGrade ?? 0, color: BRAND.gold },
                  { icon: '⏳', label: 'بانتظار المراجعة', value: stats.summary?.pendingReview ?? 0, color: BRAND.orange },
                  { icon: '📊', label: 'نسبة الاستجابة', value: stats.summary?.responseRate ?? 0, color: BRAND.deep },
                ].map((card, i) => (
                  <div
                    key={i}
                    style={{
                      ...smallCard,
                      padding: '16px 12px',
                      textAlign: 'center',
                      borderColor: `${card.color}28`,
                    }}
                  >
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{card.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: card.color, marginBottom: 4 }}>{card.value}</div>
                    <div style={{ fontSize: 11, color: ui.sub }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {stats.studentStats?.length > 0 && (
                <div style={{ ...smallCard, marginBottom: 20, overflow: 'hidden' }}>
                  <div
                    style={{
                      padding: '14px 18px',
                      borderBottom: `1px solid ${ui.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 800, color: ui.text }}>أداء الطلاب</span>
                    <span style={{ fontSize: 12, color: ui.sub }}>{stats.studentStats.length}</span>
                  </div>

                  <div>
                    {stats.studentStats.map((s: any, i: number) => {
                      const gradeColor =
                        s.avgGrade == null ? ui.sub : s.avgGrade >= 70 ? BRAND.gold : s.avgGrade >= 50 ? BRAND.orange : BRAND.crimson

                      return (
                        <div
                          key={s.id}
                          style={{
                            padding: '14px 18px',
                            borderBottom: i < stats.studentStats.length - 1 ? `1px solid ${ui.border}` : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: ui.text }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: ui.sub, marginTop: 3 }}>{s.email}</div>
                          </div>

                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: ui.sub }}>المرسلة: <strong>{s.submitted}</strong></span>
                            <span style={{ fontSize: 12, color: ui.sub }}>المصححة: <strong>{s.graded}</strong></span>
                            <span style={{ fontSize: 12, color: ui.sub }}>المعلّقة: <strong>{s.pending}</strong></span>
                            <span style={{ fontSize: 12, color: gradeColor, fontWeight: 800 }}>
                              {s.avgGrade ?? '-'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {stats.assignmentStats?.length > 0 && (
                <div style={{ ...smallCard, overflow: 'hidden' }}>
                  <div
                    style={{
                      padding: '14px 18px',
                      borderBottom: `1px solid ${ui.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 800, color: ui.text }}>إحصاءات المهام</span>
                    <span style={{ fontSize: 12, color: ui.sub }}>{stats.assignmentStats.length}</span>
                  </div>

                  <div>
                    {stats.assignmentStats.map((a: any, i: number) => (
                      <div
                        key={a.id}
                        style={{
                          padding: '14px 18px',
                          borderBottom: i < stats.assignmentStats.length - 1 ? `1px solid ${ui.border}` : 'none',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 800, color: ui.text }}>{a.title}</div>
                          <div style={{ fontSize: 12, color: ui.sub }}>{a.avgGrade ?? a.avgPercent ?? '-'}</div>
                        </div>

                        <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: ui.sub }}>المرسلة: {a.submitted}</span>
                          <span style={{ fontSize: 12, color: ui.sub }}>المصححة: {a.graded}</span>
                          <span style={{ fontSize: 12, color: BRAND.orange }}>المعلّقة: {a.pending}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
      </>
      )}
    </main>
  )
}

function SectionTitle({
  icon,
  title,
  ui,
  margin = 18,
}: {
  icon: string
  title: string
  ui: any
  margin?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: margin }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h2
        style={{
          margin: 0,
          fontSize: 18,
          color: ui.text,
          fontWeight: 900,
          fontFamily: BRAND.fontHeading,
        }}
      >
        {title}
      </h2>
    </div>
  )
}

function Banner({ type, text, ui }: { type: 'success' | 'error'; text: string; ui: any }) {
  const isSuccess = type === 'success'
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 14,
        marginBottom: 14,
        background: isSuccess ? ui.successBg : ui.dangerBg,
        border: `1px solid ${isSuccess ? ui.successBorder : ui.dangerBorder}`,
        color: isSuccess ? '#0f7a55' : BRAND.crimson,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {text}
    </div>
  )
}

function Field({
  label,
  sub,
  children,
}: {
  label: string
  sub: string
  children: ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 800 }}>
        {label}
        <span style={{ color: sub, fontWeight: 500, fontSize: 12, marginRight: 8 }} />
      </div>
      {children}
    </label>
  )
}

function SelectionList({
  items,
  selected,
  onToggle,
  ui,
}: {
  items: SelectionItem[]
  selected: string[]
  onToggle: (id: string) => void
  ui: any
}) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 8,
        maxHeight: 240,
        overflowY: 'auto',
        padding: 4,
      }}
    >
      {items.map(item => {
        const active = selected.includes(item.id)
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            style={{
              textAlign: 'right',
              padding: '10px 12px',
              borderRadius: 12,
              border: `1px solid ${active ? ui.borderAccent : ui.border}`,
              background: active ? `${ui.themeColor}10` : ui.inputBg,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: active ? ui.themeColor : ui.text }}>{item.title}</div>
            {item.sub ? <div style={{ fontSize: 11, color: ui.sub, marginTop: 2 }}>{item.sub}</div> : null}
          </button>
        )
      })}
    </div>
  )
}

function LoadingBlock({
  text,
  sub,
  accent,
}: {
  text: string
  sub: string
  accent?: string
}) {
  return (
    <div
      style={{
        padding: 24,
        textAlign: 'center',
        color: sub,
        fontSize: 14,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: `3px solid ${accent ? `${accent}35` : 'rgba(0,0,0,0.12)'}`,
          borderTopColor: accent || '#999',
          borderRadius: '50%',
          margin: '0 auto 10px',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  sub,
  cardBg,
  borderCol,
  textCol,
  subCol,
}: {
  icon: string
  title: string
  sub: string
  cardBg: string
  borderCol: string
  textCol: string
  subCol: string
}) {
  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${borderCol}`,
        borderRadius: 18,
        padding: 28,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 16, color: textCol, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: subCol }}>{sub}</div>
    </div>
  )
}