'use client'

import { BRAND } from '@/lib/constants/theme'
import { fmtDateTime, getEmbedUrl } from '@/lib/teacher/teacher.utils'
import type { TeacherModalsContainerProps } from '@/types/teacher-page.types'

export function TeacherModalsContainer({
  controller,
  fileRef,
  availableStudentsForClass,
}: TeacherModalsContainerProps) {
  const {
    ui,
    styles,
    subjects,

    showNewG,
    setShowNewG,
    creatingG,
    gDone,
    classError,
    gName,
    setGName,
    gSubject,
    setGSubject,
    gLevel,
    setGLevel,
    createClass,

    openClass,
    setOpenClass,
    loadingClassDetail,
    addingMember,
    addToClass,
    removeFromClass,
    deleteClass,

    openSub,
    setOpenSub,
    tGrade,
    setTGrade,
    tFeedback,
    setTFeedback,
    reviewing,
    reviewDone,
    submitReview,

    openMedia,
    setOpenMedia,
  } = controller

  const { ghostBtn, primaryBtn, inputStyle, smallCard } = styles

  return (
    <>
      {showNewG && (
        <div className="modal-shell" onClick={() => !creatingG && setShowNewG(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div
              style={{
                padding: '16px 18px',
                borderBottom: `1px solid ${ui.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 900, color: ui.text }}>إنشاء فصل جديد</div>
              <button
                type="button"
                onClick={() => !creatingG && setShowNewG(false)}
                style={{ ...ghostBtn(false), padding: '6px 10px' }}
              >
                إغلاق
              </button>
            </div>

            <div className="modal-body-scroll">
              {gDone ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    marginBottom: 14,
                    background: ui.successBg,
                    border: `1px solid ${ui.successBorder}`,
                    color: '#0f7a55',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  تم إنشاء الفصل بنجاح.
                </div>
              ) : null}

              {classError ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    marginBottom: 14,
                    background: ui.dangerBg,
                    border: `1px solid ${ui.dangerBorder}`,
                    color: BRAND.crimson,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {classError}
                </div>
              ) : null}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: ui.text }}>🏫 اسم الفصل</span>
                  <input
                    value={gName ?? ''}
                    onChange={e => setGName(e.target.value)}
                    placeholder="مثال: عاشر 1"
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: ui.text }}>📚 المادة</span>
                  <select value={gSubject ?? ''} onChange={e => setGSubject(e.target.value)} style={inputStyle}>
                    <option value="">-- اختر مادة --</option>
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: ui.text }}>🎓 المرحلة / المستوى</span>
                  <input
                    value={gLevel ?? ''}
                    onChange={e => setGLevel(e.target.value)}
                    placeholder="مثال: الصف العاشر"
                    style={inputStyle}
                  />
                </label>

                <button
                  type="button"
                  onClick={createClass}
                  disabled={creatingG || !(gName ?? '').trim()}
                  style={primaryBtn(Boolean((gName ?? '').trim()))}
                >
                  {creatingG ? 'جارٍ الإنشاء...' : 'إنشاء الفصل'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openClass && (
        <div className="modal-shell" onClick={() => setOpenClass(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div
              style={{
                padding: '16px 18px',
                borderBottom: `1px solid ${ui.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: ui.text }}>{openClass.name}</div>
                <div style={{ fontSize: 12, color: ui.sub, marginTop: 4 }}>
                  {openClass.subject_name ? openClass.subject_name : 'بلا مادة'}{' '}
                  {openClass.level ? `• ${openClass.level}` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => deleteClass(openClass.id)}
                  style={{
                    ...ghostBtn(false),
                    background: ui.dangerBg,
                    borderColor: ui.dangerBorder,
                    color: BRAND.crimson,
                  }}
                >
                  حذف الفصل
                </button>

                <button type="button" onClick={() => setOpenClass(null)} style={ghostBtn(false)}>
                  إغلاق
                </button>
              </div>
            </div>

            <div className="modal-body-scroll">
              {loadingClassDetail ? (
                <div style={{ padding: 30, textAlign: 'center', color: ui.sub }}>جارٍ تحميل تفاصيل الفصل...</div>
              ) : (
                <div className="split-grid">
                  <div style={{ ...smallCard, overflow: 'hidden' }}>
                    <div
                      style={{
                        padding: '12px 14px',
                        borderBottom: `1px solid ${ui.border}`,
                        fontSize: 13,
                        fontWeight: 700,
                        color: ui.sub,
                      }}
                    >
                      طلاب متاحون ({availableStudentsForClass.length})
                    </div>

                    <div style={{ overflowY: 'auto', maxHeight: 500 }}>
                      {availableStudentsForClass.length === 0 ? (
                        <p style={{ color: ui.sub, fontSize: 13, padding: 14, margin: 0 }}>لا يوجد طلاب متاحون.</p>
                      ) : (
                        availableStudentsForClass.map((s: any) => (
                          <div key={s.id} style={{ padding: '12px 14px', borderBottom: `1px solid ${ui.border}` }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: ui.text }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: ui.sub, marginTop: 2 }}>{s.email}</div>
                            <button
                              type="button"
                              onClick={() => addToClass(openClass.id, s.id)}
                              disabled={addingMember}
                              style={{ ...ghostBtn(true), marginTop: 8, width: '100%' }}
                            >
                              {addingMember ? 'جارٍ الإضافة...' : 'إضافة إلى الفصل'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ ...smallCard, overflow: 'hidden' }}>
                    <div
                      style={{
                        padding: '12px 14px',
                        borderBottom: `1px solid ${ui.border}`,
                        fontSize: 13,
                        fontWeight: 700,
                        color: ui.sub,
                      }}
                    >
                      أعضاء الفصل ({openClass.students?.length ?? 0})
                    </div>

                    <div style={{ overflowY: 'auto', maxHeight: 500 }}>
                      {(openClass.students?.length ?? 0) === 0 ? (
                        <p style={{ color: ui.sub, fontSize: 13, padding: 14, margin: 0 }}>لا يوجد أعضاء بعد.</p>
                      ) : (
                        openClass.students.map((s: any) => (
                          <div key={s.member_id ?? s.student_id} style={{ padding: '12px 14px', borderBottom: `1px solid ${ui.border}` }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: ui.text }}>{s.full_name ?? s.name}</div>
                            <div style={{ fontSize: 11, color: ui.sub, marginTop: 2 }}>{s.email}</div>
                            <button
                              type="button"
                              onClick={() => removeFromClass(openClass.id, s.student_id)}
                              style={{
                                ...ghostBtn(false),
                                marginTop: 8,
                                width: '100%',
                                background: ui.dangerBg,
                                borderColor: ui.dangerBorder,
                                color: BRAND.crimson,
                              }}
                            >
                              إزالة من الفصل
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {openSub && (
        <div className="modal-shell" onClick={() => setOpenSub(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <div
              style={{
                padding: '16px 18px',
                borderBottom: `1px solid ${ui.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: ui.text }}>
                  {openSub.users?.name ?? 'مراجعة الإجابة'}
                </div>
                <div style={{ fontSize: 12, color: ui.sub, marginTop: 4 }}>{fmtDateTime(openSub.submitted_at)}</div>
              </div>

              <button type="button" onClick={() => setOpenSub(null)} style={ghostBtn(false)}>
                إغلاق
              </button>
            </div>

            <div className="modal-body-scroll">
              {reviewDone ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    marginBottom: 14,
                    background: ui.successBg,
                    border: `1px solid ${ui.successBorder}`,
                    color: '#0f7a55',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  تم حفظ المراجعة بنجاح.
                </div>
              ) : null}

              <div style={{ ...smallCard, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: ui.sub, marginBottom: 8 }}>نص الإجابة</div>
                <div style={{ fontSize: 14, color: ui.text, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                  {openSub.answer_text ?? 'لا يوجد نص.'}
                </div>
              </div>

              {(openSub.ai_feedback || openSub.ai_grade !== null) && (
                <div style={{ ...smallCard, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: ui.themeColor, marginBottom: 8, fontWeight: 800 }}>تقييم الذكاء الاصطناعي</div>
                  {openSub.ai_grade !== null && openSub.ai_grade !== undefined ? (
                    <div style={{ fontSize: 14, color: ui.text, marginBottom: 8 }}>الدرجة المقترحة: {openSub.ai_grade}</div>
                  ) : null}
                  {openSub.ai_feedback ? (
                    <div style={{ fontSize: 13, color: ui.sub, lineHeight: 1.8 }}>{openSub.ai_feedback}</div>
                  ) : null}
                </div>
              )}

              <div style={{ display: 'grid', gap: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: ui.text }}>الدرجة</span>
                  <input value={tGrade ?? ''} onChange={e => setTGrade(e.target.value)} style={inputStyle} />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: ui.text }}>ملاحظات المعلم</span>
                  <textarea
                    value={tFeedback ?? ''}
                    onChange={e => setTFeedback(e.target.value)}
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </label>

                <button type="button" onClick={submitReview} disabled={reviewing} style={primaryBtn(true)}>
                  {reviewing ? 'جارٍ الحفظ...' : 'حفظ المراجعة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openMedia && (
        <div className="modal-shell" onClick={() => setOpenMedia(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 860 }}>
            <div
              style={{
                padding: '16px 18px',
                borderBottom: `1px solid ${ui.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: ui.text }}>{openMedia.title}</div>
                <div style={{ fontSize: 12, color: ui.sub, marginTop: 4 }}>
                  {openMedia.type === 'video' ? 'فيديو' : 'صوت'}
                </div>
              </div>

              <button type="button" onClick={() => setOpenMedia(null)} style={ghostBtn(false)}>
                إغلاق
              </button>
            </div>

            <div className="modal-body-scroll">
              {openMedia.type === 'video' ? (
  getEmbedUrl(openMedia.url ?? '') ? (
    <iframe
      src={getEmbedUrl(openMedia.url ?? '') ?? ''}
      title={openMedia.title}
                    style={{ width: '100%', height: 420, border: 'none', borderRadius: 16 }}
                    allowFullScreen
                  />
                ) : (
                  <video
                    controls
                    src={openMedia.url ?? ''}
                    style={{ width: '100%', borderRadius: 16 }}
                  />
                )
              ) : (
                <audio
                  controls
                  src={openMedia.url ?? ''}
                  style={{ width: '100%' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}