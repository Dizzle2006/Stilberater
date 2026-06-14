import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { ChevronRight, Sliders, RotateCcw, Sun, Moon, Monitor, Check, ChevronDown, X, History, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { HYBRID_STYLE_PROFILES, getHybridProfilesForStyle, findHybridProfile, synthesizeHybrid, customHybridKey, resolveHybridProfile } from '../data/hybridStyles'
import {
  loadBriefingPrefs, saveBriefingPrefs,
  scheduleMorningBriefing, cancelMorningBriefing,
  requestNotificationPermission,
} from '../utils/notifications'
import { STRINGS } from '../constants/strings'

// ─── Optionen (gespiegelt von OnboardingPage) ─────────────────────────────────
const LOOK_OPTIONS = [
  { id: 'old_money',           label: 'Quiet Luxury',            sub: 'Gedeckte Töne, höchste Qualität — kein Logo, kein Trend' },
  { id: 'smart_casual',        label: 'Smart Casual',            sub: 'Immer mit Third-Piece — Blazer, Strick oder Weste' },
  { id: 'english_gentleman',   label: 'Klassisch & Formal',      sub: 'Savile-Row-Silhouette, Anzug, Worsted Wool' },
  { id: 'ivy_league',          label: 'Ivy League / Collegiate', sub: 'OCBD, Chino, Penny Loafer — entspannt aber gepflegt' },
  { id: 'british_countryside', label: 'British Countryside',     sub: 'Tweed, Wachsjacke, Landed-Gentry-Ästhetik' },
  { id: 'riviera',             label: 'Riviera / Mediterran',    sub: 'Leinen, Sprezzatura — nie zu steif, immer nonchalant' },
  { id: 'italian_elegance',    label: 'Italian Elegance',        sub: 'Neapolitanische Schneiderkunst — tobacco, mid blue, Suede' },
]
const LIFESTYLE_OPTIONS = [
  { id: 'formelles_buero',   label: 'Formelles Büro' },
  { id: 'lockeres_buero',    label: 'Lockeres Büro / Start-up' },
  { id: 'homeoffice',        label: 'Homeoffice & Freizeit' },
  { id: 'unterwegs',         label: 'Viel unterwegs' },
  { id: 'gesellschaftlich',  label: 'Gesellschaftliche Anlässe' },
]
const PERCEPTION_OPTIONS = [
  { id: 'elegant_hochwertig',          label: 'Elegant & hochwertig' },
  { id: 'schick_professionell',        label: 'Schick & professionell' },
  { id: 'selbstbewusst_charismatisch', label: 'Selbstbewusst & präsent' },
  { id: 'entspannt_umgaenglich',       label: 'Gepflegt & authentisch' },
]
const CONTRAST_OPTIONS = [
  { id: 'hoch',      label: 'Hoher Kontrast — dunkle Haare, helle Haut' },
  { id: 'mittel',    label: 'Mittlerer Kontrast' },
  { id: 'gedaempft', label: 'Gedämpft — weiche, tonale Töne stehen mir' },
]
const FIT_OPTIONS = [
  { id: 'slim',     label: 'Tailliert / Slim' },
  { id: 'regular',  label: 'Regular / Classic' },
  { id: 'relaxed',  label: 'Relaxed / Comfortable' },
  { id: 'tailored', label: 'Tailored' },
]
const AVOIDED_COLOR_OPTIONS = [
  { name: 'white',       hex: '#F5F5F0' }, { name: 'cream',       hex: '#F5F0E1' },
  { name: 'beige',       hex: '#C9B49A' }, { name: 'camel',       hex: '#C19A6B' },
  { name: 'tan',         hex: '#B49164' }, { name: 'brown',       hex: '#6D4C41' },
  { name: 'khaki',       hex: '#B4AA82' }, { name: 'olive',       hex: '#5A6440' },
  { name: 'navy',        hex: '#1A2744' }, { name: 'light blue',  hex: '#ADD2EB' },
  { name: 'grey',        hex: '#969696' }, { name: 'charcoal',    hex: '#37373C' },
  { name: 'black',       hex: '#141414' }, { name: 'burgundy',    hex: '#641E32' },
  { name: 'rust',        hex: '#B45028' }, { name: 'blush',       hex: '#DCAFA5' },
]

type ThemeMode = 'light' | 'dark' | 'system'

function deriveStyleScores(look: string, context: string): Record<string, number> {
  const base: Record<string, Record<string, number>> = {
    old_money:           { old_money: 5, smart_casual: 3, riviera: 3, english_gentleman: 2 },
    smart_casual:        { smart_casual: 5, ivy_league: 3, old_money: 2 },
    english_gentleman:   { english_gentleman: 5, old_money: 3, smart_casual: 2 },
    ivy_league:          { ivy_league: 5, smart_casual: 3, old_money: 2 },
    british_countryside: { british_countryside: 5, smart_casual: 2, old_money: 2 },
    riviera:             { riviera: 5, old_money: 3, smart_casual: 3, italian_elegance: 3 },
    italian_elegance:    { italian_elegance: 5, old_money: 3, riviera: 2, smart_casual: 2 },
  }
  const scores = { ...(base[look] ?? { smart_casual: 3, old_money: 2 }) }
  if (context === 'beruflich' || context === 'besondere_anlaesse') {
    scores.english_gentleman = Math.min(5, (scores.english_gentleman ?? 0) + 1)
  } else if (context === 'privat') {
    scores.smart_casual = Math.min(5, (scores.smart_casual ?? 0) + 1)
  }
  return scores
}

const ACCENT_PRESETS = [
  { label: 'Waldgrün',   hex: '#2D4830' },
  { label: 'Ozean',      hex: '#1a3a5c' },
  { label: 'Kakao',      hex: '#5c3d28' },
  { label: 'Terrakotta', hex: '#8b3a2a' },
  { label: 'Pflaume',    hex: '#4a2d68' },
]

function applyDesign(theme: ThemeMode, accent: string) {
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  const r = parseInt(accent.slice(1, 3), 16), g = parseInt(accent.slice(3, 5), 16), b = parseInt(accent.slice(5, 7), 16)
  document.documentElement.style.setProperty('--accent', accent)
  document.documentElement.style.setProperty('--accent-light', `rgba(${r},${g},${b},.10)`)
  document.documentElement.style.setProperty('--accent-border', `rgba(${r},${g},${b},.18)`)
  localStorage.setItem('appDesign', JSON.stringify({ theme, accent }))
}

const STYLE_LABELS: Record<string, string> = {
  minimalistisch: 'Minimalistisch', klassisch: 'Klassisch',
  casual: 'Casual', streetwear: 'Streetwear',
  elegant: 'Elegant', boho: 'Bohemian',
  business: 'Business', sporty: 'Sportlich',
  old_money: 'Old Money', british_countryside: 'British Countryside',
  english_gentleman: 'English Gentleman', smart_casual: 'Smart Casual',
  riviera: 'Riviera', ivy_league: 'Ivy League', italian_elegance: 'Italian Elegance',
}

// Alle wählbaren Archetypen für den Stil-Mix-Editor
const MIX_STYLE_OPTIONS = [
  'old_money', 'english_gentleman', 'british_countryside',
  'italian_elegance', 'smart_casual', 'ivy_league', 'riviera',
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile]          = useState<any>(null)
  const [expandedSection, setExpanded] = useState<string | null>(null)
  const [themeMode, setThemeMode]      = useState<ThemeMode>('light')
  const [accent, setAccent]            = useState('#2D4830')
  const [navOffset, setNavOffset]      = useState(() =>
    parseInt(localStorage.getItem('navOffset') || '5', 10)
  )
const [styleOpen, setStyleOpen]      = useState(false)

  // Feature 3: Morning Briefing prefs
  const [briefingEnabled, setBriefingEnabled] = useState(() => loadBriefingPrefs().enabled)
  const [briefingHour,    setBriefingHour]    = useState(() => loadBriefingPrefs().hour)
  const [briefingMinute,  setBriefingMinute]  = useState(() => loadBriefingPrefs().minute)

  const handleBriefingToggle = async (next: boolean) => {
    if (next) {
      const granted = await requestNotificationPermission()
      if (!granted) {
        toast(STRINGS.notifications.permissionDenied, { icon: '🔔' })
        return
      }
      scheduleMorningBriefing(briefingHour, briefingMinute)
    } else {
      cancelMorningBriefing()
    }
    setBriefingEnabled(next)
    saveBriefingPrefs(next, briefingHour, briefingMinute)
  }

  const handleBriefingTimeChange = (h: number, m: number) => {
    setBriefingHour(h)
    setBriefingMinute(m)
    saveBriefingPrefs(briefingEnabled, h, m)
    if (briefingEnabled) {
      cancelMorningBriefing()
      scheduleMorningBriefing(h, m)
    }
  }

  // Editierbare Profilfelder
  const [editLook,       setEditLook]       = useState('')
  const [editLifestyle,  setEditLifestyle]  = useState('')
  const [editPerception, setEditPerception] = useState('')
  const [editFit,        setEditFit]        = useState('')
  const [editContrast,   setEditContrast]   = useState('')
  const [editAvoided,    setEditAvoided]    = useState<string[]>([])
  const [savingStyle,    setSavingStyle]    = useState(false)

  const saveStyleProfile = async () => {
    setSavingStyle(true)
    try {
      await api.updateProfile({
        look_identity:     editLook      || undefined,
        lifestyle_context: editLifestyle || undefined,
        perception_goal:   editPerception || undefined,
        fit_preference:    editFit       || undefined,
        contrast_type:     editContrast  || undefined,
        avoided_colors:    editAvoided,
        style_scores:      deriveStyleScores(editLook, profile?.context_primary ?? ''),
      })
      toast.success('Stilprofil gespeichert')
      setStyleOpen(false)
    } catch { toast.error('Fehler beim Speichern') }
    finally { setSavingStyle(false) }
  }

  useEffect(() => {
    api.getProfile().then(p => {
      setProfile(p)
      setEditLook(p.look_identity ?? '')
      setEditLifestyle(p.lifestyle_context ?? '')
      setEditPerception(p.perception_goal ?? '')
      setEditFit(p.fit_preference ?? '')
      setEditContrast(p.contrast_type ?? '')
      setEditAvoided(p.avoided_colors ?? [])
    }).catch(() => setProfile({}))
    try {
      const saved = JSON.parse(localStorage.getItem('appDesign') || '{}')
      if (saved.theme) setThemeMode(saved.theme)
      if (saved.accent) setAccent(saved.accent)
    } catch {}
  }, [])

  const changeNavOffset = (px: number) => {
    setNavOffset(px)
    localStorage.setItem('navOffset', String(px))
    window.dispatchEvent(new CustomEvent('navOffsetChange', { detail: px }))
  }

  const changeTheme = (mode: ThemeMode) => {
    setThemeMode(mode)
    applyDesign(mode, accent)
    toast.success('Design gespeichert')
  }

  const changeAccent = (hex: string) => {
    setAccent(hex)
    applyDesign(themeMode, hex)
    toast.success('Akzentfarbe gespeichert')
  }

  const selectedStyles: string[] = profile?.style_personas ?? []
  const preferredColors: string[] = profile?.preferred_colors ?? []

  return (
    <div style={{ padding: 'calc(env(safe-area-inset-top, 44px) + 20px) 20px 20px', background: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 24 }}>
        Profil
      </h1>

      {/* Style Summary card */}
      {selectedStyles.length > 0 && (
        <div style={{
          background: 'var(--bg2)', borderRadius: 18,
          border: '1px solid var(--border)',
          padding: '16px 18px',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 10 }}>
            Dein Stil
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: preferredColors.length ? 12 : 0 }}>
            {selectedStyles.map((s: string) => (
              <span key={s} className="tag">{STYLE_LABELS[s] ?? s}</span>
            ))}
          </div>
          {preferredColors.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {preferredColors.map((hex: string, i: number) => (
                <div key={i} style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: hex, border: '1.5px solid var(--border)',
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hybrid-Stil Badge */}
      {profile?.hybrid_profile && resolveHybridProfile(profile.hybrid_profile, profile.hybrid_ratio) && (
        <HybridProfileCard
          hybridKey={profile.hybrid_profile}
          activeStyles={profile.active_styles ?? []}
          onClear={async () => {
            await api.updateProfile({ hybrid_profile: undefined, hybrid_ratio: undefined, active_styles: [] })
            const updated = await api.getProfile()
            setProfile(updated)
            toast.success('Hybrid-Stil deaktiviert')
          }}
          onChangeHybrid={async (newKey: string) => {
            const hybrid = HYBRID_STYLE_PROFILES[newKey]
            if (!hybrid) return
            await api.updateProfile({
              hybrid_profile: newKey,
              hybrid_ratio: hybrid.ratio,
              active_styles: [...hybrid.components],
            })
            const updated = await api.getProfile()
            setProfile(updated)
            toast.success(`Hybrid-Stil geändert: ${hybrid.name_de}`)
          }}
        />
      )}

      {/* Stil-Mix: 1–3 Archetypen kombinieren */}
      <StyleMixEditor
        activeStyles={profile?.active_styles ?? []}
        onSave={async (styles: string[]) => {
          if (!styles.length) {
            await api.updateProfile({ hybrid_profile: undefined, hybrid_ratio: undefined, active_styles: [] })
          } else if (styles.length === 1) {
            await api.updateProfile({
              hybrid_profile: undefined, hybrid_ratio: undefined,
              active_styles: styles,
              look_identity: styles[0],
              style_scores: deriveStyleScores(styles[0], profile?.context_primary ?? ''),
            })
          } else {
            const predefined = findHybridProfile(...styles)
            const hybrid = predefined ?? synthesizeHybrid(styles)
            await api.updateProfile({
              hybrid_profile: predefined ? predefined.id : customHybridKey(styles),
              hybrid_ratio: hybrid.ratio,
              active_styles: [...hybrid.components],
              look_identity: styles[0],
              style_scores: deriveStyleScores(styles[0], profile?.context_primary ?? ''),
            })
          }
          const updated = await api.getProfile()
          setProfile(updated)
          toast.success(styles.length >= 2 ? 'Stil-Mix aktiviert' : 'Stil gespeichert')
        }}
      />

      {/* Stilprofil editieren */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
        Stilprofil
      </div>
      <div style={{
        background: 'var(--bg2)', borderRadius: 18,
        border: '1px solid var(--border)',
        overflow: 'hidden', marginBottom: 20,
      }}>
        <SettingsRow
          icon={<Sliders size={18} />}
          label="Stil-Einstellungen anpassen"
          onClick={() => setStyleOpen(v => !v)}
          right={<ChevronDown size={16} color="var(--muted2)" style={{ transform: styleOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }} />}
        />
        {styleOpen && (
          <div style={{ padding: '4px 18px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            <ProfileSelect label="Stil-Identität"    options={LOOK_OPTIONS}       value={editLook}       onChange={setEditLook} />
            <ProfileSelect label="Alltags-Kontext"   options={LIFESTYLE_OPTIONS}  value={editLifestyle}  onChange={setEditLifestyle} />
            <ProfileSelect label="Gewünschte Wirkung" options={PERCEPTION_OPTIONS} value={editPerception} onChange={setEditPerception} />
            <ProfileSelect label="Passform"           options={FIT_OPTIONS}        value={editFit}        onChange={setEditFit} />
            <ProfileSelect label="Farbtyp (Kontrast)"  options={CONTRAST_OPTIONS}   value={editContrast}   onChange={setEditContrast} />

            {/* Avoided Colors */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                Vermiedene Farben
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {AVOIDED_COLOR_OPTIONS.map(c => {
                  const avoided = editAvoided.includes(c.name)
                  return (
                    <button
                      key={c.name}
                      title={c.name}
                      onClick={() => setEditAvoided(prev =>
                        avoided ? prev.filter(x => x !== c.name) : [...prev, c.name]
                      )}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c.hex,
                        border: avoided ? '3px solid var(--accent)' : '1.5px solid rgba(0,0,0,0.12)',
                        boxShadow: avoided ? '0 0 0 2px var(--accent)' : 'none',
                        cursor: 'pointer', position: 'relative', transition: 'all 100ms',
                      }}
                    >
                      {avoided && (
                        <X size={10} color="#fff" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                      )}
                    </button>
                  )
                })}
              </div>
              {editAvoided.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Ausgeschlossen: {editAvoided.join(', ')}
                </div>
              )}
            </div>

            <button
              onClick={saveStyleProfile}
              disabled={savingStyle}
              style={{
                padding: '11px 16px', borderRadius: 10, border: 'none',
                background: savingStyle ? 'var(--border2)' : 'var(--accent)',
                color: savingStyle ? 'var(--muted)' : '#fff',
                fontSize: 14, fontWeight: 600, cursor: savingStyle ? 'not-allowed' : 'pointer',
              }}
            >
              {savingStyle ? 'Wird gespeichert…' : 'Stilprofil speichern'}
            </button>
          </div>
        )}
      </div>

      {/* Feature 3: Benachrichtigungen */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
        Benachrichtigungen
      </div>
      <div style={{
        background: 'var(--bg2)', borderRadius: 18,
        border: '1px solid var(--border)',
        overflow: 'hidden', marginBottom: 20,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px',
          borderBottom: briefingEnabled ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--bg3)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', flexShrink: 0,
          }}>
            <Bell size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 400, color: 'var(--text)' }}>
              {STRINGS.notifications.morningToggleLabel}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {STRINGS.notifications.morningToggleDesc}
            </div>
          </div>
          {/* Toggle switch */}
          <button
            onClick={() => handleBriefingToggle(!briefingEnabled)}
            style={{
              width: 44, height: 26, borderRadius: 13, border: 'none',
              background: briefingEnabled ? 'var(--accent)' : 'var(--bg3)',
              position: 'relative', cursor: 'pointer', flexShrink: 0,
              transition: 'background 200ms',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 3, left: briefingEnabled ? 21 : 3,
              width: 20, height: 20, borderRadius: '50%',
              background: '#fff',
              transition: 'left 200ms',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            }} />
          </button>
        </div>
        {briefingEnabled && (
          <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', flex: 1 }}>
              {STRINGS.notifications.notifTimeLabel}
            </div>
            <input
              type="time"
              value={`${String(briefingHour).padStart(2, '0')}:${String(briefingMinute).padStart(2, '0')}`}
              onChange={e => {
                const [h, m] = e.target.value.split(':').map(Number)
                if (!isNaN(h) && !isNaN(m)) handleBriefingTimeChange(h, m)
              }}
              style={{
                padding: '6px 10px', borderRadius: 8,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 14, cursor: 'pointer',
              }}
            />
          </div>
        )}
      </div>

      {/* Allgemein */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
        Allgemein
      </div>
      <div style={{
        background: 'var(--bg2)', borderRadius: 18,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        marginBottom: 20,
      }}>
        {/* Stil anpassen */}
        <SettingsRow
          icon={<Sliders size={18} />}
          label="Erscheinungsbild"
          onClick={() => setExpanded(v => v === 'appdesign' ? null : 'appdesign')}
          right={<ChevronRight size={16} color="var(--muted2)" style={{ transform: expandedSection === 'appdesign' ? 'rotate(90deg)' : undefined, transition: 'transform 150ms' }} />}
        />
        {expandedSection === 'appdesign' && (
          <div style={{ padding: '12px 18px 18px 18px', borderBottom: '1px solid var(--border)' }}>
            {/* Theme */}
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 10 }}>
              Farbschema
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {([
                { mode: 'light' as ThemeMode,  label: 'Hell',   Icon: Sun },
                { mode: 'dark'  as ThemeMode,  label: 'Dunkel', Icon: Moon },
                { mode: 'system' as ThemeMode, label: 'System', Icon: Monitor },
              ]).map(({ mode, label, Icon }) => {
                const active = themeMode === mode
                return (
                  <button
                    key={mode}
                    onClick={() => changeTheme(mode)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '12px 8px', borderRadius: 12,
                      background: active ? 'var(--accent-light)' : 'var(--bg3)',
                      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      color: active ? 'var(--accent)' : 'var(--muted)',
                      cursor: 'pointer', transition: 'all 150ms',
                    }}
                  >
                    <Icon size={20} />
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
                  </button>
                )
              })}
            </div>

            {/* Nav position */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                Navigation – Position
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--muted2)' }}>Höher</span>
                <input
                  type="range"
                  min={-20}
                  max={50}
                  step={1}
                  value={navOffset}
                  onChange={e => changeNavOffset(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: 11, color: 'var(--muted2)' }}>Tiefer</span>
              </div>
            </div>

            {/* Accent color */}
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 10 }}>
              Akzentfarbe
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {ACCENT_PRESETS.map(p => {
                const active = accent === p.hex
                return (
                  <button
                    key={p.hex}
                    onClick={() => changeAccent(p.hex)}
                    title={p.label}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', background: p.hex,
                      border: `3px solid ${active ? p.hex : 'transparent'}`,
                      outline: `2px solid ${active ? p.hex : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <Check size={14} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 9, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.2 }}>{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Outfit-Verlauf */}
        <SettingsRow
          icon={<History size={18} />}
          label="Outfit-Verlauf"
          onClick={() => navigate('/verlauf')}
          right={<ChevronRight size={16} color="var(--muted2)" />}
        />

        {/* Fragebogen wiederholen */}
        <SettingsRow
          icon={<RotateCcw size={18} />}
          label="Fragebogen wiederholen"
          onClick={() => navigate('/onboarding')}
          right={<ChevronRight size={16} color="var(--muted2)" />}
          separator={false}
        />
      </div>

      <div style={{ textAlign: 'center', padding: '8px 0', color: 'var(--muted2)', fontSize: 12 }}>
        Version 1.0
      </div>
    </div>
  )
}

function ProfileSelect({ label, options, value, onChange }: {
  label: string
  options: { id: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(o => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: value === o.id ? 'var(--accent)' : 'var(--bg3)',
              color: value === o.id ? '#fff' : 'var(--muted)',
              border: `1.5px solid ${value === o.id ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer', transition: 'all 120ms',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StyleMixEditor({ activeStyles, onSave }: {
  activeStyles: string[]
  onSave: (styles: string[]) => void
}) {
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState<string[]>(activeStyles.slice(0, 3))
  const [saving, setSaving]     = useState(false)

  useEffect(() => { setSelected(activeStyles.slice(0, 3)) }, [activeStyles.join('|')])

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 3) {
        toast('Maximal 3 Stile kombinierbar', { icon: 'ℹ️' })
        return prev
      }
      return [...prev, id]
    })
  }

  const preview = selected.length >= 2
    ? (findHybridProfile(...selected) ?? synthesizeHybrid(selected))
    : null

  const dirty = selected.join('|') !== activeStyles.slice(0, 3).join('|')

  return (
    <div style={{
      background: 'var(--bg2)', borderRadius: 18,
      border: '1px solid var(--border)',
      overflow: 'hidden', marginBottom: 20,
    }}>
      <SettingsRow
        icon={<Sliders size={18} />}
        label="Stil-Mix (1–3 Stile kombinieren)"
        onClick={() => setOpen(v => !v)}
        right={<ChevronDown size={16} color="var(--muted2)" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }} />}
        separator={open}
      />
      {open && (
        <div style={{ padding: '4px 18px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>
            Wähle einen Hauptstil oder kombiniere bis zu drei Stilrichtungen.
            Der Algorithmus verbindet Stilregeln, Brückenfarben und Anker-Pieces
            der gewählten Traditionen.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {MIX_STYLE_OPTIONS.map(id => {
              const active = selected.includes(id)
              const order  = selected.indexOf(id)
              return (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  style={{
                    padding: '8px 13px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                    background: active ? 'var(--accent)' : 'var(--bg3)',
                    color: active ? '#fff' : 'var(--text)',
                    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {active && <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'rgba(255,255,255,.25)', fontSize: 10, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>{order + 1}</span>}
                  {STYLE_LABELS[id] ?? id}
                </button>
              )
            })}
          </div>
          {preview && (
            <div style={{
              padding: '12px 14px', borderRadius: 12, marginBottom: 14,
              background: 'var(--bg3)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                {preview.name_de}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 8 }}>
                {preview.description_de.slice(0, 140)}…
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {preview.bridge_colors.slice(0, 7).map(c => (
                  <span key={c} style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 8,
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    color: 'var(--muted)',
                  }}>{c}</span>
                ))}
              </div>
            </div>
          )}
          <button
            disabled={!dirty || saving}
            onClick={async () => {
              setSaving(true)
              try { await onSave(selected) } finally { setSaving(false) }
            }}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12,
              fontSize: 14, fontWeight: 600, border: 'none',
              background: dirty ? 'var(--accent)' : 'var(--bg3)',
              color: dirty ? '#fff' : 'var(--muted2)',
              cursor: dirty ? 'pointer' : 'default',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Speichern…' : selected.length >= 2 ? 'Stil-Mix anwenden' : 'Stil anwenden'}
          </button>
        </div>
      )}
    </div>
  )
}

function HybridProfileCard({
  hybridKey, activeStyles, onClear, onChangeHybrid,
}: {
  hybridKey: string
  activeStyles: string[]
  onClear: () => void
  onChangeHybrid: (key: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const hybrid = resolveHybridProfile(hybridKey)
  if (!hybrid) return null

  // Finde alle Hybrid-Profile die einen der aktiven Stile enthalten
  const relatedProfiles = [...new Set(
    activeStyles.flatMap(s => getHybridProfilesForStyle(s))
  )].filter(p => p.id !== hybridKey)

  return (
    <div style={{
      background: 'var(--bg2)', borderRadius: 18,
      border: '1px solid var(--accent-border)',
      padding: '16px 18px', marginBottom: 20,
    }}>
      <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
        Hybrid-Stil aktiv
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
        {hybrid.name_de}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14 }}>
        {hybrid.description_de.slice(0, 100)}…
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {relatedProfiles.length > 0 && (
          <button
            onClick={() => setShowPicker(v => !v)}
            style={{
              padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500,
              background: 'var(--bg3)', border: '1.5px solid var(--border)',
              color: 'var(--text)', cursor: 'pointer',
            }}
          >
            Hybrid-Stil ändern
          </button>
        )}
        <button
          onClick={onClear}
          style={{
            padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500,
            background: 'transparent', border: '1.5px solid var(--border)',
            color: 'var(--muted)', cursor: 'pointer',
          }}
        >
          Hybrid deaktivieren
        </button>
      </div>
      {showPicker && relatedProfiles.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {relatedProfiles.map(p => (
            <div
              key={p.id}
              onClick={() => { onChangeHybrid(p.id); setShowPicker(false) }}
              style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{p.name_de}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.components.join(' + ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SettingsRow({ icon, label, right, onClick, separator = true }: {
  icon: React.ReactNode
  label: string
  right?: React.ReactNode
  onClick?: () => void
  separator?: boolean
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        borderBottom: separator ? '1px solid var(--border)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        background: 'transparent',
        transition: 'background 100ms',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.background = 'var(--bg3)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: 'var(--bg3)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent)', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, fontSize: 15, fontWeight: 400, color: 'var(--text)' }}>
        {label}
      </div>
      {right}
    </div>
  )
}
