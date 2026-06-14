import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { User, Trash2, Sparkles } from 'lucide-react'

function useNavOffset() {
  const [val, setVal] = useState(() =>
    parseInt(localStorage.getItem('navOffset') || '5', 10)
  )
  useEffect(() => {
    const handler = (e: Event) => setVal((e as CustomEvent).detail)
    window.addEventListener('navOffsetChange', handler)
    return () => window.removeEventListener('navOffsetChange', handler)
  }, [])
  return val
}

function OutfitIcon({ size = 22, active = false }: { size?: number; active?: boolean }) {
  const sw = active ? 2 : 1.5
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  )
}

function WardrobeIcon({ size = 22, active = false }: { size?: number; active?: boolean }) {
  const sw = active ? 2 : 1.5
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="2" y1="8" x2="22" y2="8" />
      <line x1="9" y1="14" x2="11" y2="14" strokeWidth={sw * 1.4} strokeLinecap="round" />
      <line x1="13" y1="14" x2="15" y2="14" strokeWidth={sw * 1.4} strokeLinecap="round" />
    </svg>
  )
}

const NAV = [
  { to: '/',               label: 'Outfit',      icon: 'outfits'    },
  { to: '/kleiderschrank', label: 'Schrank',      icon: 'wardrobe'   },
  { to: '/assistent',      label: 'Assistent',   icon: 'assistent'  },
  { to: '/purge',          label: 'Aussortieren', icon: 'purge'      },
  { to: '/profil',         label: 'Profil',       icon: 'profil'     },
] as const

export default function BottomNav() {
  const offset = useNavOffset()
  return createPortal(
    <nav style={{
      flexShrink: 0,
      width: '100%',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'flex-start',
      paddingTop: 8,
      transform: `translateY(${offset}px)`,
    }}>
      {NAV.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: '8px 0',
            color: isActive ? 'var(--accent)' : 'var(--muted2)',
            fontSize: 9,
            fontWeight: isActive ? 600 : 400,
            letterSpacing: '.01em',
            transition: 'color 150ms',
          })}
        >
          {({ isActive }) => (
            <>
              {icon === 'outfits'   && <OutfitIcon size={20} active={isActive} />}
              {icon === 'wardrobe'  && <WardrobeIcon size={20} active={isActive} />}
              {icon === 'assistent' && <Sparkles size={20} strokeWidth={isActive ? 2 : 1.5} />}
              {icon === 'purge'     && <Trash2 size={20} strokeWidth={isActive ? 2 : 1.5} />}
              {icon === 'profil'    && <User size={20} strokeWidth={isActive ? 2 : 1.5} />}
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>,
    document.body
  )
}
