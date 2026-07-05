import { supabase } from '@/lib/supabase'
import { clearStoredAuth, writeStoredUser } from './auth.storage'
import { normalizeUser } from './auth.normalize'
import type { AppUser } from './auth.types'

export interface CurrentSessionResult {
  user: AppUser | null
  accessToken: string | null
}

export async function getCurrentSession(): Promise<CurrentSessionResult> {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session?.access_token) {
      clearStoredAuth()
      return { user: null, accessToken: null }
    }

    const accessToken = data.session.access_token

    const meRes = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const meData = await meRes.json().catch(() => null)
    const user = normalizeUser(meData?.user)

    if (!meRes.ok || !user) {
      clearStoredAuth()
      return { user: null, accessToken: null }
    }

    writeStoredUser(user)
    return { user, accessToken }
  } catch {
    clearStoredAuth()
    return { user: null, accessToken: null }
  }
}

export async function signOutApp() {
  try {
    await supabase.auth.signOut()
  } finally {
    clearStoredAuth()
  }
}