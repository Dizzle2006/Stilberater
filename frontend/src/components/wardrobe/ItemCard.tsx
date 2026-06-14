import { useState } from 'react'
import { Trash2, Pencil, X, Check, Shirt, Sparkles, Undo2, Loader2 } from 'lucide-react'
import { useWardrobeStore } from '../../store/wardrobe'
import { api, imgUrl } from '../../utils/api'
import ImageSkeleton from '../ImageSkeleton'
import toast from 'react-hot-toast'
import { formatLastWorn } from '../../services/wearTrackingService'
import { STRINGS } from '../../constants/strings'
import { removeBackground, blobToDataUrl } from '../../services/backgroundRemoval'

const CAT_COLORS: Record<string, string> = {
  tops: '#8a6a9a', bottoms: '#6a8a9a', shoes: '#9a8a6a',
  outerwear: '#6a9a7a', accessories: '#9a6a6a',
}

const COLOR_SWATCHES: { name: string; hex: string }[] = [
  { name: 'white',       hex: '#F5F5F0' }, { name: 'cream',       hex: '#F5F0E1' },
  { name: 'beige',       hex: '#C9B49A' }, { name: 'camel',       hex: '#C19A6B' },
  { name: 'tan',         hex: '#B49164' }, { name: 'brown',       hex: '#6D4C41' },
  { name: 'dark brown',  hex: '#461E2E' }, { name: 'khaki',       hex: '#B4AA82' },
  { name: 'olive',       hex: '#5A6440' }, { name: 'forest green', hex: '#326446' },
  { name: 'navy',        hex: '#1A2744' }, { name: 'cobalt',      hex: '#0046B4' },
  { name: 'light blue',  hex: '#ADD2EB' }, { name: 'denim blue',  hex: '#5578A0' },
  { name: 'grey',        hex: '#969696' }, { name: 'charcoal',    hex: '#37373C' },
  { name: 'anthracite',  hex: '#2D3237' }, { name: 'black',       hex: '#141414' },
  { name: 'burgundy',    hex: '#641E32' }, { name: 'bordeaux',    hex: '#780020' },
  { name: 'rust',        hex: '#B45028' }, { name: 'blush',       hex: '#DCAFA5' },
]

interface Item {
  id: number; name: string; category: string; subcategory?: string
  color_primary: string; style_tags: string[]; season: string[]
  image_path?: string; times_worn: number; pattern: string; notes?: string
  last_worn?: string | null
}

interface Props { item: Item }

export default function ItemCard({ item }: Props) {
  const { remove, fetch } = useWardrobeStore()
  const [editing, setEditing]         = useState(false)
  const [confirmDelete, setConfirm]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [editColor, setEditColor]     = useState(item.color_primary)
  const [editName, setEditName]       = useState(item.name)
  const [editNotes, setEditNotes]     = useState(item.notes ?? '')
  const [similarItems, setSimilarItems] = useState<Item[] | null>(null)
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [removingBg, setRemovingBg]   = useState(false)
  const [bgProgress, setBgProgress]   = useState(0)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const catColor = CAT_COLORS[item.category] ?? '#888'

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirm(true); return }
    await remove(item.id)
    toast.success('Aus dem Schrank entfernt')
  }

  const loadSimilar = async () => {
    if (similarItems !== null) { setSimilarItems(null); return }
    setLoadingSimilar(true)
    try {
      const res = await api.getSimilarItems(item.id, 3)
      setSimilarItems(res.map((r: any) => r.item ?? r))
    } catch { toast.error('Fehler beim Laden ähnlicher Stücke') }
    finally { setLoadingSimilar(false) }
  }

  const handleRemoveBg = async () => {
    if (removingBg) return
    const src = pendingImage ?? imgUrl(item.image_path)
    if (!src) return
    if (pendingImage) { setPendingImage(null); return }
    setRemovingBg(true)
    setBgProgress(0)
    try {
      const blob = await removeBackground(src, setBgProgress)
      const dataUrl = await blobToDataUrl(blob)
      setPendingImage(dataUrl)
      toast.success('Hintergrund entfernt — wird beim Speichern übernommen')
    } catch {
      toast.error('Hintergrundentfernung fehlgeschlagen')
    } finally {
      setRemovingBg(false)
      setBgProgress(0)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates: any = {
        name: editName.trim() || item.name,
        color_primary: editColor,
        notes: editNotes.trim() || undefined,
      }
      if (pendingImage) {
        updates.image_data = pendingImage
        updates.image_path = pendingImage
      }
      await api.updateItem(item.id, updates)
      await fetch()
      setEditing(false)
      setPendingImage(null)
      toast.success('Aktualisiert')
    } catch { toast.error('Fehler beim Speichern') }
    finally { setSaving(false) }
  }

  if (editing) {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Image preview */}
        <div style={{ aspectRatio: '3/4', background: '#f0ede8', position: 'relative' }}>
          {(pendingImage ?? imgUrl(item.image_path))
            ? <ImageSkeleton
                src={pendingImage ?? imgUrl(item.image_path)!}
                alt={item.name}
                style={{ width: '100%', height: '100%' }}
                objectFit={pendingImage ? 'contain' : 'cover'}
              />
            : <div style={{ width: '100%', height: '100%', background: colorHex(editColor) }} />
          }
          <button
            onClick={() => { setEditing(false); setPendingImage(null) }}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: '50%',
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={13} color="#fff" />
          </button>
          {/* Remove background button */}
          {(imgUrl(item.image_path) || pendingImage) && (
            <button
              onClick={handleRemoveBg}
              disabled={removingBg || saving}
              title={pendingImage ? 'Rückgängig' : 'Hintergrund entfernen'}
              style={{
                position: 'absolute', top: 8, left: 8,
                background: pendingImage ? 'rgba(45,72,48,0.85)' : 'rgba(0,0,0,.55)',
                border: 'none', borderRadius: 20,
                padding: '4px 9px', cursor: removingBg || saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                color: '#fff', fontSize: 10, fontFamily: 'inherit',
              }}
            >
              {removingBg ? (
                <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> {bgProgress > 0 ? `${bgProgress}%` : '…'}</>
              ) : pendingImage ? (
                <><Undo2 size={11} /> Original</>
              ) : (
                <><Sparkles size={11} /> Hintergrund</>
              )}
            </button>
          )}
        </div>

        {/* Edit form */}
        <div style={{ padding: '12px 12px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Name */}
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 12,
            }}
          />

          {/* Color picker */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
              Farbe
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {COLOR_SWATCHES.map(s => (
                <button
                  key={s.name}
                  title={s.name}
                  onClick={() => setEditColor(s.name)}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', background: s.hex,
                    border: editColor === s.name ? '2.5px solid var(--accent)' : '1.5px solid rgba(255,255,255,.1)',
                    boxShadow: editColor === s.name ? '0 0 0 2px var(--accent)' : 'none',
                    cursor: 'pointer', transition: 'all 100ms',
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 5 }}>
              {editColor}
            </div>
          </div>

          {/* Notes */}
          <input
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            placeholder="Notiz (optional)"
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 8,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 11,
            }}
          />

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: 12 }}
            >
              <Check size={12} /> {saving ? '…' : 'Speichern'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="btn btn-ghost"
              style={{ padding: '8px 10px', fontSize: 12 }}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Image */}
      <div style={{ aspectRatio: '3/4', background: '#f0ede8', position: 'relative', overflow: 'hidden' }}>
        {imgUrl(item.image_path)
          ? <ImageSkeleton src={imgUrl(item.image_path)!} alt={item.name} style={{ width: '100%', height: '100%' }} />
          : <div style={{ width: '100%', height: '100%', background: colorHex(item.color_primary), display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: .35, color: '#fff' }}><Shirt size={32} /></div>
        }

        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: catColor + '33', border: `1px solid ${catColor}55`,
          color: catColor, padding: '2px 8px', borderRadius: 20,
          fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase',
        }}>
          {item.category}
        </div>

        {/* Color dot */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 12, height: 12, borderRadius: '50%',
          background: colorHex(item.color_primary),
          border: '1.5px solid rgba(255,255,255,.25)',
          boxShadow: '0 1px 3px rgba(0,0,0,.4)',
        }} title={item.color_primary} />

        {/* Hover overlay */}
        <div className="item-overlay" style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: 0, transition: 'opacity 200ms', flexWrap: 'wrap',
        }}>
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '6px 10px' }} onClick={() => { setEditing(true); setConfirm(false) }}>
            <Pencil size={12} /> Bearbeiten
          </button>
          <button
            className={`btn ${confirmDelete ? 'btn-danger' : 'btn-ghost'}`}
            style={{ fontSize: 11, padding: '6px 10px' }}
            onClick={handleDelete}
            onBlur={() => setConfirm(false)}
          >
            <Trash2 size={12} /> {confirmDelete ? 'Sicher?' : 'Löschen'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }} className="truncate">{item.name}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
          {item.style_tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: 'var(--muted)', fontSize: 11 }}>
            <span>{item.times_worn}× getragen</span>
            {formatLastWorn(item.last_worn) && (
              <span style={{ marginLeft: 6, color: 'var(--muted2)' }}>
                · {STRINGS.wear.lastWornLabel}: {formatLastWorn(item.last_worn)}
              </span>
            )}
          </div>
          <button
            onClick={loadSimilar}
            style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 20,
              background: similarItems !== null ? 'var(--accent-light)' : 'var(--bg3)',
              border: `1px solid ${similarItems !== null ? 'var(--accent-border)' : 'var(--border)'}`,
              color: similarItems !== null ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {loadingSimilar ? '…' : 'Ähnliche'}
          </button>
        </div>
      </div>

      {/* Similar items popover */}
      {similarItems !== null && similarItems.length > 0 && (
        <div style={{ padding: '0 10px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Ähnliche Stücke
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {similarItems.map((sim: Item) => (
              <div
                key={sim.id}
                style={{
                  flex: 1, aspectRatio: '1', borderRadius: 6, overflow: 'hidden',
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                }}
                title={sim.name}
              >
                {imgUrl(sim.image_path)
                  ? <img src={imgUrl(sim.image_path)} alt={sim.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: '#ccc' }} />
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {similarItems !== null && similarItems.length === 0 && (
        <div style={{ padding: '0 12px 10px', fontSize: 11, color: 'var(--muted)' }}>
          Keine ähnlichen Stücke gefunden.
        </div>
      )}

      <style>{`.card:hover .item-overlay { opacity: 1 !important; }`}</style>
    </div>
  )
}

function colorHex(name: string): string {
  const swatch = COLOR_SWATCHES.find(s => s.name === name)
  return swatch?.hex ?? '#888'
}
