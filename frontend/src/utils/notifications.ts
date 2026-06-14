import { db, newProfile } from '../db/index'
import { generateOutfits } from '../services/outfitEngine'
import { interpretProfile } from '../services/profileInterpreter'
import { STRINGS } from '../constants/strings'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return false
  await navigator.serviceWorker.register('/sw.js')
  return true
}

export function scheduleOutfitReminder() {
  const now = new Date()
  const next8 = new Date(now)
  next8.setHours(8, 0, 0, 0)
  if (next8 <= now) next8.setDate(next8.getDate() + 1)
  const msUntil8 = next8.getTime() - now.getTime()
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('Style Assistant 👗', {
        body: 'Was trägst du heute? Dein Outfit des Tages wartet!',
        icon: '/icon.png',
      })
    }
    setInterval(() => {
      if (Notification.permission === 'granted') {
        new Notification('Style Assistant 👗', {
          body: 'Was trägst du heute? Dein Outfit des Tages wartet!',
        })
      }
    }, 24 * 60 * 60 * 1000)
  }, msUntil8)
}

// ─── Feature 3: Morning Briefing ────────────────────────────────────────────

const BRIEFING_KEY = 'morningBriefingEnabled'
const BRIEFING_TIME_KEY = 'morningBriefingTime'
const BRIEFING_LAST_SENT_KEY = 'morningBriefingLastSent'

let _briefingTimerId: ReturnType<typeof setTimeout> | null = null
let _briefingIntervalId: ReturnType<typeof setInterval> | null = null

export async function generateBriefingPayload(): Promise<string> {
  try {
    const allItems = await db.clothing_items.filter(i => i.is_active === true).toArray()
    if (allItems.length < 5) return STRINGS.notifications.briefingBodyFallback

    const profiles = await db.profile.toArray()
    const profile = profiles[0] ?? newProfile()
    const rules = interpretProfile(profile as any)
    const outfits = generateOutfits(allItems, 'casual', undefined, 1, profile as any, rules)

    if (!outfits.length) return STRINGS.notifications.briefingBodyFallback

    const best = outfits[0]
    const outfitItems = best.item_ids
      .map((id: number) => allItems.find(i => i.id === id))
      .filter(Boolean)

    const top    = outfitItems.find((i: any) => i.category === 'tops')
    const bottom = outfitItems.find((i: any) => i.category === 'bottoms')
    const shoe   = outfitItems.find((i: any) => i.category === 'shoes')

    if (!top || !bottom || !shoe) return STRINGS.notifications.briefingBodyFallback

    const score = Math.round((best.score ?? 0) * 100)
    const text = STRINGS.notifications.briefingFormat(
      `${top.color_primary} ${top.subcategory?.replace(/_/g, ' ') ?? top.category}`,
      `${bottom.color_primary} ${bottom.subcategory?.replace(/_/g, ' ') ?? bottom.category}`,
      `${shoe.color_primary} ${shoe.subcategory?.replace(/_/g, ' ') ?? shoe.category}`,
      score,
    )
    return text.slice(0, 60)
  } catch {
    return STRINGS.notifications.briefingBodyFallback
  }
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fireBriefing() {
  if (Notification.permission !== 'granted') return
  const lastSent = localStorage.getItem(BRIEFING_LAST_SENT_KEY)
  if (lastSent === todayKey()) return  // already sent today

  const body = await generateBriefingPayload()
  new Notification(STRINGS.notifications.briefingTitle, {
    body,
    icon: '/icon-192.png',
    data: { url: '/' },
  })
  localStorage.setItem(BRIEFING_LAST_SENT_KEY, todayKey())
}

export function scheduleMorningBriefing(hour = 7, minute = 30) {
  cancelMorningBriefing()

  const now = new Date()
  const target = new Date(now)
  target.setHours(hour, minute, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  const msUntil = target.getTime() - now.getTime()

  _briefingTimerId = setTimeout(async () => {
    await fireBriefing()
    _briefingIntervalId = setInterval(fireBriefing, 24 * 60 * 60 * 1000)
  }, msUntil)
}

export function cancelMorningBriefing() {
  if (_briefingTimerId   != null) { clearTimeout(_briefingTimerId);   _briefingTimerId   = null }
  if (_briefingIntervalId != null) { clearInterval(_briefingIntervalId); _briefingIntervalId = null }
}

/** Call once on app start — re-arms the briefing if it was previously enabled. */
export function rehydrateMorningBriefing() {
  const enabled = localStorage.getItem(BRIEFING_KEY) === 'true'
  if (!enabled) return
  const [h, m] = (localStorage.getItem(BRIEFING_TIME_KEY) ?? '7:30').split(':').map(Number)
  scheduleMorningBriefing(h, m)
}

export function saveBriefingPrefs(enabled: boolean, hour: number, minute: number) {
  localStorage.setItem(BRIEFING_KEY, String(enabled))
  localStorage.setItem(BRIEFING_TIME_KEY, `${hour}:${minute}`)
}

export function loadBriefingPrefs(): { enabled: boolean; hour: number; minute: number } {
  const enabled = localStorage.getItem(BRIEFING_KEY) === 'true'
  const [h, m] = (localStorage.getItem(BRIEFING_TIME_KEY) ?? '7:30').split(':').map(Number)
  return { enabled, hour: h ?? 7, minute: m ?? 30 }
}
