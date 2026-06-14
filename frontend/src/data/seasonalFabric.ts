// StyleAdvisor Classical Menswear Database v7.1 — Seasonal-Thermal Coherence Engine
// ─────────────────────────────────────────────────────────────────────────────
// WARUM dieses Modul existiert:
//   Das alte Saison-Modell hatte zwei Schwächen, die zu Fehlern wie
//   „Leinenhose + Chelsea Boot" oder „Leinen + Wolljacke" führten:
//     1. Es kannte nur 3 Gewichtsstufen (light/medium/heavy) und blockierte hart
//        ausschließlich light+heavy. Leinen (light) + Chelsea Boot (medium) rutschte
//        durch.
//     2. Die Saison-Kohärenz war eine reine Schnittmengen-Prüfung der season-Arrays.
//        Da fast jedes Teil 'spring' listet (Leinenhose ['spring','summer'],
//        Chelsea Boot ['autumn','winter','spring']), entstand über das gemeinsame
//        'spring' ein FALSE POSITIVE — die Kombination wurde sogar als „kohärent"
//        belohnt, obwohl Leinen ein reiner Sommerstoff und der Chelsea Boot ein
//        Kaltwetter-Schuh ist.
//
// LÖSUNG: Jedes Teil erhält eine THERMISCHE KLASSE (SeasonClass) — eine dominante,
//   einzelne Einordnung statt einer permissiven Saison-Liste. Sommer-exklusive
//   Stoffe (hot) und Kaltwetter-Teile (cold) dürfen NIE im selben Outfit erscheinen.
//   Das ist ein harter K.O. — auch im Sprezzatura-Modus, denn „Sommer + Winter"
//   ist kein eleganter Regelbruch, sondern schlicht ein Saisonfehler.
//
// Quellen (klassische Trag-Lehre):
//   • Alan Flusser — «Dressing the Man» (Stoff-Saisonalität, Gewichte)
//   • G. Bruce Boyer — «True Style» (Sommer- vs. Winterstoffe, Schuh-Material)
//   • Simon Crompton — Permanent Style (Fresco/Hopsack/Flanell, Wildleder im Sommer)
//   • Branchenkonsens: Drake's, The Armoury, neapolitanische Schule
//   • Recherche-Konsens (2024–2026): Leinenhose → Espadrilles/Sommer-Loafer/
//     helle Wildleder-Derbys; KEINE schweren/glänzenden Boots; matt statt Hochglanz.

import type { ClothingItem } from '../db/index'

// ─── Thermische Klassen ───────────────────────────────────────────────────────

export type SeasonClass =
  | 'hot'           // Hochsommer-exklusiv — Leinen, Seersucker, Fresco, ungefütterte Sommerschuhe
  | 'warm'          // Frühling–Sommer, leicht — leichte Baumwolle, Polo, Boat Shoe
  | 'transitional'  // 3-Saison-Allrounder — Worsted-Mid, Oxford-Cloth, Calf-Schuhe, Chino
  | 'cold'          // Herbst–Winter — Flanell, Tweed, Cord, Grobstrick, Boots, Wollmäntel

export const SEASON_CLASS_ORDER: SeasonClass[] = ['hot', 'warm', 'transitional', 'cold']
export const SEASON_CLASS_LABEL_DE: Record<SeasonClass, string> = {
  hot: 'Hochsommer', warm: 'Warm/leicht', transitional: 'Ganzjährig', cold: 'Herbst/Winter',
}
const classIndex = (c: SeasonClass): number => SEASON_CLASS_ORDER.indexOf(c)

// ─── Subkategorie → Default-Saisonklasse ───────────────────────────────────────
// Die dominante thermische Einordnung jeder Subkategorie. Tailoring (sakko/blazer)
// und manche Schuhe werden zusätzlich durch die Stoff-Familie verfeinert (s. u.).

export const SUBCAT_SEASON_CLASS: Record<string, SeasonClass> = {
  // Tops
  leinenhemd: 'hot',
  poloshirt: 'warm',
  t_shirt: 'warm',
  oxford_hemd: 'transitional',
  flanellhemd: 'cold',
  strickpullover_rund: 'cold',
  strickpullover_v: 'cold',
  troyer: 'cold',
  rollkragen: 'cold',
  strickweste: 'transitional',
  weste: 'transitional',

  // Bottoms
  leinenhose: 'hot',
  chino: 'transitional',
  anzughose: 'transitional',
  jeans_dunkel: 'transitional',
  wollhose: 'cold',
  flanellhose: 'cold',
  cord_hose: 'cold',

  // Outerwear (Nicht-Tailoring)
  wollmantel: 'cold',
  peacoat: 'cold',
  dufflecoat: 'cold',
  trenchcoat: 'transitional',
  harrington: 'transitional',
  field_jacket: 'transitional',
  gesteppte_weste: 'cold',
  strickjacke: 'transitional',
  wachsjacke: 'cold',

  // Tailoring (Default — wird durch Stoff verfeinert)
  sakko: 'transitional',
  blazer: 'transitional',
  tweed_sakko: 'cold',

  // Schuhe
  summer_loafer: 'hot',     // sockless Sommer-Essenzial (Riviera/Ivy)
  loafer: 'transitional',   // Penny/Tassel: Frühling–Herbst, mit Flanell sogar Winter
  penny_loafer: 'transitional',
  tassel_loafer: 'transitional',
  derby: 'transitional',
  oxford_schuh: 'transitional',
  monkstrap: 'transitional',
  brogue: 'transitional',
  sneaker_minimal: 'transitional', // clean white sneaker — ganzjährig casual
  chelsea_boot: 'cold',     // glatter Lederboot — Kaltwetter-Klassiker
  chukka_boot: 'cold',      // Boot-Volumen → konservativ Kaltwetter
  boots: 'cold',

  // Accessoires mit klarer Saisonbindung (NICHT exempt)
  schal_kaschmir: 'cold',
  muetze_woll: 'cold',
  leder_handschuhe: 'cold',
}

// Tailoring, dessen Klasse vom Stoff abhängt
const TAILORING_SUBCATS = new Set(['sakko', 'blazer', 'tweed_sakko'])

// Saison-neutrale Accessoires — werden bei der harten Prüfung ignoriert
export const SEASON_NEUTRAL_SUBCATS = new Set([
  'krawatte', 'einstecktuch', 'guertel_leder', 'uhr_klassisch',
])

// ─── Stoff-Familie → Saison-Tendenz ────────────────────────────────────────────
// Leinen ist die einzige Familie, die für sich allein saisonbindend ist (immer hot).
// Wolle/Strick verfeinern in Kombination mit dem Gewicht.

export function fabricSeasonHint(
  family: string | undefined, weight: 'light' | 'medium' | 'heavy' | undefined,
): SeasonClass | null {
  const fam = (family ?? '').toLowerCase()
  if (fam === 'linen') return 'hot'
  if (fam === 'knit' && weight === 'heavy') return 'cold'
  if (fam === 'wool' && weight === 'heavy') return 'cold'
  if (fam === 'cotton' && weight === 'light') return 'warm'
  return null
}

// ─── Haupt-Resolver: Teil → SeasonClass ─────────────────────────────────────────

export function seasonClassOf(item: Partial<ClothingItem>): SeasonClass {
  const sub = item.subcategory ?? ''
  const fam = (item.fabric_family ?? '').toLowerCase()
  const wt = item.fabric_weight

  // 1) Leinen ist immer Hochsommer — egal welche Subkategorie (auch Leinen-Sakko!)
  if (fam === 'linen') return 'hot'

  // 2) Tailoring: Stoff bestimmt die Klasse (Leinen-Sakko ≠ Tweed-Sakko)
  if (TAILORING_SUBCATS.has(sub)) {
    if (sub === 'tweed_sakko') return 'cold'
    if (wt === 'heavy') return 'cold'
    if (fam === 'cotton' && wt === 'light') return 'warm'
    if (wt === 'light') return 'warm'
    return SUBCAT_SEASON_CLASS[sub] ?? 'transitional'
  }

  // 3) Direkte Subkategorie-Zuordnung (+ Stoff-Override für Grobstrick)
  if (SUBCAT_SEASON_CLASS[sub]) {
    if (fam === 'knit' && wt === 'heavy') return 'cold'
    return SUBCAT_SEASON_CLASS[sub]
  }

  // 4) Stoff-Hinweis ohne Subkategorie
  const hint = fabricSeasonHint(fam, wt)
  if (hint) return hint

  // 5) Fallback: aus dem season-Array ableiten
  const seasons = new Set((item.season ?? []).map(s => s.toLowerCase()))
  const hasSummer = seasons.has('summer')
  const hasCold = seasons.has('winter') || seasons.has('autumn')
  if (hasSummer && !hasCold) return seasons.size > 1 ? 'warm' : 'hot'
  if (hasCold && !hasSummer) return 'cold'
  return 'transitional'
}

// ─── Harte Saison-Konflikt-Prüfung ──────────────────────────────────────────────
// Ein Outfit, das gleichzeitig ein 'hot'-Teil (Sommerstoff) und ein 'cold'-Teil
// (Kaltwetter) enthält, ist ein Saisonbruch. Das ist das K.O.-Kriterium, das
// „Leinen + Chelsea Boot" und „Leinen + Tweed-Sakko" zuverlässig herausfiltert.

export interface SeasonalConflict {
  conflict: boolean
  hotItem?: string
  coldItem?: string
  reason?: string
}

export function seasonalConflict(items: Partial<ClothingItem>[]): SeasonalConflict {
  let hot: Partial<ClothingItem> | null = null
  let cold: Partial<ClothingItem> | null = null

  for (const it of items) {
    if (SEASON_NEUTRAL_SUBCATS.has(it.subcategory ?? '')) continue
    const c = seasonClassOf(it)
    if (c === 'hot' && !hot) hot = it
    if (c === 'cold' && !cold) cold = it
  }

  if (hot && cold) {
    const hn = hot.name ?? hot.subcategory ?? 'Sommerstoff'
    const cn = cold.name ?? cold.subcategory ?? 'Kaltwetter-Teil'
    return {
      conflict: true,
      hotItem: hot.subcategory,
      coldItem: cold.subcategory,
      reason: `Saisonbruch: „${hn}" ist ein Sommerstoff, „${cn}" gehört in Herbst/Winter — nie im selben Outfit`,
    }
  }
  return { conflict: false }
}

// ─── Saison-Kohärenz für das Scoring (weich) ────────────────────────────────────
// Ersetzt die fehlerhafte Schnittmengen-Logik. Bewertet, wie eng beieinander die
// thermischen Klassen liegen.

export function seasonCoherence(items: Partial<ClothingItem>[]): 'coherent' | 'mismatch' | 'neutral' {
  const classes = items
    .filter(i => !SEASON_NEUTRAL_SUBCATS.has(i.subcategory ?? ''))
    .map(seasonClassOf)
  if (classes.length < 2) return 'neutral'

  const indices = classes.map(classIndex)
  const span = Math.max(...indices) - Math.min(...indices)
  const hasHot = classes.includes('hot')
  const hasCold = classes.includes('cold')

  if (hasHot && hasCold) return 'mismatch'   // Sommer + Winter
  if (span <= 1) return 'coherent'           // dicht beieinander
  return 'neutral'                           // moderate Spannung (z.B. warm + cold)
}

// ─── Schuh-/Stoff-Feinregeln (weich, fürs Scoring) ──────────────────────────────
// Über den harten hot×cold-Block hinaus: ästhetische Feinabstimmung zwischen
// Schuh-Material/-Volumen und leichten Sommerhosen.
//   • Hochglanz-Formalschuh (Oxford/Monk in Calf) zu mattem Leinen → kleine Spannung
//   • Sommerstoff verträgt am besten matte Wildleder- oder Leinen-/Canvas-Schuhe
// Quelle: Boyer/Crompton (matt vs. shine), Recherche-Konsens 2024–2026.

const HIGH_SHINE_FORMAL_SHOES = new Set(['oxford_schuh', 'monkstrap'])
const HOT_BOTTOMS = new Set(['leinenhose'])

export function shoeFabricTension(items: Partial<ClothingItem>[]): { penalty: number; reason: string | null } {
  const subs = items.map(i => i.subcategory ?? '')
  const hasHotBottom = subs.some(s => HOT_BOTTOMS.has(s)) ||
    items.some(i => i.category === 'bottoms' && seasonClassOf(i) === 'hot')
  const shinyShoe = items.find(i => HIGH_SHINE_FORMAL_SHOES.has(i.subcategory ?? ''))
  if (hasHotBottom && shinyShoe) {
    return { penalty: 0.05, reason: 'Hochglanz-Schuh zu mattem Leinen — matte Wildleder-/Leinenschuhe sitzen stimmiger' }
  }
  return { penalty: 0, reason: null }
}

// ─── Dokumentierte Saison-Anti-Pattern (Wissensbasis / Erklärbarkeit) ───────────
// Maschinenlesbare Liste klassischer Saisonfehler, die der hot×cold-Block abdeckt.
// Dient der Transparenz und als Referenz für die Begründungstexte.

export interface SeasonAntiPattern {
  hot: string
  cold: string
  reason: string
}

export const SEASON_ANTI_PATTERNS: SeasonAntiPattern[] = [
  { hot: 'leinenhose', cold: 'chelsea_boot',  reason: 'Sommer-Leinen + Kaltwetter-Lederboot — Material, Gewicht und Saison kollidieren' },
  { hot: 'leinenhose', cold: 'chukka_boot',   reason: 'Sommer-Leinen + Knöchelboot — Boot-Volumen erdrückt die Leichtigkeit des Leinens' },
  { hot: 'leinenhose', cold: 'boots',         reason: 'Sommer-Leinen + schwerer Stiefel — krasse Saison- und Volumen-Spreizung' },
  { hot: 'leinenhose', cold: 'tweed_sakko',   reason: 'Sommer-Leinen + Wintertweed — gegensätzliche Jahreszeiten' },
  { hot: 'leinenhose', cold: 'flanellhose',   reason: 'Leinen + Flanell — leichtester Sommerstoff vs. schwerer Winterstoff' },
  { hot: 'leinenhose', cold: 'wollmantel',    reason: 'Leinen + Wollmantel — Winter-Oberschicht über Sommerhose' },
  { hot: 'leinenhose', cold: 'wachsjacke',    reason: 'Leinen + Wachsjacke — schwere Utility-Schicht über Sommerstoff' },
  { hot: 'leinenhemd', cold: 'rollkragen',    reason: 'Leinenhemd + Grobstrick — Sommer- vs. Winterlage' },
  { hot: 'leinenhemd', cold: 'wollmantel',    reason: 'Sommerhemd unter Wintermantel — inkohärent' },
  { hot: 'summer_loafer', cold: 'cord_hose',  reason: 'Sockless Sommer-Loafer + Winter-Cord — Saisonbruch am Fuß' },
  { hot: 'leinenhose', cold: 'schal_kaschmir', reason: 'Sommerhose + Kaschmirschal — Sommer- vs. Winter-Accessoire' },
]

// ─── Korrekte Sommer-Schuh-Paarungen (Positiv-Wissen) ───────────────────────────
// Was Leinen-/Sommerhosen WIRKLICH brauchen — für Kauf-Empfehlungen & Begründung.

export const SUMMER_BOTTOM_SHOE_RECOMMENDATIONS: Record<string, string[]> = {
  leinenhose: ['summer_loafer', 'penny_loafer', 'tassel_loafer', 'loafer', 'sneaker_minimal', 'derby'],
  // Ideal in heller, matter Ausführung (Wildleder/Leinen/Canvas), sockless oder unsichtbare Socke.
}
