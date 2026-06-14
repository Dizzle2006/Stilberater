// StyleAdvisor v5.1 (#10) — Persönliche Lernschleife
// Globale Stilregeln bleiben fix; persönliche Präferenzen lernen darüber.
// Signale: getragene/favorisierte Outfits (+), negatives Feedback (−).
// Lernziel: Farbpaar- und Subkategorie-Paar-Deltas, gekappt auf ±0.05,
// damit die klassische Regelbasis nie überstimmt wird.

import { db } from '../db/index'

export interface PersonalAdjustments {
  colorPairDelta: Record<string, number>     // key: 'a|b' sortiert
  subcatPairDelta: Record<string, number>    // key: 'a|b' sortiert
  sampleSize: number
}

const MAX_DELTA = 0.05
const POSITIVE_STEP = 0.012   // pro Trage-/Favoriten-Signal
const NEGATIVE_STEP = 0.018   // negatives Feedback wiegt schwerer

function pairKey(a: string, b: string): string {
  return [a.toLowerCase(), b.toLowerCase()].sort().join('|')
}

function clamp(v: number): number {
  return Math.max(-MAX_DELTA, Math.min(MAX_DELTA, v))
}

/**
 * Berechnet persönliche Anpassungen aus der Outfit-Historie + Feedback.
 * Bayesianisch im Geiste: jedes Signal verschiebt die Paar-Priors leicht;
 * wiederholte Signale akkumulieren bis zur Kappung.
 */
export async function computePersonalAdjustments(): Promise<PersonalAdjustments> {
  const colorPairDelta: Record<string, number> = {}
  const subcatPairDelta: Record<string, number> = {}
  let sampleSize = 0

  try {
    const outfits = await db.outfits.toArray()
    const items = await db.clothing_items.toArray()
    const itemById = new Map(items.map(i => [i.id!, i]))

    // ── Positive Signale: getragene + favorisierte Outfits ──────────────────
    for (const outfit of outfits) {
      const weight = (outfit.times_worn ?? 0) + (outfit.is_favourite ? 2 : 0)
      if (weight <= 0) continue
      sampleSize++
      const its = (outfit.item_ids ?? []).map(id => itemById.get(id)).filter(Boolean) as any[]
      const colors  = [...new Set(its.map(i => (i.color_primary ?? '').toLowerCase()).filter(Boolean))]
      const subcats = [...new Set(its.map(i => i.subcategory ?? '').filter(Boolean))]
      const step = Math.min(3, weight) * POSITIVE_STEP

      for (let a = 0; a < colors.length; a++)
        for (let b = a + 1; b < colors.length; b++) {
          const k = pairKey(colors[a], colors[b])
          colorPairDelta[k] = clamp((colorPairDelta[k] ?? 0) + step)
        }
      for (let a = 0; a < subcats.length; a++)
        for (let b = a + 1; b < subcats.length; b++) {
          const k = pairKey(subcats[a], subcats[b])
          subcatPairDelta[k] = clamp((subcatPairDelta[k] ?? 0) + step)
        }
    }

    // ── Negative Signale: Feedback-Historie ─────────────────────────────────
    const profiles = await db.profile.toArray()
    const profile = profiles[0]
    for (const fb of (profile?.feedback_history ?? [])) {
      if (fb.reason !== 'wrong_color' || !fb.outfitColors?.length) continue
      sampleSize++
      const colors = [...new Set(fb.outfitColors.map(c => c.toLowerCase()))]
      for (let a = 0; a < colors.length; a++)
        for (let b = a + 1; b < colors.length; b++) {
          const k = pairKey(colors[a], colors[b])
          colorPairDelta[k] = clamp((colorPairDelta[k] ?? 0) - NEGATIVE_STEP)
        }
    }
  } catch {
    // DB nicht verfügbar (z.B. SSR/Test) → neutrale Anpassungen
  }

  return { colorPairDelta, subcatPairDelta, sampleSize }
}

/**
 * Wendet die persönlichen Deltas auf ein Outfit an.
 * Rückgabe: gekappter Gesamt-Bonus/Malus −0.08 … +0.08.
 */
export function personalDelta(
  adj: PersonalAdjustments | undefined,
  items: Array<{ color_primary?: string; subcategory?: string }>
): number {
  if (!adj || adj.sampleSize === 0) return 0
  let delta = 0
  const colors  = [...new Set(items.map(i => (i.color_primary ?? '').toLowerCase()).filter(Boolean))]
  const subcats = [...new Set(items.map(i => i.subcategory ?? '').filter(Boolean))]

  for (let a = 0; a < colors.length; a++)
    for (let b = a + 1; b < colors.length; b++)
      delta += adj.colorPairDelta[pairKey(colors[a], colors[b])] ?? 0
  for (let a = 0; a < subcats.length; a++)
    for (let b = a + 1; b < subcats.length; b++)
      delta += (adj.subcatPairDelta[pairKey(subcats[a], subcats[b])] ?? 0) * 0.5

  return Math.max(-0.08, Math.min(0.08, delta))
}
