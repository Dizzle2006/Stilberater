import { useEffect, useState } from 'react'
import { api, imgUrl } from '../utils/api'
import { Link } from 'react-router-dom'
import { Shirt, Sparkles, ShoppingBag, Trash2, ArrowRight, Star } from 'lucide-react'

export default function DashboardPage() {
  const [summary, setSummary]     = useState<any>(null)
  const [capsule, setCapsule]     = useState<any[]>([])
  const [capsuleLoading, setCapsuleLoading] = useState(false)

  useEffect(() => { api.getSummary().then(setSummary).catch(() => {}) }, [])

  useEffect(() => {
    setCapsuleLoading(true)
    api.getCapsuleAnalysis(6).then(setCapsule).catch(() => {}).finally(() => setCapsuleLoading(false))
  }, [])

  const stats = [
    { label: 'Kleidungsstücke', value: summary?.total_items ?? '—', icon: Shirt, to: '/wardrobe', color: 'var(--accent)' },
    { label: 'Aussortieren', value: summary?.purge_count ?? '—', icon: Trash2, to: '/purge', color: '#e74c3c' },
    { label: 'Schrank-Lücken', value: summary?.gap_count ?? '—', icon: ShoppingBag, to: '/recommendations', color: 'var(--warn)' },
    { label: 'Outfits', value: '∞', icon: Sparkles, to: '/outfits', color: '#a78bfa' },
  ]

  return (
    <div style={{ padding: '32px 40px', flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Willkommen zurück
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 42, fontWeight: 300, lineHeight: 1.1 }}>
            Dein persönlicher<br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Stil-Assistent</em>
          </h1>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 40 }}>
          {stats.map(s => (
            <Link key={s.label} to={s.to} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: 20, cursor: 'pointer', transition: 'border-color 200ms' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <s.icon size={20} color={s.color} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'var(--font-serif)', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            Schnellzugriff
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { to: '/wardrobe', label: 'Kleidungsstück hochladen', desc: 'KI analysiert Farbe, Stil & Kategorie automatisch' },
              { to: '/outfits', label: 'Outfits generieren', desc: 'Lass die KI Kombinationen für heute vorschlagen' },
              { to: '/recommendations', label: 'Schrank optimieren', desc: 'Was fehlt, was weg soll — mit Shopping-Links' },
              { to: '/profile', label: 'Stil-Profil anpassen', desc: 'Lieblingsfarben, Anlässe, Budget-Range' },
            ].map(a => (
              <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'border-color 200ms' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{a.label}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{a.desc}</div>
                  </div>
                  <ArrowRight size={14} color="var(--muted)" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Capsule-Kleiderschrank (#10) */}
        {(capsuleLoading || capsule.length > 0) && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Star size={13} color="var(--accent)" />
              <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                Deine Capsule-Items
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
              Diese Stücke erscheinen in den meisten deiner besten Outfits — dein Kern-Kleiderschrank.
            </div>
            {capsuleLoading ? (
              <div style={{ display: 'flex', gap: 10 }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ width: 80, height: 100, borderRadius: 12 }} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {capsule.map((item: any) => (
                  <div key={item.id} style={{
                    flexShrink: 0, width: 80,
                    background: 'var(--bg2)', borderRadius: 12,
                    border: '1px solid var(--border)', overflow: 'hidden',
                  }}>
                    <div style={{ height: 80, background: 'var(--bg3)', position: 'relative' }}>
                      {imgUrl(item.image_path) ? (
                        <img
                          src={imgUrl(item.image_path)}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%' }} />
                      )}
                    </div>
                    <div style={{ padding: '5px 6px' }}>
                      <div style={{ fontSize: 9, color: 'var(--text)', fontWeight: 500, lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--accent)', marginTop: 2 }}>
                        {item.outfit_count}× genutzt
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category breakdown */}
        {summary?.categories && Object.keys(summary.categories).length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              Schrank-Verteilung
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(summary.categories).map(([cat, count]: [string, any]) => {
                const pct = Math.round((count / summary.total_items) * 100)
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 90, fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>{cat}</div>
                    <div style={{ flex: 1, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 600ms ease' }} />
                    </div>
                    <div style={{ width: 28, fontSize: 12, color: 'var(--muted)' }}>{count}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
