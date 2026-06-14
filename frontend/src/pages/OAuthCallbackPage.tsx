import { useEffect } from 'react'

export default function OAuthCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const expires_in = Number(params.get('expires_in') ?? 3600)
    if (access_token && window.opener) {
      window.opener.postMessage(
        { type: 'google-oauth-token', access_token, expires_in },
        window.location.origin,
      )
    }
  }, [])
  return null
}
