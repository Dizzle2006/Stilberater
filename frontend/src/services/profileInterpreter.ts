// Direct port of backend/app/services/profile_interpreter.py
import type { UserProfile, FeedbackReason, FeedbackEntry } from '../db/index'
import { findHybridProfile, synthesizeHybrid, customHybridKey, resolveHybridProfile, HYBRID_STYLE_PROFILES, type HybridStyleProfile } from '../data/hybridStyles'

export interface ProfileRules {
  required_tags: string[]
  forbidden_tags: string[]
  preferred_tags: string[]
  avoided_colors: string[]
  preferred_color_families: string[]
  allowed_patterns: string[]
  preferred_fits: string[]
  weight_color: number
  weight_style: number
  weight_occasion: number
  weight_freshness: number
  weight_formality: number
  occasion_weights: Record<string, number>
  primary_occasions: string[]
  combination_boldness: number
  structure_preference: string
  max_outfits: number
  // Blueprint v2.0 Phase 3: Neue Felder
  sprezzatura_mode: boolean
  active_styles: string[]
  min_score_threshold: number
  // Gap 5: Formalitäts-Untergrenze abgeleitet aus anlass_frequenz
  formality_floor: number
  // Gap 7: Modernes Büro — Selvedge Denim im Business-Casual-Kontext erlaubt
  modern_office: boolean
}

function defaultRules(): ProfileRules {
  return {
    required_tags: [], forbidden_tags: [], preferred_tags: [],
    avoided_colors: [], preferred_color_families: [], allowed_patterns: [], preferred_fits: [],
    weight_color: 0.20, weight_style: 0.28, weight_occasion: 0.20, weight_freshness: 0.12, weight_formality: 0.20,
    occasion_weights: {}, primary_occasions: [], combination_boldness: 3, structure_preference: 'balanced', max_outfits: 8,
    sprezzatura_mode: false, active_styles: [], min_score_threshold: 0.78, formality_floor: 0, modern_office: false,
  }
}

// ─── Gap 5: Formality-Floor ────────────────────────────────────────────────

/**
 * Leitet formality_floor (0–100) aus Anlass-Frequenz ab.
 * Logik: buero_anteil×0.6 + event_anteil×0.4 → Basis (0–1) × 70 + 20.
 * Beispiel: 80% Büro → floor ≈ 55. 80% Freizeit → floor ≈ 20.
 */
export function deriveFormalityFloor(
  anlass?: { buero?: number; events?: number; freizeit?: number }
): number {
  if (!anlass) return 0
  const buero   = anlass.buero   ?? 0
  const events  = anlass.events  ?? 0
  const sum = buero + events + (anlass.freizeit ?? 0)
  if (sum === 0) return 0
  const bueroNorm  = buero  / sum
  const eventsNorm = events / sum
  const basis = bueroNorm * 0.6 + eventsNorm * 0.4
  return Math.round(basis * 70 + 20)
}

const LOOK_IDENTITY_RULES: Record<string, any> = {
  klassisch_zeitlos:     { required_tags:['classic'],  preferred_tags:['formal','business','preppy'],         forbidden_tags:['sporty','streetwear','bohemian','edgy'] },
  smart_casual:          { required_tags:[],            preferred_tags:['classic','casual','business'],        forbidden_tags:['sporty','streetwear','bohemian','edgy'] },
  english_gentleman:     { required_tags:['classic'],   preferred_tags:['business','formal','british'],        forbidden_tags:['sporty','streetwear','bohemian','edgy'] },
  elegantes_casual:      { required_tags:[],            preferred_tags:['classic','formal','casual'],          forbidden_tags:['sporty','streetwear','edgy'] },
  minimalistisch_modern: { required_tags:[],            preferred_tags:['minimalist','classic','casual'],      forbidden_tags:['sporty','streetwear','bohemian','edgy'] },
  // Stile die früher fehlten → fielen fälschlicherweise auf smart_casual zurück
  old_money:             { required_tags:['classic'],   preferred_tags:['old_money','formal','business'],      forbidden_tags:['sporty','streetwear','edgy'] },
  ivy_league:            { required_tags:[],            preferred_tags:['classic','casual','business','preppy'],forbidden_tags:['sporty','streetwear','edgy','bohemian'] },
  british_countryside:   { required_tags:[],            preferred_tags:['british','classic','casual','old_money'],forbidden_tags:['sporty','streetwear','edgy'] },
  riviera:               { required_tags:[],            preferred_tags:['classic','casual','old_money'],       forbidden_tags:['sporty','streetwear','edgy'] },
  italian_elegance:      { required_tags:[],            preferred_tags:['classic','old_money','casual','smart_casual'], forbidden_tags:['sporty','streetwear','edgy','bohemian'] },
}

const LIFESTYLE_CONTEXT_RULES: Record<string, any> = {
  formelles_buero:  { preferred_tags:['formal','business','classic'],    forbidden_tags:['sporty','streetwear'], weight_style:0.45, weight_occasion:0.35 },
  lockeres_buero:   { preferred_tags:['business','casual','classic'],    forbidden_tags:['sporty','streetwear'], weight_style:0.35, weight_occasion:0.30 },
  homeoffice:       { preferred_tags:['casual','classic'],               forbidden_tags:['streetwear'],          weight_style:0.30, weight_occasion:0.20 },
  unterwegs:        { preferred_tags:['casual','classic','business'],    forbidden_tags:['streetwear'],          weight_style:0.30, weight_occasion:0.30 },
  gesellschaftlich: { preferred_tags:['formal','classic','business'],    forbidden_tags:['sporty','streetwear'], weight_style:0.40, weight_occasion:0.35 },
}

const FIT_PREFERENCE_MAP: Record<string, string[]> = {
  slim: ['slim'], regular: ['regular','classic'], relaxed: ['relaxed','regular'], tailored: ['tailored','slim'],
}

const COLOR_WORLD_FAMILY_MAP: Record<string, string> = {
  erdtoene: 'earth', navy: 'navy', grau: 'grey', neutral: 'warm_neutral', kuehl: 'cool', burgund: 'burgundy',
}

const PATTERN_MAP: Record<string, string> = {
  solid: 'solid', subtle_texture: 'subtle_texture', stripe: 'stripe', fine_check: 'fine_check', houndstooth: 'houndstooth', paisley: 'other',
}

const CONTEXT_PRIMARY_RULES: Record<string, any> = {
  privat:           { preferred_tags:['casual'],                           primary_occasions:['leisure','social_events'] },
  beruflich:        { preferred_tags:['business','formal','classic'],      primary_occasions:['office_formal','office_casual'] },
  privat_beruflich: { preferred_tags:['classic','casual'],                 primary_occasions:['office_casual','leisure','social_events'] },
  besondere_anlaesse:{ preferred_tags:['formal','classic'],                primary_occasions:['special_occasions','social_events'] },
}

const PERCEPTION_GOAL_RULES: Record<string, any> = {
  elegant_hochwertig:         { preferred_tags:['formal','classic'],    weight_style_bonus:0.05,  boldness_modifier:0 },
  schick_professionell:       { preferred_tags:['business','classic'],  weight_style_bonus:0.03,  boldness_modifier:0 },
  selbstbewusst_charismatisch:{ preferred_tags:['classic'],             weight_style_bonus:0.0,   boldness_modifier:1 },
  entspannt_umgaenglich:      { preferred_tags:['casual'],              weight_style_bonus:-0.03, boldness_modifier:0 },
  locker_cool:                { preferred_tags:['casual'],              weight_style_bonus:-0.05, boldness_modifier:1 },
}

const STYLE_SCORE_TAG_BOOSTS: Record<string, string[]> = {
  smart_casual:        ['classic','casual'],
  english_gentleman:   ['formal','business','classic','british'],
  old_money:           ['classic','old_money'],
  ivy_league:          ['classic','casual'],
  british_countryside: ['british','classic','casual','old_money'],
  riviera:             ['classic','casual','old_money'],
}

const IMAGE_STYLE_DEFINITIONS: Record<string, any> = {
  g1_a: { formality:4, preferred_tags:['classic','formal','business','old_money','minimalist'], forbidden_tags:['sporty','streetwear','bohemian','edgy'], color_families:['navy','grey'], boldness:2, structure:'durchdacht', occasion_weights:{office_formal:30,special_occasions:30,social_events:25,office_casual:10,leisure:5} },
  g1_b: { formality:4, preferred_tags:['classic','formal','business','british'],               forbidden_tags:['sporty','streetwear','bohemian'],        color_families:['navy','grey','warm_neutral'], boldness:2, structure:'durchdacht', occasion_weights:{office_formal:45,office_casual:20,social_events:20,special_occasions:10,leisure:5} },
  g1_c: { formality:2, preferred_tags:['classic','casual','smart_casual'],                     forbidden_tags:['sporty','streetwear'],                   color_families:['grey','navy'], boldness:3, structure:'ausgewogen', occasion_weights:{leisure:35,office_casual:25,social_events:25,special_occasions:10,office_formal:5} },
  g1_d: { formality:1, preferred_tags:['casual','classic','minimalist'],                       forbidden_tags:['streetwear','sporty'],                   color_families:['grey','navy'], boldness:4, structure:'ausgewogen', occasion_weights:{leisure:50,office_casual:20,social_events:15,special_occasions:5,office_formal:10} },
  g2_a: { formality:5, preferred_tags:['formal','business','classic'],                         forbidden_tags:['sporty','streetwear','bohemian','edgy'],  color_families:['navy','warm_neutral'], boldness:2, structure:'durchdacht', occasion_weights:{office_formal:50,special_occasions:25,social_events:15,office_casual:10,leisure:0} },
  g2_b: { formality:4, preferred_tags:['british','classic','formal','old_money'],              forbidden_tags:['sporty','streetwear','edgy'],             color_families:['navy','grey','earth'], boldness:2, structure:'durchdacht', occasion_weights:{office_formal:35,social_events:30,office_casual:20,special_occasions:10,leisure:5} },
  g2_c: { formality:3, preferred_tags:['classic','smart_casual','old_money'],forbidden_tags:['sporty','streetwear','edgy'],             color_families:['navy','earth','warm_neutral'], boldness:3, structure:'ausgewogen', occasion_weights:{office_casual:35,social_events:30,leisure:20,office_formal:10,special_occasions:5} },
  g2_d: { formality:2, preferred_tags:['casual','smart_casual','old_money'],                   forbidden_tags:['sporty','streetwear','edgy'],             color_families:['earth','warm_neutral'], boldness:3, structure:'ausgewogen', occasion_weights:{leisure:35,social_events:30,office_casual:25,office_formal:5,special_occasions:5} },
  g3_a: { formality:2, preferred_tags:['british','casual','classic'],                          forbidden_tags:['streetwear','edgy'],                      color_families:['earth','navy','grey','warm_neutral'], boldness:4, structure:'ausgewogen', occasion_weights:{leisure:55,social_events:25,office_casual:15,special_occasions:5,office_formal:0} },
  g3_b: { formality:3, preferred_tags:['old_money','classic','minimalist'],                    forbidden_tags:['sporty','streetwear','edgy','bohemian'],  color_families:['warm_neutral','earth'], boldness:1, structure:'ausgewogen', occasion_weights:{social_events:35,office_casual:25,leisure:25,special_occasions:10,office_formal:5} },
  g3_c: { formality:2, preferred_tags:['minimalist','casual','classic'],                       forbidden_tags:['sporty','streetwear','edgy','bohemian'],  color_families:['grey','navy','warm_neutral'], boldness:2, structure:'minimal', occasion_weights:{leisure:40,office_casual:30,social_events:20,office_formal:5,special_occasions:5} },
  g3_d: { formality:2, preferred_tags:['smart_casual','casual','classic'],                     forbidden_tags:['streetwear','bohemian'],                  color_families:['grey','warm_neutral','navy'], boldness:4, structure:'ausgewogen', occasion_weights:{leisure:40,social_events:30,office_casual:20,office_formal:5,special_occasions:5} },
}

function combineImagePicks(picks: string[]) {
  const defs = picks.map(p => IMAGE_STYLE_DEFINITIONS[p]).filter(Boolean)
  if (!defs.length) return {}

  const formality = defs.reduce((s, d) => s + (d.formality ?? 3), 0) / defs.length
  const tagFreq: Record<string, number> = {}
  for (const d of defs) for (const t of (d.preferred_tags ?? [])) tagFreq[t] = (tagFreq[t] ?? 0) + 1
  const preferred_tags = Object.keys(tagFreq).sort((a, b) => tagFreq[b] - tagFreq[a])
  const forbidden_tags = [...new Set(defs.flatMap((d: any) => d.forbidden_tags ?? []))]
  const color_families = [...new Set(defs.flatMap((d: any) => d.color_families ?? []))]
  const boldness = Math.round(defs.reduce((s: number, d: any) => s + (d.boldness ?? 3), 0) / defs.length)
  const structures = defs.map((d: any) => d.structure ?? 'ausgewogen')
  const structure = structures.includes('durchdacht') && formality >= 3.5 ? 'durchdacht'
    : structures.includes('minimal') ? 'minimal' : 'ausgewogen'

  const occKeys = ['office_formal','office_casual','social_events','leisure','special_occasions']
  const raw: Record<string, number> = {}
  for (const occ of occKeys) {
    raw[occ] = defs.reduce((s: number, d: any) => s + (d.occasion_weights?.[occ] ?? 0), 0) / defs.length
  }
  const total = Object.values(raw).reduce((s, v) => s + v, 0) || 1
  const occasion_weights: Record<string,number> = {}
  for (const [k, v] of Object.entries(raw)) occasion_weights[k] = Math.round(v / total * 100)

  return { formality, preferred_tags, forbidden_tags, color_families, boldness, structure, occasion_weights }
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/ /g,'_').replace(/&/g,'').replace(/\//g,'_').replace(/__/g,'_')
}

function mergeUnique(base: string[], additions: string[]): string[] {
  const seen = new Set(base)
  const result = [...base]
  for (const item of additions) {
    if (!seen.has(item)) { result.push(item); seen.add(item) }
  }
  return result
}

// ─── Gap 2: Feedback-Reason → Profil-Updates ─────────────────────────────────

export interface FeedbackPayload {
  reason: FeedbackReason
  outfitOccasion?: string
  outfitColors?: string[]
  outfitStyles?: string[]
}

/**
 * Verarbeitet einen Feedback-Grund und gibt die daraus resultierenden
 * Profil-Änderungen zurück. Nicht-destruktiv — gibt nur Deltas zurück.
 */
export function processFeedback(
  profile: UserProfile,
  payload: FeedbackPayload,
): Partial<UserProfile> {
  const updates: Partial<UserProfile> = {}

  // Feedback-Eintrag in History aufnehmen (max. 30 Einträge)
  const entry: FeedbackEntry = {
    reason: payload.reason,
    outfitOccasion: payload.outfitOccasion,
    outfitColors:   payload.outfitColors,
    outfitStyles:   payload.outfitStyles,
    timestamp:      new Date().toISOString(),
  }
  const history = [...(profile.feedback_history ?? []), entry].slice(-30)
  updates.feedback_history = history

  if (payload.reason === 'too_formal') {
    // formality_range[1] um 3 senken (min: 30)
    const current = profile.formality_range ?? [30, 80]
    updates.formality_range = [current[0], Math.max(30, current[1] - 3)]
  }

  if (payload.reason === 'wrong_color') {
    // Farb-Paar in persönlicher avoided_colors aufnehmen
    if (payload.outfitColors?.length) {
      const currentAvoided = profile.avoided_colors ?? []
      // Nehme nur die Primärfarbe des abgelehnten Outfits auf, wenn noch nicht vorhanden
      const dominantColor = payload.outfitColors[0]
      if (dominantColor && !currentAvoided.includes(dominantColor) && currentAvoided.length < 5) {
        updates.avoided_colors = [...currentAvoided, dominantColor]
      }
    }
  }

  if (payload.reason === 'wrong_occasion') {
    // occasion_weights des abgelehnten Anlass −10% (min: 0)
    if (payload.outfitOccasion) {
      const weights = { ...(profile.occasion_weights ?? {}) }
      const current = weights[payload.outfitOccasion] ?? 0
      weights[payload.outfitOccasion] = Math.max(0, Math.round(current * 0.90))
      updates.occasion_weights = weights
    }
  }

  if (payload.reason === 'style_mismatch') {
    // Stil-Score des Outfit-Stils −8 (abgebildet auf style_scores)
    if (payload.outfitStyles?.length) {
      const scores = { ...(profile.style_scores ?? {}) }
      for (const style of payload.outfitStyles) {
        scores[style] = Math.max(0, (scores[style] ?? 50) - 8)
      }
      updates.style_scores = scores
    }
  }

  return updates
}

// ─── Gap 6: Sympathie-Bonus bei Favorit-Markierung ───────────────────────────

type ItemLike = { id?: number; category: string; color_primary: string; favorite?: boolean }

/**
 * Findet Items mit gleicher Kategorie-Gruppe UND gleicher Farb-Familie
 * wie das favorisierte Item. Gibt temporäre Boost-Werte zurück.
 * Die Boosts werden NICHT persistiert — nur für die nächste generateOutfits()-Runde.
 */
export function applySympatheticBonus(
  favoritedItem: ItemLike,
  allItems: ItemLike[],
): Array<{ item_id: number; bonus: number }> {
  const COLOR_FAMILY_MAP: Record<string, string[]> = {
    earth:        ['beige','sand','camel','tan','khaki','light brown','brown','dark brown'],
    navy:         ['navy','midnight blue','cobalt','denim blue','slate'],
    grey:         ['grey','charcoal','anthracite','black'],
    warm_neutral: ['white','cream','ivory'],
    cool:         ['ice blue','light blue','sage','slate','lavender'],
    burgundy:     ['burgundy','bordeaux','oxblood','wine'],
    green:        ['olive','forest green','sage'],
  }

  function getFamily(color: string): string | null {
    const c = color.toLowerCase()
    for (const [family, colors] of Object.entries(COLOR_FAMILY_MAP)) {
      if (colors.includes(c)) return family
    }
    return null
  }

  const favFamily = getFamily(favoritedItem.color_primary)
  const result: Array<{ item_id: number; bonus: number }> = []

  for (const item of allItems) {
    if (item.id == null) continue
    if (item.id === favoritedItem.id) continue
    const sameCategory = item.category === favoritedItem.category
    const family = getFamily(item.color_primary)
    const sameFamily = favFamily !== null && family === favFamily
    if (sameCategory && sameFamily) {
      result.push({ item_id: item.id, bonus: 3 })
    }
  }
  return result
}

// ─── Gap 3: Trend-Erkennung & Auto-Rebalancing ────────────────────────────────

export interface TrendAnalysis {
  hasTrend: boolean
  dominantReason: FeedbackReason | null
  dominantRatio: number   // 0–1: Anteil des dominanten Grundes
  entryCount: number
}

/**
 * Analysiert die letzten Feedback-Einträge auf dominante Muster.
 * Trend erkannt wenn >60% der Ablehnungen denselben Grund haben.
 */
export function analyzeFeedbackTrends(history: FeedbackEntry[]): TrendAnalysis {
  if (history.length < 5) return { hasTrend: false, dominantReason: null, dominantRatio: 0, entryCount: history.length }

  const counts: Record<string, number> = {}
  for (const entry of history) {
    counts[entry.reason] = (counts[entry.reason] ?? 0) + 1
  }

  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a)
  const [topReason, topCount] = sorted[0]
  const ratio = topCount / history.length

  return {
    hasTrend: ratio > 0.60,
    dominantReason: ratio > 0.60 ? (topReason as FeedbackReason) : null,
    dominantRatio: ratio,
    entryCount: history.length,
  }
}

/**
 * Wendet wöchentliches Rebalancing an (max. ±8% pro Stil).
 * Gibt die Profil-Delta-Updates zurück.
 */
export function applyWeeklyRebalancing(profile: UserProfile): Partial<UserProfile> {
  const history = profile.feedback_history ?? []
  const trend = analyzeFeedbackTrends(history)
  const updates: Partial<UserProfile> = {
    last_rebalance_at: new Date().toISOString(),
  }

  if (!trend.hasTrend || !trend.dominantReason) return updates

  const styleScores = { ...(profile.style_scores ?? {}) }

  if (trend.dominantReason === 'too_formal') {
    // Formale Stile herunterranken
    for (const style of ['english_gentleman', 'smart_casual']) {
      if (style in styleScores) styleScores[style] = Math.max(0, styleScores[style] - 8)
    }
    updates.formality_range = [
      (profile.formality_range?.[0] ?? 30),
      Math.max(40, (profile.formality_range?.[1] ?? 80) - 5),
    ]
  }

  if (trend.dominantReason === 'style_mismatch') {
    // Combination boldness senken — Nutzer mag konsistentere Looks
    updates.combination_boldness = Math.max(1, (profile.combination_boldness ?? 3) - 1)
  }

  if (trend.dominantReason === 'wrong_occasion') {
    // Occasion-Weights normalisieren — weniger Fokus auf den abgelehnten Anlass
    const weights = { ...(profile.occasion_weights ?? {}) }
    for (const key of Object.keys(weights)) {
      weights[key] = Math.max(0, Math.round(weights[key] * 0.92))
    }
    updates.occasion_weights = weights
  }

  if (Object.keys(styleScores).length) updates.style_scores = styleScores

  return updates
}

/**
 * Prüft ob ein Rebalancing fällig ist (last_rebalance_at > 7 Tage).
 */
export function isRebalancingDue(profile: UserProfile): boolean {
  if (!profile.last_rebalance_at) return (profile.feedback_history?.length ?? 0) >= 5
  const daysSince = (Date.now() - new Date(profile.last_rebalance_at).getTime()) / 86400000
  return daysSince >= 7
}

/**
 * Analysiert Style-Scores und erkennt Hybrid-Profile.
 * Trigger: top-2 Stile weniger als 22 Punkte auseinander.
 * Gibt null zurück wenn kein passender Hybrid gefunden.
 */
export function detectHybridProfile(
  styleScores: Record<string, number>
): {
  hybridKey: string
  profile: HybridStyleProfile
  dominantStyles: string[]
  ratio: number[]
} | null {
  const sorted = Object.entries(styleScores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])

  if (sorted.length < 2) return null

  const [, topScore]    = sorted[0]
  const [, secondScore] = sorted[1]

  // Hybrid-Trigger: weniger als 22 Punkte Abstand zwischen Top-1 und Top-2
  if (topScore - secondScore > 22) return null

  // Top-3-Erkennung: dritter Stil zählt mit wenn er nah am zweiten liegt
  const dominant: Array<[string, number]> = [sorted[0], sorted[1]]
  if (sorted.length >= 3 && secondScore - sorted[2][1] <= 12) {
    dominant.push(sorted[2])
  }

  const styles = dominant.map(([s2]) => s2)
  const total  = dominant.reduce((acc, [, v]) => acc + v, 0)
  const ratio  = dominant.map(([, v]) => Math.round((v / total) * 100) / 100)

  // Vordefiniertes Profil bevorzugen — sonst dynamisch synthetisieren.
  // Damit ist JEDE Bedürfniskombination abgedeckt.
  const predefined = findHybridProfile(...styles)
  const profile = predefined ?? synthesizeHybrid(styles, ratio)

  return {
    hybridKey: predefined ? predefined.id : customHybridKey(styles),
    profile,
    dominantStyles: styles,
    ratio,
  }
}

export function interpretProfile(profile: UserProfile): ProfileRules {
  const rules = defaultRules()
  rules.avoided_colors = [...(profile.avoided_colors ?? [])]

  const lookKey = normalize(profile.look_identity ?? 'smart_casual')
  const lookRules = LOOK_IDENTITY_RULES[lookKey] ?? LOOK_IDENTITY_RULES['smart_casual']
  rules.required_tags = [...lookRules.required_tags]
  rules.preferred_tags = [...lookRules.preferred_tags]
  rules.forbidden_tags = [...lookRules.forbidden_tags]

  const lifestyleKey = normalize(profile.lifestyle_context ?? 'lockeres_buero')
  const lc = LIFESTYLE_CONTEXT_RULES[lifestyleKey] ?? LIFESTYLE_CONTEXT_RULES['lockeres_buero']
  rules.preferred_tags = mergeUnique(rules.preferred_tags, lc.preferred_tags)
  rules.forbidden_tags = mergeUnique(rules.forbidden_tags, lc.forbidden_tags)
  rules.weight_style = lc.weight_style ?? 0.35
  rules.weight_occasion = lc.weight_occasion ?? 0.25
  const remaining = Math.max(0.10, 1.0 - rules.weight_style - rules.weight_occasion - rules.weight_formality)
  rules.weight_color = Math.round(remaining * 0.625 * 1000) / 1000
  rules.weight_freshness = Math.round(remaining * 0.375 * 1000) / 1000

  const fitKey = normalize(profile.fit_preference ?? 'regular')
  rules.preferred_fits = FIT_PREFERENCE_MAP[fitKey] ?? ['regular']

  for (const cw of (profile.color_world ?? [])) {
    const family = COLOR_WORLD_FAMILY_MAP[cw]
    if (family) rules.preferred_color_families.push(family)
  }

  if (profile.pattern_preference?.length) {
    rules.allowed_patterns = profile.pattern_preference
      .filter(p => PATTERN_MAP[p])
      .map(p => PATTERN_MAP[p])
  }

  rules.structure_preference = profile.structure_preference ?? 'ausgewogen'
  rules.combination_boldness = profile.combination_boldness ?? 3

  const ctxKey = normalize(profile.context_primary ?? 'privat_beruflich')
  const ctxRules = CONTEXT_PRIMARY_RULES[ctxKey] ?? CONTEXT_PRIMARY_RULES['privat_beruflich']
  rules.preferred_tags = mergeUnique(rules.preferred_tags, ctxRules.preferred_tags)
  rules.primary_occasions = ctxRules.primary_occasions

  const pgKey = normalize(profile.perception_goal ?? 'schick_professionell')
  const pgRules = PERCEPTION_GOAL_RULES[pgKey] ?? PERCEPTION_GOAL_RULES['schick_professionell']
  rules.preferred_tags = mergeUnique(rules.preferred_tags, pgRules.preferred_tags)
  const bonus = pgRules.weight_style_bonus ?? 0
  if (bonus !== 0) {
    rules.weight_style = Math.round(Math.min(0.7, Math.max(0.1, rules.weight_style + bonus)) * 1000) / 1000
    const rem = 1.0 - rules.weight_style - rules.weight_occasion
    rules.weight_color = Math.round(rem * 0.625 * 1000) / 1000
    rules.weight_freshness = Math.round(rem * 0.375 * 1000) / 1000
  }
  rules.combination_boldness = Math.min(5, rules.combination_boldness + (pgRules.boldness_modifier ?? 0))

  const fitTags: Record<string,string[]> = { slim:['slim'], regular:['regular'], relaxed:['relaxed'], tailored:['tailored','slim'] }
  rules.preferred_tags = mergeUnique(rules.preferred_tags, fitTags[fitKey] ?? ['regular'])

  const scores = profile.style_scores ?? {}
  for (const [key, tags] of Object.entries(STYLE_SCORE_TAG_BOOSTS)) {
    if ((scores[key] ?? 0) >= 3) rules.preferred_tags = mergeUnique(rules.preferred_tags, tags)
  }

  rules.occasion_weights = profile.occasion_weights && Object.keys(profile.occasion_weights).length
    ? profile.occasion_weights
    : { office_formal:30, office_casual:25, social_events:20, leisure:20, special_occasions:5 }

  const formalScore = scores['english_gentleman'] ?? 2
  rules.max_outfits = formalScore >= 3 ? 50 : formalScore <= 1 ? 30 : 40

  const picks = profile.style_image_picks ?? []
  if (picks.length >= 3) {
    const combined: any = combineImagePicks(picks.slice(0, 3))
    if (combined.preferred_tags?.length) rules.preferred_tags = mergeUnique(combined.preferred_tags, rules.preferred_tags)
    if (combined.forbidden_tags?.length) rules.forbidden_tags = mergeUnique(rules.forbidden_tags, combined.forbidden_tags)
    if (combined.color_families?.length) {
      rules.preferred_color_families = [...new Set([...combined.color_families, ...rules.preferred_color_families])]
    }
    if (combined.boldness != null) rules.combination_boldness = combined.boldness
    if (combined.structure)        rules.structure_preference  = combined.structure
    if (combined.occasion_weights) rules.occasion_weights      = combined.occasion_weights
    const avgFormality = combined.formality ?? 3
    rules.max_outfits = avgFormality >= 4 ? 50 : avgFormality <= 1.5 ? 30 : 40
  }

  // Normalise weights to sum = 1
  const total = rules.weight_color + rules.weight_style + rules.weight_occasion + rules.weight_freshness + rules.weight_formality
  if (total > 0.001) {
    const f = 1 / total
    rules.weight_color     = Math.round(rules.weight_color     * f * 1000) / 1000
    rules.weight_style     = Math.round(rules.weight_style     * f * 1000) / 1000
    rules.weight_occasion  = Math.round(rules.weight_occasion  * f * 1000) / 1000
    rules.weight_freshness = Math.round(rules.weight_freshness * f * 1000) / 1000
    rules.weight_formality = Math.round(rules.weight_formality * f * 1000) / 1000
  }

  // ─── Blueprint v2.0 Phase 3: Neue Felder ─────────────────────────────────────
  rules.sprezzatura_mode = profile.sprezzatura_mode ?? false
  rules.active_styles    = profile.active_styles ?? []

  // Wenn active_styles leer: aus look_identity ableiten damit der Outfit-Engine
  // immer einen primären Stil bekommt (verhindert Fallback auf generische Ergebnisse)
  if (!rules.active_styles.length && profile.look_identity) {
    const LOOK_TO_ACTIVE: Record<string, string[]> = {
      old_money:            ['old_money', 'smart_casual'],
      smart_casual:         ['smart_casual', 'ivy_league'],
      english_gentleman:    ['english_gentleman', 'old_money'],
      ivy_league:           ['ivy_league', 'smart_casual'],
      british_countryside:  ['british_countryside', 'smart_casual'],
      riviera:              ['riviera', 'old_money'],
      italian_elegance:     ['italian_elegance', 'old_money'],
      klassisch_zeitlos:    ['english_gentleman', 'old_money'],
      elegantes_casual:     ['old_money', 'smart_casual'],
      minimalistisch_modern:['smart_casual'],
    }
    rules.active_styles = LOOK_TO_ACTIVE[normalize(profile.look_identity)] ?? []
  }

  // Hybrid-Profil: wenn gesetzt, beide Stile als active_styles aufnehmen
  if (profile.hybrid_profile) {
    const hybrid = resolveHybridProfile(profile.hybrid_profile, profile.hybrid_ratio)
    if (hybrid) {
      rules.active_styles = [
        ...hybrid.components,
        ...(rules.active_styles).filter(
          s => !hybrid.components.includes(s as string)
        ),
      ].slice(0, 3)
    }
  }

  rules.min_score_threshold = rules.sprezzatura_mode ? 0.73
    : (rules.active_styles.length >= 2 ? 0.75 : 0.78)

  // Gap 5: Formality-Floor aus anlass_frequenz ableiten
  rules.formality_floor = deriveFormalityFloor(profile.anlass_frequenz)

  // Gap 7: Modernes Büro aus buero_config
  rules.modern_office = !!(profile.buero_config?.modern_office) &&
    rules.active_styles.includes('smart_casual')

  // anlass_frequenz → Occasion-Weights dynamisch anpassen
  if (profile.anlass_frequenz) {
    const { buero = 0, events = 0, freizeit = 0 } = profile.anlass_frequenz
    if (buero > 0.5) {
      rules.occasion_weights.office_formal = Math.min(50, (rules.occasion_weights.office_formal ?? 25) + 15)
      rules.occasion_weights.office_casual = Math.min(40, (rules.occasion_weights.office_casual ?? 20) + 10)
    }
    if (events > 0.4) {
      rules.occasion_weights.social_events = Math.min(45, (rules.occasion_weights.social_events ?? 20) + 10)
      rules.occasion_weights.special_occasions = Math.min(25, (rules.occasion_weights.special_occasions ?? 5) + 10)
    }
    if (freizeit > 0.5) {
      rules.occasion_weights.leisure = Math.min(60, (rules.occasion_weights.leisure ?? 20) + 15)
    }
  }

  // temp_zone → max_outfits und Season-Präferenz modifizieren
  if (profile.temp_zone === 'mediterran' || profile.temp_zone === 'warm') {
    // Wärmeres Klima → mehr Sommeroutfits bevorzugen
    rules.occasion_weights.leisure = Math.min(55, (rules.occasion_weights.leisure ?? 20) + 8)
  } else if (profile.temp_zone === 'kalt') {
    // Kaltes Klima → mehr strukturierte Outfits
    rules.weight_style = Math.min(0.55, rules.weight_style + 0.05)
  }

  return rules
}
