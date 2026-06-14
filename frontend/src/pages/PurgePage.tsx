import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import { useWardrobeStore } from '../store/wardrobe'
import { Trash2, ExternalLink, Loader2, Shirt } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PurgePage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { remove } = useWardrobeStore()

  const load = () => {
    setLoading(true)
    api.getPurgeList().then(setItems).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRemove = async (id: number) => {
    await remove(id)
    setItems(prev => prev.filter(i => i.item_id !== id))
    toast.success('Aus dem Schrank entfernt')
  }

  return (
    <div style={{ padding: 'calc(env(safe-area-inset-top, 44px) + 20px) 20px 20px', background: 'var(--bg)', minHeight: '100%' }}>
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 300, marginBottom: 4 }}>
            Aussortieren
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            Items die nicht mehr zu deinem Stil passen oder kaum getragen werden
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', padding: '60px 0' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analysiere Schrank…
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌟</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 8 }}>Alles passt!</div>
            <div style={{ fontSize: 13 }}>Keine Aussortier-Empfehlungen</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item) => (
              <div key={item.item_id} className="card" style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                {/* Thumbnail */}
                <div style={{ width: 64, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg3)' }}>
                  {item.image_path ? (
                    <img src={item.image_path} alt={item.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted2)' }}><Shirt size={28} /></div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.item_name}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {item.reasons.map((r: string, i: number) => (
                      <span key={i} className="tag warn">{r}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>→ {item.suggestion}</span>
                    {item.sell_link && (
                      <a href={item.sell_link} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }}>
                        <ExternalLink size={11} /> Vinted
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <div style={{
                    fontSize: 11, textAlign: 'center', padding: '3px 10px', borderRadius: 20,
                    background: item.purge_score >= 4 ? 'rgba(192,57,43,.15)' : 'rgba(230,126,34,.12)',
                    color: item.purge_score >= 4 ? '#e74c3c' : 'var(--warn)',
                  }}>
                    Score {item.purge_score}
                  </div>
                  <button className="btn btn-danger" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => handleRemove(item.item_id)}>
                    <Trash2 size={12} /> Entfernen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
