import { useState } from 'react'
import { Heart, Pencil, Trash2, X, ChevronRight, Check, MoreHorizontal, CheckSquare, CalendarCheck, MessageSquare, Shirt } from 'lucide-react'
import { api, imgUrl } from '../../utils/api'
import ImageSkeleton from '../ImageSkeleton'
import toast from 'react-hot-toast'
import { computeOutfitWeatherTags, type WeatherTag } from '../../services/outfitEngine'
import { STRINGS } from '../../constants/strings'
import type { FeedbackReason } from '../../db/index'

// ─── Blueprint v2.0 Phase 7: Exponentielle Lernrate ─────────────────────────
// Interaktionen 1–10: ×1.0 | 11–30: ×1.3 | 31+: ×1.5
function getFeedbackMultiplier(interactionCount: number): number {
  if (interactionCount > 30) return 1.5
  if (interactionCount > 10) return 1.3
  return 1.0
}

// ─── Blueprint v2.0 Phase 7: Feedback-Reason-Tags ────────────────────────────
const FEEDBACK_REASONS: Array<{ key: FeedbackReason; label: string }> = [
  { key: 'too_formal',      label: STRINGS.feedbackReasons.too_formal },
  { key: 'wrong_color',     label: STRINGS.feedbackReasons.wrong_color },
  { key: 'wrong_occasion',  label: STRINGS.feedbackReasons.wrong_occasion },
  { key: 'style_mismatch',  label: STRINGS.feedbackReasons.style_mismatch },
]

interface Item {
  id: number
  name: string
  category: string
  subcategory?: string
  color_primary: string
  image_path?: string
  style_tags?: string[]
  season?: string[]
  weatherproof?: boolean
}

const WEATHER_TEMP_PRIORITY: WeatherTag[] = ['heiss', 'warm', 'mild', 'kuehl', 'kalt']
const WEATHER_EMOJI: Record<string, string> = {
  heiss: '☀️', warm: '🌤️', mild: '⛅', kuehl: '🌬️', kalt: '🥶',
}

interface Outfit {
  id: number
  name?: string
  occasion: string
  score?: number
  notes?: string
  score_insight?: string
  score_reasons?: string[]
  item_ids: number[]
  base_layer_ids?: number[]
  is_favourite: boolean
  is_ai_generated?: boolean
  times_worn?: number
  active_styles?: string[]
  sprezzatura_active?: boolean
}

interface Props {
  outfit: Outfit
  items: Item[]
  onDeleted?: (id: number) => void
  onUpdated?: (updated: Outfit) => void
  /** Negatives Feedback: Outfit wird durch einen neu generierten Vorschlag ersetzt (oder entfernt, falls keiner möglich ist) */
  onReplaced?: (oldId: number, replacement: Outfit | null) => void
  /** Gap 9: Regen aktiv → wetterfeste Items hervorheben */
  rainActive?: boolean
}

export default function OutfitCard({ outfit, items, onDeleted, onUpdated, onReplaced, rainActive = false }: Props) {
  const [fav, setFav]                   = useState(outfit.is_favourite)
  const [editing, setEditing]           = useState(false)
  const [showMenu, setShowMenu]         = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false)
  const [currentIds, setCurrentIds]     = useState<number[]>(outfit.item_ids)

  const outfitItems = currentIds
    .map(id => items.find(i => i.id === id))
    .filter(Boolean) as Item[]

  const weatherTags  = computeOutfitWeatherTags(outfitItems)
  const dominantTemp = WEATHER_TEMP_PRIORITY.find(t => weatherTags.includes(t))
  const hasRain      = weatherTags.includes('regen')

  // Base Layer: versteckte Schichten (T-Shirt unter Pullover, Hemd unter Pullover)
  const baseLayerSet = new Set(outfit.base_layer_ids ?? [])
  const baseLayers   = outfitItems.filter(i => baseLayerSet.has(i.id))
  const mainItems    = outfitItems.filter(i => !baseLayerSet.has(i.id))

  const tops        = mainItems.filter(i => ['tops', 'outerwear'].includes(i.category))
  const bottoms     = mainItems.filter(i => i.category === 'bottoms')
  const shoes       = mainItems.filter(i => i.category === 'shoes')
  const accessories = mainItems.filter(i => i.category === 'accessories')

  // Build display rows with category tag for proportional heights
  const displayRows: { items: Item[]; cat: string }[] = []
  if (tops.length > 0)        displayRows.push({ items: tops.slice(0, 3),        cat: 'tops' })
  if (bottoms.length > 0)     displayRows.push({ items: [bottoms[0]],            cat: 'bottoms' })
  if (shoes.length > 0)       displayRows.push({ items: [shoes[0]],              cat: 'shoes' })
  if (accessories.length > 0) displayRows.push({ items: accessories.slice(0, 2), cat: 'accessories' })
  if (displayRows.length === 0) displayRows.push({ items: outfitItems.slice(0, 3), cat: 'tops' })

  // Flex weight per row category — total card image area stays fixed at 252px.
  // Tops each get weight 5, bottoms 4, shoes 2, accessories 1.
  // With layering (2 top rows) the space is shared; shoes/bottoms shrink slightly
  // but the card height never changes.
  const ROW_FLEX: Record<string, number> = {
    tops: 5, bottoms: 4, shoes: 2, accessories: 1,
  }

  const toggleFav = async () => {
    const next = !fav
    setFav(next)
    await api.outfitFeedback(outfit.id, { is_favourite: next }).catch(() => {})
    // Blueprint v2.0 Phase 7: Interaktionszähler + exponentielle Lernrate
    api.getProfile().then(profile => {
      const interactionCount = ((profile as any)?.interaction_count ?? 0) + 1
      const _multiplier = getFeedbackMultiplier(interactionCount)
      api.updateProfile({ interaction_count: interactionCount } as any).catch(() => {})
    }).catch(() => {})
    toast.success(next ? 'Favorit gespeichert ✦' : 'Aus Favoriten entfernt')
  }

  // Negatives Feedback: Profil lernt sofort daraus, Outfit wird gelöscht und
  // durch einen neuen Vorschlag ersetzt, der die gelernten Präferenzen nutzt.
  const handleDislike = async (reason?: FeedbackReason) => {
    setShowFeedbackSheet(false)
    const outfitColors  = outfitItems.map(i => i.color_primary).filter(Boolean)
    const outfitSubcats = outfitItems.map(i => i.subcategory).filter(Boolean) as string[]

    const { outfit: replacement } = await api.replaceOutfit(outfit.id, reason, {
      outfitOccasion: outfit.occasion,
      outfitColors,
      outfitStyles: outfit.active_styles ?? [],
      outfitSubcats,
    }).catch(() => ({ outfit: null as Outfit | null }))

    if (reason) {
      toast.success(replacement
        ? `Feedback (${FEEDBACK_REASONS.find(r => r.key === reason)?.label}) gespeichert — neues Outfit geladen`
        : `Feedback (${FEEDBACK_REASONS.find(r => r.key === reason)?.label}) gespeichert`)
    } else {
      toast.success(replacement ? 'Outfit ersetzt' : 'Outfit gelöscht')
    }
    onReplaced?.(outfit.id, replacement)

    // Exponentielle Lernrate — Interaktionszähler
    api.getProfile().then(profile => {
      const interactionCount = ((profile as any)?.interaction_count ?? 0) + 1
      const _multiplier = getFeedbackMultiplier(interactionCount)
      api.updateProfile({ interaction_count: interactionCount } as any).catch(() => {})
    }).catch(() => {})
  }

  const markWorn = async () => {
    await api.markOutfitWorn(outfit.id)
    setShowMenu(false)
    toast.success('Als getragen markiert')
  }

  // Feature 4: Wear Tracking — only for high-quality outfits (score >= 70)
  const handleRecordWear = async () => {
    setShowMenu(false)
    try {
      const result = await api.recordWear(outfit.id)
      if (result.autoFavorited) {
        setFav(true)
        toast.success(STRINGS.wear.autoFavToast, { duration: 4000 })
      } else {
        toast.success(STRINGS.wear.markWornBtn)
      }
    } catch {
      toast.error('Fehler beim Speichern')
    }
  }

  const scoreAbove70 = (outfit.score ?? 0) >= 0.70

  const scheduleToday = () => {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const cal = JSON.parse(localStorage.getItem('outfitCalendar') || '{}')
    cal[today] = outfit.id
    localStorage.setItem('outfitCalendar', JSON.stringify(cal))
    window.dispatchEvent(new Event('outfitCalendarUpdated'))
    setShowMenu(false)
    toast.success('Für heute eingeplant')
  }

  const handleDelete = async () => {
    if (!deleting) { setDeleting(true); return }
    await api.deleteOutfit(outfit.id)
    toast.success('Outfit gelöscht')
    onDeleted?.(outfit.id)
  }

  const handleSaveEdit = async (newIds: number[]) => {
    const updated = await api.updateOutfit(outfit.id, { item_ids: newIds })
    setCurrentIds(newIds)
    setEditing(false)
    onUpdated?.(updated)
    toast.success('Outfit aktualisiert')
  }

  if (editing) {
    return (
      <OutfitEditorSheet
        outfit={{ ...outfit, item_ids: currentIds }}
        allItems={items}
        onSave={handleSaveEdit}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div style={{
      borderRadius: 18,
      overflow: 'hidden',
      position: 'relative',
      background: 'var(--card-bg)',
      backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.09) 1px, transparent 1px)',
      backgroundSize: '16px 16px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* More menu button */}
      <button
        onClick={() => setShowMenu(v => !v)}
        style={{
          position: 'absolute', top: 10, right: 10,
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', zIndex: 10,
        }}
      >
        <MoreHorizontal size={14} color="var(--muted)" />
      </button>

      {/* Items display — fixed 252px total height, rows share space via flex */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 6px 0', height: 252, gap: 0 }}>
        {displayRows.map((row, ri) => {
          const flexVal = ROW_FLEX[row.cat] ?? 3
          const maxW = row.items.length === 1
            ? (row.cat === 'shoes' ? '44%' : row.cat === 'accessories' ? '38%' : '56%')
            : `${Math.floor(88 / row.items.length)}%`
          return (
            <div
              key={ri}
              style={{
                flex: flexVal,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 0,
              }}
            >
              {row.items.map(item => (
                <div key={item.id} style={{ width: maxW, height: '100%' }}>
                  {imgUrl(item.image_path) ? (
                    <ImageSkeleton
                      src={imgUrl(item.image_path)!}
                      alt={item.name}
                      objectFit="contain"
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <div style={{
                      width: '80%', height: '70%', margin: 'auto',
                      background: colorHex(item.color_primary),
                      borderRadius: 6, opacity: 0.7,
                    }} />
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Wetter + Stil-Strip */}
      <div style={{
        padding: '5px 10px 0',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {dominantTemp && (
          <span style={{ fontSize: 13, lineHeight: 1, opacity: 0.75 }}>
            {WEATHER_EMOJI[dominantTemp]}{hasRain ? ' 🌧️' : ''}
          </span>
        )}
        {/* Gap 9: Regen-Icon wenn rain_priority aktiv und Outfit wetterfest */}
        {rainActive && outfitItems.some(i => i.weatherproof) && (
          <span style={{ fontSize: 11, lineHeight: 1, opacity: 0.8 }} title="Wetterfest">☂</span>
        )}
        <span
          title={outfit.score_reasons?.length ? outfit.score_reasons.join(' · ') : undefined}
          style={{
          fontSize: 9, color: 'var(--muted)', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}>
          {outfit.score_reasons?.length
            ? outfit.score_reasons.slice(0, 2).join(' · ')
            : outfit.score_insight
              ? outfit.score_insight
              : outfit.notes?.includes('—')
                ? outfit.notes.split('—').pop()?.trim()
                : ''}
        </span>
      </div>

      {/* Base-Layer-Indikator: eigene Zeile UNTER dem Wetter-Strip */}
      {baseLayers.length > 0 ? (
        <div
          title={baseLayers.map(i => i.name).join(', ')}
          style={{
            padding: '3px 10px 26px',
            display: 'flex', alignItems: 'center', gap: 4, opacity: 0.55,
          }}
        >
          <Shirt size={10} strokeWidth={1.5} color="var(--muted)" />
          {baseLayers.map(item => (
            imgUrl(item.image_path) ? (
              <img
                key={item.id}
                src={imgUrl(item.image_path)!}
                alt=""
                style={{ width: 18, height: 22, objectFit: 'contain' }}
              />
            ) : (
              <div key={item.id} style={{
                width: 14, height: 18, borderRadius: 2,
                background: colorHex(item.color_primary),
              }} />
            )
          ))}
          <span style={{ fontSize: 8, color: 'var(--muted)', lineHeight: 1 }}>
            {baseLayers.map(i => i.name).join(' + ')}
          </span>
        </div>
      ) : (
        <div style={{ paddingBottom: 26 }} />
      )}

      {/* Heart button */}
      <button
        onClick={toggleFav}
        style={{
          position: 'absolute', bottom: 12, right: 12,
          background: 'transparent', border: 'none',
          padding: 4,
        }}
      >
        <Heart
          size={20}
          strokeWidth={1.8}
          color={fav ? 'var(--accent)' : 'var(--accent)'}
          fill={fav ? 'var(--accent)' : 'none'}
        />
      </button>

      {/* Blueprint v2.0 Phase 7: Feedback-Reason-Sheet */}
      {showFeedbackSheet && (
        <>
          <div
            onClick={() => setShowFeedbackSheet(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.35)' }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--bg2)', borderRadius: '20px 20px 0 0',
            padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
            zIndex: 50, boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              Warum gefällt dir dieses Outfit nicht?
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              Dein Feedback verbessert zukünftige Empfehlungen.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FEEDBACK_REASONS.map(r => (
                <button
                  key={r.key}
                  onClick={() => handleDislike(r.key)}
                  style={{
                    padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    fontSize: 14, color: 'var(--text)', cursor: 'pointer', fontWeight: 500,
                  }}
                >
                  {r.label}
                </button>
              ))}
              <button
                onClick={() => handleDislike(undefined)}
                style={{
                  padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                  background: 'transparent', border: 'none',
                  fontSize: 13, color: 'var(--muted)', cursor: 'pointer',
                }}
              >
                Ohne Begründung überspringen
              </button>
            </div>
          </div>
        </>
      )}

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div
            onClick={() => { setShowMenu(false); setDeleting(false) }}
            style={{ position: 'fixed', inset: 0, zIndex: 20 }}
          />
          <div style={{
            position: 'absolute', top: 40, right: 10,
            background: 'var(--bg2)',
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            zIndex: 30,
            minWidth: 160,
          }}>
            <MenuRow icon={<CheckSquare size={14} />} label="Als getragen" onClick={markWorn} />
            {scoreAbove70 && (
              <MenuRow icon={<Shirt size={14} />} label={STRINGS.wear.markWornBtn} onClick={handleRecordWear} />
            )}
            <MenuRow icon={<CalendarCheck size={14} />} label="Heute tragen" onClick={scheduleToday} />
            <MenuRow icon={<Pencil size={14} />} label="Bearbeiten" onClick={() => { setEditing(true); setShowMenu(false) }} />
            <MenuRow icon={<MessageSquare size={14} />} label="Feedback geben" onClick={() => { setShowFeedbackSheet(true); setShowMenu(false) }} />
            <MenuRow
              icon={<Trash2 size={14} />}
              label={deleting ? 'Bestätigen' : 'Löschen'}
              onClick={handleDelete}
              danger
            />
          </div>
        </>
      )}
    </div>
  )
}

function MenuRow({ icon, label, onClick, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 14px', background: 'transparent', border: 'none',
        borderBottom: '1px solid var(--border)',
        fontSize: 13, fontWeight: 400,
        color: danger ? 'var(--danger)' : 'var(--text)',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      {icon} {label}
    </button>
  )
}

// ─── Outfit Editor Sheet ───────────────────────────────────────────────────────

function OutfitEditorSheet({
  outfit, allItems, onSave, onCancel,
}: {
  outfit: Outfit
  allItems: Item[]
  onSave: (newIds: number[]) => void
  onCancel: () => void
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([...outfit.item_ids])
  const [activeCategory, setActiveCategory] = useState<string>('alle')
  const [saving, setSaving] = useState(false)

  const categories = ['alle', 'tops', 'bottoms', 'shoes', 'outerwear', 'accessories']
  const catLabels: Record<string, string> = {
    alle: 'Alle', tops: 'Oberteile', bottoms: 'Hosen',
    shoes: 'Schuhe', outerwear: 'Jacken', accessories: 'Extras',
  }

  const visibleItems = activeCategory === 'alle'
    ? allItems
    : allItems.filter(i => i.category === activeCategory)

  const toggle = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (selectedIds.length === 0) return
    setSaving(true)
    try { await onSave(selectedIds) }
    finally { setSaving(false) }
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Outfit bearbeiten</span>
        <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', display: 'flex' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Ausgewählt ({selectedIds.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selectedIds.map(id => {
            const item = allItems.find(i => i.id === id)
            if (!item) return null
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20,
                  background: 'var(--accent)', color: '#fff',
                  border: 'none', fontSize: 11, fontWeight: 500, cursor: 'pointer',
                }}
              >
                {item.name} <X size={10} />
              </button>
            )
          })}
          {selectedIds.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>Nichts ausgewählt</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', overflowX: 'auto' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 11,
              background: activeCategory === cat ? 'var(--accent)' : 'var(--bg3)',
              color: activeCategory === cat ? '#fff' : 'var(--muted)',
              border: `1px solid ${activeCategory === cat ? 'transparent' : 'var(--border)'}`,
              cursor: 'pointer', fontWeight: activeCategory === cat ? 500 : 400,
            }}
          >
            {catLabels[cat]}
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6, padding: '0 16px', maxHeight: 280, overflowY: 'auto',
      }}>
        {visibleItems.map(item => {
          const sel = selectedIds.includes(item.id)
          return (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              style={{
                position: 'relative', aspectRatio: '3/4', borderRadius: 12,
                overflow: 'hidden', cursor: 'pointer',
                border: `2.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                background: 'var(--card-bg)',
                transition: 'border-color 120ms',
              }}
            >
              {imgUrl(item.image_path)
                ? <ImageSkeleton src={imgUrl(item.image_path)!} alt={item.name} objectFit="contain" style={{ width: '100%', height: '100%' }} />
                : <div style={{ width: '100%', height: '100%', background: colorHex(item.color_primary) }} />
              }
              {sel && (
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--accent)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={11} color="#fff" strokeWidth={2.5} />
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '4px 5px',
                background: 'linear-gradient(transparent, rgba(0,0,0,.5))',
              }}>
                <span style={{ fontSize: 9, color: '#fff', display: 'block', lineHeight: 1.3 }}>{item.name}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '12px 16px' }}>
        <button
          onClick={handleSave}
          disabled={selectedIds.length === 0 || saving}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '13px', borderRadius: 14,
            background: 'var(--accent)', color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 600,
            opacity: selectedIds.length === 0 ? 0.4 : 1,
            cursor: selectedIds.length === 0 ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Wird gespeichert…' : `${selectedIds.length} Items speichern`}
          {!saving && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  )
}

function colorHex(name: string): string {
  const map: Record<string, string> = {
    navy: '#1a2744', grey: '#969696', white: '#F5F5F0', black: '#141414',
    camel: '#C19A6B', beige: '#C9B49A', brown: '#6D4C41', cream: '#F5F0E1',
    charcoal: '#37373C', olive: '#5A6440', burgundy: '#641E32', tan: '#B49164',
    'dark brown': '#461E2E', 'light brown': '#A07850', khaki: '#B4AA82',
  }
  return map[name] ?? '#C4C0B8'
}
