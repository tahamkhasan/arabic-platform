export type UnitItem = {
  id: string
  subject_id: string
  name: string
  description: string | null
  icon: string
  order_num: number
  is_active: boolean
  created_at?: string | null
}

export type UnitFormState = {
  name: string
  description: string
  icon: string
  order_num: number
  is_active: boolean
}

export const emptyUnitForm: UnitFormState = {
  name: '',
  description: '',
  icon: '📖',
  order_num: 1,
  is_active: true,
}

export function formFromUnit(unit: UnitItem): UnitFormState {
  return {
    name: unit.name || '',
    description: unit.description || '',
    icon: unit.icon || '📖',
    order_num: unit.order_num ?? 1,
    is_active: unit.is_active !== false,
  }
}