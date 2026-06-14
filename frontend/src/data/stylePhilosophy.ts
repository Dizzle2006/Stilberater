// StyleAdvisor Classical Menswear Database v3.0 — Combination Philosophy

export const COMBINATION_PHILOSOPHY = {
  core_formula: 'Score = (StyleCompat × 0.40) + (ColourHarmony × 0.35) + (FormalityCoherence × 0.25)',

  core_rule: `
    An outfit is valid when the items together create a coherent look —
    even if individual items serve different styles. The shared bridge
    matters, not the dominant style of each single item.
  `,

  third_piece_rule: `
    SMART CASUAL: Shirt + trousers alone is always incomplete.
    A blazer, waistcoat, knit, or structured overshirt is required.
    The third piece defines the look and elevates the formality.
  `,

  formality_rule: `
    FORMALITY COHERENCE (weight 0.25 in core formula):
    Formality spread of 1 step = ideal.
    Spread of 2 steps = allowed with penalty.
    Spread >2 steps = -12 pts penalty.
    English Gentleman items (formality >80) cannot combine with
    casual items (formality <30) — hard block.
  `,

  colour_rule: `
    COLOUR HARMONY (weight 0.35 in core formula):
    Archetype palette match = +8 pts bonus.
    Palette violation (forbidden colour for archetype) = -10 pts.
    Black + navy without texture difference = -8 pts.
    60/30/10 proportion met (dominant ≥55%, accent ≤15%) = +3 pts.
  `,

  texture_rule: `
    TEXTURE CONTRAST:
    Good contrast (2–3 fabric families, one smooth anchor) = +4 pts.
    Anti-pattern (denim × denim, shiny × shiny) = -15 pts.
    Seasonal mismatch (linen jacket + cable knit) = -10 pts.
  `,
} as const

export interface StyleCombinationGuideEntry {
  allowed: boolean
  score_range: [number, number]
  typical_occasion: string[]
  bridge_items: string[]
  avoid_items: string[]
  note: string
}

export const STYLE_COMBINATION_GUIDE: Record<string, StyleCombinationGuideEntry> = {
  'old_money|smart_casual': {
    allowed: true,
    score_range: [78, 85],
    typical_occasion: ['leisure', 'social_events', 'office_casual'],
    bridge_items: ['rollkragen', 'loafer', 'chino', 'strickjacke'],
    avoid_items: ['tweed_sakko', 'boots', 'flanellhemd'],
    note: 'Quiet British — most frequently worn hybrid in classic menswear.',
  },
  'old_money|riviera': {
    allowed: true,
    score_range: [90, 97],
    typical_occasion: ['leisure', 'social_events', 'special_occasions'],
    bridge_items: ['leinenhose', 'loafer', 'leinenhemd', 'strickpullover_rund'],
    avoid_items: ['tweed_sakko', 'boots', 'krawatte'],
    note: 'Continental Gentleman. Summer / warm climate only.',
  },
  'old_money|english_gentleman': {
    allowed: true,
    score_range: [72, 80],
    typical_occasion: ['office_casual', 'social_events', 'special_occasions'],
    bridge_items: ['flanellhose', 'wollhose', 'oxford_schuh', 'rollkragen'],
    avoid_items: ['sneaker_minimal', 'jeans_dunkel', 't_shirt'],
    note: 'Quiet luxury meets Savile Row. Strongest on suit separates days.',
  },
  'old_money|british_countryside': {
    allowed: true,
    score_range: [58, 68],
    typical_occasion: ['leisure', 'social_events'],
    bridge_items: ['wollmantel', 'flanellhose', 'brogue', 'tassel_loafer'],
    avoid_items: ['sneaker_minimal', 'leinenhose', 'anzughose'],
    note: 'English Gentleman weekending — works with quality tweeds and cashmere.',
  },
  'ivy_league|smart_casual': {
    allowed: true,
    score_range: [88, 95],
    typical_occasion: ['office_casual', 'leisure', 'social_events'],
    bridge_items: ['oxford_hemd', 'chino', 'chelsea_boot', 'blazer'],
    avoid_items: ['tweed_sakko', 'anzughose', 'krawatte'],
    note: 'Most natural combination — Ivy and Smart Casual overlap strongly.',
  },
  'ivy_league|old_money': {
    allowed: true,
    score_range: [68, 76],
    typical_occasion: ['office_casual', 'leisure', 'social_events'],
    bridge_items: ['oxford_hemd', 'chino', 'penny_loafer', 'blazer'],
    avoid_items: ['tweed_sakko', 'boots', 'flanellhemd'],
    note: 'Classic American meets quiet British. Shared palette of navy, khaki, cream.',
  },
  'smart_casual|riviera': {
    allowed: true,
    score_range: [74, 82],
    typical_occasion: ['leisure', 'social_events'],
    bridge_items: ['leinenhemd', 'chino', 'loafer', 'leinenhose'],
    avoid_items: ['tweed_sakko', 'boots', 'krawatte'],
    note: 'Summer only. Unstructured blazer is the bridge piece.',
  },
  'british_countryside|smart_casual': {
    allowed: true,
    score_range: [58, 65],
    typical_occasion: ['leisure', 'office_casual'],
    bridge_items: ['chelsea_boot', 'cord_hose', 'flanellhemd', 'chino'],
    avoid_items: ['loafer', 'leinenhose', 'anzughose'],
    note: 'Heritage Casual. Chelsea Boot is the perfect bridge item.',
  },
  'english_gentleman|ivy_league': {
    allowed: true,
    score_range: [58, 65],
    typical_occasion: ['office_casual', 'social_events'],
    bridge_items: ['oxford_hemd', 'flanellhose', 'blazer', 'derby'],
    avoid_items: ['sneaker_minimal', 'jeans_dunkel', 't_shirt'],
    note: 'Transatlantic classic. Less formal on Ivy side bridges the gap.',
  },
  'english_gentleman|british_countryside': {
    allowed: false,
    score_range: [35, 45],
    typical_occasion: [],
    bridge_items: [],
    avoid_items: [],
    note: 'Hard block in most contexts. Worsted suit + tweed = costume. Smart Separates (template #11) is the exception.',
  },
  'english_gentleman|riviera': {
    allowed: false,
    score_range: [28, 38],
    typical_occasion: [],
    bridge_items: [],
    avoid_items: [],
    note: 'BLOCKED. Savile Row formality + Riviera lightness = irreconcilable conflict.',
  },
  'british_countryside|riviera': {
    allowed: false,
    score_range: [20, 30],
    typical_occasion: [],
    bridge_items: [],
    avoid_items: [],
    note: 'BLOCKED. Heavy tweed + linen = seasonal and aesthetic hard conflict.',
  },

  'italian_elegance|old_money': {
    allowed: true,
    score_range: [85, 93],
    typical_occasion: ['office_casual', 'social_events', 'leisure', 'special_occasions'],
    bridge_items: ['rollkragen', 'loafer', 'tassel_loafer', 'flanellhose', 'sakko', 'strickjacke'],
    avoid_items: ['boots', 'field_jacket', 'flanellhemd'],
    note: 'Gentleman Sprezzatura — same quiet-luxury register, Italian softness over British restraint.',
  },
  'english_gentleman|italian_elegance': {
    allowed: true,
    score_range: [80, 90],
    typical_occasion: ['office_formal', 'office_casual', 'social_events', 'special_occasions'],
    bridge_items: ['sakko', 'anzughose', 'oxford_hemd', 'krawatte', 'loafer', 'derby'],
    avoid_items: ['boots', 'wachsjacke', 'flanellhemd', 'sneaker_minimal'],
    note: 'Anglo-Italian — Savile Row structure carried with Neapolitan ease. Drake\u2019s territory.',
  },
  'italian_elegance|riviera': {
    allowed: true,
    score_range: [88, 96],
    typical_occasion: ['leisure', 'social_events', 'special_occasions'],
    bridge_items: ['leinenhemd', 'leinenhose', 'summer_loafer', 'poloshirt', 'sakko'],
    avoid_items: ['tweed_sakko', 'boots', 'wollmantel', 'cord_hose'],
    note: 'Mediterranean natural fit — shared linen, suede and sun-warmed palette.',
  },
  'italian_elegance|smart_casual': {
    allowed: true,
    score_range: [75, 85],
    typical_occasion: ['office_casual', 'leisure', 'social_events'],
    bridge_items: ['sakko', 'chino', 'poloshirt', 'loafer', 'strickpullover_rund'],
    avoid_items: ['boots', 'field_jacket'],
    note: 'Modern Italian everyday — unstructured tailoring over smart-casual base.',
  },
  'british_countryside|italian_elegance': {
    allowed: true,
    score_range: [55, 65],
    typical_occasion: ['leisure', 'social_events'],
    bridge_items: ['strickpullover_rund', 'wollhose', 'flanellhose', 'tassel_loafer'],
    avoid_items: ['wachsjacke', 'field_jacket', 'flanellhemd', 'leinenhose'],
    note: 'Difficult bridge — works only via shared earth tones and knitwear; keep tweed out.',
  },
  'italian_elegance|ivy_league': {
    allowed: true,
    score_range: [68, 78],
    typical_occasion: ['office_casual', 'leisure', 'social_events'],
    bridge_items: ['poloshirt', 'chino', 'penny_loafer', 'blazer', 'oxford_hemd'],
    avoid_items: ['boots', 'flanellhemd', 'madras'],
    note: 'Transatlantic classic — shared loafers and chinos, Italian fabric upgrade.',
  },
}

export const ABSOLUTE_STYLE_BLOCKS = new Set([
  'british_countryside|riviera',
  'english_gentleman|riviera',
])
