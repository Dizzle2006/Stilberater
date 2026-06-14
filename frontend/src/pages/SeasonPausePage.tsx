import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { db } from '../db/index'
import { imgUrl } from '../utils/api'
import { STRINGS } from '../constants/strings'

type SeasonShift = 'summer_to_autumn' | 'winter_to_spring'

const SHIFT_NEW_SEASON: Record<SeasonShift, string> = {
  summer_to_autumn: 'autumn',
  winter_to_spring: 'spring',
}

interface PauseItem {
  id: number
  name: string
  category: string
  image_path?: string
  season: string[]
  selected: boolean
}

export default function SeasonPausePage() {
  const navigate         = useNavigate()
  const [params]         = useSearchParams()
  const shift            = (params.get('shift') ?? 'summer_to_autumn') as SeasonShift
  const newSeason        = SHIFT_NEW_SEASON[shift] ?? 'autumn'

  const [items, setItems]     = useState<PauseItem[]>([])
  const [saving, setSaving]   = useState(false)
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    db.clothing_items
      .filter(i => i.is_active === true)
      .toArray()
      .then(all => {
        const offSeason = all
          .filter(i => {
            const tags = i.season ?? []
            return tags.length > 0 && !tags.includes(newSeason) && !tags.includes('all')
          })
          .map(i => ({
            id:         i.id!,
            name:       i.name,
            category:   i.category,
            image_path: i.image_data ?? i.image_path,
            season:     i.season ?? [],
            selected:   true,
          }))
        setItems(offSeason)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [newSeason])

  const toggle = (id: number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i))

  const handlePause = async () => {
    const toDeactivate = items.filter(i => i.selected)
    if (!toDeactivate.length) return
    setSaving(true)
    try {
      await Promise.all(
        toDeactivate.map(i => db.clothing_items.update(i.id, { is_active: false })),
      )
      toast.success(STRINGS.season.pauseSuccess(toDeactivate.length))
      navigate(-1)
    } catch {
      toast.error('Fehler beim Pausieren')
    } finally {
      setSaving(false)
    }
  }

  const handleReactivateAll = async () => {
    setSaving(true)
    try {
      const all = await db.clothing_items.filter(i => !i.is_active).toArray()
      await Promise.all(all.map(i => db.clothing_items.update(i.id!, { is_active: true })))
      toast.success(STRINGS.season.reactivateSuccess(all.length))
    } catch {
      toast.error('Fehler beim Reaktivieren')
    } finally {
      setSaving(false)
    }
  }

  const selected = items.filter(i => i.selected)

  return (
    <div style={{
      minHeight: '100%', background: 'var(--bg)',
      padding: 'calc(env(safe-area-inset-top, 44px) + 12px) 0 20px',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} color="var(--muted)" />
          </button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {STRINGS.season.pauseScreenTitle}
            </h1>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {items.length} Saison-Items gefunden
            </div>
          </div>
        </div>
        <button
          onClick={handleReactivateAll}
          disabled={saving}
          style={{
            fontSize: 11, fontWeight: 500, padding: '6px 12px', borderRadius: 20,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            color: 'var(--muted)', cursor: 'pointer',
          }}
        >
          {STRINGS.season.reactivateAll}
        </button>
      </div>

      {/* Item list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
        {!loaded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 64, borderRadius: 14 }} />
            ))}
          </div>
        )}
        {loaded && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              Alle Items sind saisonal passend
            </div>
            <div style={{ fontSize: 12 }}>Kein Handlungsbedarf.</div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <div
              key={item.id}
              style={{
                padding: '12px 14px', borderRadius: 14,
                background: item.selected ? 'var(--bg2)' : 'var(--bg3)',
                border: `1.5px solid ${item.selected ? 'var(--accent-border)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: 12,
                opacity: item.selected ? 1 : 0.55,
                transition: 'all 150ms',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: 'var(--bg3)', overflow: 'hidden',
                border: '1px solid var(--border)',
              }}>
                {imgUrl(item.image_path)
                  ? <img src={imgUrl(item.image_path)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'var(--muted2)', opacity: 0.3 }} />
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }} className="truncate">
                  {item.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  {item.category} · {item.season.join(', ')}
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggle(item.id)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: item.selected ? 'var(--accent)' : 'var(--bg3)',
                  border: `1.5px solid ${item.selected ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 150ms',
                }}
              >
                {item.selected && <Check size={13} color="#fff" strokeWidth={2.5} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Pause button */}
      {items.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <button
            onClick={handlePause}
            disabled={selected.length === 0 || saving}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: selected.length === 0 ? 'var(--bg3)' : 'var(--accent)',
              color: selected.length === 0 ? 'var(--muted)' : '#fff',
              border: 'none', fontSize: 15, fontWeight: 600,
              cursor: selected.length === 0 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {saving ? '…' : `${STRINGS.season.pauseBtn} (${selected.length})`}
          </button>
        </div>
      )}
    </div>
  )
}
