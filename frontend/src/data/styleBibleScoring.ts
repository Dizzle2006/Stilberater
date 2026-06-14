// ─────────────────────────────────────────────────────────────────────────────
// styleBibleScoring.ts — macht die 7 Stil-Bibeln (styleBibles.ts) für die
// Scoring-Engine NUTZBAR. Vorher waren colour_combos, outfit_templates und
// anti_patterns reines Wissen ohne Wirkung (nur als Kommentar referenziert).
//
// Hier werden die frei formulierten Bibel-Strings einmalig beim Laden in
// strukturierte Signale geparst (Farb-Buckets + Struktur-Flags) und als reine
// Funktionen exportiert, die in computeBlueprintModifiers eingehängt werden.
//
// Granularität: Farben werden auf "Ton-Buckets" gemappt (navy, camel, brown …),
// damit ein Bibel-Combo wie „Navy blazer + camel chino" auch dann greift, wenn
// das Item-Farbwort „tan" statt „camel" ist. Tabus (brown+black, navy+black)
// bleiben über getrennte Buckets erkennbar.
// ─────────────────────────────────────────────────────────────────────────────

import { STYLE_BIBLES } from './styleBibles'
import type { ClothingItem } from '../db/index'

// ─── Ton-Buckets ─────────────────────────────────────────────────────────────
// Phrasen je Bucket; Match per Substring, längste Phrase zuerst.
const COLOUR_BUCKETS: Record<string, string[]> = {
  navy:       ['navy', 'midnight blue', 'dark blue', 'denim blue'],
  blue_light: ['sky blue', 'pale blue', 'light blue', 'cobalt', 'mid blue', 'powder blue'],
  white:      ['off-white', 'white', 'ivory', 'cream', 'ecru', 'chalk', 'oatmeal'],
  grey:       ['mid-grey', 'light grey', 'charcoal', 'anthracite', 'slate blue', 'slate', 'grey', 'gray'],
  black:      ['black'],
  camel:      ['camel', 'dark tan', 'warm beige', 'beige', 'sand', 'stone', 'biscuit', 'buff', 'fawn', 'khaki', 'tan', 'taupe', 'mushroom'],
  brown:      ['chocolate brown', 'cigar brown', 'bracken brown', 'dark brown', 'tobacco', 'brown', 'umber', 'bark', 'cordovan', 'chestnut'],
  green:      ['forest green', 'hunter green', 'moss green', 'bottle green', 'kelly green', 'olive', 'sage', 'heather'],
  burgundy:   ['burgundy', 'bordeaux', 'oxblood', 'wine', 'maroon', 'aubergine'],
  warm_acc:   ['terracotta', 'rust', 'ochre', 'mustard', 'saffron', 'coral', 'amber', 'pale yellow', 'yellow', 'gold', 'orange'],
  pink:       ['dusty rose', 'pale pink', 'blush', 'pink', 'lavender grey', 'lavender'],
}

const ALL_PHRASES: Array<[string, string]> = (() => {
  const list: Array<[string, string]> = []
  for (const [bucket, phrases] of Object.entries(COLOUR_BUCKETS)) {
    for (const p of phrases) list.push([p, bucket])
  }
  // längste Phrase zuerst, damit "forest green" vor "green", "mid-grey" vor "grey" greift
  return list.sort((a, b) => b[0].length - a[0].length)
})()

export function bucketOf(colour: string | undefined | null): string | null {
  if (!colour) return null
  const c = colour.toLowerCase()
  for (const [phrase, bucket] of ALL_PHRASES) {
    if (c.includes(phrase)) return bucket
  }
  return null
}

// Buckets in einem frei formulierten Bibel-String (Reihenfolge, dedupliziert)
function parseBuckets(text: string): string[] {
  const c = ' ' + text.toLowerCase() + ' '
  const found: Array<[number, string]> = []
  for (const [phrase, bucket] of ALL_PHRASES) {
    const idx = c.indexOf(phrase)
    if (idx >= 0) found.push([idx, bucket])
  }
  found.sort((a, b) => a[0] - b[0])
  const out: string[] = []
  for (const [, b] of found) if (!out.includes(b)) out.push(b)
  return out
}

// ─── Struktur-Signal (für Template-Matching) ─────────────────────────────────
const STRUCTURE_WORDS = ['blazer', 'suit', 'sports jacket', 'sport coat', 'sportcoat', 'jacket', 'overcoat', 'coat', 'waistcoat', '3-piece']
const TAILORED_SUBCATS = new Set([
  'sakko', 'blazer', 'tweed_sakko', 'wollmantel', 'peacoat', 'dufflecoat',
  'trenchcoat', 'wachsjacke', 'harrington', 'field_jacket', 'weste', 'gesteppte_weste',
])
function hasStructureSignal(items: ClothingItem[]): boolean {
  return items.some(i => i.category === 'outerwear' || TAILORED_SUBCATS.has(i.subcategory ?? ''))
}

// ─── Vorparsen aller Bibeln (einmalig) ───────────────────────────────────────
interface ParsedCombo    { buckets: string[]; score: number }
interface ParsedTemplate { buckets: string[]; needsStructure: boolean; name: string }
interface ParsedBible    { combos: ParsedCombo[]; templates: ParsedTemplate[] }

const BIBLE_PARSED: Record<string, ParsedBible> = (() => {
  const out: Record<string, ParsedBible> = {}
  for (const [id, bible] of Object.entries(STYLE_BIBLES)) {
    const combos: ParsedCombo[] = []
    for (const c of bible.colour_combos) {
      const buckets = parseBuckets(c.combo)
      if (buckets.length >= 1) combos.push({ buckets, score: c.score })
    }
    const templates: ParsedTemplate[] = []
    for (const t of bible.outfit_templates) {
      const buckets = parseBuckets(t.formula)
      const f = t.formula.toLowerCase()
      const needsStructure = STRUCTURE_WORDS.some(w => f.includes(w))
      if (buckets.length >= 2) templates.push({ buckets, needsStructure, name: t.name })
    }
    out[id] = { combos, templates }
  }
  return out
})()

// Outfit → Set seiner Ton-Buckets (aus color_primary)
function outfitBuckets(items: ClothingItem[]): Set<string> {
  const s = new Set<string>()
  for (const i of items) {
    const b = bucketOf(i.color_primary)
    if (b) s.add(b)
  }
  return s
}

// ─── Export 1: Bibel-Farbcombo-Score ─────────────────────────────────────────
// Belohnt kanonische Archetyp-Combos, bestraft archetyp-spezifische Tabus
// (z.B. Old Money „Brown + black" 0.05, „Navy + black" 0.25).
export function bibleColourScore(
  items: ClothingItem[],
  archetype: string | null,
): { delta: number; reason: string | null } {
  if (!archetype) return { delta: 0, reason: null }
  const parsed = BIBLE_PARSED[archetype]
  if (!parsed) return { delta: 0, reason: null }

  const buckets = outfitBuckets(items)
  if (buckets.size < 2) return { delta: 0, reason: null }

  let best = -1, worst = 2
  let bestApplies = false
  for (const combo of parsed.combos) {
    // Combo greift, wenn ALLE seine Buckets im Outfit vorkommen
    if (combo.buckets.every(b => buckets.has(b))) {
      bestApplies = true
      if (combo.score > best) best = combo.score
      if (combo.score < worst) worst = combo.score
    }
  }
  if (!bestApplies) return { delta: 0, reason: null }

  // Tabu hat Vorrang vor Bonus (eine schlechte Paarung verdirbt das Outfit)
  if (worst <= 0.35) {
    const penalty = Math.min(0.18, (0.5 - worst) * 0.4)
    return { delta: -penalty, reason: `Bibel-Tabu (${archetype}): vermiedene Farbpaarung` }
  }
  if (best >= 0.85) {
    const bonus = Math.min(0.06, (best - 0.85) * 0.4)
    return { delta: +bonus, reason: 'Kanonische Stil-Bibel-Farbkombination' }
  }
  return { delta: 0, reason: null }
}

// ─── Export 2: Bibel-Template-Bonus (formelgetrieben) ────────────────────────
// Ersetzt die alte Pauschal-Heuristik durch echtes Abgleichen mit den
// kanonischen Outfit-Formeln des aktiven Archetyps.
export function bibleTemplateBonus(
  items: ClothingItem[],
  archetype: string | null,
): { bonus: number; reason: string | null } {
  if (!archetype) return { bonus: 0, reason: null }
  const parsed = BIBLE_PARSED[archetype]
  if (!parsed || !parsed.templates.length) return { bonus: 0, reason: null }

  const buckets = outfitBuckets(items)
  if (!buckets.size) return { bonus: 0, reason: null }
  const struct = hasStructureSignal(items)

  let bestRatio = 0
  let bestName: string | null = null
  for (const t of parsed.templates) {
    if (t.needsStructure && !struct) continue
    const core = t.buckets.slice(0, 3)            // erste 3 Farben = Kern der Formel
    const hit = core.filter(b => buckets.has(b)).length
    const ratio = hit / core.length
    if (ratio > bestRatio) { bestRatio = ratio; bestName = t.name }
  }

  if (bestRatio >= 0.75) {
    const bonus = Math.min(0.10, 0.10 * bestRatio)
    return { bonus, reason: bestName ? `Folgt der Stil-Formel „${bestName}"` : 'Folgt einer kanonischen Stil-Formel' }
  }
  return { bonus: 0, reason: null }
}

// ─── Export 3: Monochrom-Blob-Strafe ─────────────────────────────────────────
// Bibel-Anti-Pattern „Camel coat + camel trouser + camel shoe" / „cream+ivory+
// stone" — Ton-in-Ton über Oben+Unten+Schuh ohne Trennung wirkt wie Kostüm.
export function bibleMonochromePenalty(
  items: ClothingItem[],
): { penalty: number; reason: string | null } {
  const core = items.filter(i => i.category === 'tops' || i.category === 'bottoms' || i.category === 'shoes')
  if (core.length < 3) return { penalty: 0, reason: null }
  const buckets = core.map(i => bucketOf(i.color_primary)).filter(Boolean) as string[]
  if (buckets.length < 3) return { penalty: 0, reason: null }
  const uniq = new Set(buckets)
  // Nur warme Neutraltöne als "Blob" werten (camel/white/grey) — dort ist Ton-in-Ton riskant
  const blobBuckets = new Set(['camel', 'white', 'grey'])
  if (uniq.size === 1 && blobBuckets.has([...uniq][0])) {
    return { penalty: 0.06, reason: 'Ton-in-Ton ohne Trennung (Bibel-Anti-Pattern)' }
  }
  return { penalty: 0, reason: null }
}
