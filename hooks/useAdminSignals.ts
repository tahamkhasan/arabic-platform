'use client'
import { useCallback, useEffect, useState } from 'react'
import type { PlatformSignal } from '@/types/admin.types'

export function useAdminSignals(params: {
  authorized: boolean
  admin: any
  adminAccessToken: string | null
  tab: string
  setActionMsg: (msg: string) => void
}) {
  const { authorized, admin, adminAccessToken, tab, setActionMsg } = params
  const [signals, setSignals] = useState<PlatformSignal[]>([])
  const [signalsLoading, setSignalsLoading] = useState(false)
  const [resolvingSignalId, setResolvingSignalId] = useState<string | null>(null)

  useEffect(() => {
    if (!authorized || !admin || tab !== 'signals') return

    let mounted = true

    async function loadSignals() {
      try {
        setSignalsLoading(true)

        if (!adminAccessToken) return

        const res = await fetch('/api/admin/signals', {
          headers: { Authorization: `Bearer ${adminAccessToken}` },
        })

        const data = await res.json().catch(() => null)
        if (!mounted) return

        if (res.ok) setSignals(data?.data?.signals ?? data?.signals ?? [])
        else setActionMsg(`❌ ${data?.error || 'تعذر تحميل الإشارات.'}`)
      } catch {
        if (mounted) setActionMsg('❌ تعذر الاتصال بالخادم لجلب الإشارات.')
      } finally {
        if (mounted) setSignalsLoading(false)
      }
    }

    void loadSignals()

    return () => {
      mounted = false
    }
  }, [authorized, admin, adminAccessToken, tab, setActionMsg])

  const resolveSignal = useCallback(
    async (signalId: string, status: 'dismissed' | 'action_taken') => {
      try {
        setResolvingSignalId(signalId)

        if (!adminAccessToken) return

        const res = await fetch('/api/admin/signals', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminAccessToken}`,
          },
          body: JSON.stringify({ signal_id: signalId, status }),
        })

        const data = await res.json().catch(() => null)

        if (res.ok) {
          setSignals(prev => prev.filter(s => s.id !== signalId))
          setActionMsg(status === 'dismissed' ? '✅ تم تجاهل الإشارة' : '✅ تم تسجيل التدخل')
          setTimeout(() => setActionMsg(''), 2500)
        } else {
          setActionMsg(`❌ ${data?.error || 'فشل تحديث الإشارة'}`)
        }
      } catch {
        setActionMsg('❌ حدث خطأ')
      } finally {
        setResolvingSignalId(null)
      }
    },
    [adminAccessToken, setActionMsg],
  )

  return { signals, signalsLoading, resolvingSignalId, resolveSignal }
}