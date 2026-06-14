import { db } from '../db/index'

const WEAR_AUTO_FAV_THRESHOLD = 3

export interface WearResult {
  autoFavorited: boolean
  outfitId: number
}

/**
 * Records that an outfit was worn today.
 * - Increments times_worn on all items in the outfit.
 * - Sets last_worn to today on all items.
 * - If all items reach WEAR_AUTO_FAV_THRESHOLD → auto-favorites the outfit.
 * - Blocks re-suggestion for today by recording worn_date on the outfit.
 */
export async function recordWear(outfitId: number): Promise<WearResult> {
  const outfit = await db.outfits.get(outfitId)
  if (!outfit) throw new Error('Outfit not found')

  const today = new Date().toISOString()

  // Update all items
  for (const itemId of outfit.item_ids ?? []) {
    const item = await db.clothing_items.get(itemId)
    if (!item) continue
    await db.clothing_items.update(itemId, {
      times_worn: (item.times_worn ?? 0) + 1,
      last_worn: today,
    })
  }

  // Record wear date on outfit
  const wornDates = [...(outfit.worn_dates ?? []), today]
  const timesWorn = (outfit.times_worn ?? 0) + 1
  await db.outfits.update(outfitId, { times_worn: timesWorn, worn_dates: wornDates })

  // Auto-favorite: check if all items are worn >= threshold times
  let autoFavorited = false
  if (!outfit.is_favourite) {
    const updatedItems = await Promise.all(
      (outfit.item_ids ?? []).map(id => db.clothing_items.get(id)),
    )
    const allAboveThreshold = updatedItems
      .filter(Boolean)
      .every(i => (i!.times_worn ?? 0) >= WEAR_AUTO_FAV_THRESHOLD)

    if (allAboveThreshold) {
      await db.outfits.update(outfitId, { is_favourite: true })
      autoFavorited = true
    }
  }

  return { autoFavorited, outfitId }
}

/** Formats last_worn date as human-readable relative string. */
export function formatLastWorn(lastWornIso: string | null | undefined): string | null {
  if (!lastWornIso) return null
  const diff = Date.now() - new Date(lastWornIso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Heute'
  if (days < 7) return `Vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `Vor ${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'}`
  const months = Math.floor(days / 30)
  return `Vor ${months} ${months === 1 ? 'Monat' : 'Monaten'}`
}
