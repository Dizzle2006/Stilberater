import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { detectHybridProfile } from '../services/profileInterpreter'
import { STRINGS } from '../constants/strings'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#F4EFE8',
  white:     '#FFFFFF',
  text:      '#1A1A1A',
  muted:     '#888580',
  border:    '#E0D9CF',
  green:     '#1E3A2A',
  greenHov:  '#264D38',
  accent:    '#C9B89A',
  accentBg:  'rgba(201,184,154,0.18)',
  selected:  '#1E3A2A',
}

// ─── Typen ────────────────────────────────────────────────────────────────────
interface OnboardingData {
  context_primary:    string
  lifestyle_context:  string
  perception_goal:    string
  look_identity:      string
  fit_preference:     string
  color_world:        string[]
  pattern_preference: string[]
  // Blueprint v2.0 Phase 3
  sprezzatura_mode:   boolean
  anlass_frequenz:    { buero: number; events: number; freizeit: number }
  temp_zone:          string
  // Gap 7
  modern_office:      boolean
  // v7.1: persönlicher Kontrasttyp — aktiviert die Kontrasttyp-Bewertung
  contrast_type:      string
}

const DEFAULT: OnboardingData = {
  context_primary:    '',
  lifestyle_context:  '',
  perception_goal:    '',
  look_identity:      '',
  fit_preference:     '',
  color_world:        [],
  pattern_preference: [],
  sprezzatura_mode:   false,
  anlass_frequenz:    { buero: 0.3, events: 0.3, freizeit: 0.4 },
  temp_zone:          'mitteleuropaeisch',
  modern_office:      false,
  contrast_type:      'mittel',
}

// ─── Auswahloptionen ──────────────────────────────────────────────────────────

const CONTEXT_OPTIONS = [
  { id: 'privat',              label: 'Privat',             sub: 'Freizeit, Homeoffice, Ausgehen' },
  { id: 'beruflich',           label: 'Beruflich',          sub: 'Büro, Business Meetings, Kundentermine' },
  { id: 'privat_beruflich',    label: 'Privat & Beruflich', sub: 'Beides gleichermaßen' },
  { id: 'besondere_anlaesse',  label: 'Besondere Anlässe',  sub: 'Events, Hochzeiten, Networking' },
]

const LIFESTYLE_OPTIONS = [
  { id: 'formelles_buero',   label: 'Formelles Büro',           sub: 'Anzug oder Blazer-Dresscode' },
  { id: 'lockeres_buero',    label: 'Lockeres Büro / Start-up', sub: 'Smart Casual, kreative Umgebung' },
  { id: 'homeoffice',        label: 'Homeoffice & Freizeit',    sub: 'Kein fester Dresscode' },
  { id: 'unterwegs',         label: 'Viel unterwegs',           sub: 'Reisen, Außentermine, wechselnde Umgebungen' },
  { id: 'gesellschaftlich',  label: 'Gesellschaftliche Anlässe',sub: 'Networking, Events, Auftritte' },
]

const PERCEPTION_OPTIONS = [
  { id: 'elegant_hochwertig',          label: 'Elegant & hochwertig',    sub: 'Qualität, die man sieht' },
  { id: 'schick_professionell',        label: 'Schick & professionell',  sub: 'Kompetent, gepflegt, vertrauenswürdig' },
  { id: 'selbstbewusst_charismatisch', label: 'Selbstbewusst & präsent', sub: 'Ausstrahlung, die im Raum auffällt' },
  { id: 'entspannt_umgaenglich',       label: 'Gepflegt & authentisch',  sub: 'Nahbar, ohne Statussymbole' },
]

const LOOK_OPTIONS = [
  { id: 'old_money',           label: 'Quiet Luxury',          sub: 'Gedeckte Töne, höchste Qualität — kein Logo, kein Trend' },
  { id: 'smart_casual',        label: 'Smart Casual',          sub: 'Immer mit Third-Piece — Blazer, Strick oder Weste' },
  { id: 'english_gentleman',   label: 'Klassisch & Formal',    sub: 'Savile-Row-Silhouette, Anzug, Worsted Wool' },
  { id: 'ivy_league',          label: 'Ivy League / Collegiate',sub: 'OCBD, Chino, Penny Loafer — entspannt aber gepflegt' },
  { id: 'british_countryside',  label: 'British Countryside',   sub: 'Tweed, Wachsjacke, Landed-Gentry-Ästhetik' },
  { id: 'riviera',             label: 'Riviera / Mediterran',   sub: 'Leinen, Sprezzatura — nie zu steif, immer nonchalant' },
  { id: 'italian_elegance',    label: 'Italian Elegance',       sub: 'Neapolitanische Schneiderkunst — tobacco, mid blue, Suede' },
]

const FIT_OPTIONS = [
  { id: 'slim',     label: 'Tailliert / Slim',           sub: 'Figurbetont, nah am Körper' },
  { id: 'regular',  label: 'Regular / Classic',          sub: 'Nicht zu eng, nicht zu weit — der Klassiker' },
  { id: 'relaxed',  label: 'Relaxed / Comfortable',      sub: 'Etwas mehr Spielraum, bewusst entspannt' },
  { id: 'tailored', label: 'Tailored / Maßgeschneidert', sub: 'Perfekter Sitz, strukturiert, klar' },
]

const COLOR_PALETTES = [
  { id: 'erdtoene', label: 'Erdtöne & Naturfarben', swatches: ['#C9B49A','#C19A6B','#8A8A5A','#6B7C3D'] },
  { id: 'navy',     label: 'Navy & Marineblau',     swatches: ['#1a2744','#3D6B9E','#4A5568','#191970'] },
  { id: 'grau',     label: 'Grautöne & Schwarz',    swatches: ['#2D2D2D','#3C3C3C','#9E9E9E','#1a1a1a'] },
  { id: 'neutral',  label: 'Warme Neutrals',        swatches: ['#F5F0E8','#F0EAD6','#D4C5A9','#F8F4EF'] },
  { id: 'kuehl',    label: 'Kühle Töne',            swatches: ['#B8D4E8','#7B9DB4','#8FAF8F','#9BA5B5'] },
  { id: 'burgund',  label: 'Burgund & Dunkeltöne',  swatches: ['#7B1F3A','#800020','#2D5A27','#3E1F00'] },
]

const PATTERN_OPTIONS = [
  { id: 'solid',          label: 'Uni / Einfarbig',     sub: 'Keine Muster — reine, klare Farben' },
  { id: 'subtle_texture', label: 'Feine Textur',         sub: 'Herringbone, Tweed, Mouliné — dezent strukturiert' },
  { id: 'stripe',         label: 'Streifen',             sub: 'Nadelstreifen, Bengal, Oxford — klassisch-elegant' },
  { id: 'fine_check',     label: 'Feines Karo',          sub: 'Windowpane, Prince of Wales, Glen-Check' },
  { id: 'houndstooth',    label: 'Hahnentritt / Pepita', sub: 'Houndstooth — britischer Klassiker' },
]

// ─── Stil-Bilder — drei Gruppen à 4 Bilder (lokale Dateien) ───────────────────
// Bilder liegen unter /images/onboarding/ im public-Ordner des Frontends.
// Jede Datei: g{gruppe}_{a|b|c|d}.jpg
// Bitte Bilder unter frontend/public/images/onboarding/ ablegen.

const BASE = import.meta.env.BASE_URL

const GRUPPE1_IMAGES = [
  `${BASE}images/onboarding/g1_a.png`,  // Dark Monochromatic — Navy-Anzug + Rollkragen
  `${BASE}images/onboarding/g1_b.png`,  // Classic Business Formal — Navy-Blazer + Krawatte
  `${BASE}images/onboarding/g1_c.png`,  // Smart Casual Outerwear — Peacoat + Sweater
  `${BASE}images/onboarding/g1_d.png`,  // Contemporary Casual Layering — Strick + Weste
]

const GRUPPE2_IMAGES = [
  `${BASE}images/onboarding/g2_a.png`,  // Power Dressing — Navy-Suit + gepunktete Krawatte
  `${BASE}images/onboarding/g2_b.png`,  // British Check / Ivy League — Karoblazer + Krawatte
  `${BASE}images/onboarding/g2_c.png`,  // European Smart Casual — Navy-Blazer + Beige-Sweater
  `${BASE}images/onboarding/g2_d.png`,  // Relaxed Tailoring — Camel-Blazer + Tee + Chino
]

const GRUPPE3_IMAGES = [
  `${BASE}images/onboarding/g3_a.png`,  // Heritage Coastal — Shawl-Cardigan + Jeans + Boots
  `${BASE}images/onboarding/g3_b.png`,  // Quiet Luxury — Creme-Polo-Knit + Beige-Hose
  `${BASE}images/onboarding/g3_c.png`,  // Clean Minimal — Half-Zip + dunkle Hose + Sneaker
  `${BASE}images/onboarding/g3_d.png`,  // Sport Tailoring — Tweed-Blazer + Tee + Jogger
]

// Bild-IDs je Gruppe (für Algorithmus-Mapping)
const GRUPPE1_IDS = ['g1_a', 'g1_b', 'g1_c', 'g1_d']
const GRUPPE2_IDS = ['g2_a', 'g2_b', 'g2_c', 'g2_d']
const GRUPPE3_IDS = ['g3_a', 'g3_b', 'g3_c', 'g3_d']

// ─── Blueprint v2.0: Temp-Zone Optionen ──────────────────────────────────────
const TEMP_ZONE_OPTIONS = [
  { id: 'kalt',             label: 'Kalt & Rau',          sub: 'Skandinavien, Alpen — überwiegend kalt und nass' },
  { id: 'mitteleuropaeisch',label: 'Mitteleuropäisch',     sub: 'Deutschland, Österreich — vier Jahreszeiten' },
  { id: 'mediterran',       label: 'Mediterran',           sub: 'Südeuropa, Küste — mild bis warm' },
  { id: 'warm',             label: 'Warm & Sonnig',        sub: 'Dauerhaft warm — überwiegend Sommerklima' },
]

// v7.1: Persönlicher Kontrasttyp — wie stark Haut, Haar & Augen miteinander kontrastieren.
// Steuert, wie viel Hell-Dunkel-Kontrast ein Outfit haben sollte (Flusser, «Dressing the Man»).
const CONTRAST_OPTIONS = [
  { id: 'hoch',     label: 'Hoher Kontrast',     sub: 'z.B. dunkles Haar + helle Haut — kräftige Hell-Dunkel-Sprünge stehen dir' },
  { id: 'mittel',   label: 'Mittlerer Kontrast', sub: 'Ausgewogen — die meisten Kombinationen funktionieren' },
  { id: 'gedaempft',label: 'Gedämpfter Kontrast',sub: 'z.B. helles/graues Haar, sanfte Färbung — Ton-in-Ton & weiche Übergänge wirken am besten' },
]

// ─── Archetype-Scores aus Image-Picks ableiten (für Hybrid-Erkennung) ────────
// Mapping von pick-ID zu 8-Archetyp-Scores (approximativ aus preferred_tags + formality)
const IMAGE_ARCHETYPE_SCORES: Record<string, Record<string, number>> = {
  // g1_a: Dark Monochromatic — Navy-Anzug + Rollkragen
  g1_a: { old_money:72, british_countryside:18, english_gentleman:75, smart_casual:52, riviera:25, ivy_league:48, italian_elegance:55 },
  // g1_b: Classic Business Formal — Navy-Blazer + Krawatte
  g1_b: { old_money:48, british_countryside:22, english_gentleman:78, smart_casual:45, riviera:20, ivy_league:62, italian_elegance:40 },
  // g1_c: Smart Casual Outerwear — Peacoat + Sweater
  g1_c: { old_money:40, british_countryside:32, english_gentleman:18, smart_casual:78, riviera:38, ivy_league:60, italian_elegance:35 },
  // g1_d: Contemporary Casual Layering — Strick + Weste
  g1_d: { old_money:28, british_countryside:25, english_gentleman:12, smart_casual:72, riviera:32, ivy_league:50, italian_elegance:40 },
  // g2_a: Power Dressing — Navy-Suit + gepunktete Krawatte
  g2_a: { old_money:52, british_countryside:20, english_gentleman:90, smart_casual:28, riviera:25, ivy_league:55, italian_elegance:45 },
  // g2_b: British Check / Ivy League — Karoblazer + Krawatte
  g2_b: { old_money:62, british_countryside:50, english_gentleman:58, smart_casual:48, riviera:20, ivy_league:72, italian_elegance:35 },
  // g2_c: European Smart Casual — Navy-Blazer + Beige-Sweater
  g2_c: { old_money:72, british_countryside:35, english_gentleman:38, smart_casual:72, riviera:48, ivy_league:58, italian_elegance:70 },
  // g2_d: Relaxed Tailoring — Camel-Blazer + Tee + Chino
  g2_d: { old_money:62, british_countryside:28, english_gentleman:16, smart_casual:78, riviera:52, ivy_league:48, italian_elegance:75 },
  // g3_a: Heritage Coastal — Shawl-Cardigan + Jeans + Boots
  g3_a: { old_money:28, british_countryside:75, english_gentleman:10, smart_casual:52, riviera:22, ivy_league:42, italian_elegance:20 },
  // g3_b: Quiet Luxury — Creme-Polo-Knit + Beige-Hose
  g3_b: { old_money:88, british_countryside:38, english_gentleman:32, smart_casual:62, riviera:42, ivy_league:50, italian_elegance:70 },
  // g3_c: Clean Minimal — Half-Zip + dunkle Hose + Sneaker
  g3_c: { old_money:38, british_countryside:18, english_gentleman:15, smart_casual:75, riviera:38, ivy_league:48, italian_elegance:35 },
  // g3_d: Sport Tailoring — Tweed-Blazer + Tee + Jogger
  g3_d: { old_money:32, british_countryside:38, english_gentleman:12, smart_casual:78, riviera:32, ivy_league:48, italian_elegance:30 },
}

function deriveArchetypeScoresFromPicks(picks: string[]): Record<string, number> {
  const archetypes = ['old_money', 'british_countryside', 'english_gentleman', 'smart_casual', 'riviera', 'ivy_league', 'italian_elegance']
  const result: Record<string, number> = {}
  const validPicks = picks.filter(p => IMAGE_ARCHETYPE_SCORES[p])
  if (!validPicks.length) return {}
  for (const arch of archetypes) {
    const vals = validPicks.map(p => IMAGE_ARCHETYPE_SCORES[p]?.[arch] ?? 0)
    result[arch] = Math.round(vals.reduce((s, v) => s + v, 0) / validPicks.length)
  }
  return result
}

// ─── Navigations-Header ────────────────────────────────────────────────────────

function NavHeader({ onBack, step, totalSteps }: { onBack: () => void; step: number; totalSteps: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'calc(env(safe-area-inset-top, 44px) + 12px) 20px 0',
    }}>
      <button
        onClick={onBack}
        style={{
          width: 40, height: 40, borderRadius: 12,
          background: C.white, border: 'none',
          boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <ChevronLeft size={20} color={C.text} strokeWidth={2.5} />
      </button>
      <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>
        {Math.min(step, totalSteps)} / {totalSteps} Schritte
      </span>
    </div>
  )
}

function WeiterBtn({
  onClick, disabled = false, label = 'Weiter', loading = false,
}: {
  onClick: () => void
  disabled?: boolean
  label?: string
  loading?: boolean
}) {
  return (
    <div style={{
      position: 'sticky', bottom: 0,
      background: `linear-gradient(to top, ${C.bg} 70%, transparent)`,
      padding: `12px 20px calc(8px + env(safe-area-inset-bottom, 0px))`,
      marginTop: 'auto',
    }}>
      <button
        onClick={onClick}
        disabled={disabled || loading}
        style={{
          width: '100%', padding: '16px 20px',
          background: disabled ? '#C5BFBA' : C.green,
          color: '#fff',
          border: 'none', borderRadius: 14,
          fontSize: 16, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 150ms',
          letterSpacing: '.01em',
        }}
      >
        {loading
          ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          : <>{label} <ChevronRight size={18} strokeWidth={2.5} /></>
        }
      </button>
    </div>
  )
}

// ─── Bild-Pick-Lookup-Tabellen (gespiegelt von IMAGE_STYLE_DEFINITIONS im Backend) ─
// boldness: 1=sehr zurückhaltend … 5=sehr mutig
const IMAGE_PICK_BOLDNESS: Record<string, number> = {
  g1_a: 2, g1_b: 2, g1_c: 3, g1_d: 4,
  g2_a: 2, g2_b: 2, g2_c: 3, g2_d: 3,
  g3_a: 4, g3_b: 1, g3_c: 2, g3_d: 4,
}

// structure: 'durchdacht' | 'ausgewogen' | 'minimal'
const IMAGE_PICK_STRUCTURE: Record<string, string> = {
  g1_a: 'durchdacht', g1_b: 'durchdacht', g1_c: 'ausgewogen', g1_d: 'ausgewogen',
  g2_a: 'durchdacht', g2_b: 'durchdacht', g2_c: 'ausgewogen', g2_d: 'ausgewogen',
  g3_a: 'ausgewogen', g3_b: 'ausgewogen', g3_c: 'minimal',    g3_d: 'ausgewogen',
}

// formality: spiegelt IMAGE_STYLE_DEFINITIONS.formality im Backend
const IMAGE_PICK_FORMALITY: Record<string, number> = {
  g1_a: 4, g1_b: 4, g1_c: 2, g1_d: 1,
  g2_a: 5, g2_b: 4, g2_c: 3, g2_d: 2,
  g3_a: 2, g3_b: 3, g3_c: 2, g3_d: 2,
}

const IMAGE_PICK_OCCASION_WEIGHTS: Record<string, Record<string, number>> = {
  g1_a: { office_formal: 30, special_occasions: 30, social_events: 25, office_casual: 10, leisure:  5 },
  g1_b: { office_formal: 45, office_casual: 20,     social_events: 20, special_occasions: 10, leisure:  5 },
  g1_c: { leisure: 35,       office_casual: 25,     social_events: 25, special_occasions: 10, office_formal:  5 },
  g1_d: { leisure: 50,       office_casual: 20,     social_events: 15, special_occasions:  5, office_formal: 10 },
  g2_a: { office_formal: 50, special_occasions: 25, social_events: 15, office_casual: 10,     leisure:  0 },
  g2_b: { office_formal: 35, social_events: 30,     office_casual: 20, special_occasions: 10, leisure:  5 },
  g2_c: { office_casual: 35, social_events: 30,     leisure: 20,       office_formal: 10,     special_occasions:  5 },
  g2_d: { leisure: 35,       social_events: 30,     office_casual: 25, office_formal:  5,     special_occasions:  5 },
  g3_a: { leisure: 55,       social_events: 25,     office_casual: 15, special_occasions:  5, office_formal:  0 },
  g3_b: { social_events: 35, office_casual: 25,     leisure: 25,       special_occasions: 10, office_formal:  5 },
  g3_c: { leisure: 40,       office_casual: 30,     social_events: 20, office_formal:  5,     special_occasions:  5 },
  g3_d: { leisure: 40,       social_events: 30,     office_casual: 20, office_formal:  5,     special_occasions:  5 },
}

function deriveStructureFromPicks(picks: string[]): string {
  if (!picks.length) return 'ausgewogen'
  const structures = picks.map(p => IMAGE_PICK_STRUCTURE[p] ?? 'ausgewogen')
  const avgFormality = picks.reduce((sum, p) => sum + (IMAGE_PICK_FORMALITY[p] ?? 3), 0) / picks.length
  // Spiegelt _combine_image_picks-Logik im Backend: durchdacht hat Vorrang wenn formal genug
  if (structures.includes('durchdacht') && avgFormality >= 3.5) return 'durchdacht'
  if (structures.includes('minimal')) return 'minimal'
  return 'ausgewogen'
}

function deriveBoldnessFromPicks(picks: string[]): number {
  if (!picks.length) return 3
  return Math.round(picks.reduce((sum, p) => sum + (IMAGE_PICK_BOLDNESS[p] ?? 3), 0) / picks.length)
}

function deriveOccasionWeightsFromPicks(picks: string[]): Record<string, number> {
  if (!picks.length) {
    return { office_formal: 30, office_casual: 25, social_events: 20, leisure: 20, special_occasions: 5 }
  }
  const keys = ['office_formal', 'office_casual', 'social_events', 'leisure', 'special_occasions']
  const raw: Record<string, number> = {}
  for (const key of keys) {
    const vals = picks.map(p => IMAGE_PICK_OCCASION_WEIGHTS[p]?.[key] ?? 0)
    raw[key] = vals.reduce((s, v) => s + v, 0) / vals.length
  }
  const total = Object.values(raw).reduce((s, v) => s + v, 0) || 1
  return Object.fromEntries(keys.map(k => [k, Math.round(raw[k] / total * 100)])) as Record<string, number>
}

// ─── Style-Scores ableiten aus Bedarfsanalyse-Antworten ─────────────────────────

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
  const scores = { ...(base[look] ?? { smart_casual: 3 }) }
  if (context === 'beruflich' || context === 'besondere_anlaesse') {
    scores.english_gentleman = Math.min(5, (scores.english_gentleman ?? 0) + 1)
  } else if (context === 'privat') {
    scores.riviera = Math.min(5, (scores.riviera ?? 0) + 1)
  }
  return scores
}

// ─── Haupt-Komponente ──────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep]     = useState(0)
  const [saving, setSaving] = useState(false)
  const [data, setData]     = useState<OnboardingData>(DEFAULT)
  // Single-select: Index des gewählten Bildes (0–3) oder null
  const [selectedG1, setSelectedG1] = useState<number | null>(null)
  const [selectedG2, setSelectedG2] = useState<number | null>(null)
  const [selectedG3, setSelectedG3] = useState<number | null>(null)
  // Hybrid-Erkennung: gesetzt wenn nach Image-Picks ein Hybrid erkannt wurde
  const [hybridResult, setHybridResult] = useState<ReturnType<typeof detectHybridProfile>>(null)
  const [hybridAccepted, setHybridAccepted] = useState(false)

  const totalSteps = hybridResult !== null ? 13 : 12

  const next = () => {
    if (step === 10) {
      // Nach letztem Image-Pick: Hybrid-Erkennung
      const picks = [
        selectedG1 !== null ? GRUPPE1_IDS[selectedG1] : null,
        selectedG2 !== null ? GRUPPE2_IDS[selectedG2] : null,
        selectedG3 !== null ? GRUPPE3_IDS[selectedG3] : null,
      ].filter((p): p is string => p !== null)
      const archetypeScores = deriveArchetypeScoresFromPicks(picks)
      const result = detectHybridProfile(archetypeScores)
      setHybridResult(result)
      // Hybrid erkannt → zeige Schritt 11 (Hybrid-Screen), sonst direkt zu Schritt 12 (Temp-Zone)
      setStep(result ? 11 : 12)
      return
    }
    setStep(s => s + 1)
  }

  const back = () => {
    if (step === 0) { navigate(-1); return }
    // Wenn bei step 12 kein Hybrid → zurück zu step 10 (Hybrid-Screen wurde übersprungen)
    if (step === 12 && !hybridResult) { setStep(10); return }
    setStep(s => s - 1)
  }

  function set<K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) {
    setData(d => ({ ...d, [k]: v }))
  }

  const finish = async () => {
    setSaving(true)
    try {
      const personaMap: Record<string, string> = {
        old_money:           'old_money',
        smart_casual:        'smart_casual',
        english_gentleman:   'english_gentleman',
        ivy_league:          'ivy_league',
        british_countryside:  'british_countryside',
        riviera:             'riviera',
        italian_elegance:    'italian_elegance',
      }

      const imagePicks = [
        selectedG1 !== null ? GRUPPE1_IDS[selectedG1] : '',
        selectedG2 !== null ? GRUPPE2_IDS[selectedG2] : '',
        selectedG3 !== null ? GRUPPE3_IDS[selectedG3] : '',
      ].filter(Boolean)

      // Hybrid-Daten: wenn erkannt und akzeptiert
      const hybridProfileKey = (hybridResult && hybridAccepted) ? hybridResult.hybridKey : undefined
      const activeStyles = (hybridResult && hybridAccepted)
        ? hybridResult.dominantStyles.slice(0, 3)
        : undefined

      await api.updateProfile({
        style_personas:      personaMap[data.look_identity] ? [personaMap[data.look_identity]] : [],
        onboarding_complete: true,
        context_primary:     data.context_primary,
        lifestyle_context:   data.lifestyle_context,
        perception_goal:     data.perception_goal,
        look_identity:       data.look_identity,
        fit_preference:      data.fit_preference,
        color_world:         data.color_world,
        pattern_preference:  data.pattern_preference,
        style_image_picks:    imagePicks,
        style_scores:         deriveStyleScores(data.look_identity, data.context_primary),
        structure_preference: deriveStructureFromPicks(imagePicks),
        combination_boldness: deriveBoldnessFromPicks(imagePicks),
        occasion_weights:     deriveOccasionWeightsFromPicks(imagePicks),
        // Blueprint v2.0 Phase 3
        sprezzatura_mode:  data.sprezzatura_mode,
        anlass_frequenz:   data.anlass_frequenz,
        temp_zone:         data.temp_zone as any,
        interaction_count: 0,
        // v7.1: Kontrasttyp (aktiviert Kontrasttyp-Bewertung im Scoring)
        contrast_type:     data.contrast_type,
        // Gap 7
        buero_config:      { modern_office: data.modern_office },
        // Hybrid-System
        ...(hybridProfileKey ? { hybrid_profile: hybridProfileKey, hybrid_ratio: hybridResult!.ratio } : {}),
        ...(activeStyles ? { active_styles: activeStyles } : {}),
      })
      toast.success('Stilprofil aktiviert!')
      navigate('/')
    } catch {
      toast.error('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ height: '100%', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div
        key={step}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', animation: 'ob-in 220ms ease' }}
      >
        {step === 0 && <StepWelcome onNext={next} onBack={back} />}

        {step === 1 && (
          <StepSelect step={1}
            question="Wofür brauchst du deine Garderobe?"
            options={CONTEXT_OPTIONS} value={data.context_primary}
            onChange={v => set('context_primary', v)} onBack={back} onNext={next}
          />
        )}
        {step === 2 && (
          <StepLifestyle step={2}
            value={data.lifestyle_context}
            modernOffice={data.modern_office}
            onChange={v => set('lifestyle_context', v)}
            onModernOfficeChange={v => set('modern_office', v)}
            onBack={back} onNext={next}
          />
        )}
        {step === 3 && (
          <StepSelect step={3}
            question="Wie möchtest du wirken?"
            options={PERCEPTION_OPTIONS} value={data.perception_goal}
            onChange={v => set('perception_goal', v)} onBack={back} onNext={next}
          />
        )}
        {step === 4 && (
          <StepSelect step={4}
            question="Was beschreibt deinen Stil am besten?"
            options={LOOK_OPTIONS} value={data.look_identity}
            onChange={v => set('look_identity', v)} onBack={back} onNext={next}
          />
        )}
        {step === 5 && (
          <StepSelect step={5}
            question="Wie sitzt deine Kleidung am liebsten?"
            options={FIT_OPTIONS} value={data.fit_preference}
            onChange={v => set('fit_preference', v)} onBack={back} onNext={next}
          />
        )}
        {step === 6 && (
          <StepColors step={6}
            selected={data.color_world}
            onToggle={id => {
              const arr = data.color_world
              set('color_world', arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])
            }}
            onBack={back} onNext={next}
          />
        )}
        {step === 7 && (
          <StepPatterns step={7}
            selected={data.pattern_preference}
            onToggle={id => {
              const arr = data.pattern_preference
              set('pattern_preference', arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])
            }}
            onBack={back} onNext={next}
          />
        )}
        {step === 8 && (
          <StepImages step={8}
            question="Welcher Look spricht dich an?"
            sub="Wähle das Outfit, das am ehesten zu dir passt."
            images={GRUPPE1_IMAGES}
            selected={selectedG1}
            onSelect={i => setSelectedG1(i)}
            onBack={back} onNext={next}
          />
        )}
        {step === 9 && (
          <StepImages step={9}
            question="Welcher Look spricht dich an?"
            sub="Wähle das Outfit, das am ehesten zu dir passt."
            images={GRUPPE2_IMAGES}
            selected={selectedG2}
            onSelect={i => setSelectedG2(i)}
            onBack={back} onNext={next}
          />
        )}
        {step === 10 && (
          <StepImages step={10}
            question="Welcher Look spricht dich an?"
            sub="Wähle das Outfit, das am ehesten zu dir passt."
            images={GRUPPE3_IMAGES}
            selected={selectedG3}
            onSelect={i => setSelectedG3(i)}
            onBack={back} onNext={next}
          />
        )}
        {step === 11 && hybridResult && (
          <StepHybridDetect
            step={11} totalSteps={totalSteps}
            hybridResult={hybridResult}
            onAccept={() => { setHybridAccepted(true); setStep(12) }}
            onReject={() => { setHybridAccepted(false); setStep(12) }}
            onBack={back}
          />
        )}
        {step === 12 && (
          <StepSelect step={12}
            question="Welches Klimagebiet passt zu dir?"
            options={TEMP_ZONE_OPTIONS}
            value={data.temp_zone}
            onChange={v => set('temp_zone', v)}
            onBack={back} onNext={next}
            totalSteps={totalSteps}
          />
        )}
        {step === 13 && (
          <StepSprezzatura step={13}
            value={data.sprezzatura_mode}
            anlassFrequenz={data.anlass_frequenz}
            contrastType={data.contrast_type}
            onChange={v => set('sprezzatura_mode', v)}
            onAnlassChange={v => set('anlass_frequenz', v)}
            onContrastChange={v => set('contrast_type', v)}
            onBack={back} onNext={finish}
            saving={saving}
            totalSteps={totalSteps}
          />
        )}
      </div>

      <style>{`
        @keyframes ob-in { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin   { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

// ─── Gap 7: Schritt 2 Lifestyle mit modern_office Checkbox ───────────────────

function StepLifestyle({
  step, value, modernOffice, onChange, onModernOfficeChange, onBack, onNext,
}: {
  step: number; value: string; modernOffice: boolean
  onChange: (v: string) => void; onModernOfficeChange: (v: boolean) => void
  onBack: () => void; onNext: () => void
}) {
  const showModernOffice = ['formelles_buero', 'lockeres_buero'].includes(value)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NavHeader onBack={onBack} step={step} totalSteps={12} />
      <div style={{ flex: 1, padding: '24px 20px 0', overflowY: 'auto' }}>
        <h2 style={{
          fontSize: 30, fontWeight: 900, color: C.text,
          marginBottom: 24, lineHeight: 1.2, letterSpacing: '-.02em',
        }}>
          Was prägt deinen Alltag am meisten?
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LIFESTYLE_OPTIONS.map(opt => {
            const sel = value === opt.id
            return (
              <div key={opt.id} onClick={() => onChange(opt.id)} style={{
                borderRadius: 14, padding: '16px 18px',
                background: sel ? C.green : C.white,
                border: `1.5px solid ${sel ? C.green : C.border}`,
                cursor: 'pointer', transition: 'all 150ms',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: sel ? '#fff' : C.text, marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: 13, color: sel ? 'rgba(255,255,255,0.7)' : C.muted }}>{opt.sub}</div>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${sel ? '#fff' : C.border}`,
                  background: sel ? '#fff' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <Check size={13} color={C.green} strokeWidth={3} />}
                </div>
              </div>
            )
          })}
        </div>

        {/* Gap 7: Modernes Büro Checkbox — nur bei Büro-Antworten sichtbar */}
        {showModernOffice && (
          <div
            onClick={() => onModernOfficeChange(!modernOffice)}
            style={{
              marginTop: 16, padding: '14px 18px', borderRadius: 14,
              background: modernOffice ? C.accentBg : C.white,
              border: `1.5px solid ${modernOffice ? C.accent : C.border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all 150ms',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              border: `2px solid ${modernOffice ? C.green : C.border}`,
              background: modernOffice ? C.green : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {modernOffice && <Check size={12} color="#fff" strokeWidth={3} />}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Modernes Büro / Startup-Umfeld</div>
              <div style={{ fontSize: 12, color: C.muted }}>Lockerer Dresscode — Premium-Denim im Business-Kontext erlaubt</div>
            </div>
          </div>
        )}
      </div>
      <WeiterBtn onClick={onNext} disabled={!value} />
    </div>
  )
}

// ─── Schritt 0: Willkommen ────────────────────────────────────────────────────

function StepWelcome({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 28px', textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: C.green,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 32, boxShadow: '0 4px 20px rgba(30,58,42,0.25)',
      }}>
        <span style={{ fontSize: 32 }}>✦</span>
      </div>

      <p style={{
        fontFamily: 'Georgia, serif', fontStyle: 'italic',
        fontSize: 14, color: C.muted, marginBottom: 12, letterSpacing: '.05em',
      }}>
        Dein persönlicher Stilberater
      </p>
      <h1 style={{
        fontSize: 38, fontWeight: 900, color: C.text,
        marginBottom: 20, lineHeight: 1.1, letterSpacing: '-.02em',
      }}>
        Entdecke deinen Stil
      </h1>
      <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.75, marginBottom: 52, maxWidth: 320 }}>
        In 12 Schritten analysieren wir deinen Stil und deinen Alltag — der Algorithmus kombiniert dann passende Outfits aus deinem Kleiderschrank.
      </p>

      <button
        onClick={onNext}
        style={{
          width: '100%', maxWidth: 340, padding: '17px 24px',
          background: C.green, color: '#fff', border: 'none',
          borderRadius: 14, fontSize: 16, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer', letterSpacing: '.01em',
        }}
      >
        Jetzt starten <ChevronRight size={18} strokeWidth={2.5} />
      </button>

      <button
        onClick={onBack}
        style={{ marginTop: 16, background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer' }}
      >
        Zurück
      </button>
    </div>
  )
}

// ─── Einzel-Auswahl ────────────────────────────────────────────────────────────

function StepSelect({
  step, question, options, value, onChange, onBack, onNext, totalSteps = 12,
}: {
  step: number
  question: string
  options: { id: string; label: string; sub: string }[]
  value: string
  onChange: (v: string) => void
  onBack: () => void
  onNext: () => void
  totalSteps?: number
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NavHeader onBack={onBack} step={step} totalSteps={totalSteps} />
      <div style={{ flex: 1, padding: '24px 20px 0', overflowY: 'auto' }}>
        <h2 style={{
          fontSize: 30, fontWeight: 900, color: C.text,
          marginBottom: 24, lineHeight: 1.2, letterSpacing: '-.02em',
        }}>
          {question}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map(opt => {
            const sel = value === opt.id
            return (
              <div
                key={opt.id}
                onClick={() => onChange(opt.id)}
                style={{
                  borderRadius: 14, padding: '16px 18px',
                  background: sel ? C.green : C.white,
                  border: `1.5px solid ${sel ? C.green : C.border}`,
                  cursor: 'pointer', transition: 'all 150ms',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: sel ? '#fff' : C.text, marginBottom: 2 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 13, color: sel ? 'rgba(255,255,255,0.7)' : C.muted }}>
                    {opt.sub}
                  </div>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${sel ? '#fff' : C.border}`,
                  background: sel ? '#fff' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 150ms',
                }}>
                  {sel && <Check size={13} color={C.green} strokeWidth={3} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <WeiterBtn onClick={onNext} disabled={!value} />
    </div>
  )
}

// ─── Schritt 6: Farbwelt ──────────────────────────────────────────────────────

function StepColors({
  step, selected, onToggle, onBack, onNext,
}: {
  step: number
  selected: string[]
  onToggle: (id: string) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NavHeader onBack={onBack} step={step} totalSteps={12} />
      <div style={{ flex: 1, padding: '24px 20px 0', overflowY: 'auto' }}>
        <h2 style={{
          fontSize: 30, fontWeight: 900, color: C.text,
          marginBottom: 6, lineHeight: 1.2, letterSpacing: '-.02em',
        }}>
          Welche Farbwelt spricht dich an?
        </h2>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
          Mehrfachauswahl möglich.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {COLOR_PALETTES.map(p => {
            const sel = selected.includes(p.id)
            return (
              <div
                key={p.id}
                onClick={() => onToggle(p.id)}
                style={{
                  borderRadius: 14, padding: '14px 18px',
                  background: sel ? C.green : C.white,
                  border: `1.5px solid ${sel ? C.green : C.border}`,
                  cursor: 'pointer', transition: 'all 150ms',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  {p.swatches.map(hex => (
                    <div key={hex} style={{
                      width: 20, height: 20, borderRadius: '50%', background: hex,
                      border: '1.5px solid rgba(255,255,255,0.3)', flexShrink: 0,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: sel ? '#fff' : C.text, flex: 1 }}>
                  {p.label}
                </span>
                {sel && <Check size={16} color="#fff" strokeWidth={2.5} />}
              </div>
            )
          })}
        </div>
      </div>
      <WeiterBtn onClick={onNext} disabled={selected.length === 0} />
    </div>
  )
}

// ─── Schritt 7: Musterpräferenz ────────────────────────────────────────────────

function StepPatterns({
  step, selected, onToggle, onBack, onNext,
}: {
  step: number
  selected: string[]
  onToggle: (id: string) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NavHeader onBack={onBack} step={step} totalSteps={12} />
      <div style={{ flex: 1, padding: '24px 20px 0', overflowY: 'auto' }}>
        <h2 style={{
          fontSize: 30, fontWeight: 900, color: C.text,
          marginBottom: 6, lineHeight: 1.2, letterSpacing: '-.02em',
        }}>
          Welche Muster trägst du gerne?
        </h2>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          Kleidungsstücke mit nicht gewählten Mustern werden ausgeschlossen. Mehrfachauswahl möglich.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PATTERN_OPTIONS.map(p => {
            const sel = selected.includes(p.id)
            return (
              <div
                key={p.id}
                onClick={() => onToggle(p.id)}
                style={{
                  borderRadius: 14, padding: '16px 18px',
                  background: sel ? C.green : C.white,
                  border: `1.5px solid ${sel ? C.green : C.border}`,
                  cursor: 'pointer', transition: 'all 150ms',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: sel ? '#fff' : C.text, marginBottom: 2 }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: 13, color: sel ? 'rgba(255,255,255,0.7)' : C.muted }}>
                    {p.sub}
                  </div>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${sel ? '#fff' : C.border}`,
                  background: sel ? '#fff' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 150ms',
                }}>
                  {sel && <Check size={13} color={C.green} strokeWidth={3} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <WeiterBtn onClick={onNext} disabled={selected.length === 0} />
    </div>
  )
}

// ─── Schritte 8–10: Stil-Bilder (Single-Select) ──────────────────────────────

function StepImages({
  step, question, sub, images, selected, onSelect, onBack, onNext,
}: {
  step: number
  question: string
  sub: string
  images: string[]
  selected: number | null
  onSelect: (i: number) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NavHeader onBack={onBack} step={step} totalSteps={12} />

      <div style={{ padding: '20px 20px 12px' }}>
        <h2 style={{
          fontSize: 28, fontWeight: 900, color: C.text,
          lineHeight: 1.2, letterSpacing: '-.02em', marginBottom: 4,
        }}>
          {question}
        </h2>
        <p style={{ color: C.muted, fontSize: 13 }}>{sub}</p>
      </div>

      {/* 2×2 Bild-Raster — so groß wie möglich */}
      <div style={{
        flex: 1, padding: '0 20px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10,
      }}>
        {images.map((src, i) => {
          const isSelected = selected === i
          return (
            <div
              key={i}
              onClick={() => onSelect(i)}
              style={{
                position: 'relative', borderRadius: 16, overflow: 'hidden',
                cursor: 'pointer', background: '#E8E0D8',
                border: `3px solid ${isSelected ? C.green : 'transparent'}`,
                transition: 'border-color 150ms',
              }}
            >
              <img
                src={src} alt=""
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => {
                  const t = e.target as HTMLImageElement
                  t.style.display = 'none'
                  const parent = t.parentElement
                  if (parent && !parent.querySelector('.img-placeholder')) {
                    const ph = document.createElement('div')
                    ph.className = 'img-placeholder'
                    ph.style.cssText = [
                      'position:absolute', 'inset:0', 'display:flex',
                      'align-items:center', 'justify-content:center',
                      'color:#c4b8a8', 'font-size:11px', 'text-align:center',
                      'padding:8px',
                    ].join(';')
                    ph.textContent = 'Bild nicht verfügbar'
                    parent.appendChild(ph)
                  }
                }}
              />
              {/* Ausgewählt-Indikator */}
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 28, height: 28, borderRadius: '50%',
                  background: C.green,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </div>
              )}
              {/* Abdunkelung bei nicht-ausgewählten Bildern (sobald eines gewählt) */}
              {selected !== null && !isSelected && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(244,239,232,0.50)',
                  transition: 'opacity 150ms',
                }} />
              )}
            </div>
          )
        })}
      </div>

      <WeiterBtn onClick={onNext} disabled={selected === null} label="Weiter" />
    </div>
  )
}

// ─── Hybrid-Erkennung Screen ──────────────────────────────────────────────────

function StepHybridDetect({
  step, totalSteps, hybridResult, onAccept, onReject, onBack,
}: {
  step: number
  totalSteps: number
  hybridResult: NonNullable<ReturnType<typeof detectHybridProfile>>
  onAccept: () => void
  onReject: () => void
  onBack: () => void
}) {
  const { profile } = hybridResult
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NavHeader onBack={onBack} step={step} totalSteps={totalSteps} />
      <div style={{ flex: 1, padding: '24px 20px 0', overflowY: 'auto' }}>
        <div style={{
          display: 'inline-block', padding: '4px 10px', borderRadius: 20,
          background: C.accentBg, marginBottom: 14,
        }}>
          <span style={{ fontSize: 11, color: C.green, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase' }}>
            {STRINGS.hybrid.detectedLabel}
          </span>
        </div>
        <h2 style={{
          fontSize: 28, fontWeight: 900, color: C.text,
          marginBottom: 8, lineHeight: 1.2, letterSpacing: '-.02em',
        }}>
          {STRINGS.hybrid.screenTitle}
        </h2>
        <div style={{
          background: C.white, borderRadius: 16, padding: '16px 18px', marginBottom: 20,
          border: `1.5px solid ${C.accent}`,
        }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 6 }}>
            {profile.name_de}
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>
            {profile.description_de}
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
          {STRINGS.hybrid.exampleCombosTitle}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {profile.example_combos.slice(0, 3).map((combo, i) => (
            <div key={i} style={{
              padding: '10px 14px', borderRadius: 10,
              background: C.white, border: `1px solid ${C.border}`,
              fontSize: 13, color: C.text,
            }}>
              · {combo}
            </div>
          ))}
        </div>
      </div>
      <div style={{
        position: 'sticky', bottom: 0,
        background: `linear-gradient(to top, ${C.bg} 70%, transparent)`,
        padding: `12px 20px calc(8px + env(safe-area-inset-bottom, 0px))`,
        display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto',
      }}>
        <button
          onClick={onAccept}
          style={{
            width: '100%', padding: '15px 20px',
            background: C.green, color: '#fff',
            border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer',
          }}
        >
          <Check size={16} strokeWidth={2.5} /> {STRINGS.hybrid.acceptBtn}
        </button>
        <button
          onClick={onReject}
          style={{
            width: '100%', padding: '13px 20px',
            background: 'transparent', color: C.muted,
            border: `1.5px solid ${C.border}`, borderRadius: 14,
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          {STRINGS.hybrid.rejectBtn}
        </button>
      </div>
    </div>
  )
}

// ─── Blueprint v2.0 Schritt 12: Sprezzatura-Mode + Anlass-Frequenz ────────────

const ANLASS_OPTIONS: { key: keyof { buero: number; events: number; freizeit: number }; label: string; sub: string }[] = [
  { key: 'buero',    label: 'Büro / Arbeit',       sub: 'Professionelle Meetings, Kundentermine' },
  { key: 'events',   label: 'Events / Ausgehen',   sub: 'Abendessen, Networking, Partys' },
  { key: 'freizeit', label: 'Freizeit / Privat',   sub: 'Wochenende, Alltag, Sport' },
]

function StepSprezzatura({
  step, value, anlassFrequenz, contrastType, onChange, onAnlassChange, onContrastChange, onBack, onNext, saving, totalSteps = 12,
}: {
  step: number
  value: boolean
  anlassFrequenz: { buero: number; events: number; freizeit: number }
  contrastType: string
  onChange: (v: boolean) => void
  onAnlassChange: (v: { buero: number; events: number; freizeit: number }) => void
  onContrastChange: (v: string) => void
  onBack: () => void
  onNext: () => void
  saving: boolean
  totalSteps?: number
}) {
  const total = anlassFrequenz.buero + anlassFrequenz.events + anlassFrequenz.freizeit || 1

  const handleSlider = (key: keyof typeof anlassFrequenz, val: number) => {
    const rest = 1 - val
    const others = ANLASS_OPTIONS.filter(o => o.key !== key)
    const otherSum = others.reduce((s, o) => s + anlassFrequenz[o.key], 0) || 1
    const updated = { ...anlassFrequenz, [key]: val }
    for (const o of others) {
      updated[o.key] = Math.max(0, (anlassFrequenz[o.key] / otherSum) * rest)
    }
    // Normalize to sum = 1
    const sum = updated.buero + updated.events + updated.freizeit
    if (sum > 0) {
      updated.buero    = +(updated.buero / sum).toFixed(2)
      updated.events   = +(updated.events / sum).toFixed(2)
      updated.freizeit = +(updated.freizeit / sum).toFixed(2)
    }
    onAnlassChange(updated)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <NavHeader onBack={onBack} step={step} totalSteps={totalSteps} />
      <div style={{ flex: 1, padding: '24px 20px 0', overflowY: 'auto' }}>
        <h2 style={{
          fontSize: 28, fontWeight: 900, color: C.text,
          marginBottom: 6, lineHeight: 1.2, letterSpacing: '-.02em',
        }}>
          Letzter Schritt
        </h2>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          Für welche Anlässe trägst du die meiste Kleidung? Und wie experimentierfreudig bist du?
        </p>

        {/* Anlass-Frequenz Slider */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
            Anlass-Verteilung
          </div>
          {ANLASS_OPTIONS.map(opt => {
            const pct = Math.round((anlassFrequenz[opt.key] / total) * 100)
            return (
              <div key={opt.key} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{opt.sub}</div>
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: C.green,
                    background: C.accentBg, borderRadius: 8, padding: '2px 8px',
                    alignSelf: 'center',
                  }}>
                    {pct}%
                  </span>
                </div>
                <div style={{
                  position: 'relative', height: 6, borderRadius: 3,
                  background: C.border, marginBottom: 2,
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${pct}%`, borderRadius: 3, background: C.green,
                    transition: 'width 150ms',
                  }} />
                </div>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={anlassFrequenz[opt.key]}
                  onChange={e => handleSlider(opt.key, parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: C.green }}
                />
              </div>
            )
          })}
        </div>

        {/* v7.1: Kontrasttyp-Auswahl */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
            Dein Kontrasttyp
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CONTRAST_OPTIONS.map(opt => {
              const active = contrastType === opt.id
              return (
                <div key={opt.id}
                  onClick={() => onContrastChange(opt.id)}
                  style={{
                    background: C.white, borderRadius: 14, cursor: 'pointer',
                    border: `1.5px solid ${active ? C.green : C.border}`,
                    padding: '14px 16px', transition: 'border-color 150ms',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{opt.sub}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sprezzatura-Mode Toggle */}
        <div style={{
          background: C.white, borderRadius: 16,
          border: `1.5px solid ${value ? C.green : C.border}`,
          padding: '18px 18px', transition: 'border-color 150ms',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                Sprezzatura-Modus
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                Aktiviert stilhistorisch legitimierte Kombinationen — z.B. brauner Wildleder-Loafer zu grauem Anzug, Loafer ohne Socken, Tweed-Sakko mit City-Flanellhose.
                Regelwerk als Leitplanke, nicht als Käfig.
              </div>
            </div>
            <div
              onClick={() => onChange(!value)}
              style={{
                width: 50, height: 28, borderRadius: 14, flexShrink: 0,
                background: value ? C.green : C.border,
                position: 'relative', cursor: 'pointer',
                transition: 'background 200ms',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, width: 22, height: 22, borderRadius: '50%',
                background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                left: value ? 25 : 3, transition: 'left 200ms',
              }} />
            </div>
          </div>
          {value && (
            <div style={{
              marginTop: 12, padding: '10px 12px', borderRadius: 10,
              background: C.accentBg, fontSize: 12, color: C.green, lineHeight: 1.5,
            }}>
              ✓ Context-Overrides aktiviert — kreative Kombinationen werden höher bewertet
            </div>
          )}
        </div>
      </div>

      <div style={{
        position: 'sticky', bottom: 0,
        background: `linear-gradient(to top, ${C.bg} 70%, transparent)`,
        padding: `12px 20px calc(8px + env(safe-area-inset-bottom, 0px))`,
        marginTop: 'auto',
      }}>
        <button
          onClick={onNext}
          disabled={saving}
          style={{
            width: '100%', padding: '16px 20px',
            background: C.green, color: '#fff',
            border: 'none', borderRadius: 14,
            fontSize: 16, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving
            ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Wird gespeichert…</>
            : <>Stilprofil aktivieren <ChevronRight size={18} strokeWidth={2.5} /></>
          }
        </button>
      </div>
    </div>
  )
}
