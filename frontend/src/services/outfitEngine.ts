// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  SPEED-STIL-BERATER · OUTFIT-ENGINE  (v8.0 — Neuaufbau)                     ║
// ║                                                                            ║
// ║  Klar strukturierter 3-Schritt-Algorithmus:                                ║
// ║                                                                            ║
// ║   SCHRITT 1  Stil-Kontext   →  Bedarfsanalyse + Einstellungen liefern       ║
// ║                                bis zu 3 aktive Stile (resolveStyleContext)  ║
// ║   SCHRITT 2  Wissensdatenbank → Farb-, Stoff-, Muster-, Schuh-, Saison- und  ║
// ║                                Exemplar-Regeln (import aus ../data/*)        ║
// ║   SCHRITT 3  Generierung     →  Kombinationen bauen, harte Regeln prüfen,    ║
// ║                                kalibriert (0–1) bewerten, beste auswählen.   ║
// ║                                                                            ║
// ║  GARANTIE: Solange Oberteil + Hose + Schuh (oder Kleid + Schuh) existieren, ║
// ║  liefert die Engine IMMER mindestens ein Outfit. Weiche Regeln senken nur   ║
// ║  den Score, sie löschen niemals die ganze Garderobe.                        ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import type { ClothingItem, UserProfile } from '../db/index'
import type { ProfileRules } from './profileInterpreter'
import { interpretProfile, applySympatheticBonus } from './profileInterpreter'
import { CATEGORIES } from './styleTagger'
import { personalDelta, type PersonalAdjustments } from './personalLearning'

// ─── SCHRITT 2: Wissensdatenbank ─────────────────────────────────────────────
import { COLOUR_PAIRS, getColourFamily, analyzePalette, contrastTypeDelta } from '../data/colourPairs'
import { isFabricAntiPattern, getFabricPairScore, getSubcatWeight } from '../data/fabricRules'
import { PATTERN_MIX_MATRIX } from '../data/patternRules'
import { getFootwearFormalityPoint, shoeAnchorPenalty } from '../data/formalityScale'
import { exemplarMatch, antiExemplarMatch } from '../data/outfitExemplars'
import { seasonalConflict, seasonCoherence, seasonClassOf, shoeFabricTension } from '../data/seasonalFabric'
import { bibleColourScore, bibleTemplateBonus, bibleMonochromePenalty } from '../data/styleBibleScoring'
import { getSeasonalColourBonus, currentSeason, type Season } from '../data/seasonalRules'
import { ABSOLUTE_STYLE_BLOCKS, STYLE_COMBINATION_GUIDE } from '../data/stylePhilosophy'

// ════════════════════════════════════════════════════════════════════════════
//  KONSTANTEN
// ════════════════════════════════════════════════════════════════════════════

/**
 * Stil-Kompatibilitäts-Matrix (0–100). Diagonale = 100 (Reinform).
 * Wert < 45 = harter Stilbruch beim Mischen zweier Archetypen.
 * Alle 7 Archetypen sind vertreten (italian_elegance war früher vergessen).
 */
const STYLE_COMPAT: Record<string, Record<string, number>> = {
  old_money:           { old_money:100, british_countryside:62, english_gentleman:80, smart_casual:82, riviera:95, ivy_league:78, italian_elegance:90 },
  british_countryside: { old_money:62,  british_countryside:100, english_gentleman:55, smart_casual:68, riviera:30, ivy_league:60, italian_elegance:38 },
  english_gentleman:   { old_money:80,  british_countryside:55,  english_gentleman:100, smart_casual:58, riviera:42, ivy_league:65, italian_elegance:72 },
  smart_casual:        { old_money:82,  british_countryside:68,  english_gentleman:58, smart_casual:100, riviera:80, ivy_league:90, italian_elegance:80 },
  riviera:             { old_money:95,  british_countryside:30,  english_gentleman:42, smart_casual:80, riviera:100, ivy_league:70, italian_elegance:88 },
  ivy_league:          { old_money:78,  british_countryside:60,  english_gentleman:65, smart_casual:90, riviera:70, ivy_league:100, italian_elegance:72 },
  italian_elegance:    { old_money:90,  british_countryside:38,  english_gentleman:72, smart_casual:80, riviera:88, ivy_league:72, italian_elegance:100 },
}

const ALL_STYLES = Object.keys(STYLE_COMPAT)

/** Universalneutrale Farben — passen praktisch zu allem. */
const UNIVERSAL_NEUTRALS = new Set([
  'white','cream','ivory','beige','sand','grey','light grey','charcoal','anthracite','black','navy','midnight blue',
])

// Layering-Vokabular (für Kombinationsbau + harte Regeln)
const SHIRT_SUBCATS = new Set(['oxford_hemd','leinenhemd','flanellhemd'])
const COLLARED = new Set(['oxford_hemd','leinenhemd','flanellhemd'])
const PULLOVER_LAYERABLE = new Set(['strickpullover_rund','strickpullover_v','strickweste','troyer'])
const KNITWEAR_NEEDS_BASE = new Set(['strickpullover_rund','strickpullover_v','strickweste','troyer','rollkragen','strickjacke'])
const KNITWEAR_OUTERWEAR = new Set(['strickjacke'])
const SEASON_FLEXIBLE_OUTER = new Set(['wachsjacke','trenchcoat','harrington','field_jacket','gesteppte_weste'])
const CHUNKY_KNIT = new Set(['troyer','strickjacke'])
const TAILORING = new Set(['sakko','blazer','tweed_sakko'])
const SHORT_CASUAL_OUTER = new Set(['harrington','field_jacket','gesteppte_weste','wachsjacke'])
const STRUCTURED_OUTER = new Set(['blazer','sakko','tweed_sakko','peacoat','wollmantel','trenchcoat'])

const NEUTRAL_TSHIRT_COLORS = new Set(['white','cream','ivory','grey','light grey'])

const SHOE_SUBCATS = new Set([
  'chelsea_boot','brogue','loafer','penny_loafer','oxford_schuh','derby',
  'chukka_boot','monkstrap','sneaker_minimal','boots','summer_loafer','tassel_loafer',
])

// ════════════════════════════════════════════════════════════════════════════
//  SCHRITT 1: STIL-KONTEXT  (Bedarfsanalyse + Einstellungen)
// ════════════════════════════════════════════════════════════════════════════

export interface StyleContext {
  /** Bis zu 3 aktive Stil-Archetypen (aus Bedarfsanalyse ODER Einstellungen). */
  activeStyles: string[]
  occasion: string
  season?: string
  sprezzatura: boolean
  contrastType?: string
  rainPriority: boolean
  personalAdj?: PersonalAdjustments
}

/**
 * SCHRITT 1: Bestimmt den Stil-Kontext des Nutzers.
 * Priorität: (1) explizit gesetzte active_styles (Einstellungen / Bedarfsanalyse),
 * (2) Ableitung aus style_scores, (3) kein Stil-Zwang (rein ästhetisch).
 * Es werden maximal 3 Stile berücksichtigt — exakt wie in den Einstellungen wählbar.
 */
export function resolveStyleContext(
  profile: UserProfile | undefined,
  rules: ProfileRules,
  occasion: string,
  season: string | undefined,
  rainPriority: boolean,
  personalAdj: PersonalAdjustments | undefined,
): StyleContext {
  let active = (rules.active_styles?.length ? rules.active_styles : profile?.active_styles ?? [])
    .filter(s => ALL_STYLES.includes(s))

  // Fallback: aus style_scores ableiten (Top-Stile mit Affinität ≥ 55)
  if (!active.length && profile?.style_scores) {
    active = Object.entries(profile.style_scores)
      .filter(([s, v]) => ALL_STYLES.includes(s) && v >= 55)
      .sort((a, b) => b[1] - a[1])
      .map(([s]) => s)
  }

  return {
    activeStyles: active.slice(0, 3),              // maximal 3 Stile kombinierbar
    occasion,
    season,
    sprezzatura: profile?.sprezzatura_mode ?? rules.sprezzatura_mode ?? false,
    contrastType: profile?.contrast_type,
    rainPriority,
    personalAdj,
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  HILFSFUNKTIONEN (nutzen SCHRITT 2: Wissensdatenbank)
// ════════════════════════════════════════════════════════════════════════════

/** Formalität eines Items auf 1–5-Skala. */
function getFormality(item: ClothingItem): number {
  if (item.subcategory && CATEGORIES[item.subcategory]) return CATEGORIES[item.subcategory].formality
  if (item.category === 'shoes' && item.subcategory) {
    const fw = getFootwearFormalityPoint(item.subcategory)
    if (fw !== null) return fw / 2   // 1–10 → ~1–5
  }
  return ({ tops:2, bottoms:3, shoes:3, outerwear:3, accessories:3 } as Record<string, number>)[item.category] ?? 2
}

/** Dominante Stile eines Items (style_scores ≥ Schwelle). */
function dominantStyles(item: ClothingItem, threshold = 60): string[] {
  if (!item.style_scores) return []
  return Object.entries(item.style_scores).filter(([, s]) => s >= threshold).map(([a]) => a)
}

/** Gemeinsamer „Brücken"-Stil eines Outfits (für Notizen / Anzeige). */
export function findBridgeStyle(items: ClothingItem[]): string | null {
  if (items.length < 2) return null
  const sets = items.map(i => {
    const s = new Set<string>()
    if (i.primary_style) s.add(i.primary_style)
    for (const b of i.bridge_styles ?? []) s.add(b)
    for (const d of dominantStyles(i, 50)) s.add(d)
    return s
  })
  const counts: Record<string, number> = {}
  for (const set of sets) for (const s of set) counts[s] = (counts[s] ?? 0) + 1
  const best = Object.entries(counts).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1])
  return best.length ? best[0][0] : null
}

/** Dominante Archetypen des gesamten Outfits (für active_styles-Feld). */
export function getOutfitActiveStyles(items: ClothingItem[]): string[] {
  const counts: Record<string, number> = {}
  for (const it of items) {
    if (!it.style_scores) continue
    for (const [a, s] of Object.entries(it.style_scores)) if (s >= 60) counts[a] = (counts[a] ?? 0) + 1
  }
  return Object.entries(counts).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).map(([a]) => a).slice(0, 3)
}

// ─── Bewertungs-Bausteine (jeweils 0–1) ──────────────────────────────────────

/**
 * STIL-PASSUNG (0–1): zwei Aspekte kombiniert —
 *  (a) Ausrichtung: Wie stark sitzen die Teile in den gewählten Stilen des Nutzers?
 *  (b) Kohärenz:    Passen die Archetypen der Teile untereinander (Matrix)?
 */
function styleFitScore(items: ClothingItem[], ctx: StyleContext): number {
  const withScores = items.filter(i => i.style_scores && Object.keys(i.style_scores).length)

  // (a) Ausrichtung auf die gewählten Stile
  let alignment = 0.72
  if (ctx.activeStyles.length && withScores.length) {
    const perItem = withScores.map(i =>
      Math.max(...ctx.activeStyles.map(s => (i.style_scores![s] ?? 0))) / 100)
    alignment = perItem.reduce((a, b) => a + b, 0) / perItem.length
  }

  // (b) Innere Kohärenz über die Stil-Kompatibilitäts-Matrix
  let cohesion = 0.78
  const dom = withScores.map(i => dominantStyles(i, 60)).filter(d => d.length)
  if (dom.length >= 2) {
    const pairScores: number[] = []
    for (let i = 0; i < dom.length; i++) {
      for (let j = i + 1; j < dom.length; j++) {
        let best = 0
        for (const a of dom[i]) for (const b of dom[j]) {
          const key = [a, b].sort().join('|')
          if (ABSOLUTE_STYLE_BLOCKS.has(key)) { best = Math.max(best, 0); continue }
          const guide = STYLE_COMBINATION_GUIDE[key]
          if (guide && !guide.allowed) { best = Math.max(best, 10); continue }
          best = Math.max(best, STYLE_COMPAT[a]?.[b] ?? 55)
        }
        pairScores.push(best)
      }
    }
    if (pairScores.length) cohesion = (pairScores.reduce((a, b) => a + b, 0) / pairScores.length) / 100
  } else if (!withScores.length) {
    // Kein AI-Tagging vorhanden → Tag-Jaccard als Ersatz
    cohesion = tagCohesion(items)
  }

  return Math.max(0, Math.min(1, alignment * 0.6 + cohesion * 0.4))
}

function tagCohesion(items: ClothingItem[]): number {
  const scores: number[] = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = new Set(items[i].style_tags ?? []), b = new Set(items[j].style_tags ?? [])
      if (!a.size || !b.size) { scores.push(0.6); continue }
      let inter = 0; for (const t of a) if (b.has(t)) inter++
      scores.push(inter / (a.size + b.size - inter))
    }
  }
  return scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : 0.6
}

/** Score eines Farbpaares (0–1) aus der Wissensdatenbank, mit Neutral-Fallback. */
function colorPairScore(c1: string, c2: string): number {
  c1 = c1.toLowerCase(); c2 = c2.toLowerCase()
  const known = COLOUR_PAIRS[[c1, c2].sort().join('|')]
  if (known !== undefined) return known
  if (c1 === c2) return 0.78
  if (UNIVERSAL_NEUTRALS.has(c1) || UNIVERSAL_NEUTRALS.has(c2)) return 0.85
  const f1 = getColourFamily(c1), f2 = getColourFamily(c2)
  if (f1 && f1 === f2) return 0.72
  return 0.55
}

/** FARB-HARMONIE (0–1): Durchschnitt aller Farbpaare, leichte Strafe für zu viele Farben. */
function colorHarmonyScore(items: ClothingItem[]): number {
  const colors = items
    .flatMap(i => [i.color_primary, i.color_secondary].filter(Boolean) as string[])
    .map(c => c.toLowerCase())
  if (colors.length < 2) return 0.80

  const pairs: number[] = []
  for (let i = 0; i < colors.length; i++)
    for (let j = i + 1; j < colors.length; j++)
      pairs.push(colorPairScore(colors[i], colors[j]))
  const harmony = pairs.reduce((a, b) => a + b, 0) / pairs.length

  const distinct = new Set(items.map(i => (i.color_primary ?? '').toLowerCase()).filter(Boolean)).size
  const countPenalty = Math.max(0, (distinct - 3) * 0.10)
  const hasNeutral = colors.some(c => UNIVERSAL_NEUTRALS.has(c))
  return Math.max(0, Math.min(1, harmony - countPenalty + (hasNeutral ? 0.05 : 0)))
}

/** FORMALITÄTS-KOHÄRENZ (0–1): geringe Streuung der Formalität = hoher Score. */
function formalityCohesionScore(items: ClothingItem[]): number {
  const withBase = items.filter(i => i.formality_base != null)
  if (withBase.length >= 2) {
    const vals = withBase.map(i => i.formality_base!)
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    const sigma = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length)
    return Math.max(0, Math.min(1, (100 - sigma * 4) / 100))   // σ=25 → 0
  }
  const fs = items.map(getFormality)
  if (fs.length < 2) return 0.9
  const spread = Math.max(...fs) - Math.min(...fs)
  return ({ 0:1.0, 1:0.9, 2:0.75, 3:0.5, 4:0.25 } as Record<number, number>)[Math.min(spread, 4)] ?? 0.1
}

const OCCASION_TAGS: Record<string, string[]> = {
  office_formal:['formal','business','classic'], office_casual:['smart_casual','classic','formal'],
  social_events:['classic','smart_casual','old_money'], leisure:['casual','classic'],
  special_occasions:['formal','classic','old_money'], casual:['casual','classic'],
  formal:['formal','business','classic'], smart_casual:['smart_casual','classic','casual'],
  business_casual:['smart_casual','classic','formal'], british:['british','classic','old_money'],
}

/** ANLASS-PASSUNG (0–1). */
function occasionFitScore(items: ClothingItem[], occasion: string, rules: ProfileRules): number {
  const target = new Set(OCCASION_TAGS[occasion] ?? ['casual'])
  const tags = new Set(items.flatMap(i => i.style_tags ?? []))
  const overlap = [...tags].filter(t => target.has(t)).length / Math.max(target.size, 1)
  const primaryBonus = (rules.primary_occasions ?? []).includes(occasion) ? 0.10 : 0
  return Math.min(1, overlap * 0.6 + 0.4 + primaryBonus)
}

/** Frische (0–1): selten/nie getragene Teile bevorzugen. */
function freshnessScore(items: ClothingItem[]): number {
  const avgWorn = items.reduce((s, i) => s + (i.times_worn ?? 0), 0) / items.length
  const wornFactor = Math.max(0, 1 - avgWorn / 50)
  const days = items.filter(i => i.last_worn).map(i => (Date.now() - new Date(i.last_worn!).getTime()) / 86400000)
  if (!days.length) return wornFactor * 0.5 + 0.5
  const avgDays = days.reduce((a, b) => a + b, 0) / days.length
  return wornFactor * 0.5 + Math.min(1, avgDays / 21) * 0.5
}

// ─── Stoff-/Muster-/Saison-Modifikatoren (aus Wissensdatenbank, gedeckelt) ────

const SUBCAT_FABRIC_FAMILY: Record<string, string> = {
  tweed_sakko:'tweed', flanellhose:'flannel', flanellhemd:'flannel', wollhose:'flannel',
  anzughose:'worsted_wool', sakko:'worsted_wool', blazer:'worsted_wool', wollmantel:'worsted_wool',
  peacoat:'worsted_wool', dufflecoat:'worsted_wool', weste:'worsted_wool',
  strickpullover_rund:'cashmere', strickpullover_v:'cashmere', rollkragen:'cashmere',
  troyer:'cashmere', strickweste:'cashmere', strickjacke:'cashmere',
  oxford_hemd:'cotton', poloshirt:'cotton', chino:'cotton', t_shirt:'cotton',
  trenchcoat:'cotton', harrington:'cotton', field_jacket:'cotton',
  cord_hose:'corduroy', jeans_dunkel:'denim', leinenhemd:'linen', leinenhose:'linen',
  oxford_schuh:'leather', derby:'leather', brogue:'leather', loafer:'leather',
  penny_loafer:'leather', tassel_loafer:'leather', chelsea_boot:'leather', chukka_boot:'leather',
  monkstrap:'leather', boots:'leather', summer_loafer:'leather', guertel_leder:'leather',
  wachsjacke:'wax_cotton', sneaker_minimal:'synthetic', gesteppte_weste:'synthetic',
}

function fabricFamily(i: ClothingItem): string | null {
  return i.fabric_family ?? SUBCAT_FABRIC_FAMILY[i.subcategory ?? ''] ?? null
}

const PATTERN_NORMALIZE: Record<string, string> = {
  solid:'solid', subtle_texture:'herringbone', stripe:'stripe', fine_check:'check',
  houndstooth:'check', check:'check', plaid:'plaid', tweed:'tweed', dots:'dots',
  floral:'floral', paisley:'paisley', print:'print', geometric:'geometric',
}

function patternOf(i: ClothingItem): string {
  const raw = ((i.pattern_type ?? i.pattern ?? 'solid') as string).toLowerCase()
  return PATTERN_NORMALIZE[raw] ?? raw
}

/**
 * Modifikatoren aus der Wissensdatenbank — gedeckelt, damit der Score in [0,1] bleibt.
 * Liefert {delta, reasons}. delta wird in scoreOutfit auf [-0.30, +0.20] geklemmt.
 */
function knowledgeModifiers(items: ClothingItem[], ctx: StyleContext): { delta: number; reasons: string[] } {
  let delta = 0
  const reasons: string[] = []
  const primaryStyle = ctx.activeStyles[0] ?? getOutfitActiveStyles(items)[0] ?? null

  // Stoff: kanonische Paarung belohnen, weicher Konflikt bestrafen
  const fams = items.map(fabricFamily).filter(Boolean) as string[]
  let fSum = 0, fN = 0, soft = 0
  for (let i = 0; i < fams.length; i++) {
    for (let j = i + 1; j < fams.length; j++) {
      const s = getFabricPairScore(fams[i], fams[j]); if (s != null) { fSum += s; fN++ }
      const ap = isFabricAntiPattern(fams[i], fams[j]); if (ap?.severity === 'soft') soft++
    }
  }
  if (fN && fSum / fN >= 0.9) { delta += 0.04; reasons.push('Kanonische Stoffpaarung') }
  if (soft) { delta -= 0.04 * soft; reasons.push('Stoffe konkurrieren leicht') }

  // Muster-Konflikt (aus PATTERN_MIX_MATRIX)
  const pats = items.map(patternOf).filter(p => p !== 'solid' && p !== '')
  let patternClash = false
  for (let i = 0; i < pats.length && !patternClash; i++)
    for (let j = i + 1; j < pats.length; j++) {
      const mix = PATTERN_MIX_MATRIX[[pats[i], pats[j]].sort().join('|')]
      if (mix !== undefined && mix < 0.4) { patternClash = true; break }
    }
  if (patternClash) { delta -= 0.10; reasons.push('Muster konkurrieren') }
  else if (pats.length >= 2) { delta += 0.03; reasons.push('Muster-Mix gelungen') }

  // Gold-Exemplar (erlaubtes Referenz-Outfit) belohnen
  const ex = exemplarMatch(items, ctx.activeStyles)
  if (ex.score >= 0.75) { delta += Math.min(0.08, ex.score * 0.08); reasons.push(`Nähe zu Referenz-Outfit „${ex.name}"`) }

  // Paletten-Kontrast (Helligkeit) + persönlicher Kontrasttyp
  const palette = analyzePalette(items.map(i => i.color_primary ?? ''))
  delta += Math.max(-0.06, Math.min(0.06, palette.delta))
  if (palette.delta > 0) reasons.push(...palette.reasons.slice(0, 1))
  const ct = contrastTypeDelta(palette.valueContrast, ctx.contrastType)
  if (ct > 0) { delta += ct; reasons.push('Passt zu deinem Kontrasttyp') }

  // Stil-Bibeln: kanonische Farb-Combos / Tabus / Ton-in-Ton
  const bc = bibleColourScore(items, primaryStyle); if (bc.delta) { delta += bc.delta; if (bc.reason) reasons.push(bc.reason) }
  const bt = bibleTemplateBonus(items, primaryStyle); if (bt.bonus > 0) { delta += bt.bonus; if (bt.reason) reasons.push(bt.reason) }
  const bm = bibleMonochromePenalty(items); if (bm.penalty > 0) { delta -= bm.penalty; if (bm.reason) reasons.push(bm.reason) }

  // Schuh-Anker zu casual fürs Niveau
  const anchor = shoeAnchorPenalty(items); if (anchor > 0) { delta -= Math.min(0.10, anchor); reasons.push('Schuh zu casual fürs Outfit-Niveau') }

  // Schuhmaterial vs. Sommerstoff-Spannung
  const sft = shoeFabricTension(items); if (sft.penalty > 0) { delta -= Math.min(0.08, sft.penalty); if (sft.reason) reasons.push(sft.reason) }

  // Saisonale Farbwahl (eigene Dimension neben Stoff-Thermik)
  const season: Season = (ctx.season as Season) || currentSeason()
  let seasCol = 0
  for (const it of items) seasCol += getSeasonalColourBonus(it.color_primary ?? '', season)
  seasCol = Math.max(-0.05, Math.min(0.05, seasCol * 0.4))
  if (seasCol !== 0) { delta += seasCol; reasons.push(seasCol > 0 ? 'Saisonal stimmige Farben' : 'Farben unpassend zur Saison') }

  // Saison-Kohärenz der Stoffe
  if (seasonCoherence(items) === 'coherent') { delta += 0.02 }

  // Gürtel-Schuh-Farbabgleich
  delta -= beltShoePenalty(items)

  // Regen-Priorität: nicht-wetterfeste Teile leicht abwerten (kein Hard-Block)
  if (ctx.rainPriority) {
    const notWp = items.filter(i => !i.weatherproof).length
    if (notWp) delta -= Math.min(0.10, 0.05 * (notWp / items.length))
  }

  // Persönliche Lernschleife
  const personal = personalDelta(ctx.personalAdj, items)
  if (personal > 0.02) { delta += Math.min(0.06, personal); reasons.push('Ähnlich zu Outfits, die du gern trägst') }

  return { delta, reasons }
}

function beltShoePenalty(items: ClothingItem[]): number {
  const belt = items.find(i => i.subcategory === 'guertel_leder')
  const shoe = items.find(i => i.category === 'shoes')
  if (!belt || !shoe) return 0
  const bc = (belt.color_primary ?? '').toLowerCase(), sc = (shoe.color_primary ?? '').toLowerCase()
  if (!bc || !sc || bc === sc) return 0
  const bf = getColourFamily(bc), sf = getColourFamily(sc)
  if (bf && bf === sf) return 0
  const darkNeutral = new Set(['black','navy','charcoal','anthracite'])
  if (darkNeutral.has(bc) && darkNeutral.has(sc)) return 0
  return 0.10
}

// ════════════════════════════════════════════════════════════════════════════
//  KALIBRIERTER GESAMT-SCORE  (immer 0–1)
// ════════════════════════════════════════════════════════════════════════════

export interface ScoreBreakdown {
  style: number; color: number; formality: number; occasion: number; freshness: number
  total: number; reasons: string[]
}

function scoreOutfit(items: ClothingItem[], ctx: StyleContext, rules: ProfileRules): ScoreBreakdown {
  const style     = styleFitScore(items, ctx)
  const color     = colorHarmonyScore(items)
  const formality = formalityCohesionScore(items)
  const occasion  = occasionFitScore(items, ctx.occasion, rules)
  const freshness = freshnessScore(items)

  // Basis (gewichtet, jeweils 0–1 → Basis 0–1)
  const base = style * 0.40 + color * 0.30 + formality * 0.15 + occasion * 0.15

  // Modifikatoren aus der Wissensdatenbank (gedeckelt)
  const mod = knowledgeModifiers(items, ctx)
  const modClamped = Math.max(-0.30, Math.min(0.20, mod.delta + freshness * 0.04))

  // Strafe für vermiedene Farben (weich)
  let avoidPenalty = 0
  if (rules.avoided_colors?.length) {
    const avoid = new Set(rules.avoided_colors.map(c => c.toLowerCase()))
    const hits = items.filter(i => avoid.has((i.color_primary ?? '').toLowerCase())).length
    if (hits) avoidPenalty = Math.min(0.15, hits * 0.05)
  }

  const total = Math.max(0, Math.min(1, base + modClamped - avoidPenalty))
  return { style, color, formality, occasion, freshness, total, reasons: mod.reasons }
}

// ════════════════════════════════════════════════════════════════════════════
//  HARTE REGELN  (gestuft → erlauben Graceful Degradation)
//
//  Tier 0 (severe): wirklich „kaputt aussehende" Kombis — nie im Hauptpool.
//  Tier 1 (relaxable): Saisonbruch — wird nur gelockert, wenn sonst kein Outfit.
// ════════════════════════════════════════════════════════════════════════════

interface Violation { tier: 0 | 1 | null; reason?: string }

function hardViolation(items: ClothingItem[], activeStyles: string[]): Violation {
  const subs = new Set(items.map(i => i.subcategory ?? ''))

  // ── Tier 0: unwearable ────────────────────────────────────────────────────
  // Rollkragen ersetzt das Hemd — nie beides
  if (subs.has('rollkragen') && [...subs].some(s => COLLARED.has(s)))
    return { tier: 0, reason: 'Rollkragen + Hemd' }
  // Grobstrick unter Sakko bricht die Schulterlinie
  if ([...subs].some(s => TAILORING.has(s)) && [...subs].some(s => CHUNKY_KNIT.has(s)))
    return { tier: 0, reason: 'Grobstrick unter Sakko' }
  // Kurze Casual-Jacke über Sakko
  if ([...subs].some(s => TAILORING.has(s)) && [...subs].some(s => SHORT_CASUAL_OUTER.has(s)))
    return { tier: 0, reason: 'Kurze Jacke über Sakko' }
  // Poloshirt + Strick-Outerwear
  if (subs.has('poloshirt') && [...subs].some(s => KNITWEAR_OUTERWEAR.has(s)))
    return { tier: 0, reason: 'Poloshirt unter Strickjacke' }
  // Verbotenes Referenz-Outfit (Anti-Exemplar)
  const anti = antiExemplarMatch(items, activeStyles)
  if (anti.hit) return { tier: 0, reason: anti.name ?? 'Verbotene Kombination' }

  // ── Tier 1: Saisonbruch (lockerbar) ───────────────────────────────────────
  const sc = seasonalConflict(items)
  if (sc.conflict) return { tier: 1, reason: sc.reason ?? 'Saisonbruch' }

  return { tier: null }
}

// ════════════════════════════════════════════════════════════════════════════
//  SCHRITT 3a: ITEM-AUSWAHL  (weiche Filter — leeren nie eine Kategorie)
// ════════════════════════════════════════════════════════════════════════════

interface Buckets { tops: ClothingItem[]; bottoms: ClothingItem[]; shoes: ClothingItem[]; outerwear: ClothingItem[]; accessories: ClothingItem[]; dresses: ClothingItem[] }

function selectEligible(items: ClothingItem[], ctx: StyleContext, rules: ProfileRules, blacklist: Set<string>): ClothingItem[] {
  // Harte Ausschlüsse: nur inaktiv oder vom Nutzer auf die Blacklist gesetzt.
  let base = items.filter(i =>
    i.is_active &&
    !blacklist.has(i.category) &&
    !(i.subcategory && blacklist.has(i.subcategory)))

  // Saison: bevorzugt passend — aber nur filtern, solange die Kategorie nicht leer wird.
  if (ctx.season) {
    base = guardedFilter(base, i =>
      !i.season?.length ||
      SEASON_FLEXIBLE_OUTER.has(i.subcategory ?? '') ||
      i.season.includes(ctx.season!))
  }

  // Vermiedene Farben: ebenfalls nur, solange die Kategorie nicht leer wird.
  if (rules.avoided_colors?.length) {
    const avoid = new Set(rules.avoided_colors.map(c => c.toLowerCase()))
    base = guardedFilter(base, i => !avoid.has((i.color_primary ?? '').toLowerCase()))
  }

  return base
}

/**
 * Filtert pro Kategorie — behält aber mindestens ein Item je Kategorie,
 * damit weiche Filter niemals Oberteile/Hosen/Schuhe komplett entfernen.
 */
function guardedFilter(items: ClothingItem[], keep: (i: ClothingItem) => boolean): ClothingItem[] {
  const byCat: Record<string, ClothingItem[]> = {}
  for (const i of items) (byCat[i.category] ??= []).push(i)
  const out: ClothingItem[] = []
  for (const list of Object.values(byCat)) {
    const kept = list.filter(keep)
    out.push(...(kept.length ? kept : list))   // leer? → ganze Kategorie behalten
  }
  return out
}

function buildBuckets(eligible: ClothingItem[], ctx: StyleContext): Buckets {
  const b: Buckets = { tops:[], bottoms:[], shoes:[], outerwear:[], accessories:[], dresses:[] }
  for (const it of eligible) if (it.category in b) (b as any)[it.category].push(it)

  // Beste Items zuerst: Stil-Ausrichtung + Favorit
  const primary = ctx.activeStyles[0] ?? null
  const rank = (i: ClothingItem) =>
    (i.favorite ? 10 : 0) + (primary ? (i.style_scores?.[primary] ?? 0) / 10 : 0)
  for (const cat of Object.keys(b) as (keyof Buckets)[]) b[cat].sort((x, y) => rank(y) - rank(x))

  // Kombinatorische Explosion bremsen
  b.tops = b.tops.filter(t => (t.subcategory ?? '') !== 't_shirt').slice(0, 18)
  b.bottoms = b.bottoms.slice(0, 14)
  b.shoes = b.shoes.slice(0, 14)
  b.outerwear = b.outerwear.slice(0, 6)
  return b
}

// ════════════════════════════════════════════════════════════════════════════
//  SCHRITT 3b: KOMBINATIONEN BAUEN + BEWERTEN
// ════════════════════════════════════════════════════════════════════════════

interface Candidate {
  item_ids: number[]; combo: ClothingItem[]; base_layer_ids?: number[]
  hash: string; score: number; score_breakdown: ScoreBreakdown
  score_insight: string; score_reasons: string[]; notes: string
  active_styles: string[]; bridge_style?: string; occasion: string
  violationTier: 0 | 1 | null
}

export function computeOutfitHash(itemIds: number[]): string {
  return [...itemIds].sort((a, b) => a - b).join('|')
}

function buildScoreInsight(b: ScoreBreakdown): string {
  const dims: [string, number][] = [
    ['Farbharmonie', b.color], ['Stilkonsistenz', b.style],
    ['Anlasspassung', b.occasion], ['Formalität', b.formality],
  ]
  const top = dims.sort((a, c) => c[1] - a[1])[0]
  return top[1] >= 0.80 ? `${top[0]} ✦` : ''
}

function notes(combo: ClothingItem[]): string {
  const named = combo.filter(i => i.category !== 'accessories').slice(0, 4)
  const parts = named.map(i => `${i.color_primary} ${(i.subcategory ?? i.category).replace(/_/g, ' ')}`)
  const bridge = findBridgeStyle(combo)
  const label = bridge ? ` — ${bridge.replace(/_/g, ' ')}` : ''
  return parts.join(' + ') + label
}

function makeCandidate(
  combo: ClothingItem[], baseLayerIds: number[], ctx: StyleContext, rules: ProfileRules,
): Candidate {
  const item_ids = combo.map(i => i.id!).filter(id => id != null)
  // versteckte Base-Layer (z. B. T-Shirt unter Strick) in item_ids aufnehmen
  for (const id of baseLayerIds) if (!item_ids.includes(id)) item_ids.push(id)

  const breakdown = scoreOutfit(combo, ctx, rules)
  const v = hardViolation(combo, ctx.activeStyles)
  return {
    item_ids,
    combo,
    base_layer_ids: baseLayerIds.length ? baseLayerIds : undefined,
    hash: computeOutfitHash(item_ids),
    score: breakdown.total,
    score_breakdown: breakdown,
    score_insight: buildScoreInsight(breakdown),
    score_reasons: breakdown.reasons,
    notes: notes(combo),
    active_styles: getOutfitActiveStyles(combo),
    bridge_style: findBridgeStyle(combo) ?? undefined,
    occasion: ctx.occasion,
    violationTier: v.tier,
  }
}

function bestAccessory(accessories: ClothingItem[], combo: ClothingItem[], primary: string | null): ClothingItem | null {
  if (!accessories.length) return null
  const scored = accessories
    .map(a => ({ a, s: primary ? (a.style_scores?.[primary] ?? 30) : 30 }))
    .sort((x, y) => y.s - x.s)
  return scored[0].s >= 40 ? scored[0].a : null
}

function generateCandidates(b: Buckets, ctx: StyleContext, rules: ProfileRules, tshirts: ClothingItem[]): Candidate[] {
  const out: Candidate[] = []
  const useOuter = rules.structure_preference !== 'minimal' && b.outerwear.length > 0
  const useAccessory = ['structured','durchdacht','balanced','ausgewogen'].includes(rules.structure_preference)
  const primary = ctx.activeStyles[0] ?? null

  const baseLayerFor = (top: ClothingItem): number[] => {
    if (KNITWEAR_NEEDS_BASE.has(top.subcategory ?? '') && tshirts.length && tshirts[0].id != null)
      return [tshirts[0].id]
    return []
  }

  const outerVariants = (core: ClothingItem[]): Array<ClothingItem | null> => {
    const variants: Array<ClothingItem | null> = [null]
    if (useOuter) for (const o of b.outerwear) {
      // Volumen-/Längenregeln werden in hardViolation geprüft — hier nur grobe Formalität
      if (Math.abs(getFormality(o) - avg(core.map(getFormality))) <= 2.2) variants.push(o)
    }
    return variants
  }

  const assemble = (core: ClothingItem[], top: ClothingItem) => {
    for (const outer of outerVariants(core)) {
      const combo = outer ? [...core, outer] : [...core]
      if (useAccessory && b.accessories.length) {
        const acc = bestAccessory(b.accessories, combo, primary)
        if (acc) combo.push(acc)
      }
      out.push(makeCandidate(combo, baseLayerFor(top), ctx, rules))
    }
  }

  // Strategie 1: Oberteil + Hose + Schuh
  for (const top of b.tops)
    for (const bottom of b.bottoms)
      for (const shoe of b.shoes)
        assemble([top, bottom, shoe], top)

  // Strategie 2: Hemd unter Pullover + Hose + Schuh (sichtbares Layering)
  const shirts = b.tops.filter(t => SHIRT_SUBCATS.has(t.subcategory ?? ''))
  const pullovers = b.tops.filter(t => PULLOVER_LAYERABLE.has(t.subcategory ?? ''))
  for (const shirt of shirts)
    for (const pull of pullovers)
      for (const bottom of b.bottoms)
        for (const shoe of b.shoes) {
          const core = [shirt, pull, bottom, shoe]
          for (const outer of outerVariants(core)) {
            const combo = outer ? [...core, outer] : [...core]
            if (useAccessory && b.accessories.length) {
              const acc = bestAccessory(b.accessories, combo, primary)
              if (acc) combo.push(acc)
            }
            const c = makeCandidate(combo, [], ctx, rules)
            c.base_layer_ids = [shirt.id!]
            out.push(c)
          }
        }

  // Strategie 3: Kleid + Schuh
  for (const dress of b.dresses)
    for (const shoe of b.shoes)
      out.push(makeCandidate([dress, shoe], [], ctx, rules))

  return out
}

function avg(xs: number[]): number { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0 }

// ════════════════════════════════════════════════════════════════════════════
//  SCHRITT 3c: AUSWAHL  (Dedup → Diversität → garantierter Fallback)
// ════════════════════════════════════════════════════════════════════════════

function deduplicate(cands: Candidate[]): Candidate[] {
  const seen = new Set<string>()
  return cands.filter(c => { if (seen.has(c.hash)) return false; seen.add(c.hash); return true })
}

/**
 * Greedy-Diversität: wählt nacheinander aus, bestraft Wiederverwendung von Items
 * (besonders Schuhe), damit alle Teile rotieren statt immer derselben Top-Kombo.
 */
export function selectDiverse(source: any[], n: number, allItems?: ClothingItem[]): any[] {
  if (!source.length) return []
  const subcatOf: Record<number, string> = {}
  if (allItems) for (const i of allItems) if (i.id != null) subcatOf[i.id] = i.subcategory ?? ''

  const selected: any[] = []
  const remaining = source.slice()
  const used: Record<number, number> = {}
  const shoeUsed: Record<number, number> = {}
  const limit = Math.min(n, source.length)

  while (selected.length < limit && remaining.length) {
    let best = -Infinity, bestIdx = 0
    for (let i = 0; i < remaining.length; i++) {
      const ids: number[] = remaining[i].item_ids
      const penalty = ids.reduce((sum, id) => {
        const isShoe = SHOE_SUBCATS.has(subcatOf[id] ?? '')
        return sum + (used[id] ?? 0) * 0.15 + (isShoe ? (shoeUsed[id] ?? 0) * 0.30 : 0)
      }, 0)
      const adjusted = remaining[i].score - penalty
      if (adjusted > best) { best = adjusted; bestIdx = i }
    }
    const chosen = remaining.splice(bestIdx, 1)[0]
    selected.push(chosen)
    for (const id of chosen.item_ids as number[]) {
      used[id] = (used[id] ?? 0) + 1
      if (SHOE_SUBCATS.has(subcatOf[id] ?? '')) shoeUsed[id] = (shoeUsed[id] ?? 0) + 1
    }
  }
  return selected
}

// ════════════════════════════════════════════════════════════════════════════
//  HAUPT-GENERATOR  (orchestriert SCHRITT 1 → 2 → 3)
// ════════════════════════════════════════════════════════════════════════════

export function generateOutfits(
  items: ClothingItem[],
  occasion = 'casual',
  season?: string,
  maxOutfits = 6,
  profile?: UserProfile,
  rules?: ProfileRules,
  recentlyWornSignatures?: string[],
  occasionContext?: string,           // beibehalten für API-Kompatibilität
  rainPriority?: boolean,
  degradationRef?: { level: 0 | 1 | 2 | 3 },
  personalAdj?: PersonalAdjustments,
): any[] {
  void occasionContext
  if (!items.length) return []

  // ── SCHRITT 1: Regeln + Stil-Kontext ───────────────────────────────────────
  if (!rules) rules = profile ? interpretProfile(profile) : defaultRules(maxOutfits)
  const ctx = resolveStyleContext(profile, rules, occasion, season, rainPriority ?? false, personalAdj)
  if (profile) maxOutfits = Math.max(maxOutfits, rules.max_outfits)

  const blacklist = new Set(profile?.blacklist_categories ?? [])

  // ── SCHRITT 3a: Item-Auswahl (leert nie eine Kategorie) ─────────────────────
  const eligible = selectEligible(items, ctx, rules, blacklist)

  // Sympathie-Bonus (ähnliche Items wie Favoriten) — fließt über favorite-Ranking ein
  const sympathetic: Record<number, number> = {}
  for (const fav of eligible.filter(i => i.favorite && i.id != null))
    for (const { item_id, bonus } of applySympatheticBonus(fav, eligible))
      sympathetic[item_id] = (sympathetic[item_id] ?? 0) + bonus

  const buckets = buildBuckets(eligible, ctx)

  // Schuhe sind zwingend — falls Auswahl leer, aus allen aktiven Schuhen auffüllen
  if (!buckets.shoes.length)
    buckets.shoes = items.filter(i => i.is_active && i.category === 'shoes' && !blacklist.has('shoes')).slice(0, 14)

  // T-Shirt-Pool als unsichtbarer Base-Layer (neutrale Farben + Favoriten zuerst)
  const tshirts = items
    .filter(i => i.is_active && i.category === 'tops' && i.subcategory === 't_shirt' && !blacklist.has('tops'))
    .sort((a, b) => {
      const na = NEUTRAL_TSHIRT_COLORS.has((a.color_primary ?? '').toLowerCase()) ? 1 : 0
      const nb = NEUTRAL_TSHIRT_COLORS.has((b.color_primary ?? '').toLowerCase()) ? 1 : 0
      return ((b.favorite ? 2 : 0) + nb) - ((a.favorite ? 2 : 0) + na)
    })
    .slice(0, 5)

  // ── SCHRITT 3b: Kandidaten bauen + bewerten ─────────────────────────────────
  let candidates = deduplicate(generateCandidates(buckets, ctx, rules, tshirts))
  if (!candidates.length) { if (degradationRef) degradationRef.level = 3; return [] }

  // Kürzlich getragene Outfits abwerten
  const worn = new Set(recentlyWornSignatures ?? [])
  if (worn.size) for (const c of candidates) {
    if (worn.has([...c.item_ids].sort().join(','))) c.score = Math.max(0, c.score - 0.30)
  }

  // ── SCHRITT 3c: gestufte Auswahl — IMMER nicht-leer ─────────────────────────
  const clean = candidates.filter(c => c.violationTier === null).sort((a, b) => b.score - a.score)
  const seasonRelax = candidates.filter(c => c.violationTier === 1).sort((a, b) => b.score - a.score)
  const severe = candidates.filter(c => c.violationTier === 0).sort((a, b) => b.score - a.score)

  let pool = clean
  let degradation: 0 | 1 | 2 | 3 = 0
  const need = Math.min(maxOutfits, 4)

  if (pool.length < need) {                 // Saison-Regel lockern
    pool = [...clean, ...seasonRelax]
    degradation = clean.length ? 1 : 2
  }
  if (!pool.length) {                       // letzter Ausweg: auch „kaputte" Kombis
    pool = severe
    degradation = 3
  }
  if (degradationRef) degradationRef.level = Math.max(degradationRef.level, degradation) as 0 | 1 | 2 | 3

  return selectDiverse(pool, maxOutfits, items)
}

function defaultRules(maxOutfits: number): ProfileRules {
  return {
    required_tags: [], forbidden_tags: [], preferred_tags: [], avoided_colors: [],
    preferred_color_families: [], allowed_patterns: [], preferred_fits: [],
    weight_color: 0.30, weight_style: 0.40, weight_occasion: 0.15, weight_freshness: 0.05, weight_formality: 0.15,
    occasion_weights: {}, primary_occasions: [], combination_boldness: 3, structure_preference: 'balanced',
    max_outfits: maxOutfits, sprezzatura_mode: false, active_styles: [], min_score_threshold: 0.55,
    formality_floor: 0, modern_office: false,
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  WETTER-KLASSIFIZIERUNG  (von OutfitCard / OutfitsPage genutzt)
// ════════════════════════════════════════════════════════════════════════════

const SUMMER_SUBCATS_WT = new Set(['leinenhemd','poloshirt','leinenhose','t_shirt'])
const WINTER_KNIT_WT = new Set(['strickpullover_rund','strickpullover_v','rollkragen','flanellhose','weste'])
const HEAVY_OUTER_WT = new Set(['wollmantel','peacoat'])
const SPRING_OUTER_WT = new Set(['trenchcoat'])

export type WeatherTag = 'kalt' | 'kuehl' | 'mild' | 'warm' | 'heiss' | 'regen' | 'sonnig'

export function computeOutfitWeatherTags(
  outfitItems: { subcategory?: string; category: string; season?: string[] }[],
): WeatherTag[] {
  if (!outfitItems.length) return ['mild']
  const has = (set: Set<string>) => outfitItems.some(i => set.has(i.subcategory ?? ''))
  const hasOuter = outfitItems.some(i => i.category === 'outerwear')
  const tags = new Set<WeatherTag>()

  if (has(HEAVY_OUTER_WT)) { tags.add('kalt'); tags.add('kuehl') }
  else if (has(SPRING_OUTER_WT)) { tags.add('kuehl'); tags.add('mild') }
  else if (has(WINTER_KNIT_WT)) { tags.add('kuehl'); tags.add('mild') }
  else if (has(SUMMER_SUBCATS_WT)) { tags.add('warm'); tags.add('heiss'); tags.add('mild'); tags.add('sonnig') }
  else { tags.add('mild'); tags.add('kuehl'); tags.add('warm') }

  if (hasOuter) tags.add('regen')
  if (!has(HEAVY_OUTER_WT) && !has(WINTER_KNIT_WT)) tags.add('sonnig')
  return [...tags]
}

// ════════════════════════════════════════════════════════════════════════════
//  GARDEROBEN-LÜCKEN  (von OutfitsPage genutzt)
// ════════════════════════════════════════════════════════════════════════════

export interface WardrobeGap {
  category: string; subcategory: string; displayName: string; forStyle: string
  blockedOutfitCount: number; reason: string
}

const STYLE_KEY_PIECES: Record<string, Array<{ subcategory: string; displayName: string; category: string }>> = {
  old_money: [
    { subcategory:'rollkragen', displayName:'Rollkragenpullover', category:'tops' },
    { subcategory:'flanellhose', displayName:'Flanellhose', category:'bottoms' },
    { subcategory:'loafer', displayName:'Loafer', category:'shoes' },
    { subcategory:'wollmantel', displayName:'Wollmantel', category:'outerwear' },
  ],
  british_countryside: [
    { subcategory:'tweed_sakko', displayName:'Tweed-Sakko', category:'outerwear' },
    { subcategory:'brogue', displayName:'Brogue', category:'shoes' },
    { subcategory:'cord_hose', displayName:'Cordhose', category:'bottoms' },
    { subcategory:'wachsjacke', displayName:'Wachsjacke', category:'outerwear' },
  ],
  ivy_league: [
    { subcategory:'oxford_hemd', displayName:'Oxford-Hemd', category:'tops' },
    { subcategory:'chino', displayName:'Chino', category:'bottoms' },
    { subcategory:'penny_loafer', displayName:'Penny Loafer', category:'shoes' },
    { subcategory:'blazer', displayName:'Navy Blazer', category:'outerwear' },
  ],
  english_gentleman: [
    { subcategory:'anzughose', displayName:'Anzughose', category:'bottoms' },
    { subcategory:'oxford_schuh', displayName:'Oxford-Schuh', category:'shoes' },
    { subcategory:'krawatte', displayName:'Krawatte', category:'accessories' },
  ],
  smart_casual: [
    { subcategory:'jeans_dunkel', displayName:'Selvedge-Jeans', category:'bottoms' },
    { subcategory:'chelsea_boot', displayName:'Chelsea Boot', category:'shoes' },
    { subcategory:'oxford_hemd', displayName:'Oxford-Hemd', category:'tops' },
  ],
  riviera: [
    { subcategory:'leinenhose', displayName:'Leinenhose', category:'bottoms' },
    { subcategory:'loafer', displayName:'Loafer', category:'shoes' },
    { subcategory:'leinenhemd', displayName:'Leinenhemd', category:'tops' },
  ],
  italian_elegance: [
    { subcategory:'sakko', displayName:'Sakko', category:'outerwear' },
    { subcategory:'loafer', displayName:'Loafer', category:'shoes' },
    { subcategory:'leinenhose', displayName:'Leinenhose', category:'bottoms' },
  ],
}

export function analyzeWardrobeGaps(items: ClothingItem[], activeStyles: string[]): WardrobeGap[] {
  const existing = new Set(items.filter(i => i.is_active).map(i => i.subcategory).filter(Boolean))
  const styles = activeStyles.length ? activeStyles : Object.keys(STYLE_KEY_PIECES)
  const gaps: WardrobeGap[] = []
  for (const style of styles) {
    for (const piece of STYLE_KEY_PIECES[style] ?? []) {
      if (existing.has(piece.subcategory)) continue
      const others = ['tops','bottoms','shoes','outerwear'].filter(c => c !== piece.category)
      const compatible = items.filter(i => i.is_active && others.includes(i.category) && (i.style_scores?.[style] ?? 0) >= 60)
      gaps.push({
        category: piece.category, subcategory: piece.subcategory, displayName: piece.displayName,
        forStyle: style, blockedOutfitCount: Math.min(12, Math.max(1, Math.floor(compatible.length * 0.8))),
        reason: `Fehlendes Key-Piece für ${style.replace(/_/g, ' ')}`,
      })
    }
  }
  const seen = new Set<string>()
  return gaps
    .sort((a, b) => b.blockedOutfitCount - a.blockedOutfitCount)
    .filter(g => { if (seen.has(g.subcategory)) return false; seen.add(g.subcategory); return true })
    .slice(0, 10)
}

// ════════════════════════════════════════════════════════════════════════════
//  CAPSULE-ANALYSE  (von api.ts genutzt)
// ════════════════════════════════════════════════════════════════════════════

export interface CapsuleItem { item: ClothingItem; outfitCount: number; versatilityScore: number }

export function analyzeCapsule(
  items: ClothingItem[],
  topOutfits: { item_ids: number[]; score: number }[],
  topN = 8,
): CapsuleItem[] {
  if (!items.length || !topOutfits.length) return []
  const counts: Record<number, number> = {}
  for (const o of topOutfits) for (const id of o.item_ids ?? []) counts[id] = (counts[id] ?? 0) + 1
  return items
    .filter(i => i.id != null && (counts[i.id!] ?? 0) > 0)
    .map(i => ({
      item: i, outfitCount: counts[i.id!] ?? 0,
      versatilityScore: Math.min(1, (counts[i.id!] ?? 0) / Math.max(topOutfits.length, 1)),
    }))
    .sort((a, b) => b.outfitCount - a.outfitCount || b.versatilityScore - a.versatilityScore)
    .slice(0, topN)
}
