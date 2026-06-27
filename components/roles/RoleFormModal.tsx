'use client'

import { cardStyle, inputStyle, labelStyle, T } from '../../lib/roles-page-styles'
import type { RoleFormState, RoleItem } from '../../types/roles'

type Props = {
  open: boolean
  form: RoleFormState
  editingRole: RoleItem | null
  saving: boolean
  deleting: boolean
  onClose: () => void
  onSubmit: () => void
  onChange: <K extends keyof RoleFormState>(key: K, value: RoleFormState[K]) => void
}

export default function RoleFormModal({
  open,
  form,
  editingRole,
  saving,
  deleting,
  onClose,
  onSubmit,
  onChange,
}: Props) {
  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,18,33,0.34)',
        backdropFilter: 'blur(6px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 720,
          ...cardStyle,
          padding: 22,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: T.primary,
                marginBottom: 6,
              }}
            >
              {editingRole ? 'تعديل الدور' : 'إضافة دور جديد'}
            </div>
            <div style={{ fontSize: 13, color: T.subCol }}>
              {editingRole
                ? 'يمكنك تعديل الاسم والوصف والصلاحيات وحالة التفعيل.'
                : 'أدخل بيانات الدور كما ستُستخدم داخل النظام والـ APIs.'}
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving || deleting}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: `1px solid ${T.borderCol}`,
              background: '#fff',
              color: T.subCol,
              fontWeight: 800,
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          >
            إغلاق
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div>
            <label style={labelStyle}>مفتاح الدور</label>
            <input
              value={form.key}
              onChange={(e) => onChange('key', e.target.value)}
              placeholder="admin / supervisor / teacher"
              style={inputStyle}
              disabled={saving}
            />
          </div>

          <div>
            <label style={labelStyle}>اسم الدور</label>
            <input
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="المدير العام"
              style={inputStyle}
              disabled={saving}
            />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>الوصف</label>
          <textarea
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="وصف مختصر يوضح وظيفة هذا الدور داخل المنصة"
            style={{
              ...inputStyle,
              minHeight: 96,
              resize: 'vertical',
            }}
            disabled={saving}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>الصلاحيات (كل صلاحية في سطر مستقل)</label>
          <textarea
            value={form.permissionsText}
            onChange={(e) => onChange('permissionsText', e.target.value)}
            placeholder={`manage_users\nmanage_subjects\nview_reports`}
            style={{
              ...inputStyle,
              minHeight: 140,
              resize: 'vertical',
              lineHeight: 1.8,
            }}
            disabled={saving}
          />
        </div>

        <div
          style={{
            marginBottom: 20,
            padding: '12px 14px',
            borderRadius: 12,
            background: T.inputBg,
            border: `1px solid ${T.borderCol}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: T.textCol }}>
              حالة الدور
            </div>
            <div style={{ fontSize: 12, color: T.subCol }}>
              يمكن تعطيل الدور دون حذفه.
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 800,
              color: T.textCol,
            }}
          >
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => onChange('is_active', e.target.checked)}
              disabled={saving}
            />
            الدور نشط
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={onSubmit}
            disabled={saving}
            style={{
              flex: 1,
              minWidth: 180,
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
              color: '#fff',
              fontWeight: 900,
              fontSize: 14,
              boxShadow: '0 10px 22px rgba(192,57,43,0.24)',
              opacity: saving ? 0.8 : 1,
              fontFamily: 'inherit',
            }}
          >
            {saving ? 'جارٍ الحفظ...' : editingRole ? 'حفظ التعديلات' : 'إنشاء الدور'}
          </button>

          <button
            onClick={onClose}
            disabled={saving}
            style={{
              minWidth: 140,
              padding: '12px 16px',
              borderRadius: 12,
              border: `1.5px solid ${T.borderCol}`,
              background: '#fff',
              color: T.textCol,
              fontWeight: 800,
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}