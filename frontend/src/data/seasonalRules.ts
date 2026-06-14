// StyleAdvisor Classical Menswear Database v3.0 — Phase 6: Seasonal Coherence Rules

export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all'

// ─── Seasonal Weight Tiers ────────────────────────────────────────────────────
// Each tier maps to the seasons it is appropriate for.
// 'all' = year-round appropriate for this tier if layered correctly.

export interface SeasonalTier {
  id: string
  label: string
  seasons: Season[]
  fabric_examples: string[]
  weight_range_grams_per_sqm: [number, number]
}

export const SEASONAL_TIERS: SeasonalTier[] = [
  {
    id: 'summer_weight',
    label: 'Sommergewicht',
    seasons: ['spring', 'summer'],
    fabric_examples: ['linen', 'seersucker', 'fresco', 'cotton_poplin', 'cotton_drill_light'],
    weight_range_grams_per_sqm: [150, 260],
  },
  {
    id: 'mid_weight',
    label: 'Mittleres Gewicht (ganzjährig)',
    seasons: ['spring', 'summer', 'autumn', 'winter', 'all'],
    fabric_examples: ['worsted_wool', 'cotton_oxford', 'cavalry_twill', 'gabardine', 'hopsack'],
    weight_range_grams_per_sqm: [260, 330],
  },
  {
    id: 'autumn_weight',
    label: 'Herbstgewicht',
    seasons: ['autumn', 'winter'],
    fabric_examples: ['flannel', 'houndstooth', 'herringbone_wool', 'soft_tweed'],
    weight_range_grams_per_sqm: [330, 420],
  },
  {
    id: 'winter_weight',
    label: 'Wintergewicht',
    seasons: ['winter', 'autumn'],
    fabric_examples: ['heavy_tweed', 'melton', 'heavy_flannel', 'heavy_wool_overcoat'],
    weight_range_grams_per_sqm: [420, 700],
  },
]

// ─── Seasonal Colour Rules ─────────────────────────────────────────────────────
// Which colours are seasonally appropriate.
// 'avoid' means strong recommendation against — not a hard block.

export interface SeasonalColourRule {
  colour: string
  recommended_seasons: Season[]
  avoid_seasons: Season[]
  reason: string
}

export const SEASONAL_COLOUR_RULES: SeasonalColourRule[] = [
  { colour: 'white',        recommended_seasons: ['spring', 'summer'], avoid_seasons: [],                   reason: 'Fresh and clean — most powerful in warm months but acceptable year-round' },
  { colour: 'cream',        recommended_seasons: ['all'],              avoid_seasons: [],                   reason: 'Warmer than white — flatters in any season' },
  { colour: 'ivory',        recommended_seasons: ['all'],              avoid_seasons: [],                   reason: 'Same as cream' },
  { colour: 'linen_natural',recommended_seasons: ['spring', 'summer'], avoid_seasons: ['winter'],           reason: 'Fabric and colour together read summer' },
  { colour: 'sky blue',     recommended_seasons: ['spring', 'summer'], avoid_seasons: [],                   reason: 'Light tone — feels cold in winter' },
  { colour: 'pale pink',    recommended_seasons: ['spring', 'summer'], avoid_seasons: [],                   reason: 'Spring/summer colour family' },
  { colour: 'terracotta',   recommended_seasons: ['spring', 'summer', 'autumn'], avoid_seasons: [],        reason: 'Warm earth — good from spring to autumn' },
  { colour: 'rust',         recommended_seasons: ['autumn', 'winter'], avoid_seasons: ['summer'],           reason: 'Warm dark — anchors autumn palette' },
  { colour: 'forest green', recommended_seasons: ['autumn', 'winter'], avoid_seasons: [],                   reason: 'Deep earthy — particularly strong in autumn' },
  { colour: 'olive',        recommended_seasons: ['autumn', 'spring'], avoid_seasons: [],                   reason: 'Earthy mid-tone — all-season but best in cooler months' },
  { colour: 'burgundy',     recommended_seasons: ['autumn', 'winter'], avoid_seasons: ['summer'],           reason: 'Rich and dark — summer is too warm' },
  { colour: 'camel',        recommended_seasons: ['autumn', 'winter'], avoid_seasons: [],                   reason: 'Overcoat colour — winter classic' },
  { colour: 'tan',          recommended_seasons: ['all'],              avoid_seasons: [],                   reason: 'Versatile warm neutral' },
  { colour: 'sand',         recommended_seasons: ['spring', 'summer', 'autumn'], avoid_seasons: [],        reason: 'Coastal palette — summer core, usable through autumn' },
  { colour: 'charcoal',     recommended_seasons: ['autumn', 'winter'], avoid_seasons: ['summer'],           reason: 'Heavy dark — too warm in summer' },
  { colour: 'navy',         recommended_seasons: ['all'],              avoid_seasons: [],                   reason: 'Anchor dark — true year-round' },
  { colour: 'cobalt',       recommended_seasons: ['spring', 'summer'], avoid_seasons: ['winter'],           reason: 'Vibrant — best in warmer months' },
  { colour: 'yellow',       recommended_seasons: ['spring', 'summer'], avoid_seasons: ['winter'],           reason: 'Light warm — loses energy in dark winter palette' },
  { colour: 'stone',        recommended_seasons: ['all'],              avoid_seasons: [],                   reason: 'Quiet neutral — works year-round' },
  { colour: 'sage',         recommended_seasons: ['spring', 'summer', 'autumn'], avoid_seasons: [],        reason: 'Muted cool green — grows into autumn' },
]

// ─── Anti-Season Combinations ─────────────────────────────────────────────────
// Hard seasonal mismatches that break coherence regardless of colour.

export interface SeasonalAntiPattern {
  items: [string, string]  // fabric or garment types
  reason: string
}

export const SEASONAL_ANTI_PATTERNS: SeasonalAntiPattern[] = [
  { items: ['tweed_jacket',    'linen_trouser'],   reason: 'Tweed is autumn/winter; linen is summer — opposite seasons' },
  { items: ['heavy_overcoat',  'linen_shirt'],     reason: 'Outer layer winter weight, inner layer summer weight — incoherent' },
  { items: ['seersucker_suit', 'wool_scarf'],      reason: 'Summer suit + winter accessory' },
  { items: ['white_flannel',   'heavy_knit'],      reason: 'Summer white flannel trouser + heavy winter knit' },
  { items: ['linen_blazer',    'corduroy_trouser'],reason: 'Light summer blazer + heavy autumn trouser' },
]

// ─── Season Detection ─────────────────────────────────────────────────────────
// Map months to seasons (Northern Hemisphere defaults).

const MONTH_TO_SEASON: Record<number, Season> = {
  12: 'winter', 1: 'winter', 2: 'winter',
  3: 'spring',  4: 'spring', 5: 'spring',
  6: 'summer',  7: 'summer', 8: 'summer',
  9: 'autumn', 10: 'autumn', 11: 'autumn',
}

export function currentSeason(): Season {
  return MONTH_TO_SEASON[new Date().getMonth() + 1] ?? 'spring'
}

export function isColourSeasonallyAppropriate(colour: string, season: Season): boolean {
  const rule = SEASONAL_COLOUR_RULES.find(r => r.colour === colour.toLowerCase())
  if (!rule) return true  // no rule = always ok
  if (rule.avoid_seasons.includes(season)) return false
  return true
}

export function getSeasonalColourBonus(colour: string, season: Season): number {
  const rule = SEASONAL_COLOUR_RULES.find(r => r.colour === colour.toLowerCase())
  if (!rule) return 0
  if (rule.avoid_seasons.includes(season)) return -0.10
  if (rule.recommended_seasons.includes(season) || rule.recommended_seasons.includes('all')) return +0.05
  return 0
}
