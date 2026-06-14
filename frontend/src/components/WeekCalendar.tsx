import { useState, useEffect } from 'react'
import { imgUrl } from '../utils/api'

interface Item {
  id: number
  name: string
  image_path?: string
  color_primary: string
  category: string
}

interface Outfit {
  id: number
  name?: string
  item_ids: number[]
}

interface Props {
  outfits: Outfit[]
  items: Item[]
}

function localIsoDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getWeekDays(): { iso: string; label: string; short: string }[] {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  const shorts = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      iso: localIsoDate(d),
      label: `${d.getDate()}.${d.getMonth() + 1}.`,
      short: shorts[i],
    }
  })
}

function readCalendar(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem('outfitCalendar') || '{}') } catch { return {} }
}

export default function WeekCalendar({ outfits, items }: Props) {
  const [calendar, setCalendar] = useState<Record<string, number>>(readCalendar)
  const [selected, setSelected] = useState<string | null>(null)
  const days = getWeekDays()
  const today = localIsoDate()

  useEffect(() => {
    const handler = () => setCalendar(readCalendar())
    window.addEventListener('outfitCalendarUpdated', handler)
    return () => window.removeEventListener('outfitCalendarUpdated', handler)
  }, [])

  const getOutfit = (iso: string) => {
    const id = calendar[iso]
    return id !== undefined ? outfits.find(o => o.id === id) : undefined
  }

  const getOutfitItems = (outfit: Outfit) =>
    outfit.item_ids.map(id => items.find(i => i.id === id)).filter(Boolean) as Item[]

  const selectedOutfit = selected ? getOutfit(selected) : undefined
  const selectedItems  = selectedOutfit ? getOutfitItems(selectedOutfit) : []

  const removeEntry = () => {
    if (!selected) return
    const cal = readCalendar()
    delete cal[selected]
    localStorage.setItem('outfitCalendar', JSON.stringify(cal))
    setCalendar(readCalendar())
    setSelected(null)
  }

  return (
    <div>
      {/* 7-day row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {days.map(d => {
          const outfit   = getOutfit(d.iso)
          const isToday  = d.iso === today
          const isSel    = selected === d.iso
          const thumb    = outfit ? getOutfitItems(outfit).find(i => imgUrl(i.image_path)) : null

          return (
            <div
              key={d.iso}
              onClick={() => setSelected(isSel ? null : d.iso)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                cursor: 'pointer', padding: '6px 2px', borderRadius: 12,
                background: isSel
                  ? 'var(--accent-light)'
                  : isToday
                    ? 'rgba(0,0,0,0.03)'
                    : 'transparent',
                border: `1.5px solid ${isSel ? 'var(--accent)' : isToday ? 'var(--accent-border)' : 'transparent'}`,
                transition: 'background 120ms, border 120ms',
              }}
            >
              {/* Day name */}
              <span style={{
                fontSize: 10, fontWeight: isToday ? 700 : 500,
                color: isToday ? 'var(--accent)' : 'var(--muted)',
                letterSpacing: '.04em',
              }}>
                {d.short}
              </span>

              {/* Outfit thumbnail slot */}
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: outfit ? 'var(--accent-light)' : 'var(--bg3)',
                border: `1px solid ${outfit ? 'var(--accent-border)' : 'var(--border)'}`,
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border 120ms',
              }}>
                {thumb && imgUrl(thumb.image_path)
                  ? <img src={imgUrl(thumb.image_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : outfit
                    ? <span style={{ fontSize: 18 }}>👗</span>
                    : <span style={{ fontSize: 10, color: 'var(--muted2)' }}>—</span>
                }
              </div>

              {/* Date label */}
              <span style={{
                fontSize: 9,
                color: isToday ? 'var(--accent)' : 'var(--muted2)',
                fontWeight: isToday ? 700 : 400,
              }}>
                {d.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Selected day detail */}
      {selected && (
        <div style={{
          marginTop: 16,
          padding: '14px 16px',
          borderRadius: 14,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
        }}>
          {selectedOutfit ? (
            <>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text)',
                marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>{selectedOutfit.name || 'Outfit'}</span>
                <button
                  onClick={removeEntry}
                  style={{
                    fontSize: 11, color: 'var(--danger)', background: 'transparent',
                    border: 'none', cursor: 'pointer', padding: '2px 6px',
                    borderRadius: 6,
                  }}
                >
                  Entfernen
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedItems.slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    style={{
                      flex: 1, aspectRatio: '3/4', borderRadius: 8,
                      overflow: 'hidden', background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {imgUrl(item.image_path)
                      ? <img src={imgUrl(item.image_path)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', background: '#ccc' }} />
                    }
                  </div>
                ))}
                {/* Empty slots */}
                {selectedItems.length === 0 && (
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>Keine Items</div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>+</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                Kein Outfit für diesen Tag.<br />
                Nutze <strong>„Heute tragen"</strong> in einer Outfit-Karte.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
