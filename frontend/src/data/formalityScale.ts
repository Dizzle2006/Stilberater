// StyleAdvisor Classical Menswear Database v4.0 — Phase 5: Formality Scale Reference
// Scale 1–10 where 1 = most casual, 10 = white tie.

export interface FormalityLevel {
  score: number          // 1–10
  label: string
  german_label: string
  description: string
  example_outfit: string
  typical_occasions: string[]
}

export const FORMALITY_SCALE: FormalityLevel[] = [
  {
    score: 1,
    label: 'Relaxed Casual',
    german_label: 'Lässig',
    description: 'Off-duty, no visible structure. T-shirt level.',
    example_outfit: 'White tee + dark jeans + white sneakers',
    typical_occasions: ['home', 'beach', 'gym'],
  },
  {
    score: 2,
    label: 'Casual',
    german_label: 'Casual',
    description: 'Smart basics — may include chinos and polo or OCBD untucked.',
    example_outfit: 'OCBD (untucked) + chino + canvas sneakers',
    typical_occasions: ['weekend_errands', 'friends', 'cafe'],
  },
  {
    score: 3,
    label: 'Smart Casual Low',
    german_label: 'Smart Casual (einfach)',
    description: 'Chino + OCBD tucked + clean loafer or Chelsea boot.',
    example_outfit: 'Chino + OCBD (tucked) + penny loafer',
    typical_occasions: ['casual_office', 'brunch', 'gallery'],
  },
  {
    score: 4,
    label: 'Smart Casual High',
    german_label: 'Smart Casual (gehoben)',
    description: 'Third piece (blazer/knit) enters. No tie required.',
    example_outfit: 'Navy blazer + OCBD + chino + brogue',
    typical_occasions: ['dinner_casual', 'client_lunch', 'smart_casual_event'],
  },
  {
    score: 5,
    label: 'Business Casual',
    german_label: 'Business Casual',
    description: 'Blazer or suit jacket worn, no tie. Trouser (not chino) preferred.',
    example_outfit: 'Grey flannel trouser + white poplin + navy blazer + oxford',
    typical_occasions: ['modern_office', 'networking', 'press_day'],
  },
  {
    score: 6,
    label: 'Business / Lounge Suit',
    german_label: 'Businessanzug',
    description: 'Full suit. Tie optional depending on context.',
    example_outfit: 'Charcoal suit + white shirt + no tie + oxford shoe',
    typical_occasions: ['office_formal', 'business_meeting', 'interview'],
  },
  {
    score: 7,
    label: 'Business Formal',
    german_label: 'Business Formal',
    description: 'Full suit with tie. Conservative colour and cut.',
    example_outfit: 'Charcoal or navy suit + white shirt + tie + oxford shoe',
    typical_occasions: ['formal_meeting', 'court', 'bank', 'presentation'],
  },
  {
    score: 8,
    label: 'Cocktail / Black Tie Optional',
    german_label: 'Cocktailkleidung',
    description: 'Dark lounge suit or black tie. Dinner jacket acceptable.',
    example_outfit: 'Midnight navy suit + white shirt + black tie + patent oxford',
    typical_occasions: ['cocktail_party', 'awards', 'gala_dinner_casual'],
  },
  {
    score: 9,
    label: 'Black Tie',
    german_label: 'Schwarzer Krawatte',
    description: 'Dinner jacket (tuxedo) with black bow tie.',
    example_outfit: 'Black/midnight blue DJ + white dress shirt + black bow tie + patent oxford',
    typical_occasions: ['gala', 'charity_ball', 'formal_reception'],
  },
  {
    score: 10,
    label: 'White Tie',
    german_label: 'Frack',
    description: 'Most formal attire. Tailcoat, white bow tie, waistcoat.',
    example_outfit: 'Black tailcoat + white waistcoat + white bow tie + patent pump',
    typical_occasions: ['state_dinner', 'opera_premiere', 'royal_event'],
  },
]

// ─── Footwear Formality Table ─────────────────────────────────────────────────
// Each shoe type maps to its formality range [min, max] on the 1–10 scale.

export interface FootwearFormality {
  type: string
  label: string
  german_label: string
  formality_min: number
  formality_max: number
  notes: string
}

export const FOOTWEAR_FORMALITY: FootwearFormality[] = [
  { type: 'espadrille',           label: 'Espadrille',            german_label: 'Espadrille',          formality_min: 1, formality_max: 3, notes: 'Riviera summer only' },
  { type: 'white_leather_sneaker',label: 'White Leather Sneaker', german_label: 'Weiße Ledersneaker',  formality_min: 2, formality_max: 5, notes: 'Smart casual and below — leather only, no canvas' },
  { type: 'canvas_sneaker',       label: 'Canvas Sneaker',        german_label: 'Canvas Sneaker',      formality_min: 1, formality_max: 2, notes: 'Strictly casual' },
  { type: 'boat_shoe',            label: 'Boat Shoe',             german_label: 'Segelschuh',          formality_min: 2, formality_max: 4, notes: 'Riviera / nautical casual only' },
  { type: 'suede_chukka',         label: 'Suede Chukka',         german_label: 'Wildleder Chukka',    formality_min: 3, formality_max: 6, notes: 'Smart casual to moderate business' },
  { type: 'lug_sole_derby',       label: 'Lug-Sole Derby',        german_label: 'Lug-Sole Derby',      formality_min: 3, formality_max: 6, notes: 'Country / smart casual — robust sole' },
  { type: 'brogue_boot',          label: 'Brogue Boot',           german_label: 'Brogue-Stiefel',      formality_min: 3, formality_max: 7, notes: 'Country and smart casual — bridge shoe' },
  { type: 'loafer_suede',         label: 'Suede Loafer',          german_label: 'Wildleder-Loafer',    formality_min: 3, formality_max: 5, notes: 'Smart casual only — suede drops formality' },
  { type: 'penny_loafer',         label: 'Penny Loafer',          german_label: 'Penny Loafer',        formality_min: 4, formality_max: 7, notes: 'Smart casual to business casual' },
  { type: 'chelsea_boot',         label: 'Chelsea Boot',          german_label: 'Chelsea Boot',        formality_min: 4, formality_max: 7, notes: 'Smart casual to business casual' },
  { type: 'brogue',               label: 'Wingtip Brogue',        german_label: 'Brogue',              formality_min: 4, formality_max: 7, notes: 'Smart casual to business formal — country register' },
  { type: 'tassel_loafer',        label: 'Tassel Loafer',         german_label: 'Quasten-Loafer',      formality_min: 5, formality_max: 7, notes: 'Smart to business — not formal' },
  { type: 'derby',                label: 'Derby',                 german_label: 'Derby',               formality_min: 5, formality_max: 8, notes: 'Business to cocktail' },
  { type: 'monk_strap',           label: 'Monk Strap',            german_label: 'Monkstrap',           formality_min: 5, formality_max: 8, notes: 'Business to cocktail' },
  { type: 'oxford',               label: 'Oxford / Black Cap-Toe',german_label: 'Oxford-Schnürer',     formality_min: 7, formality_max: 10, notes: 'Business formal to white tie — most formal day shoe' },
  { type: 'patent_oxford',        label: 'Patent Oxford',         german_label: 'Lackschuhe',          formality_min: 8, formality_max: 10, notes: 'Black tie and white tie only' },
  { type: 'boot_country',         label: 'Country Boot',          german_label: 'Land-Stiefel',        formality_min: 2, formality_max: 4, notes: 'British countryside only — not for city wear' },
]

// ─── DB Subcategory → Footwear Type Mapping ──────────────────────────────────
// Maps ClothingItem.subcategory values (from styleTagger.ts) to FOOTWEAR_FORMALITY type keys.
// Used as a fallback when formality_base is not set on a shoe item.
export const FOOTWEAR_SUBCAT_TO_TYPE: Record<string, string> = {
  oxford_schuh:   'oxford',
  derby:          'derby',
  brogue:         'brogue',
  loafer:         'loafer_suede',
  penny_loafer:   'penny_loafer',
  tassel_loafer:  'tassel_loafer',
  chelsea_boot:   'chelsea_boot',
  chukka_boot:    'suede_chukka',
  monkstrap:      'monk_strap',
  boots:          'boot_country',
  summer_loafer:  'penny_loafer',
  sneaker_minimal:'white_leather_sneaker',
}

// Returns the formality midpoint for a shoe subcategory (1–10 scale)
export function getFootwearFormalityPoint(subcategory: string): number | null {
  const type = FOOTWEAR_SUBCAT_TO_TYPE[subcategory]
  if (!type) return null
  const entry = FOOTWEAR_FORMALITY.find(f => f.type === type)
  if (!entry) return null
  return Math.round((entry.formality_min + entry.formality_max) / 2)
}

// ─── Formality Gap Penalty ────────────────────────────────────────────────────
// How many points of formality gap between items are allowed before penalty.
// If gap > MAX_GAP → apply penalty.

export const FORMALITY_GAP_MAX = 2          // points (on 1–10 scale)
export const FORMALITY_GAP_PENALTY = -0.15  // score deduction per point above MAX_GAP

export function formalityGapScore(itemA: number, itemB: number): number {
  const gap = Math.abs(itemA - itemB)
  if (gap <= FORMALITY_GAP_MAX) return 1.0
  const excess = gap - FORMALITY_GAP_MAX
  return Math.max(0.0, 1.0 + excess * FORMALITY_GAP_PENALTY)
}

// ─── Style–Formality Range ────────────────────────────────────────────────────
// Each archetype operates in a natural formality window.
// Outfits outside this window get a score deduction.

export const STYLE_FORMALITY_RANGE: Record<string, [number, number]> = {
  old_money:           [5, 8],
  british_countryside: [3, 6],
  english_gentleman:   [7, 9],
  smart_casual:        [3, 6],
  riviera:             [3, 6],
  ivy_league:          [2, 5],
  italian_elegance:    [3, 8],
}

// ─── v5.1 (#2): Item-Formalität mit Stoff-/Farb-/Detail-Modifikatoren ────────
// Ein brauner Suede-Oxford ist ~2 Stufen casualer als ein schwarzer Calf-Oxford.
// Basis: Subkategorie-Formalität (1–5 aus CATEGORIES, hier auf 1–10 skaliert),
// dann Modifikatoren aus Stoff, Farbe und Details.

export interface ItemFormalityInput {
  subcategory?: string
  color_primary?: string
  fabric_family?: string
  pattern?: string
  pattern_type?: string
}

// Subkategorie-Basis auf 1–10-Skala (kuratiert, nicht nur ×2)
const SUBCAT_FORMALITY_10: Record<string, number> = {
  // Tops
  t_shirt: 1.5, poloshirt: 3, leinenhemd: 3.5, flanellhemd: 3, oxford_hemd: 5,
  strickpullover_rund: 4, strickpullover_v: 4.5, troyer: 3.5, rollkragen: 5,
  strickweste: 5, weste: 7.5,
  // Outerwear
  harrington: 3, field_jacket: 2.5, gesteppte_weste: 3, wachsjacke: 3.5,
  strickjacke: 4, peacoat: 4.5, dufflecoat: 4, trenchcoat: 6, tweed_sakko: 5.5,
  sakko: 6.5, blazer: 6.5, wollmantel: 7,
  // Bottoms
  jeans_dunkel: 3, chino: 4, cord_hose: 4, leinenhose: 3.5, wollhose: 6,
  flanellhose: 6, anzughose: 7.5,
  // Shoes
  sneaker_minimal: 2, boots: 3, chukka_boot: 4, chelsea_boot: 5, summer_loafer: 3.5,
  loafer: 5, penny_loafer: 5, tassel_loafer: 5.5, brogue: 5.5, derby: 6.5,
  monkstrap: 7, oxford_schuh: 8.5,
  // Accessories
  krawatte: 8, einstecktuch: 7, guertel_leder: 5, uhr_klassisch: 6,
  schal_kaschmir: 5, muetze_woll: 2, leder_handschuhe: 6,
}

const SHOE_SUBCATS_F = new Set([
  'sneaker_minimal','boots','chukka_boot','chelsea_boot','summer_loafer',
  'loafer','penny_loafer','tassel_loafer','brogue','derby','monkstrap','oxford_schuh',
])

/**
 * Item-Formalität 1–10 mit Modifikatoren:
 * - Suede/Wildleder: −1.5 (Schuhe), −1.0 (sonst)
 * - Braun/Tan bei Schuhen: −0.5 (Schwarz ist die formale Referenz)
 * - Leinen-Stoff: −1.0 | Denim: −1.0
 * - Sichtbares Muster (check/plaid/madras): −0.5 | Pinstripe: +0.5
 */
export function computeItemFormality(item: ItemFormalityInput): number {
  const sub = item.subcategory ?? ''
  let f = SUBCAT_FORMALITY_10[sub] ?? 4
  const color  = (item.color_primary ?? '').toLowerCase()
  const fabric = (item.fabric_family ?? '').toLowerCase()
  const pat    = ((item.pattern_type ?? item.pattern ?? '') as string).toLowerCase()
  const isShoe = SHOE_SUBCATS_F.has(sub)

  if (fabric.includes('suede') || color.includes('suede')) f -= isShoe ? 1.5 : 1.0
  if (isShoe && (color.includes('brown') || color.includes('tan') || color.includes('cognac'))) f -= 0.5
  if (isShoe && color.includes('burgundy')) f -= 0.25
  if (fabric === 'linen') f -= 1.0
  if (fabric === 'denim') f -= 1.0
  if (['check','plaid','madras','tweed'].includes(pat)) f -= 0.5
  if (['pinstripe','stripe'].includes(pat) && !isShoe) f += 0.25

  return Math.min(10, Math.max(1, f))
}

/**
 * Schuh-Anker-Regel: Der Schuh setzt die Formalitäts-Obergrenze des Outfits.
 * Liegt die mittlere Formalität der übrigen Kernteile mehr als ANCHOR_TOLERANCE
 * über der Schuh-Formalität, wirkt das Outfit "von unten gebrochen".
 * Rückgabe: Penalty 0–0.15.
 */
export const SHOE_ANCHOR_TOLERANCE = 2.0

export function shoeAnchorPenalty(items: ItemFormalityInput[]): number {
  const shoe = items.find(i => SHOE_SUBCATS_F.has(i.subcategory ?? ''))
  if (!shoe) return 0
  const rest = items.filter(i => i !== shoe && (i.subcategory ?? '') !== 'guertel_leder')
  if (!rest.length) return 0
  const shoeF = computeItemFormality(shoe)
  const avg = rest.reduce((s, i) => s + computeItemFormality(i), 0) / rest.length
  const excess = avg - shoeF - SHOE_ANCHOR_TOLERANCE
  if (excess <= 0) return 0
  return Math.min(0.15, excess * 0.06)
}
