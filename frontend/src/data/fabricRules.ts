// StyleAdvisor Classical Menswear Database v3.0 — Phase 3: Fabric Pairing & Anti-Pattern Rules

// ─── Fabric Weight Matrix ────────────────────────────────────────────────────
// Score 0.0–1.0: how well two fabric weights pair together in one outfit.
// Symmetric lookup. Weights: 'light', 'medium', 'heavy'.

export type FabricWeight = 'light' | 'medium' | 'heavy'

export const FABRIC_WEIGHT_COMPAT: Record<FabricWeight, Record<FabricWeight, number>> = {
  light:  { light: 0.85, medium: 0.90, heavy: 0.45 },
  medium: { light: 0.90, medium: 0.95, heavy: 0.75 },
  heavy:  { light: 0.45, medium: 0.75, heavy: 0.90 },
}

// ─── Fabric Family Definitions ───────────────────────────────────────────────

export type FabricFamily =
  | 'wool'        // flannel, tweed, worsted, hopsack, herringbone, melton
  | 'cotton'      // oxford cloth, broadcloth, poplin, drill, chino, seersucker
  | 'linen'       // plain linen, linen-cotton blends
  | 'silk'        // plain silk, silk-wool blends (ties, pocket squares)
  | 'knit'        // jersey, interlock, fine knitwear (merino, cashmere, lambswool)
  | 'leather'     // smooth, suede, nubuck
  | 'synthetic'   // polyester, nylon, viscose blends (not classic menswear)

// Fabric-weight mapping for common sub-types
export const FABRIC_WEIGHT_MAP: Record<string, FabricWeight> = {
  // Light
  linen:          'light',
  poplin:         'light',
  seersucker:     'light',
  voile:          'light',
  silk:           'light',
  // Medium
  oxford_cloth:   'medium',
  broadcloth:     'medium',
  chino_cloth:    'medium',
  drill:          'medium',
  gabardine:      'medium',
  worsted_wool:   'medium',
  flannel_light:  'medium',
  jersey:         'medium',
  merino:         'medium',
  // Heavy
  tweed:          'heavy',
  flannel:        'heavy',
  melton:         'heavy',
  corduroy:       'heavy',
  moleskin:       'heavy',
  velvet:         'heavy',
  denim:          'heavy',
  canvas:         'heavy',
  wax_cotton:     'heavy',
  cashmere_heavy: 'heavy',
}

// ─── Forbidden Fabric Combinations ───────────────────────────────────────────
// These pairings break the classical menswear aesthetic regardless of colour.

export interface FabricAntiPattern {
  fabrics: [string, string]
  reason: string
  severity: 'hard' | 'soft'
}

export const FABRIC_ANTI_PATTERNS: FabricAntiPattern[] = [
  { fabrics: ['tweed', 'linen'],        reason: 'Tweed is autumn/winter; linen is summer — seasonal clash',         severity: 'hard' },
  { fabrics: ['flannel', 'linen'],      reason: 'Same seasonal clash — heavy vs light',                             severity: 'hard' },
  { fabrics: ['velvet', 'linen'],       reason: 'Formality and weight mismatch — velvet is evening, linen is day', severity: 'hard' },
  { fabrics: ['denim', 'silk'],         reason: 'Texture and formality too far apart',                              severity: 'hard' },
  { fabrics: ['wax_cotton', 'worsted_wool'], reason: 'Utility fabric vs formal suiting — incompatible register',   severity: 'hard' },
  { fabrics: ['seersucker', 'tweed'],   reason: 'Summer suiting vs winter suiting — seasonal mismatch',            severity: 'hard' },
  { fabrics: ['synthetic', 'cashmere'], reason: 'Synthetic next to natural luxury — cheapens the natural fibre',   severity: 'hard' },
  { fabrics: ['synthetic', 'silk'],     reason: 'Same — synthetic dilutes the silk sheen and hand',                severity: 'hard' },
  { fabrics: ['corduroy', 'seersucker'],reason: 'Both textured/patterned in conflicting seasonal registers',       severity: 'soft' },
  { fabrics: ['velvet', 'tweed'],       reason: 'Both heavily textured — compete for attention',                   severity: 'soft' },
  { fabrics: ['leather', 'linen'],      reason: 'Weight and season mismatch in most contexts',                     severity: 'soft' },
  { fabrics: ['linen', 'corduroy'],     reason: 'Summer cloth vs winter rib — seasonal clash',                      severity: 'hard' },
  { fabrics: ['linen', 'moleskin'],     reason: 'Summer cloth vs heavy brushed cotton — seasonal clash',            severity: 'hard' },
  { fabrics: ['linen', 'melton'],       reason: 'Lightest cloth vs heaviest wool — incompatible',                   severity: 'hard' },
  { fabrics: ['linen', 'cashmere_heavy'], reason: 'Summer vs winter luxury — seasonal clash',                       severity: 'hard' },
  { fabrics: ['seersucker', 'flannel'], reason: 'Summer suiting vs winter suiting',                                 severity: 'hard' },
  { fabrics: ['seersucker', 'corduroy'],reason: 'Conflicting seasonal registers',                                   severity: 'hard' },
  { fabrics: ['seersucker', 'moleskin'],reason: 'Summer vs winter cloth',                                           severity: 'hard' },
  { fabrics: ['denim', 'worsted_wool'], reason: 'Workwear vs formal suiting — register clash',                      severity: 'hard' },
  { fabrics: ['denim', 'denim'],        reason: 'Denim on denim — Canadian tuxedo, outside classical register',     severity: 'hard' },
  { fabrics: ['wax_cotton', 'linen'],   reason: 'Heavy utility vs summer lightness',                                severity: 'hard' },
  { fabrics: ['velvet', 'denim'],       reason: 'Evening luxury vs workwear',                                       severity: 'hard' },
  { fabrics: ['velvet', 'corduroy'],    reason: 'Both pile fabrics — compete and look costume',                     severity: 'soft' },
  { fabrics: ['tweed', 'seersucker'],   reason: 'Winter vs summer suiting',                                         severity: 'hard' },
  { fabrics: ['tweed', 'tweed'],        reason: 'Two tweed pieces reads as costume — tweed is an anchor, not a suit', severity: 'soft' },
  { fabrics: ['silk', 'wax_cotton'],    reason: 'Refined vs utility — register clash',                              severity: 'soft' },
  { fabrics: ['corduroy', 'corduroy'],  reason: 'Cord suit territory — only deliberate, not combined ad hoc',       severity: 'soft' },
]

// ─── Fabric–Style Affinity ───────────────────────────────────────────────────
// Which fabric families are natural to each style archetype.
// Used to bonus/penalise outfit score by fabric fit.

export const FABRIC_STYLE_AFFINITY: Record<string, string[]> = {
  old_money:           ['cashmere', 'merino', 'worsted_wool', 'flannel', 'silk', 'cavalry_twill'],
  british_countryside: ['tweed', 'flannel', 'moleskin', 'corduroy', 'wax_cotton', 'lambswool'],
  english_gentleman:   ['worsted_wool', 'flannel', 'silk', 'cashmere', 'broadcloth'],
  smart_casual:        ['cotton', 'oxford_cloth', 'merino', 'chino_cloth', 'jersey'],
  riviera:             ['linen', 'silk', 'seersucker', 'poplin', 'jersey'],
  ivy_league:          ['oxford_cloth', 'chino_cloth', 'cotton', 'merino', 'seersucker'],
}

export function getFabricWeightScore(a: FabricWeight, b: FabricWeight): number {
  return FABRIC_WEIGHT_COMPAT[a][b]
}

export function isFabricAntiPattern(fabA: string, fabB: string): FabricAntiPattern | null {
  const a = fabA.toLowerCase()
  const b = fabB.toLowerCase()
  return FABRIC_ANTI_PATTERNS.find(
    p => (p.fabrics[0] === a && p.fabrics[1] === b) || (p.fabrics[0] === b && p.fabrics[1] === a)
  ) ?? null
}


// ─── v5.1 (#1): Vollständige Stoff-Paar-Matrix ────────────────────────────────
// Positiv-Scores 0–1 für kanonische Paarungen. Symmetrischer Lookup.
// Quelle: klassische Menswear-Lehre (Flusser, Boyer, Permanent Style).

const RAW_FABRIC_PAIRS: Array<[string, string, number, string]> = [
  // Wolle-Kern
  ['flannel',      'oxford_cloth',  0.95, 'Grey flannels + OCBD — englischer Kanon'],
  ['flannel',      'cashmere_heavy',0.97, 'Apex-Paarung — Flanell + Kaschmir'],
  ['flannel',      'merino',        0.93, 'Weiches Winterduo'],
  ['flannel',      'broadcloth',    0.90, 'City-Klassiker'],
  ['flannel',      'tweed',         0.92, 'Town-and-Country-Brücke'],
  ['flannel',      'silk',          0.88, 'Flanellanzug + Seidenkrawatte'],
  ['worsted_wool', 'broadcloth',    0.95, 'Business-Standard'],
  ['worsted_wool', 'poplin',        0.94, 'Anzug + Popeline-Hemd'],
  ['worsted_wool', 'silk',          0.93, 'Anzug + Krawatte — kanonisch'],
  ['worsted_wool', 'merino',        0.88, 'Feinstrick unter Sakko'],
  ['worsted_wool', 'oxford_cloth',  0.82, 'Casual-Hemd zu formal — geht im Smart-Office'],
  ['tweed',        'oxford_cloth',  0.92, 'Tweed-Sakko + OCBD — akademisch'],
  ['tweed',        'corduroy',      0.90, 'Country-Kern — beide robust, eine glatte Basis nötig'],
  ['tweed',        'moleskin',      0.91, 'Landed-Gentry-Standard'],
  ['tweed',        'cashmere_heavy',0.88, 'Grobes Sakko + weicher Strick'],
  ['tweed',        'denim',         0.78, 'Modernes Heritage — funktioniert mit dunklem Denim'],
  ['tweed',        'flannel_light', 0.90, 'Klassische Sakko-Hose-Achse'],
  // Baumwolle
  ['chino_cloth',  'oxford_cloth',  0.95, 'Ivy-Fundament'],
  ['chino_cloth',  'merino',        0.92, 'Strick + Chino — Smart-Casual-Kern'],
  ['chino_cloth',  'jersey',        0.88, 'Polo + Chino'],
  ['chino_cloth',  'linen',         0.90, 'Leinenhemd + Chino — Sommerklassiker'],
  ['chino_cloth',  'cashmere_heavy',0.86, 'Luxusstrick auf Casualhose'],
  ['drill',        'linen',         0.90, 'Cotton-Drill + Leinen — italienischer Sommer'],
  ['drill',        'jersey',        0.88, 'Strickpolo + Drill-Hose'],
  ['oxford_cloth', 'denim',         0.84, 'OCBD + Jeans — amerikanisch korrekt'],
  ['oxford_cloth', 'merino',        0.93, 'Hemd unter Feinstrick — Layering-Kanon'],
  ['oxford_cloth', 'cashmere_heavy',0.90, 'Hemd unter Winterstrick'],
  // Leinen-Sommer
  ['linen',        'linen',         0.88, 'Voll-Leinen — Riviera, Knitter ist Feature'],
  ['linen',        'poplin',        0.86, 'Leichtes Sommerduo'],
  ['linen',        'jersey',        0.87, 'Leinenhose + Strickpolo'],
  ['linen',        'seersucker',    0.84, 'Beide Sommer — Textur beachten'],
  ['linen',        'silk',          0.85, 'Sommerlicher Luxus'],
  ['linen',        'merino',        0.80, 'Leichter Merino auf Leinen — Übergangszeit'],
  // Strick
  ['merino',       'jersey',        0.84, 'Zwei Stricklagen — Gauge-Differenz nötig'],
  ['cashmere_heavy','moleskin',     0.92, 'Weicher Strick + samtige Hose'],
  ['cashmere_heavy','corduroy',     0.88, 'Winterliche Texturen — glatte Basis empfohlen'],
  ['merino',       'denim',         0.85, 'Feinstrick + dunkler Denim'],
  // Leder/Suede (Schuh-Achse)
  ['leather',      'flannel',       0.92, 'Calf/Suede + Flanell — englischer Standard'],
  ['leather',      'worsted_wool',  0.93, 'Formaler Schuh + Anzug'],
  ['leather',      'chino_cloth',   0.90, 'Loafer + Chino'],
  ['leather',      'denim',         0.85, 'Boot/Loafer + Denim'],
  ['leather',      'corduroy',      0.88, 'Suede + Cord — Herbstkanon'],
  // Utility
  ['wax_cotton',   'tweed',         0.88, 'Barbour + Tweed — Country-Kern'],
  ['wax_cotton',   'corduroy',      0.88, 'Country-Achse'],
  ['wax_cotton',   'moleskin',      0.87, 'Field-Kombination'],
  ['wax_cotton',   'denim',         0.82, 'Modernes Heritage'],
  ['wax_cotton',   'cashmere_heavy',0.78, 'Funktioniert — Strick unter Wachsjacke'],
]

export const FABRIC_PAIR_MATRIX: Record<string, number> = (() => {
  const map: Record<string, number> = {}
  for (const [a, b, score] of RAW_FABRIC_PAIRS) {
    map[[a, b].sort().join('|')] = score
  }
  return map
})()

export function getFabricPairScore(a: string, b: string): number | null {
  return FABRIC_PAIR_MATRIX[[a.toLowerCase(), b.toLowerCase()].sort().join('|')] ?? null
}

// Subkategorie → Stoffgewicht (für harte Saisonkohärenz-Prüfung)
export const SUBCAT_FABRIC_WEIGHT: Record<string, FabricWeight> = {
  leinenhemd: 'light', leinenhose: 'light', poloshirt: 'light', t_shirt: 'light',
  summer_loafer: 'light',
  oxford_hemd: 'medium', chino: 'medium', anzughose: 'medium', sakko: 'medium',
  blazer: 'medium', jeans_dunkel: 'medium', wollhose: 'medium', derby: 'medium',
  loafer: 'medium', penny_loafer: 'medium', tassel_loafer: 'medium',
  oxford_schuh: 'medium', monkstrap: 'medium', strickpullover_rund: 'medium',
  strickpullover_v: 'medium', strickweste: 'medium', trenchcoat: 'medium',
  harrington: 'medium', krawatte: 'medium', weste: 'medium', troyer: 'medium',
  strickjacke: 'medium', chelsea_boot: 'medium', chukka_boot: 'medium', sneaker_minimal: 'medium',
  flanellhose: 'heavy', flanellhemd: 'heavy', cord_hose: 'heavy', tweed_sakko: 'heavy',
  wollmantel: 'heavy', peacoat: 'heavy', dufflecoat: 'heavy', wachsjacke: 'heavy',
  field_jacket: 'heavy', gesteppte_weste: 'heavy', rollkragen: 'heavy', boots: 'heavy',
  schal_kaschmir: 'heavy', muetze_woll: 'heavy',
}

export function getSubcatWeight(subcat: string | undefined): FabricWeight | null {
  return subcat ? (SUBCAT_FABRIC_WEIGHT[subcat] ?? null) : null
}
