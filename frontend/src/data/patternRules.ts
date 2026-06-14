// StyleAdvisor Classical Menswear Database v3.0 — Phase 4: Pattern Mixing Rules

// ─── Pattern Types ────────────────────────────────────────────────────────────

export type PatternType =
  | 'solid'
  | 'stripe'         // any stripe: pinstripe, chalk stripe, candy stripe, Bengal stripe
  | 'check'          // any check: glen plaid, windowpane, houndstooth (small)
  | 'plaid'          // tartan, large houndstooth, large windowpane
  | 'herringbone'    // woven herringbone — treated as subtle texture, not pattern
  | 'tweed'          // multicolour flecked — counts as pattern
  | 'dots'           // polka dots, pin dots (usually ties/pocket squares)
  | 'floral'         // floral print (shirt territory)
  | 'geometric'      // abstract geometric (contemporary crossover)
  | 'paisley'        // paisley (tie/pocket square classic)
  | 'print'          // photographic or graphic print (never classical)

export type PatternScale = 'micro' | 'small' | 'medium' | 'large' | 'bold'

// ─── Two-Pattern Mixing Matrix ─────────────────────────────────────────────
// score 0.0–1.0 for combining pattern A on item 1 with pattern B on item 2.
// solid × anything = high (solid is neutral). Symmetric.

const RAW_MIXING: Array<[PatternType, PatternType, number, string]> = [
  // solid pairs
  ['solid',       'solid',       0.95, 'Clean tonal — works but needs texture variation'],
  ['solid',       'stripe',      0.90, 'Classic: solid blazer + striped shirt, or vice versa'],
  ['solid',       'check',       0.88, 'Classic: solid trouser + checked jacket'],
  ['solid',       'plaid',       0.82, 'Fine if one is dominant — avoid two large pieces'],
  ['solid',       'herringbone', 0.92, 'Herringbone reads as texture not pattern — excellent'],
  ['solid',       'tweed',       0.88, 'Tweed as anchor piece + solid everything else'],
  ['solid',       'dots',        0.90, 'Dots on tie/pocket square + solid suit'],
  ['solid',       'floral',      0.80, 'Floral shirt + solid jacket — Riviera/smart casual only'],
  ['solid',       'geometric',   0.72, 'Contemporary — use sparingly'],
  ['solid',       'paisley',     0.88, 'Paisley tie + solid suit — classic'],
  ['solid',       'print',       0.30, 'Print shirt in classical menswear — almost never appropriate'],

  // stripe pairs
  ['stripe',      'stripe',      0.40, 'Only works if scales differ greatly AND colours identical — risky'],
  ['stripe',      'check',       0.75, 'One must be micro/small — diff scales required'],
  ['stripe',      'plaid',       0.35, 'Compete — avoid'],
  ['stripe',      'herringbone', 0.82, 'Stripe shirt + herringbone jacket — classic English'],
  ['stripe',      'tweed',       0.72, 'Can work if stripe is quiet (pinstripe) — scale diff required'],
  ['stripe',      'dots',        0.68, 'Only if one is very small — tie vs shirt'],
  ['stripe',      'floral',      0.20, 'Compete heavily — avoid'],
  ['stripe',      'paisley',     0.65, 'Only on tie vs shirt and they must be different scale'],
  ['stripe',      'print',       0.10, 'AVOID'],

  // check pairs
  ['check',       'check',       0.35, 'Two checks: only if radically different scale and one very quiet'],
  ['check',       'plaid',       0.25, 'Both bold patterns — hard clash'],
  ['check',       'herringbone', 0.78, 'Check jacket + herringbone tie — English classic'],
  ['check',       'tweed',       0.55, 'Both textured patterns — one must be very quiet'],
  ['check',       'dots',        0.70, 'Check suit + dot tie — works if dot is small'],
  ['check',       'floral',      0.15, 'Too busy — avoid'],
  ['check',       'paisley',     0.60, 'Check suit + paisley tie — acceptable classic'],
  ['check',       'print',       0.10, 'AVOID'],

  // plaid pairs
  ['plaid',       'plaid',       0.10, 'NEVER — two plaids is costume'],
  ['plaid',       'herringbone', 0.62, 'Borderline — plaid trouser + herringbone jacket if quiet'],
  ['plaid',       'tweed',       0.35, 'Both heavy texture patterns — avoid'],
  ['plaid',       'dots',        0.55, 'Fine on tie vs jacket if sizes differ'],
  ['plaid',       'floral',      0.10, 'AVOID'],
  ['plaid',       'paisley',     0.50, 'Tie-level paisley vs plaid trouser — marginal'],
  ['plaid',       'print',       0.05, 'AVOID'],

  // herringbone pairs
  ['herringbone', 'herringbone', 0.75, 'Both read as texture — subtle, OK if one is weave one is pattern'],
  ['herringbone', 'tweed',       0.70, 'Both woven textures — one as trouser one as jacket'],
  ['herringbone', 'dots',        0.82, 'Herringbone jacket + dotted tie — excellent'],
  ['herringbone', 'floral',      0.55, 'Context-dependent — smart casual only'],
  ['herringbone', 'paisley',     0.80, 'Classic combination'],
  ['herringbone', 'print',       0.20, 'AVOID in classical context'],

  // tweed pairs
  ['tweed',       'tweed',       0.20, 'Two tweeds — avoid, overwhelming'],
  ['tweed',       'dots',        0.78, 'Tweed jacket + dotted knit tie — countryside classic'],
  ['tweed',       'floral',      0.25, 'Tweed + floral — strong country/boho — rarely right'],
  ['tweed',       'paisley',     0.72, 'Tweed + paisley tie — works'],
  ['tweed',       'print',       0.10, 'AVOID'],

  // dots pairs
  ['dots',        'floral',      0.25, 'Both decorative — compete'],
  ['dots',        'paisley',     0.55, 'Only if one is very small and they differ in scale'],
  ['dots',        'print',       0.10, 'AVOID'],

  // floral pairs
  ['floral',      'floral',      0.05, 'NEVER'],
  ['floral',      'paisley',     0.15, 'AVOID — both organic patterns compete'],
  ['floral',      'print',       0.05, 'NEVER'],

  // paisley pairs
  ['paisley',     'paisley',     0.15, 'Only if one is micro — rare'],
  ['paisley',     'print',       0.10, 'AVOID'],

  // print pairs
  ['print',       'print',       0.05, 'NEVER in classical context'],
]

export const PATTERN_MIX_MATRIX: Record<string, number> = (() => {
  const map: Record<string, number> = {}
  for (const [a, b, score] of RAW_MIXING) {
    map[[a, b].sort().join('|')] = score
  }
  return map
})()

// ─── Scale Mixing Rule ────────────────────────────────────────────────────────
// When combining two non-solid patterns the scales should differ by at least one step.
// Returns a penalty multiplier (1.0 = no penalty, 0.7 = 30% reduction).

const SCALE_ORDER: PatternScale[] = ['micro', 'small', 'medium', 'large', 'bold']

export function patternScalePenalty(scaleA: PatternScale, scaleB: PatternScale): number {
  const diff = Math.abs(SCALE_ORDER.indexOf(scaleA) - SCALE_ORDER.indexOf(scaleB))
  if (diff === 0) return 0.70  // same scale — heavy penalty
  if (diff === 1) return 0.88  // adjacent — light penalty
  return 1.00                  // two+ steps apart — no penalty
}

export function getPatternMixScore(patA: PatternType, patB: PatternType): number {
  const key = [patA, patB].sort().join('|')
  return PATTERN_MIX_MATRIX[key] ?? 0.60
}

// ─── Max Pattern Count ────────────────────────────────────────────────────────
// Classical menswear: max 2 visible patterns per outfit (excluding ties/pocket squares).
// Smart casual / Riviera: may allow 2 patterns on main garments.
// English Gentleman / Old Money / British Countryside: strict 1 (+ accessories only).

export const MAX_PATTERNS_PER_STYLE: Record<string, number> = {
  old_money:           1,
  british_countryside: 1,
  english_gentleman:   1,
  smart_casual:        2,
  riviera:             2,
  ivy_league:          2,
}
