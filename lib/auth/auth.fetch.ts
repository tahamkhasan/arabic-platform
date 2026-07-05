import { getCurrentSession, signOutApp } from './auth.session'

type ApiFetchOptions = RequestInit & {
  auth?: boolean
  json?: boolean
}

export async function apiFetch(url: string, options: ApiFetchOptions = {}) {
  const { auth = true, json = true, headers, ...rest } = options

  const finalHeaders = new Headers(headers || {})

  if (json && !finalHeaders.has('Content-Type') && !(rest.body instanceof FormData)) {
    finalHeaders.set('Content-Type', 'application/json')
  }

  if (auth) {
    const { accessToken } = await getCurrentSession()
    if (!accessToken) {
      await signOutApp()
      throw new Error('UNAUTHENTICATED')
    }
    finalHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
  })

  if (response.status === 401) {
    await signOutApp()
    throw new Error('UNAUTHENTICATED')
  }

  return response
}