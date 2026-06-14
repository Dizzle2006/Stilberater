import { NavLink } from 'react-router-dom'
import { Shirt, Sparkles, ShoppingBag, User, BarChart3, Trash2 } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/wardrobe', label: 'Kleiderschrank', icon: Shirt },
  { to: '/outfits', label: 'Outfits', icon: Sparkles },
  { to: '/recommendations', label: 'Empfehlungen', icon: ShoppingBag },
  { to: '/purge', label: 'Aussortieren', icon: Trash2 },
  { to: '/profile', label: 'Stil-Profil', icon: User },
]

export default function Sidebar() {
  return (
    <aside style={{
      width: 'var(--sidebar-w)', minHeight: '100vh',
      background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '28px 0',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 20px 32px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, letterSpacing: '-.01em', color: 'var(--accent)' }}>
          Style
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 11, color: 'var(--muted)', letterSpacing: '.15em', textTransform: 'uppercase' }}>
          Assistant
        </div>
      </div>

      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              background: isActive ? 'rgba(201,184,154,.08)' : 'transparent',
              fontSize: 13, fontWeight: isActive ? 500 : 400,
              transition: 'all 150ms',
            })}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '0 20px', fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        v1.0.0
      </div>
    </aside>
  )
}
