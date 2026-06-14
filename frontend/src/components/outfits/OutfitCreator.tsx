import { useState } from 'react'
import { api, imgUrl } from '../../utils/api'
import { ChevronLeft, Check, Save, Shirt, Footprints, Watch, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

interface Item {
  id: number
  name: string
  category: string
  subcategory?: string
  color_primary: string
  image_path?: string
}

interface Props {
  items: Item[]
  onCreated: (outfit: any) => void
  onCancel: () => void
}

const CATEGORIES = [
  { key: 'tops',        label: 'Oberteil',   required: true },
  { key: 'bottoms',     label: 'Hose / Rock', required: true },
  { key: 'shoes',       label: 'Schuhe',     required: true },
  { key: 'outerwear',   label: 'Jacke / Mantel', required: false },
  { key: 'accessories', label: 'Accessoire', required: false },
]

const OCC_OPTIONS = [
  { key: 'office_formal',    label: 'Formelles Büro' },
  { key: 'office_casual',    label: 'Lockeres Büro' },
  { key: 'social_events',    label: 'Gesellschaftlich' },
  { key: 'leisure',          label: 'Freizeit' },
  { key: 'special_occasions', label: 'Besonderer Anlass' },
  { key: 'smart_casual',     label: 'Smart Casual' },
  { key: 'casual',           label: 'Casual' },
]

const COLOR_HEX: Record<string, string> = {
  navy: '#1a2744', grey: '#969696', white: '#F5F5F0', black: '#141414',
  camel: '#C19A6B', beige: '#C9B49A', brown: '#6D4C41', cream: '#F5F0E1',
  charcoal: '#37373C', olive: '#5A6440', burgundy: '#641E32', tan: '#B49164',
}

export default function OutfitCreator({ items, onCreated, onCancel }: Props) {
  const [selected, setSelected] = useState<Record<string, number | null>>(
    Object.fromEntries(CATEGORIES.map(c => [c.key, null]))
  )
  const [occasion, setOccasion]   = useState('casual')
  const [name, setName]           = useState('')
  const [activeSlot, setActiveSlot] = useState<string>('tops')
  const [saving, setSaving]       = useState(false)

  const slotItems = items.filter(i => i.category === activeSlot)
  const selectedItem = (cat: string) => items.find(i => i.id === selected[cat])

  const requiredFilled = CATEGORIES.filter(c => c.required).every(c => selected[c.key] !== null)
  const totalSelected  = Object.values(selected).filter(Boolean).length

  const handleSave = async () => {
    if (!requiredFilled) return
    setSaving(true)
    try {
      const itemIds = Object.values(selected).filter((id): id is number => id !== null)
      const outfit = await api.createOutfit({
        item_ids: itemIds,
        occasion,
        name: name.trim() || undefined,
      })
      toast.success('Outfit gespeichert!')
      onCreated(outfit)
    } catch (e: any) {
      toast.error(e.message ?? 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={onCancel}
          className="btn btn-ghost"
          style={{ padding: '6px 10px', fontSize: 13, gap: 5 }}
        >
          <ChevronLeft size={15} /> Zurück
        </button>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--accent)' }}>
          Outfit erstellen
        </span>
        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={!requiredFilled || saving}
          style={{ padding: '7px 14px', fontSize: 13, gap: 5, opacity: requiredFilled ? 1 : 0.4 }}
        >
          <Save size={13} /> {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Outfit name */}
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Outfit-Name (optional)"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 13, marginBottom: 16,
          }}
        />

        {/* Occasion */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
            Anlass
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {OCC_OPTIONS.map(o => (
              <button
                key={o.key}
                onClick={() => setOccasion(o.key)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12,
                  background: occasion === o.key ? 'var(--accent)' : 'var(--bg2)',
                  color: occasion === o.key ? '#0a0a0a' : 'var(--muted)',
                  border: `1px solid ${occasion === o.key ? 'transparent' : 'var(--border)'}`,
                  cursor: 'pointer', fontWeight: occasion === o.key ? 500 : 400,
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Slot tabs */}
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
          Kleidungsstücke ({totalSelected} ausgewählt)
        </div>

        {/* Current selection summary */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => {
            const item = selectedItem(cat.key)
            const isActive = activeSlot === cat.key
            return (
              <div
                key={cat.key}
                onClick={() => setActiveSlot(cat.key)}
                style={{
                  flexShrink: 0, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                }}
              >
                <div style={{
                  width: 60, height: 75, borderRadius: 10, overflow: 'hidden',
                  border: `2.5px solid ${isActive ? 'var(--accent)' : item ? 'var(--border2)' : 'var(--border)'}`,
                  background: item ? COLOR_HEX[item.color_primary] ?? 'var(--bg3)' : 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color 150ms', position: 'relative',
                }}>
                  {item && imgUrl(item.image_path) && (
                    <img
                      src={imgUrl(item.image_path)} alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  {!item && (
                    <span style={{ fontSize: 20, opacity: 0.25 }}>
                      {cat.key === 'tops' ? <Shirt size={20} /> : cat.key === 'bottoms' ? <Layers size={20} /> : cat.key === 'shoes' ? <Footprints size={20} /> : cat.key === 'outerwear' ? <Shirt size={20} /> : <Watch size={20} />}
                    </span>
                  )}
                  {item && (
                    <div style={{
                      position: 'absolute', top: 3, right: 3,
                      width: 16, height: 16, borderRadius: '50%',
                      background: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={9} color="#0a0a0a" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: 10, color: isActive ? 'var(--accent)' : 'var(--muted)',
                  textAlign: 'center', lineHeight: 1.2, fontWeight: isActive ? 500 : 400,
                }}>
                  {cat.label}
                  {cat.required && !item && <span style={{ color: 'var(--danger)' }}> *</span>}
                </span>
              </div>
            )
          })}
        </div>

        {/* Item picker for active slot */}
        <div style={{
          fontSize: 12, color: 'var(--text)', fontWeight: 500, marginBottom: 10,
        }}>
          {CATEGORIES.find(c => c.key === activeSlot)?.label} wählen
          {slotItems.length === 0 && (
            <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>
              — keine Items in dieser Kategorie
            </span>
          )}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
        }}>
          {/* "None" option for optional slots */}
          {!CATEGORIES.find(c => c.key === activeSlot)?.required && (
            <div
              onClick={() => setSelected(prev => ({ ...prev, [activeSlot]: null }))}
              style={{
                aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden',
                border: `2.5px solid ${selected[activeSlot] === null ? 'var(--accent)' : 'var(--border)'}`,
                background: 'var(--bg2)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 4,
              }}
            >
              <span style={{ fontSize: 18, opacity: 0.4 }}>✕</span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>Keines</span>
            </div>
          )}

          {slotItems.map(item => {
            const sel = selected[activeSlot] === item.id
            return (
              <div
                key={item.id}
                onClick={() => setSelected(prev => ({ ...prev, [activeSlot]: item.id }))}
                style={{
                  position: 'relative', aspectRatio: '3/4', borderRadius: 10,
                  overflow: 'hidden', cursor: 'pointer',
                  border: `2.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                  transition: 'border-color 120ms',
                  background: COLOR_HEX[item.color_primary] ?? 'var(--bg3)',
                }}
              >
                {imgUrl(item.image_path)
                  ? <img src={imgUrl(item.image_path)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: COLOR_HEX[item.color_primary] ?? 'var(--bg3)' }} />
                }
                {sel && (
                  <div style={{
                    position: 'absolute', top: 5, right: 5,
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--accent)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={11} color="#0a0a0a" strokeWidth={3} />
                  </div>
                )}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '6px 6px 4px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,.7))',
                }}>
                  <span style={{ fontSize: 9, color: '#fff', display: 'block', lineHeight: 1.3 }}>
                    {item.name}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Save bar */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
        {!requiredFilled && (
          <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginBottom: 8 }}>
            Oberteil, Hose und Schuhe sind Pflicht
          </div>
        )}
        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={!requiredFilled || saving}
          style={{
            width: '100%', justifyContent: 'center', padding: '13px',
            fontSize: 15, opacity: requiredFilled ? 1 : 0.4,
          }}
        >
          <Save size={15} /> {saving ? 'Wird gespeichert…' : 'Outfit speichern'}
        </button>
      </div>
    </div>
  )
}
