'use client'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import AddStudentModal from '@/components/admin/AddStudentModal'
import StudentSubscriptionsModal from '@/components/admin/StudentSubscriptionsModal'
import { AddTeacherModal, AssignSubjectsModal, AssignScopeModal } from '@/components/admin/TeacherManager'
import { AddParentModal } from '@/components/admin/ParentManager'
import { STAGE_LABELS, GRADES_BY_STAGE, TRACK_LABELS, type StageKey, type TrackKey } from '@/lib/constants/stages'
import { T, inputStyle } from './adminTheme'
import type { User, RoleItem } from '@/types/admin.types'

interface AdminModalsProps {
  roleModalOpen: boolean
  selectedUser: User | null
  selectedRoleId: string
  setSelectedRoleId: (id: string) => void
  roles: RoleItem[]
  rolesLoading: boolean
  assigningRole: boolean
  closeRoleModal: () => void
  assignRoleToUser: () => void
  removeAssignedRole: () => void

  stageModalOpen: boolean
  stageModalUser: User | null
  modalStage: StageKey | null
  setModalStage: (s: StageKey) => void
  modalGrade: string | null
  setModalGrade: (g: string) => void
  modalTrack: TrackKey | null
  setModalTrack: (t: TrackKey) => void
  savingStage: boolean
  closeStageModal: () => void
  saveStageAssignment: (approve: boolean) => void

  subscriptionsModalUser: User | null
  subscriptionsAccessToken: string
  closeSubscriptionsModal: () => void

  showAddTeacher: boolean
  setShowAddTeacher: (v: boolean) => void
  showAddStudent: boolean
  setShowAddStudent: (v: boolean) => void
  showAddParent: boolean
  setShowAddParent: (v: boolean) => void
  assignSubjectsFor: User | null
  setAssignSubjectsFor: (u: User | null) => void
  assignScopeFor: User | null
  setAssignScopeFor: (u: User | null) => void

  adminAccessToken: string | null
  onUsersReload: () => void
  setActionMsg: (msg: string) => void
}

export default function AdminModals(props: AdminModalsProps) {
  const {
    roleModalOpen, selectedUser, selectedRoleId, setSelectedRoleId, roles, rolesLoading, assigningRole,
    closeRoleModal, assignRoleToUser, removeAssignedRole,
    stageModalOpen, stageModalUser, modalStage, setModalStage, modalGrade, setModalGrade, modalTrack, setModalTrack,
    savingStage, closeStageModal, saveStageAssignment,
    subscriptionsModalUser, subscriptionsAccessToken, closeSubscriptionsModal,
    showAddTeacher, setShowAddTeacher, showAddStudent, setShowAddStudent, showAddParent, setShowAddParent,
    assignSubjectsFor, setAssignSubjectsFor, assignScopeFor, setAssignScopeFor,
    adminAccessToken, onUsersReload, setActionMsg,
  } = props

  return (
    <>
      {roleModalOpen && selectedUser ? (
        <div
          onClick={closeRoleModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(31,18,21,0.4)', backdropFilter: 'blur(6px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="fade-in"
            style={{ width: '100%', maxWidth: 520, background: T.cardBg, borderRadius: BRAND.radiusXl, border: `1.5px solid ${T.borderCol}`, boxShadow: BRAND.shadow, padding: 22 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: T.textCol, marginBottom: 6 }}>
                  تعيين دور للمستخدم
                </div>
                <div style={{ fontSize: 13, color: T.subCol }}>{selectedUser.email}</div>
              </div>
              <Button variant="ghost" size="sm" disabled={assigningRole} onClick={closeRoleModal}>إغلاق</Button>
            </div>

            <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: BRAND.radiusMd, background: 'rgba(140,20,40,0.05)', border: `1px solid ${T.borderCol}`, fontSize: 13, color: T.subCol }}>
              الدور الحالي: <span style={{ color: T.textCol, fontWeight: BRAND.weightBlack }}>{selectedUser.assigned_role?.name || selectedUser.assigned_role?.key || 'بدون دور معيّن'}</span>
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: BRAND.weightBlack, color: T.textCol, marginBottom: 8 }}>اختر الدور</label>
            <select
              value={selectedRoleId}
              onChange={e => setSelectedRoleId(e.target.value)}
              disabled={rolesLoading || assigningRole}
              style={{ ...inputStyle, width: '100%', minWidth: '100%', cursor: rolesLoading || assigningRole ? 'not-allowed' : 'pointer', marginBottom: 14 }}
            >
              <option value="">اختر من قائمة الأدوار</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name} ({role.key})</option>
              ))}
            </select>

            {selectedRoleId ? (
              <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: BRAND.radiusMd, background: T.inputBg, border: `1px solid ${T.borderCol}` }}>
                {roles.filter(r => String(r.id) === String(selectedRoleId)).map(role => (
                  <div key={role.id}>
                    <div style={{ fontSize: 14, fontWeight: BRAND.weightBlack, color: T.textCol, marginBottom: 6 }}>{role.name}</div>
                    {role.description ? <div style={{ fontSize: 12, color: T.subCol, marginBottom: 8 }}>{role.description}</div> : null}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(role.permissions || []).length ? (
                        role.permissions!.map(perm => (
                          <span key={perm} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, background: 'rgba(140,20,40,0.08)', color: BRAND.crimson, fontWeight: BRAND.weightBold }}>{perm}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: T.subCol }}>لا توجد صلاحيات ظاهرة لهذا الدور.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="primary" disabled={!selectedRoleId || assigningRole} onClick={assignRoleToUser}>
                {assigningRole ? 'جارٍ الحفظ...' : 'حفظ الدور'}
              </Button>
              <Button variant="danger" disabled={!selectedUser.assigned_role_id || assigningRole} onClick={removeAssignedRole}>
                إزالة الدور
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {stageModalOpen && stageModalUser ? (
        <div
          onClick={closeStageModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(31,18,21,0.4)', backdropFilter: 'blur(6px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="fade-in"
            style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: T.cardBg, borderRadius: BRAND.radiusXl, border: `1.5px solid ${T.borderCol}`, boxShadow: BRAND.shadow, padding: 22 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: T.textCol, marginBottom: 6 }}>
                  تحديد المرحلة والصف
                </div>
                <div style={{ fontSize: 13, color: T.subCol }}>{stageModalUser.email}</div>
              </div>
              <Button variant="ghost" size="sm" disabled={savingStage} onClick={closeStageModal}>إغلاق</Button>
            </div>

            <div style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: T.subCol, marginBottom: 8 }}>المرحلة</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {(Object.keys(STAGE_LABELS) as StageKey[]).map(stage => (
                <button
                  key={stage}
                  onClick={() => setModalStage(stage)}
                  style={{
                    padding: '10px 16px', borderRadius: 999,
                    border: modalStage === stage ? `2px solid ${BRAND.crimson}` : `1px solid ${T.borderCol}`,
                    background: modalStage === stage ? 'rgba(140,20,40,0.08)' : 'transparent',
                    color: modalStage === stage ? BRAND.crimson : T.textCol,
                    fontWeight: BRAND.weightBold, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                  }}
                >
                  {STAGE_LABELS[stage]}
                </button>
              ))}
            </div>

            {modalStage && (
              <>
                <div style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: T.subCol, marginBottom: 8 }}>الصف</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {GRADES_BY_STAGE[modalStage].map(g => (
                    <button
                      key={g.id}
                      onClick={() => setModalGrade(g.id)}
                      style={{
                        padding: '10px 16px', borderRadius: 999,
                        border: modalGrade === g.id ? `2px solid ${BRAND.crimson}` : `1px solid ${T.borderCol}`,
                        background: modalGrade === g.id ? 'rgba(140,20,40,0.08)' : 'transparent',
                        color: modalGrade === g.id ? BRAND.crimson : T.textCol,
                        fontWeight: BRAND.weightBold, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {(modalGrade === '11' || modalGrade === '12') && (
              <>
                <div style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: T.subCol, marginBottom: 8 }}>التشعيب</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                  {(Object.keys(TRACK_LABELS) as TrackKey[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setModalTrack(t)}
                      style={{
                        padding: '10px 18px', borderRadius: 999,
                        border: modalTrack === t ? `2px solid ${BRAND.crimson}` : `1px solid ${T.borderCol}`,
                        background: modalTrack === t ? 'rgba(140,20,40,0.08)' : 'transparent',
                        color: modalTrack === t ? BRAND.crimson : T.textCol,
                        fontWeight: BRAND.weightBold, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                      }}
                    >
                      {TRACK_LABELS[t]}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              <Button variant="primary" disabled={savingStage || !modalStage || !modalGrade} onClick={() => saveStageAssignment(stageModalUser.status === 'pending')}>
                {savingStage ? 'جارٍ الحفظ...' : stageModalUser.status === 'pending' ? '✅ حفظ واعتماد الطالب' : '💾 حفظ'}
              </Button>
              <Button variant="ghost" disabled={savingStage} onClick={closeStageModal}>إلغاء</Button>
            </div>
          </div>
        </div>
      ) : null}

      {subscriptionsModalUser && subscriptionsAccessToken ? (
        <StudentSubscriptionsModal
          studentId={subscriptionsModalUser.id}
          studentEmail={subscriptionsModalUser.email}
          studentName={subscriptionsModalUser.full_name ?? null}
          stage={(subscriptionsModalUser.allowed_stages?.[0] as StageKey) ?? null}
          grade={subscriptionsModalUser.allowed_grades?.[0] ?? null}
          track={(subscriptionsModalUser.track as TrackKey) ?? null}
          accessToken={subscriptionsAccessToken}
          onClose={closeSubscriptionsModal}
        />
      ) : null}

      {showAddTeacher ? (
        <AddTeacherModal
          accessToken={adminAccessToken ?? ''}
          onClose={() => setShowAddTeacher(false)}
          onCreated={() => {
            setShowAddTeacher(false)
            onUsersReload()
            setActionMsg('✅ تمت إضافة المعلم.')
            setTimeout(() => setActionMsg(''), 2500)
          }}
        />
      ) : null}

      {showAddStudent ? (
        <AddStudentModal
          open={showAddStudent}
          accessToken={adminAccessToken ?? ''}
          onClose={() => setShowAddStudent(false)}
          onCreated={() => {
            setShowAddStudent(false)
            onUsersReload()
            setActionMsg('✅ تمت إضافة الطالب.')
            setTimeout(() => setActionMsg(''), 2500)
          }}
        />
      ) : null}

      {showAddParent ? (
        <AddParentModal
          accessToken={adminAccessToken ?? ''}
          onClose={() => setShowAddParent(false)}
          onCreated={() => {
            setShowAddParent(false)
            setActionMsg('✅ تم إنشاء حساب ولي الأمر.')
            setTimeout(() => setActionMsg(''), 2500)
          }}
        />
      ) : null}

      {assignSubjectsFor ? (
        <AssignSubjectsModal
          teacherId={assignSubjectsFor.id}
          teacherEmail={assignSubjectsFor.email}
          accessToken={adminAccessToken ?? ''}
          onClose={() => {
            setAssignSubjectsFor(null)
            onUsersReload()
          }}
        />
      ) : null}

      {assignScopeFor ? (
        <AssignScopeModal
          teacherId={assignScopeFor.id}
          teacherEmail={assignScopeFor.email}
          accessToken={adminAccessToken ?? ''}
          onClose={() => {
            setAssignScopeFor(null)
            onUsersReload()
          }}
        />
      ) : null}
    </>
  )
}