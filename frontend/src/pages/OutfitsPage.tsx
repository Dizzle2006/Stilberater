import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { OutfitGenerationParams } from '../services/intentParser'
import { api } from '../utils/api'
import { tempToSeason } from '../services/weather'
import { computeOutfitWeatherTags, type WeatherTag, analyzeWardrobeGaps } from '../services/outfitEngine'
import { useWardrobeStore } from '../store/wardrobe'
import OutfitCard from '../components/outfits/OutfitCard'
import OutfitCreator from '../components/outfits/OutfitCreator'
import { Heart, Layers, Shirt, Plus, RefreshCw, CalendarDays, CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'
import WeekCalendar from '../components/WeekCalendar'
import { getNextEvent, parseOccasion, isCalendarConnected, requestCalendarAccess } from '../services/calendarService'
import { db } from '../db/index'
import { checkSeasonShift, snoozeSeasonBanner, type SeasonShift } from '../services/seasonDetectionService'
import { STRINGS } from '../constants/strings'

type Tab = 'alle' | 'eigene' | 'favoriten' | 'wochenplan'

interface Weather {
  temperature_c: number
  description: string
  layer_advice?: string
  needs_umbrella?: boolean
  season?: string
  weather_code?: number
}

function weatherIcon(code: number | undefined): string {
  if (code === undefined) return '🌡️'
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code < 58) return '🌫️'
  if (code < 68) return '🌧️'
  if (code < 78) return '❄️'
  if (code < 83) return '🌦️'
  if (code < 100) return '⛈️'
  return '🌡️'
}

function HangerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" strokeWidth={1.5} />
      <path d="M12 4v4" />
      <path d="M3 19l9-9 9 9" />
      <path d="M2 19h20" strokeWidth={2} />
    </svg>
  )
}

const COLOR_OPTIONS = [
  { label: 'Schwarz', hex: '#141414', names: ['black', 'charcoal', 'anthracite'] },
  { label: 'Weiß',   hex: '#F5F5F0', names: ['white', 'cream', 'ivory'] },
  { label: 'Grau',   hex: '#969696', names: ['grey', 'gray'] },
  { label: 'Marine', hex: '#1a2744', names: ['navy', 'midnight blue'] },
  { label: 'Beige',  hex: '#C9B49A', names: ['beige', 'sand', 'camel', 'tan'] },
  { label: 'Braun',  hex: '#6D4C41', names: ['brown', 'dark brown', 'light brown'] },
  { label: 'Grün',   hex: '#3d7a5a', names: ['olive', 'green', 'forest green', 'sage', 'khaki'] },
  { label: 'Blau',   hex: '#5578A0', names: ['blue', 'light blue', 'cobalt', 'denim blue', 'slate'] },
]

// Mappt aktuelles Wetter auf WeatherTag-Vokabular für Outfit-Matching
function _currentWeatherToTags(w: Weather): WeatherTag[] {
  const tags: WeatherTag[] = []
  const t = w.temperature_c
  if      (t >= 27) { tags.push('heiss'); tags.push('warm') }
  else if (t >= 20) { tags.push('warm');  tags.push('mild') }
  else if (t >= 14) { tags.push('mild');  tags.push('kuehl') }
  else if (t >= 8)  { tags.push('kuehl'); tags.push('mild') }
  else              { tags.push('kalt');  tags.push('kuehl') }
  const code = w.weather_code ?? 0
  if (w.needs_umbrella || (code >= 61 && code <= 82)) tags.push('regen')
  if (code === 0 || code === 1) tags.push('sonnig')
  return tags
}

const OCC_OPTIONS = [
  { key: '',                   label: 'Alle Anlässe'  },
  { key: 'casual',             label: 'Casual'        },
  { key: 'office_casual',      label: 'Business'      },
  { key: 'office_formal',      label: 'Formell'       },
  { key: 'social_events',      label: 'Gesellschaft.' },
  { key: 'leisure',            label: 'Freizeit'      },
  { key: 'special_occasions',  label: 'Besonderer Anlass' },
]

const SHOE_OPTIONS = [
  { key: '',               label: 'Alle Schuhe'    },
  { key: 'loafer',         label: 'Loafer'         },
  { key: 'penny_loafer',   label: 'Penny Loafer'   },
  { key: 'chelsea_boot',   label: 'Chelsea Boot'   },
  { key: 'chukka_boot',    label: 'Chukka Boot'    },
  { key: 'derby',          label: 'Derby'          },
  { key: 'oxford_schuh',   label: 'Oxford'         },
  { key: 'brogue',         label: 'Brogue'         },
  { key: 'monkstrap',      label: 'Monkstrap'      },
  { key: 'sneaker_minimal',label: 'Sneaker'        },
]

const TOP_OPTIONS = [
  { key: '',                    label: 'Alle Oberteile'      },
  { key: 'oxford_hemd',         label: 'Oxford-Hemd'         },
  { key: 'leinenhemd',          label: 'Leinenhemd'          },
  { key: 'poloshirt',           label: 'Polo'                },
  { key: 'strickpullover_rund', label: 'Pullover Rundhals'   },
  { key: 'strickpullover_v',    label: 'Pullover V-Neck'     },
  { key: 'rollkragen',          label: 'Rollkragen'          },
  { key: 'strickjacke',         label: 'Strickjacke'         },
  { key: 'strickweste',         label: 'Strickweste'         },
  { key: 't_shirt',             label: 'T-Shirt'             },
]

const BOTTOM_OPTIONS = [
  { key: '',            label: 'Alle Hosen'        },
  { key: 'chino',       label: 'Chino'             },
  { key: 'jeans_dunkel',label: 'Jeanshose'         },
  { key: 'anzughose',   label: 'Anzughose'         },
  { key: 'flanellhose', label: 'Flanellhose'       },
  { key: 'cord_hose',   label: 'Cordhose'          },
  { key: 'leinenhose',  label: 'Leinenhose'        },
]

// Gap 1: "Heute ich bin bei…" Chips
const CONTEXT_CHIPS = [
  { key: 'office',   label: 'Büro',     emoji: '💼' },
  { key: 'leisure',  label: 'Freizeit', emoji: '🌿' },
  { key: 'event',    label: 'Event',    emoji: '🥂' },
  { key: 'travel',   label: 'Reise',    emoji: '✈️' },
  { key: 'beach',    label: 'Strand',   emoji: '🌊' },
] as const

export type ContextOccasion = typeof CONTEXT_CHIPS[number]['key'] | null

const OCCASION_LABEL: Record<string, string> = {
  office: 'Büro', event: 'Event', leisure: 'Freizeit', travel: 'Reise', beach: 'Strand',
}

export default function OutfitsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { items, fetch: fetchItems } = useWardrobeStore()
  // Intent-Parameter aus route state (SESSION-ONLY — nie in Profil schreiben)
  const [intentParams, setIntentParams] = useState<OutfitGenerationParams | null>(
    () => (location.state as any)?.intentParams ?? null
  )
  const [intentBoardName, setIntentBoardName] = useState<string | null>(
    () => (location.state as any)?.boardName ?? null
  )
  const [outfits, setOutfits]              = useState<any[]>([])
  const [loading, setLoading]              = useState(false)
  const [hasGenerated, setHasGenerated]    = useState(false)
  const [tab, setTab]                      = useState<Tab>('alle')
  const [occasion, setOccasion]            = useState('')
  // Single active-filter state: which filter sheet is open
  type ActiveFilter = 'color' | 'occasion' | 'shoes' | 'tops' | 'bottoms' | null
  const [activeFilter, setActiveFilter]       = useState<ActiveFilter>(null)
  const [colorFilter, setColorFilter]         = useState('')
  const [shoeFilter, setShoeFilter]           = useState('')
  const [topFilter, setTopFilter]             = useState('')
  const [bottomFilter, setBottomFilter]       = useState('')
  const [showCreator, setShowCreator]      = useState(false)
  const [weather, setWeather]              = useState<Weather | null>(null)
  const [showWeatherRecs, setShowWeatherRecs] = useState(false)
  // Gap 1: context chip state
  const [contextOccasion, setContextOccasion] = useState<ContextOccasion>(null)
  const [calendarEventTitle, setCalendarEventTitle] = useState<string | null>(null)
  const [isManualOverride, setIsManualOverride] = useState(false)
  const initialLoadDone = useRef(false)
  // Gap 3: Rebalancing Banner
  const [showRebalancingBanner, setShowRebalancingBanner] = useState(false)
  // Gap 8: Wardrobe Gaps
  const [wardrobeGaps, setWardrobeGaps] = useState<any[]>([])
  // Feature 5: Season shift detection
  const [seasonShift, setSeasonShift] = useState<SeasonShift | null>(null)
  // Feature 1: Calendar connect state
  const [calendarConnected, setCalendarConnected] = useState(isCalendarConnected())

  // Wetter laden — Geolocation mit IP-basiertem Fallback
  useEffect(() => {
    const load = (lat: number, lon: number) =>
      api.getWeather(lat, lon).then(setWeather).catch(() => {})

    const ipFallback = async () => {
      try {
        const r = await fetch('https://ipapi.co/json/')
        const d = await r.json()
        if (d.latitude && d.longitude) load(d.latitude, d.longitude)
        else load(53.5753, 10.0153)
      } catch {
        load(53.5753, 10.0153)
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => load(pos.coords.latitude, pos.coords.longitude),
        ipFallback,
      )
    } else {
      ipFallback()
    }
  }, [])

  // Feature 1: Kalender-Event laden + Occasion-Chip auto-setzen
  const loadCalendarEvent = async () => {
    if (!isCalendarConnected()) return
    const event = await getNextEvent()
    if (!event || isManualOverride) return
    const occ = parseOccasion(event.title)
    if (occ) {
      setContextOccasion(occ)
      setCalendarEventTitle(event.title)
    }
  }

  useEffect(() => { loadCalendarEvent() }, [])

  // Items laden + gespeicherte Outfits aus DB laden + Gap 3: Rebalancing-Check
  useEffect(() => {
    const init = async () => {
      await fetchItems()
      try {
        const saved = await api.getOutfits()
        if (saved.length > 0) {
          setOutfits(saved)
          setHasGenerated(true)
        }
      } catch {}
      // Gap 3: Startup-Check ob Rebalancing fällig
      try {
        const { isDue, trend } = await api.checkRebalancingStatus()
        if (isDue && trend.hasTrend) setShowRebalancingBanner(true)
      } catch {}
      // Feature 5: Season shift — check once per day
      const shift = checkSeasonShift()
      if (shift) setSeasonShift(shift)
      initialLoadDone.current = true
    }
    init()
  }, [])

  // Gap 1: auto-regen when contextOccasion chip changes (skip on first mount)
  useEffect(() => {
    if (!initialLoadDone.current) return
    if (canGenerate) generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextOccasion])

  const generate = async () => {
    setLoading(true)
    try {
      const weatherSeason = weather ? tempToSeason(weather.temperature_c) : undefined
      const rainPriority  = !!(weather as any)?.rain_priority

      let res: any[]
      if (intentParams) {
        // Intent-basierter Flow: temporäre Profil-Overrides, nicht persistiert
        const merged: OutfitGenerationParams = {
          ...intentParams,
          rain_priority: intentParams.rain_priority || rainPriority,
        }
        res = await api.generateOutfitsWithIntent(merged, undefined, 50)
      } else {
        res = await api.generateOutfits(occasion || undefined, undefined, 50, contextOccasion ?? undefined, rainPriority)
      }
      setOutfits(res)
      setHasGenerated(true)
      // Blueprint v2.0 Phase 5: Graceful-Degradation-Feedback
      const degradationLevel = (res as any)._degradationLevel as 0 | 1 | 2 | 3 | undefined
      if (res.length === 0) {
        // Gap 8: Wardrobe-Gap-Analyse wenn Pool leer (Stufe 3)
        const gaps = await api.getWardrobeGaps().catch(() => [] as any[])
        setWardrobeGaps(gaps.slice(0, 3))
        toast('Kleiderschrank fast ausgeschöpft — neue Teile hinzufügen?', { icon: '👔', duration: 4000 })
      } else if ((degradationLevel ?? 0) >= 2) {
        // Gap 8: Wardrobe-Gap-Analyse bei Degradation Stufe 2 (< 10% Pool)
        const [dbItems, profiles] = await Promise.all([
          db.clothing_items.filter(i => i.is_active === true).toArray(),
          db.profile.toArray(),
        ])
        const profile = profiles[0]
        const activeStyles = profile?.active_styles ?? []
        const gaps = analyzeWardrobeGaps(dbItems, activeStyles)
        setWardrobeGaps(gaps.slice(0, 3))
        toast('Fast alle Kombinationen entdeckt — neue Teile erweitern die Auswahl.', { icon: '✦', duration: 3500 })
      } else if (res.length < 4) {
        toast('Fast alle Kombinationen entdeckt — neue Teile erweitern die Auswahl.', { icon: '✦', duration: 3500 })
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Fehler beim Generieren')
    } finally {
      setLoading(false)
    }
  }

  const handleOutfitDeleted = (id: number) => setOutfits(prev => prev.filter(o => o.id !== id))
  const handleOutfitUpdated = (updated: any) =>
    setOutfits(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))

  const handleOutfitCreated = (outfit: any) => {
    setOutfits(prev => [outfit, ...prev])
    setShowCreator(false)
    setTab('eigene')
  }

  const canGenerate = items.length >= 3

  // #7: Heute und gestern im Wochenplan eingeplante Outfit-IDs ans Ende sortieren
  const recentlyPlannedIds = useMemo(() => {
    const cal = JSON.parse(localStorage.getItem('outfitCalendar') || '{}')
    const result = new Set<number>()
    const now = new Date()
    for (let daysBack = 0; daysBack <= 1; daysBack++) {
      const d = new Date(now)
      d.setDate(d.getDate() - daysBack)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      if (cal[key] != null) result.add(Number(cal[key]))
    }
    return result
  }, [outfits])

  const displayed = useMemo(() => {
    const filtered = outfits.filter(o => {
      if (tab === 'favoriten' && !o.is_favourite) return false
      if (tab === 'eigene'    && o.is_ai_generated) return false
      if (occasion && o.occasion !== occasion) return false
      if (colorFilter) {
        const option = COLOR_OPTIONS.find(c => c.hex === colorFilter)
        if (option) {
          const outfitItems = items.filter(i => (o.item_ids || []).includes(i.id))
          const hasColor = outfitItems.some(i =>
            option.names.some(name =>
              (i.color_primary || '').toLowerCase().includes(name) ||
              (i.color_secondary || '').toLowerCase().includes(name)
            )
          )
          if (!hasColor) return false
        }
      }
      if (shoeFilter) {
        const outfitItems = items.filter(i => (o.item_ids || []).includes(i.id))
        if (!outfitItems.some(i => i.category === 'shoes' && i.subcategory === shoeFilter)) return false
      }
      if (topFilter) {
        const outfitItems = items.filter(i => (o.item_ids || []).includes(i.id))
        if (!outfitItems.some(i => i.category === 'tops' && i.subcategory === topFilter)) return false
      }
      if (bottomFilter) {
        const outfitItems = items.filter(i => (o.item_ids || []).includes(i.id))
        if (!outfitItems.some(i => i.category === 'bottoms' && i.subcategory === bottomFilter)) return false
      }
      return true
    })
    // Kürzlich eingeplante Outfits ans Ende
    return [...filtered].sort((a, b) => {
      const aRecent = recentlyPlannedIds.has(a.id) ? 1 : 0
      const bRecent = recentlyPlannedIds.has(b.id) ? 1 : 0
      return aRecent - bRecent
    })
  }, [outfits, tab, occasion, colorFilter, shoeFilter, topFilter, bottomFilter, items, recentlyPlannedIds])

  const weatherRecommended = useMemo(() => {
    if (outfits.length === 0) return []
    if (!weather) return outfits

    const currentTags = _currentWeatherToTags(weather)
    return outfits
      .map(o => {
        const ois = items.filter(i => (o.item_ids || []).includes(i.id))
        const outfitTags = new Set(computeOutfitWeatherTags(ois))
        const hits = currentTags.filter(t => outfitTags.has(t)).length
        return { outfit: o, score: hits / Math.max(currentTags.length, 1) }
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.outfit)
  }, [outfits, items, weather])

  if (showCreator) {
    return (
      <OutfitCreator
        items={items}
        onCreated={handleOutfitCreated}
        onCancel={() => setShowCreator(false)}
      />
    )
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'alle',       label: 'Alle Outfits',  icon: <Layers size={20} strokeWidth={1.7} /> },
    { key: 'eigene',     label: 'Meine Outfits', icon: <HangerIcon size={20} /> },
    { key: 'favoriten',  label: 'Favoriten',     icon: <Heart size={20} strokeWidth={1.7} /> },
    { key: 'wochenplan', label: 'Wochenplan',    icon: <CalendarDays size={20} strokeWidth={1.7} /> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 44px) + 12px) 20px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1 }}>
          Outfits
        </h1>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
          <button
            onClick={generate}
            disabled={loading || !canGenerate}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: !canGenerate ? 0.4 : 1,
            }}
            title="Neu generieren"
          >
            <RefreshCw size={15} color="var(--muted)" style={loading ? { animation: 'spin 1s linear infinite' } : undefined} />
          </button>
          <button
            onClick={() => setShowCreator(true)}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--accent)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Outfit erstellen"
          >
            <Plus size={18} color="#fff" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Gap 3: ProfilUpdateBanner — erscheint wenn Rebalancing fällig + Trend erkannt */}
      {showRebalancingBanner && (
        <div style={{
          margin: '10px 20px 0',
          padding: '12px 16px',
          borderRadius: 14,
          background: 'var(--accent-light)',
          border: '1.5px solid var(--accent)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>✦</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
              Dein Stil entwickelt sich
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>
              Sollen wir dein Profil anpassen — basierend auf deinem Feedback der letzten Wochen?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={async () => {
                  await api.runWeeklyRebalancing().catch(() => {})
                  setShowRebalancingBanner(false)
                  toast.success('Profil angepasst ✦')
                }}
                style={{
                  padding: '7px 16px', borderRadius: 10,
                  background: 'var(--accent)', color: '#fff',
                  border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Ja, anpassen
              </button>
              <button
                onClick={() => setShowRebalancingBanner(false)}
                style={{
                  padding: '7px 16px', borderRadius: 10,
                  background: 'transparent', color: 'var(--muted)',
                  border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer',
                }}
              >
                Später
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intent-Banner — SESSION-ONLY, erscheint wenn Assistent Parameter übergeben hat */}
      {intentParams && (
        <div style={{
          margin: '10px 20px 0',
          padding: '10px 14px',
          borderRadius: 14,
          background: 'var(--accent-light)',
          border: '1.5px solid var(--accent)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>✦</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
              {intentBoardName
                ? intentBoardName
                : intentParams.occasion
                  ? `${STRINGS.assistant.intentBanner(intentParams.occasion)}`
                  : STRINGS.assistant.intentBanner(null)}
            </span>
            {intentParams.occasion && !intentBoardName && (
              <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>
                · {OCCASION_LABEL[intentParams.occasion] ?? intentParams.occasion}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setIntentParams(null)
              setIntentBoardName(null)
              // Neu generieren mit Standard-Profil
              setTimeout(generate, 0)
            }}
            style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff', border: 'none',
              fontSize: 16, lineHeight: 1, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
            title={STRINGS.assistant.resetFilter}
          >
            ×
          </button>
        </div>
      )}

      {/* Feature 5: SeasonShiftBanner */}
      {seasonShift && (
        <div style={{
          margin: '10px 20px 0',
          padding: '12px 16px',
          borderRadius: 14,
          background: 'var(--bg2)',
          border: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>
            {seasonShift === 'summer_to_autumn' ? '🍂' : '🌱'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
              {seasonShift === 'summer_to_autumn'
                ? STRINGS.season.bannerSummerToAutumn
                : STRINGS.season.bannerWinterToSpring}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setSeasonShift(null)
                  navigate(`/season-pause?shift=${seasonShift}`)
                }}
                style={{
                  padding: '7px 16px', borderRadius: 10,
                  background: 'var(--accent)', color: '#fff',
                  border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {STRINGS.season.adjustNow}
              </button>
              <button
                onClick={() => {
                  snoozeSeasonBanner()
                  setSeasonShift(null)
                }}
                style={{
                  padding: '7px 16px', borderRadius: 10,
                  background: 'transparent', color: 'var(--muted)',
                  border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer',
                }}
              >
                {STRINGS.season.remindLater}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        padding: '16px 20px 0',
        gap: 0,
        overflowX: 'auto',
        borderBottom: '1.5px solid var(--border)',
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: '0 0 auto',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: '0 16px 12px',
              background: 'transparent', border: 'none',
              borderBottom: `2.5px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
              marginBottom: -1.5,
              color: tab === t.key ? 'var(--accent)' : 'var(--muted2)',
              fontSize: 11, fontWeight: tab === t.key ? 600 : 400,
              cursor: 'pointer',
              transition: 'color 150ms',
              whiteSpace: 'nowrap',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Gap 1: Kontext-Chip-Bar "Heute:" — immer sichtbar, inline */}
      {tab !== 'wochenplan' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px 0', overflowX: 'auto' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Heute:
          </span>
          {CONTEXT_CHIPS.map(chip => {
            const active = contextOccasion === chip.key
            return (
              <button
                key={chip.key}
                onClick={() => {
                  setContextOccasion(active ? null : chip.key)
                  setIsManualOverride(true)
                  setCalendarEventTitle(null)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 12px', borderRadius: 20, flexShrink: 0,
                  background: active ? 'var(--accent)' : 'var(--bg2)',
                  border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  color: active ? '#fff' : 'var(--text)',
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', transition: 'all 150ms',
                }}
              >
                <span>{chip.emoji}</span>
                <span>{chip.label}</span>
              </button>
            )
          })}
          {/* Feature 1: Kalender-Icon + Hint wenn Chip aus Kalender gesetzt */}
          {calendarEventTitle && contextOccasion && !isManualOverride && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0, marginLeft: 4,
            }}
              title={STRINGS.calendar.chipHint(calendarEventTitle)}
            >
              <CalendarClock size={12} color="var(--muted)" />
              <span style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                {STRINGS.calendar.chipHint(calendarEventTitle)}
              </span>
            </div>
          )}
          {/* Feature 1: CalendarConnect — only when VITE_GOOGLE_CLIENT_ID is configured */}
          {import.meta.env.VITE_GOOGLE_CLIENT_ID && !calendarConnected && (
            <button
              onClick={() => {
                requestCalendarAccess().then(ok => {
                  if (ok) { setCalendarConnected(true); loadCalendarEvent() }
                })
              }}
              style={{
                fontSize: 11, padding: '4px 10px',
                borderRadius: 20, background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                flexShrink: 0,
              }}
            >
              <CalendarClock size={11} />
              {STRINGS.calendar.connectBtn}
            </button>
          )}
        </div>
      )}

      {/* Filter chips — scrollen horizontal, Auswahl öffnet ein Bottom Sheet (kein Dropdown-Clipping-Problem) */}
      {tab !== 'wochenplan' && (
        <div style={{ display: 'flex', gap: 8, padding: '14px 20px 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {([
            { id: 'color',   label: colorFilter   ? COLOR_OPTIONS.find(c => c.hex === colorFilter)?.label ?? 'Farbe'      : 'Farbe',     active: !!colorFilter   },
            { id: 'occasion',label: occasion       ? OCC_OPTIONS.find(o => o.key === occasion)?.label   ?? 'Anlass'    : 'Anlass',    active: !!occasion       },
            { id: 'shoes',   label: shoeFilter     ? SHOE_OPTIONS.find(s => s.key === shoeFilter)?.label  ?? 'Schuhe'    : 'Schuhe',    active: !!shoeFilter     },
            { id: 'tops',    label: topFilter      ? TOP_OPTIONS.find(t => t.key === topFilter)?.label    ?? 'Oberteile' : 'Oberteile', active: !!topFilter      },
            { id: 'bottoms', label: bottomFilter   ? BOTTOM_OPTIONS.find(b => b.key === bottomFilter)?.label ?? 'Hosen' : 'Hosen',     active: !!bottomFilter   },
          ] as { id: ActiveFilter; label: string; active: boolean }[]).map(chip => (
            <button
              key={chip.id!}
              onClick={() => setActiveFilter(chip.id)}
              style={{
                flexShrink: 0,
                padding: '7px 16px', borderRadius: 30,
                background: chip.active ? 'var(--accent-light)' : 'var(--bg2)',
                border: `1.5px solid ${chip.active ? 'var(--accent)' : 'var(--border)'}`,
                color: chip.active ? 'var(--accent)' : 'var(--text)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Filter Bottom Sheet — position:fixed, nicht vom overflowX-Container geclipt */}
      {activeFilter && (
        <>
          <div
            onClick={() => setActiveFilter(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.35)' }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--bg2)', borderRadius: '20px 20px 0 0',
            padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
            zIndex: 50, boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
            maxHeight: '70vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                { activeFilter === 'color'    ? 'Nach Farbe filtern'
                : activeFilter === 'occasion' ? 'Nach Anlass filtern'
                : activeFilter === 'shoes'    ? 'Nach Schuhen filtern'
                : activeFilter === 'tops'     ? 'Nach Oberteil filtern'
                :                               'Nach Hose filtern' }
              </span>
              <button onClick={() => setActiveFilter(null)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {activeFilter === 'color' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={() => { setColorFilter(''); setActiveFilter(null) }}
                  style={{
                    padding: '6px 16px', borderRadius: 20, fontSize: 13,
                    background: !colorFilter ? 'var(--accent)' : 'var(--bg3)',
                    color: !colorFilter ? '#fff' : 'var(--muted)',
                    border: `1.5px solid ${!colorFilter ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer', fontWeight: !colorFilter ? 600 : 400,
                  }}
                >Alle</button>
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => { setColorFilter(c.hex); setActiveFilter(null) }}
                    title={c.label}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: c.hex, border: `3px solid ${colorFilter === c.hex ? 'var(--accent)' : 'transparent'}`,
                      outline: '1.5px solid var(--border)', cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            )}

            {(activeFilter === 'occasion' || activeFilter === 'shoes' || activeFilter === 'tops' || activeFilter === 'bottoms') && (() => {
              const opts =
                activeFilter === 'occasion' ? OCC_OPTIONS.map(o => ({ key: o.key, label: o.label })) :
                activeFilter === 'shoes'    ? SHOE_OPTIONS :
                activeFilter === 'tops'     ? TOP_OPTIONS :
                                              BOTTOM_OPTIONS
              const current =
                activeFilter === 'occasion' ? occasion :
                activeFilter === 'shoes'    ? shoeFilter :
                activeFilter === 'tops'     ? topFilter :
                                              bottomFilter
              const setCurrent = (val: string) => {
                if (activeFilter === 'occasion') setOccasion(val)
                else if (activeFilter === 'shoes')  setShoeFilter(val)
                else if (activeFilter === 'tops')   setTopFilter(val)
                else                                setBottomFilter(val)
                setActiveFilter(null)
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {opts.map(o => (
                    <button
                      key={o.key}
                      onClick={() => setCurrent(o.key)}
                      style={{
                        padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                        background: current === o.key ? 'var(--accent-light)' : 'transparent',
                        border: `1.5px solid ${current === o.key ? 'var(--accent)' : 'transparent'}`,
                        color: current === o.key ? 'var(--accent)' : 'var(--text)',
                        fontSize: 14, fontWeight: current === o.key ? 600 : 400, cursor: 'pointer',
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )
            })()}
          </div>
        </>
      )}

      {/* Content */}
      <div style={{ flex: 1, padding: '14px 20px 20px' }}>
        {tab === 'wochenplan' ? (
          <div>
            {/* Wetter-Chip + Button ganz oben sichtbar */}
            {weather && (
              <div style={{
                padding: '10px 14px', borderRadius: 14,
                background: 'var(--bg2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 14,
              }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>
                  {weather ? weatherIcon(weather.weather_code) : '🌡️'}
                </span>
                <div style={{ flex: 1 }}>
                  {weather ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {Math.round(weather.temperature_c)}°C · {weather.description}
                        {weather.needs_umbrella && <span style={{ marginLeft: 5 }}>☂️</span>}
                      </div>
                      {weather.layer_advice && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{weather.layer_advice}</div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>Wetter wird geladen…</div>
                  )}
                </div>
                <button
                  onClick={() => setShowWeatherRecs(v => !v)}
                  style={{
                    fontSize: 12, fontWeight: 500,
                    background: showWeatherRecs ? 'var(--accent)' : 'var(--accent-light)',
                    border: '1px solid var(--accent)',
                    padding: '6px 14px', borderRadius: 20,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    color: showWeatherRecs ? '#fff' : 'var(--accent)',
                  } as React.CSSProperties}
                >
                  Outfits für heute
                </button>
              </div>
            )}

            {/* Wettergerechte Outfits — expandiert nach Klick */}
            {showWeatherRecs && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {weatherRecommended.length > 0
                      ? `${weatherRecommended.length} Outfit${weatherRecommended.length !== 1 ? 's' : ''} für heute`
                      : 'Keine passenden Outfits für dieses Wetter'}
                  </span>
                  {weatherRecommended.length > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                      {Math.round((weather?.temperature_c ?? 0))}°C · {weather?.description ?? ''}
                    </span>
                  )}
                </div>
                {weatherRecommended.length > 0 && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                    maxHeight: 560, overflowY: 'auto',
                    paddingRight: 2,
                  }}>
                    {weatherRecommended.map((o, idx) => (
                      <OutfitCard
                        key={o.id ?? idx}
                        outfit={o}
                        items={items}
                        onDeleted={handleOutfitDeleted}
                        onUpdated={handleOutfitUpdated}
                        rainActive={!!(weather as any)?.rain_priority}
                      />
                    ))}
                  </div>
                )}
                <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
              </div>
            )}

            <WeekCalendar outfits={outfits} items={items} />
            {/* Hinweis unterhalb des Kalenders, bündig am unteren Rand */}
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 16, lineHeight: 1.5, textAlign: 'center' }}>
              Plane deine Outfits für diese Woche — tippe auf <strong style={{ color: 'var(--text)' }}>„Heute tragen"</strong> im Outfit-Menü (⋯).
            </div>
          </div>

        ) : loading ? (
          /* Lade-Skelett */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton" style={{ height: 280, borderRadius: 20 }} />
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              Outfits werden berechnet…
            </div>
          </div>

        ) : !canGenerate ? (
          /* Zu wenig Kleidungsstücke */
          <div style={{
            textAlign: 'center', padding: '52px 24px',
            background: 'var(--bg2)', borderRadius: 20,
            border: '1px solid var(--border)',
          }}>
            <div style={{ marginBottom: 12, color: 'var(--muted2)', display: 'flex', justifyContent: 'center' }}>
              <Shirt size={36} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              Noch zu wenig Kleidung
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              Füge mindestens<br />
              <strong style={{ color: 'var(--text)' }}>1 Oberteil · 1 Hose · 1 Schuh</strong><br />
              hinzu, um Outfits zu sehen.
            </div>
          </div>

        ) : !hasGenerated ? (
          /* Bereit zum Generieren — manueller Start */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '48px 24px', gap: 20,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'var(--bg2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shirt size={32} color="var(--accent)" strokeWidth={1.4} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: 22,
                color: 'var(--text)', marginBottom: 8, fontWeight: 300,
              }}>
                Kleiderschrank bereit
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 260 }}>
                {items.length} Kleidungsstücke hochgeladen.<br />
                Starte die Outfit-Generierung wenn du fertig bist.
              </div>
            </div>
            <button
              onClick={generate}
              style={{
                padding: '15px 36px',
                borderRadius: 14,
                background: 'var(--accent)',
                color: '#0a0a0a',
                border: 'none',
                fontFamily: 'var(--font-serif)',
                fontSize: 17,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 4px 20px rgba(201,184,154,0.4)',
                transition: 'transform 150ms, box-shadow 150ms',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(201,184,154,0.55)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(201,184,154,0.4)'
              }}
            >
              <RefreshCw size={18} />
              Outfits generieren
            </button>
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', maxWidth: 240 }}>
              Du kannst jederzeit neu generieren — oben rechts mit dem ↺ Button
            </div>
          </div>

        ) : displayed.length === 0 ? (
          /* Tab leer oder Kleiderschrank ausgeschöpft */
          <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--muted)' }}>
            {tab === 'alle' && hasGenerated ? (
              /* Blueprint v2.0 Phase 5: New-Piece-Recommendation bei 0 Outfits */
              <>
                <div style={{ fontSize: 36, marginBottom: 16 }}>👔</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                  Kleiderschrank ausgeschöpft
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 280, margin: '0 auto', marginBottom: wardrobeGaps.length ? 16 : 24 }}>
                  Alle möglichen Kombinationen wurden bereits generiert. Füge ein neues Key-Piece hinzu, um neue Outfits freizuschalten.
                </div>
                {wardrobeGaps.length > 0 && (
                  <div style={{ width: '100%', marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
                      Empfohlene Key-Pieces
                    </div>
                    {wardrobeGaps.map((gap: any, i: number) => (
                      <div key={i} style={{
                        padding: '12px 14px', borderRadius: 12, marginBottom: 8,
                        background: 'var(--bg2)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>👔</span>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                            {gap.displayName}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            Schaltet ~{gap.blockedOutfitCount} Outfits frei · {gap.forStyle?.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={generate}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '11px 24px', borderRadius: 14,
                    background: 'var(--accent)', color: '#fff', border: 'none',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={15} /> Nochmals versuchen
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                  {tab === 'favoriten' ? 'Noch keine Favoriten' :
                   tab === 'eigene'    ? 'Noch keine eigenen Outfits' :
                   'Keine Outfits'}
                </div>
                {tab === 'eigene' && (
                  <button
                    onClick={() => setShowCreator(true)}
                    style={{
                      marginTop: 16, padding: '11px 24px', borderRadius: 14,
                      background: 'var(--accent)', color: '#fff', border: 'none',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <Plus size={16} /> Outfit erstellen
                  </button>
                )}
              </>
            )}
          </div>

        ) : (
          /* Outfit-Grid */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {displayed.map((o, idx) => (
              <OutfitCard
                key={o.id ?? idx}
                outfit={o}
                items={items}
                onDeleted={handleOutfitDeleted}
                onUpdated={handleOutfitUpdated}
                rainActive={!!(weather as any)?.rain_priority}
              />
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
