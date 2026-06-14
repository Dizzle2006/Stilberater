import { useEffect, useState } from 'react'
import { useWardrobeStore } from '../store/wardrobe'
import UploadZone from '../components/wardrobe/UploadZone'
import ItemCard from '../components/wardrobe/ItemCard'
import BuyAdvisor from '../components/BuyAdvisor'
import { ShoppingBag, Wand2 } from 'lucide-react'
import { preloadBackgroundRemoval } from '../services/backgroundRemoval'
import { api } from '../utils/api'
import toast from 'react-hot-toast'


const CATEGORIES = ['Alle', 'Tops', 'Hosen', 'Schuhe', 'Mäntel', 'Accessoires', 'Kleider']
const CAT_MAP: Record<string, string> = {
  Alle: 'all', Tops: 'tops', Hosen: 'bottoms', Schuhe: 'shoes',
  Mäntel: 'outerwear', Accessoires: 'accessories', Kleider: 'dresses',
}

export default function WardrobePage() {
  const { items, loading, fetch } = useWardrobeStore()
  const [filter, setFilter]           = useState('Alle')
  const [showAdvisor, setShowAdvisor] = useState(false)
  const [repairing, setRepairing]     = useState(false)
  const [repairProgress, setRepairProgress] = useState<{ done: number; total: number } | null>(null)

  useEffect(() => {
    fetch()
    preloadBackgroundRemoval()
  }, [])

  const handleRepairBackgrounds = async (reprocessAll = false) => {
    if (repairing) return
    setRepairing(true)
    setRepairProgress({ done: 0, total: 0 })
    try {
      const repaired = await api.batchRepairBackgrounds((done, total) => {
        setRepairProgress({ done, total })
      }, reprocessAll)
      if (repaired === 0) {
        toast('Keine Bilder zum Verarbeiten gefunden', { icon: 'ℹ️' })
      } else {
        await fetch()
        toast.success(`${repaired} Bilder neu verarbeitet`)
      }
    } catch {
      toast.error('Reparatur fehlgeschlagen')
    } finally {
      setRepairing(false)
      setRepairProgress(null)
    }
  }

  const filtered = filter === 'Alle' ? items : items.filter(i => i.category === CAT_MAP[filter])

  return (
    <div style={{ padding: 'calc(env(safe-area-inset-top, 44px) + 20px) 20px 0', background: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 2 }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Schrank
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            {items.length} Kleidungsstücke
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <button
            onClick={() => setShowAdvisor(true)}
            title="Kaufberater"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 20,
              background: 'var(--accent-light)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <ShoppingBag size={14} strokeWidth={1.8} />
            Kaufberater
          </button>
          <button
            onClick={() => handleRepairBackgrounds(true)}
            disabled={repairing}
            title="Alle Bilder neu verarbeiten (verbesserte Einstellungen – behebt schwarze Flecken)"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 20,
              background: repairing ? 'var(--bg3)' : 'var(--bg2)',
              border: '1px solid var(--border)',
              color: repairing ? 'var(--muted)' : 'var(--text)',
              fontSize: 12, fontWeight: 500,
              cursor: repairing ? 'default' : 'pointer',
              opacity: repairing ? 0.7 : 1,
            }}
          >
            <Wand2 size={14} strokeWidth={1.8} />
            {repairing && repairProgress
              ? repairProgress.done === 0
                ? `Lädt Modell … (0/${repairProgress.total})`
                : `${repairProgress.done}/${repairProgress.total} …`
              : 'BG neu verarbeiten'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}><UploadZone /></div>

      {/* Category filter */}
      <div style={{
        display: 'flex',
        gap: 8,
        margin: '20px 0',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        paddingBottom: 4,
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              background: filter === cat ? 'var(--accent)' : 'var(--bg2)',
              color: filter === cat ? '#fff' : 'var(--muted)',
              border: `1px solid ${filter === cat ? 'transparent' : 'var(--border)'}`,
              fontWeight: filter === cat ? 500 : 400,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 8, color: 'var(--text)' }}>
            {filter === 'Alle' ? 'Noch leer' : `Keine ${filter} gefunden`}
          </div>
          <div style={{ fontSize: 13 }}>Lade dein erstes Stück hoch</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {filtered.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}

      {showAdvisor && <BuyAdvisor onClose={() => setShowAdvisor(false)} />}

      <style>{`div::-webkit-scrollbar { display: none; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
