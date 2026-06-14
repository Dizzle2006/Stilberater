const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'
const TOKEN_KEY = 'gca_token'
const TOKEN_EXPIRY_KEY = 'gca_token_expiry'

export type CalendarOccasion = 'office' | 'leisure' | 'event' | 'travel' | 'beach' | null

export interface CalendarEvent {
  title: string
  startTime: Date
}

const OCCASION_KEYWORDS: Array<{ words: string[]; occasion: CalendarOccasion }> = [
  { words: ['meeting', 'vorstand', 'board', 'client', 'kunde', 'call', 'review', 'standup'], occasion: 'office' },
  { words: ['dinner', 'restaurant', 'date', 'hochzeit', 'gala', 'party', 'feier', 'geburtstag'], occasion: 'event' },
  { words: ['gym', 'sport', 'training', 'workout', 'yoga', 'laufen', 'schwimmen'], occasion: null },
  { words: ['urlaub', 'reise', 'travel', 'trip', 'flug', 'hotel', 'konferenz', 'messe'], occasion: 'travel' },
  { words: ['strand', 'beach', 'pool', 'ibiza', 'mallorca', 'meer', 'see', 'baggersee'], occasion: 'beach' },
]

export function parseOccasion(title: string): CalendarOccasion {
  const lower = title.toLowerCase()
  for (const { words, occasion } of OCCASION_KEYWORDS) {
    if (words.some(w => lower.includes(w))) return occasion
  }
  return null
}

function getStoredToken(): string | null {
  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiry || Date.now() > Number(expiry)) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_EXPIRY_KEY)
      return null
    }
    return localStorage.getItem(TOKEN_KEY)
  } catch { return null }
}

function storeToken(token: string, expiresIn: number): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000))
  } catch {}
}

export function clearCalendarToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
  } catch {}
}

export function isCalendarConnected(): boolean {
  return getStoredToken() !== null
}

export async function requestCalendarAccess(): Promise<boolean> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  const enabled = import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED === 'true'
  if (!clientId || !enabled) return false

  return new Promise(resolve => {
    const redirectUri = window.location.origin + '/oauth-callback'
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: GOOGLE_CALENDAR_SCOPE,
      prompt: 'consent',
    })
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    const popup = window.open(url, 'google-oauth', 'width=480,height=600,left=200,top=100')

    const listener = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'google-oauth-token') {
        storeToken(e.data.access_token, e.data.expires_in ?? 3600)
        window.removeEventListener('message', listener)
        popup?.close()
        resolve(true)
      }
    }
    window.addEventListener('message', listener)

    // Timeout nach 3 Minuten
    setTimeout(() => {
      window.removeEventListener('message', listener)
      popup?.close()
      resolve(false)
    }, 180000)
  })
}

export async function getNextEvent(): Promise<CalendarEvent | null> {
  const token = getStoredToken()
  if (!token) return null

  try {
    const now = new Date().toISOString()
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const params = new URLSearchParams({
      timeMin: now,
      timeMax: in24h,
      maxResults: '3',
      singleEvents: 'true',
      orderBy: 'startTime',
    })
    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (resp.status === 401) { clearCalendarToken(); return null }
    if (!resp.ok) return null

    const data = await resp.json()
    const events: any[] = data.items ?? []
    if (!events.length) return null

    const first = events[0]
    return {
      title: first.summary ?? '',
      startTime: new Date(first.start?.dateTime ?? first.start?.date ?? now),
    }
  } catch { return null }
}
