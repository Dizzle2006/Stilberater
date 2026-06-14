import { useEffect, useState } from 'react'
import { api, imgUrl } from '../utils/api'

interface HistoryOutfit {
  id: number
  name?: string
  occasion: string
  worn_dates: string[]
  times_worn: number
  item_ids: number[]
  rating?: number
}

export default function HistoryPage() {
  const [outfits, setOutfits] = useState<HistoryOutfit[]>([])
  const [loading, setLoading] = useState(true)
  const [ratings, setRatings] = useState<Record<number, number>>({})

  useEffect(() => {
    api.getOutfitHistory(30)
      .then((data: HistoryOutfit[]) => {
        setOutfits(data)
        const init: Record<number, number> = {}
        data.forEach(o => { if (o.rating) init[o.id] = o.rating })
        setRatings(init)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const rate = async (id: number, rating: number) => {
    setRatings(prev => ({ ...prev, [id]: rating }))
    try { await api.rateOutfit(id, rating) } catch {}
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ padding: 'calc(env(safe-area-inset-top, 44px) + 20px) 20px 20px', background: 'var(--bg)', minHeight: '100%' }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 4 }}>
        Verlauf
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
        Deine getragenen Outfits
      </p>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 16 }} />
          ))}
        </div>
      ) : outfits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👗</div>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Noch keine Outfits getragen</div>
          <div style={{ fontSize: 13 }}>Markiere Outfits als getragen, um sie hier zu sehen.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {outfits.map(o => {
            const lastWorn = o.worn_dates.length > 0 ? o.worn_dates[o.worn_dates.length - 1] : null
            const currentRating = ratings[o.id]
            return (
              <div
                key={o.id}
                style={{
                  background: 'var(--bg2)', borderRadius: 16,
                  border: '1px solid var(--border)',
                  padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, fontSize: 14, color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {o.name || o.occasion}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {lastWorn ? `Zuletzt: ${formatDate(lastWorn)}` : 'Noch nicht getragen'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 1 }}>
                    {o.times_worn}× getragen
                  </div>
                </div>

                {/* Rating buttons */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => rate(o.id, 5)}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: currentRating === 5 ? '#27AE6022' : 'var(--bg3)',
                      fontSize: 18,
                      outline: currentRating === 5 ? '2px solid #27AE60' : 'none',
                      transition: 'all 150ms',
                    }}
                    title="Gefällt mir"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => rate(o.id, 1)}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: currentRating === 1 ? '#C0392B22' : 'var(--bg3)',
                      fontSize: 18,
                      outline: currentRating === 1 ? '2px solid #C0392B' : 'none',
                      transition: 'all 150ms',
                    }}
                    title="Gefällt mir nicht"
                  >
                    👎
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
