import { useEffect, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import OutfitsPage from './pages/OutfitsPage'
import WardrobePage from './pages/WardrobePage'
import ProfilePage from './pages/ProfilePage'
import OnboardingPage from './pages/OnboardingPage'
import HistoryPage from './pages/HistoryPage'
import PurgePage from './pages/PurgePage'
import SeasonPausePage from './pages/SeasonPausePage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import AssistantPage from './pages/AssistantPage'
import StyleBoardSelectorPage from './pages/StyleBoardSelectorPage'
import { api } from './utils/api'
import ErrorBoundary from './components/ErrorBoundary'

function applyDesign(saved: { theme?: string; accent?: string }) {
  const theme = saved.theme || 'light'
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  const hex = saved.accent || '#2D4830'
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  document.documentElement.style.setProperty('--accent', hex)
  document.documentElement.style.setProperty('--accent-light', `rgba(${r},${g},${b},.10)`)
  document.documentElement.style.setProperty('--accent-border', `rgba(${r},${g},${b},.18)`)
}

export default function App() {
  const location     = useLocation()
  const navigate     = useNavigate()
  const isOnboarding = location.pathname === '/onboarding'
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try { applyDesign(JSON.parse(localStorage.getItem('appDesign') || '{}')) } catch {}
  }, [])

  useEffect(() => {
    if (isOnboarding) { setReady(true); return }
    api.getProfile()
      .then((p: any) => {
        if (!p.onboarding_complete) navigate('/onboarding', { replace: true })
      })
      .catch(() => {/* network error — let user in anyway */})
      .finally(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <div style={{
      maxWidth: 430,
      margin: '0 auto',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <main style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <ErrorBoundary>
        <Routes>
          <Route path="/"                element={<OutfitsPage />} />
          <Route path="/kleiderschrank"  element={<WardrobePage />} />
          <Route path="/wardrobe"        element={<WardrobePage />} />
          <Route path="/profil"          element={<ProfilePage />} />
          <Route path="/profile"         element={<ProfilePage />} />
          <Route path="/onboarding"      element={<OnboardingPage />} />
<Route path="/purge"           element={<PurgePage />} />
          <Route path="/verlauf"         element={<HistoryPage />} />
<Route path="/season-pause"    element={<SeasonPausePage />} />
          <Route path="/oauth-callback"  element={<OAuthCallbackPage />} />
          <Route path="/assistent"       element={<AssistantPage />} />
          <Route path="/style-boards"    element={<StyleBoardSelectorPage />} />
        </Routes>
        </ErrorBoundary>
      </main>

      {!isOnboarding && <BottomNav />}
    </div>
  )
}
