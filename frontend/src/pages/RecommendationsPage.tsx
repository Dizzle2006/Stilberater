import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import { ShoppingBag, ExternalLink, Loader2 } from 'lucide-react'

export default function RecommendationsPage() {
  const [gaps, setGaps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getGaps().then(setGaps).finally(() => setLoading(false))
  }, [])

  const PRIORITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    high:   { bg: 'rgba(192,57,43,.12)',  color: '#e74c3c', label: 'Hoch' },
    medium: { bg: 'rgba(230,126,34,.12)', color: 'var(--warn)', label: 'Mittel' },
    low:    { bg: 'rgba(39,174,96,.12)',  color: '#2ecc71', label: 'Niedrig' },
  }

  return (
    <div style={{ padding: '28px 20px 20px', background: 'var(--bg)', minHeight: '100%' }}>
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 300, marginBottom: 4 }}>
            Einkaufs-Empfehlungen
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            Was fehlt in deinem Schrank — mit direkten Shopping-Links
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', padding: '60px 0' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analysiere Kleiderschrank…
          </div>
        ) : gaps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20 }}>Dein Schrank ist komplett!</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Keine kritischen Lücken erkannt</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {gaps.map((gap, i) => {
              const p = PRIORITY_STYLE[gap.priority] ?? PRIORITY_STYLE.medium
              return (
                <div key={i} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: p.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <ShoppingBag size={18} color={p.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, fontSize: 15 }}>{gap.category}</span>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 20,
                          background: p.bg, color: p.color,
                          letterSpacing: '.05em', textTransform: 'uppercase',
                        }}>{p.label}</span>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>{gap.reason}</div>

                      {/* Shopping links */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(gap.suggestions ?? []).map((s: any, j: number) => (
                          <a
                            key={j}
                            href={s.zalando ?? s.amazon ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost"
                            style={{ fontSize: 12 }}
                          >
                            <ExternalLink size={12} />
                            {s.zalando ? 'Zalando' : 'Amazon'} — {s.label?.split('—')[0]?.trim()}
                          </a>
                        ))}
                        {/* Both links if available */}
                        {(gap.suggestions ?? []).length > 0 && gap.suggestions[0].amazon && gap.suggestions[0].zalando && (
                          <a
                            href={gap.suggestions[0].amazon}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost"
                            style={{ fontSize: 12 }}
                          >
                            <ExternalLink size={12} /> Amazon
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
