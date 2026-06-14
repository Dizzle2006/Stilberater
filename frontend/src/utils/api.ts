// Offline PWA API — replaces all HTTP calls with local IndexedDB + browser services
import { db, newProfile, type ClothingItem, type Outfit, type UserProfile } from '../db/index'
import { computePersonalAdjustments } from '../services/personalLearning'
import type { OutfitGenerationParams } from '../services/intentParser'
import { tagItem, getAllCategories, getColorPaletteForUI } from '../services/styleTagger'
import { extractDominantColor, fileToBase64 } from '../services/colorAnalyzer'
import { generateOutfits, selectDiverse, analyzeCapsule, analyzeWardrobeGaps } from '../services/outfitEngine'
import { interpretProfile } from '../services/profileInterpreter'
import { purgeRecommendations, gapAnalysis } from '../services/recommendationEngine'
import { processFeedback, applyWeeklyRebalancing, analyzeFeedbackTrends, isRebalancingDue, type FeedbackPayload } from '../services/profileInterpreter'
import type { FeedbackReason } from '../db/index'
import { getWeather as fetchWeather } from '../services/weather'
import { recordWear as _recordWear } from '../services/wearTrackingService'
import { removeBackground, blobToDataUrl } from '../services/backgroundRemoval'

// ─── Farbwelt → Hex-Farben (für preferred_colors Anzeige) ────────────────────
const COLOR_WORLD_HEX: Record<string, string[]> = {
  erdtoene: ['#C9B49A', '#C19A6B', '#8A8A5A'],
  navy:     ['#1a2744', '#3D6B9E', '#4A5568'],
  grau:     ['#2D2D2D', '#9E9E9E', '#3C3C3C'],
  neutral:  ['#F5F0E8', '#D4C5A9', '#F0EAD6'],
  kuehl:    ['#B8D4E8', '#7B9DB4', '#8FAF8F'],
  burgund:  ['#7B1F3A', '#800020', '#3E1F00'],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getOrCreateProfile(): Promise<UserProfile & { id: number }> {
  const existing = await db.profile.toArray()
  if (existing.length) return existing[0] as UserProfile & { id: number }
  const id = await db.profile.add(newProfile())
  return (await db.profile.get(id))! as UserProfile & { id: number }
}

function serializeItem(item: ClothingItem): any {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory,
    color_primary: item.color_primary,
    color_secondary: item.color_secondary,
    pattern: item.pattern,
    style_tags: item.style_tags ?? [],
    season: item.season ?? [],
    brand: item.brand,
    image_path: item.image_data ?? item.image_path,   // base64 data URL
    times_worn: item.times_worn ?? 0,
    last_worn: item.last_worn ?? null,
    is_active: item.is_active,
    notes: item.notes,
    created_at: item.created_at,
    purchased_at: item.purchased_at ?? null,
  }
}

function serializeOutfit(o: Outfit, score?: number): any {
  return {
    id: o.id,
    name: o.name,
    item_ids: o.item_ids ?? [],
    occasion: o.occasion,
    season: o.season,
    score: score != null ? Math.round(score * 10000) / 10000 : null,
    notes: o.name,
    rating: o.rating,
    is_ai_generated: o.is_ai_generated,
    is_favourite: o.is_favourite,
    times_worn: o.times_worn ?? 0,
    worn_dates: o.worn_dates ?? [],
    score_breakdown: o.score_breakdown ?? null,
    score_insight: o.score_insight ?? null,
    active_styles: o.active_styles ?? undefined,
    base_layer_ids: o.base_layer_ids ?? undefined,
    created_at: o.created_at,
  }
}

function serializeProfile(p: UserProfile & { id: number }): any {
  return {
    id: p.id,
    style_personas:        p.style_personas        ?? [],
    preferred_colors:      (p.color_world ?? []).flatMap(cw => COLOR_WORLD_HEX[cw] ?? []).slice(0, 9),
    avoided_colors:        p.avoided_colors        ?? [],
    preferred_occasions:   p.preferred_occasions   ?? [],
    body_type:             p.body_type,
    budget_range:          p.budget_range,
    preferred_brands:      p.preferred_brands      ?? [],
    liked_item_ids:        p.liked_item_ids        ?? [],
    disliked_item_ids:     p.disliked_item_ids     ?? [],
    liked_outfit_ids:      p.liked_outfit_ids      ?? [],
    disliked_outfit_ids:   p.disliked_outfit_ids   ?? [],
    onboarding_complete:   p.onboarding_complete   ?? false,
    updated_at:            p.updated_at,
    context_primary:       p.context_primary,
    lifestyle_context:     p.lifestyle_context,
    perception_goal:       p.perception_goal,
    look_identity:         p.look_identity,
    fit_preference:        p.fit_preference,
    color_world:           p.color_world           ?? [],
    shoe_style:            p.shoe_style,
    occasion_weights:      p.occasion_weights      ?? {},
    style_scores:          p.style_scores          ?? {},
    structure_preference:  p.structure_preference,
    pattern_preference:    p.pattern_preference    ?? [],
    combination_boldness:  p.combination_boldness,
    style_image_picks:     p.style_image_picks     ?? [],
    active_styles:         p.active_styles         ?? [],
    hybrid_profile:        p.hybrid_profile,
    hybrid_ratio:          p.hybrid_ratio,
    sprezzatura_mode:      p.sprezzatura_mode       ?? false,
  }
}

// imgUrl is kept for backward compat — in offline mode image_path IS already a data URL
export function imgUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  return path
}

// ─── Wardrobe ─────────────────────────────────────────────────────────────────

async function uploadItem(file: File, categoryKey: string, colorOverride?: string, patternOverride?: string) {
  const autoColor = await extractDominantColor(file)
  const finalColor = colorOverride?.trim().toLowerCase() || autoColor
  const attrs = tagItem(categoryKey, finalColor)
  const imageData = await fileToBase64(file)

  const itemName = `${finalColor.charAt(0).toUpperCase() + finalColor.slice(1)} ${attrs.display_name}`

  const id = await db.clothing_items.add({
    name:            itemName,
    category:        attrs.category,
    subcategory:     categoryKey,
    color_primary:   finalColor,
    color_secondary: undefined,
    pattern:         patternOverride ?? 'solid',
    style_tags:      attrs.style_tags,
    season:          attrs.season,
    // Blueprint Phase 2: 8-Archetyp-Scores + Formalitätsbasis
    style_scores:         attrs.style_scores,
    formality_base:       attrs.formality_base,
    // Blueprint v2.0 Phase 2: neue Felder
    anchor_eligible:      attrs.anchor_eligible,
    sprezzatura_exceptions: attrs.sprezzatura_exceptions,
    context_overrides:    attrs.context_overrides,
    // Gap 9
    weatherproof:         attrs.weatherproof,
    // Hybrid-System: Bridge-Stile und primärer Stil
    bridge_styles:        attrs.bridge_styles,
    primary_style:        attrs.primary_style,
    image_data:      imageData,
    image_path:      imageData,
    times_worn:      0,
    favorite:        false,
    is_active:       true,
    created_at:      new Date().toISOString(),
  })

  const item = await db.clothing_items.get(id)
  return {
    id,
    name:               itemName,
    category:           attrs.category,
    subcategory:        categoryKey,
    color_primary:      finalColor,
    auto_detected_color: autoColor,
    style_tags:         attrs.style_tags,
    formality:          attrs.formality,
    attributes:         attrs,
    image_path:         imageData,
    ...serializeItem(item!),
  }
}

async function checkItem(file: File, categoryKey: string, colorOverride?: string) {
  const autoColor = await extractDominantColor(file)
  const finalColor = colorOverride?.trim().toLowerCase() || autoColor
  const attrs = tagItem(categoryKey, finalColor)

  const virtualItem: ClothingItem = {
    id: -1, name: `${finalColor} ${attrs.display_name}`,
    category: attrs.category, subcategory: categoryKey,
    color_primary: finalColor, pattern: 'solid',
    style_tags: attrs.style_tags, season: attrs.season,
    times_worn: 0, is_active: true,
    created_at: new Date().toISOString(),
  }

  const existingItems = await db.clothing_items.filter(i => i.is_active === true).toArray()
  const profile = await getOrCreateProfile()
  const rules = interpretProfile(profile)

  const outfitsBefore = generateOutfits(existingItems, 'casual', undefined, 200, profile, rules)
  const outfitsAfter  = generateOutfits([...existingItems, virtualItem], 'casual', undefined, 200, profile, rules)
  const newOutfitCount = outfitsAfter.filter(o => o.item_ids.includes(-1)).length

  // Stil-Score
  const itemTags = new Set(virtualItem.style_tags)
  const preferredTags = new Set(rules.preferred_tags)
  const tagOverlap = preferredTags.size ? [...itemTags].filter(t => preferredTags.has(t)).length / preferredTags.size : 0.65
  const isAvoided = rules.avoided_colors.map(c => c.toLowerCase()).includes(finalColor)
  const colorScore = isAvoided ? 0
    : (finalColor === 'white' || finalColor === 'navy' || finalColor === 'grey' || finalColor === 'black') ? 1.0 : 0.7
  const styleScore = Math.min(1.0, tagOverlap * 0.5 + colorScore * 0.5)
  const stylePct = Math.round(styleScore * 100)

  const reasons: string[] = []
  if (newOutfitCount >= 5) reasons.push(`Ermöglicht ${newOutfitCount} neue Outfit-Kombinationen — sehr vielseitig`)
  else if (newOutfitCount >= 3) reasons.push(`Ermöglicht ${newOutfitCount} neue Outfit-Kombinationen`)
  else if (newOutfitCount >= 1) reasons.push(`Ermöglicht ${newOutfitCount} neue Outfit-Kombination(en)`)
  else reasons.push('Passt zu keinem bestehenden Item — momentan kein Outfit-Potenzial')

  if (stylePct >= 80)      reasons.push(`Passt sehr gut zu deinem Stil (${stylePct}% Übereinstimmung)`)
  else if (stylePct >= 60) reasons.push(`Passt gut zu deinem Stil (${stylePct}% Übereinstimmung)`)
  else if (stylePct >= 40) reasons.push(`Passt mäßig zu deinem Stil (${stylePct}% Übereinstimmung)`)
  else                     reasons.push(`Passt kaum zu deinem Stil (${stylePct}% Übereinstimmung)`)

  const sameCat = existingItems.filter(i => i.category === attrs.category)
  if (sameCat.length === 0) reasons.push(`Du hast noch kein ${attrs.display_name} — schließt eine Lücke im Kleiderschrank`)
  else if (sameCat.length >= 5) reasons.push(`Du hast bereits ${sameCat.length} Items in dieser Kategorie`)

  let verdict = 'nicht_kaufen', verdictLabel = 'Lieber nicht', verdictColor = '#f87171'
  if (newOutfitCount >= 3 && styleScore >= 0.60) { verdict = 'kaufen'; verdictLabel = 'Kaufen'; verdictColor = '#4ade80' }
  else if (newOutfitCount >= 2 || styleScore >= 0.60) { verdict = 'überlegen'; verdictLabel = 'Gut überlegen'; verdictColor = '#facc15' }

  return {
    outfit_count: newOutfitCount, outfits_before: outfitsBefore.length,
    outfits_after: outfitsAfter.filter(o => !o.item_ids.includes(-1)).length,
    style_score: stylePct, verdict, verdict_label: verdictLabel, verdict_color: verdictColor,
    reasons, color_detected: autoColor, color_used: finalColor,
    style_tags: attrs.style_tags, formality: attrs.formality, category_display: attrs.display_name,
  }
}

async function getItems(params?: { category?: string }) {
  let items = await db.clothing_items.filter(i => i.is_active === true).toArray()
  if (params?.category) items = items.filter(i => i.category === params.category)
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return items.map(serializeItem)
}

async function updateItem(id: number, body: Partial<ClothingItem>) {
  const item = await db.clothing_items.get(id)
  if (!item) throw new Error('Item not found')

  const updates = { ...body }
  if (body.subcategory || body.color_primary) {
    const catKey = (body.subcategory ?? item.subcategory) || ''
    const color  = (body.color_primary ?? item.color_primary) || 'grey'
    const attrs  = tagItem(catKey, color)
    updates.style_tags = attrs.style_tags
  }

  await db.clothing_items.update(id, updates)
  return serializeItem((await db.clothing_items.get(id))!)
}

async function deleteItem(id: number) {
  await db.clothing_items.update(id, { is_active: false })
  return { ok: true }
}

async function markItemWorn(id: number) {
  const item = await db.clothing_items.get(id)
  if (!item) throw new Error('Item not found')
  const timesWorn = (item.times_worn ?? 0) + 1
  await db.clothing_items.update(id, { times_worn: timesWorn, last_worn: new Date().toISOString() })
  return { times_worn: timesWorn }
}

// ─── Outfits ──────────────────────────────────────────────────────────────────

async function generateAndSaveOutfits(occasion?: string, season?: string, count = 12, occasionContext?: string, rainPriority?: boolean) {
  const items   = await db.clothing_items.filter(i => i.is_active === true).toArray()
  const profile = await getOrCreateProfile()
  if (!items.length) return []

  // #7: Kürzlich getragene Outfit-Signaturen vor dem Löschen sichern
  const fourteenDaysAgo = Date.now() - 14 * 86400000
  const recentlyWorn = await db.outfits
    .filter(o => {
      const lastWorn = o.worn_dates?.length ? o.worn_dates[o.worn_dates.length - 1] : null
      return !!lastWorn && new Date(lastWorn).getTime() > fourteenDaysAgo
    })
    .toArray()
  const wornSignatures = recentlyWorn.map(o => [...o.item_ids].sort().join(','))

  // Delete old non-favourite AI outfits
  const oldOutfits = await db.outfits.filter(o => o.is_ai_generated && !o.is_favourite).toArray()
  await db.outfits.bulkDelete(oldOutfits.map(o => o.id!))

  const rules = interpretProfile(profile)
  const effectiveWeights = rules.occasion_weights

  let outfitData: any[] = []
  const degradationRef = { level: 0 as 0 | 1 | 2 | 3 }

  // Yield to the browser before heavy computation so the loading state renders.
  await new Promise(r => setTimeout(r, 0))

  // v5.1 (#10): persönliche Lern-Anpassungen aus Trage-/Feedback-Historie
  const personalAdj = await computePersonalAdjustments()

  if (Object.keys(effectiveWeights).length && !occasion) {
    const allOutfits: any[] = []
    const seenCombos = new Set<string>()
    for (const [occ, weight] of Object.entries(effectiveWeights)) {
      if (!weight) continue
      // Yield between occasions so the UI stays responsive.
      await new Promise(r => setTimeout(r, 0))
      const occOutfits = generateOutfits(items, occ, season, count, profile, rules, wornSignatures, occasionContext, rainPriority, degradationRef, personalAdj)
      for (const od of occOutfits) {
        const key = [...od.item_ids].sort().join(',')
        if (!seenCombos.has(key)) { seenCombos.add(key); allOutfits.push(od) }
      }
    }
    // Use greedy diversity to ensure every shoe/top/bottom type rotates,
    // not just the highest-scoring ones.
    outfitData = selectDiverse(allOutfits, count * 2, items)
  } else {
    outfitData = generateOutfits(items, occasion ?? 'casual', season, count, profile, rules, wornSignatures, occasionContext, rainPriority, degradationRef, personalAdj)
  }

  // Write all outfits in a single bulk transaction instead of N sequential add+get pairs.
  const now = new Date().toISOString()
  const records = outfitData.map(od => ({
    item_ids:       od.item_ids,
    occasion:       od.occasion,
    score_reasons:  od.score_reasons,
    name:           (od.notes ?? '').slice(0, 200) || undefined,
    is_ai_generated: true,
    is_favourite:   false,
    times_worn:     0,
    worn_dates:     [] as string[],
    score_breakdown: od.score_breakdown ?? undefined,
    score_insight:   od.score_insight   ?? undefined,
    hash:            od.hash            ?? undefined,
    active_styles:   od.active_styles   ?? undefined,
    base_layer_ids:  od.base_layer_ids  ?? undefined,
    created_at:      now,
  }))
  const ids = (await db.outfits.bulkAdd(records, { allKeys: true })) as number[]
  const savedItems = await db.outfits.bulkGet(ids)
  const result = savedItems
    .map((o, i) => o ? serializeOutfit(o as Outfit & { id: number }, outfitData[i]?.score ?? 0) : null)
    .filter((o): o is ReturnType<typeof serializeOutfit> => o !== null)
  ;(result as any)._degradationLevel = degradationRef.level
  return result
}

async function listOutfits(params?: { occasion?: string; favourites_only?: boolean }) {
  let outfits = await db.outfits.toArray()
  if (params?.occasion)       outfits = outfits.filter(o => o.occasion === params.occasion)
  if (params?.favourites_only) outfits = outfits.filter(o => o.is_favourite)
  outfits.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return outfits.map(o => serializeOutfit(o as Outfit & { id: number }))
}

async function createOutfit(body: { item_ids: number[]; occasion: string; name?: string }) {
  const id = await db.outfits.add({
    item_ids: body.item_ids, occasion: body.occasion, name: body.name,
    is_ai_generated: false, is_favourite: false,
    times_worn: 0, worn_dates: [], created_at: new Date().toISOString(),
  })
  return serializeOutfit((await db.outfits.get(id))! as Outfit & { id: number })
}

async function updateOutfit(id: number, body: { item_ids?: number[]; name?: string; occasion?: string }) {
  await db.outfits.update(id, body)
  return serializeOutfit((await db.outfits.get(id))! as Outfit & { id: number })
}

async function deleteOutfit(id: number) {
  await db.outfits.delete(id)
  return { ok: true }
}

async function outfitFeedback(
  id: number,
  body: {
    rating?: number; is_favourite?: boolean
    dislike?: boolean; feedback_reason?: string; feedback_multiplier?: number
  }
) {
  const outfit = await db.outfits.get(id)
  if (!outfit) throw new Error('Outfit not found')
  const updates: Partial<Outfit> = {}
  if (body.rating       != null) updates.rating       = body.rating
  if (body.is_favourite != null) updates.is_favourite = body.is_favourite

  const profile = await getOrCreateProfile()
  const liked    = [...(profile.liked_item_ids    ?? [])]
  const disliked = [...(profile.disliked_item_ids ?? [])]

  if (body.rating != null) {
    for (const iid of (outfit.item_ids ?? [])) {
      if (body.rating >= 4 && !liked.includes(iid)) liked.push(iid)
      else if (body.rating <= 2 && !disliked.includes(iid)) disliked.push(iid)
    }
  }

  // Blueprint v2.0 Phase 7: Favorit/Dislike mit exponentieller Lernrate
  if (body.is_favourite === true) {
    // +12 Anker-Priorität: Outfit-Items in liked_outfit_ids aufnehmen
    const likedOutfits = [...(profile.liked_outfit_ids ?? [])]
    if (!likedOutfits.includes(id)) likedOutfits.push(id)
    await db.profile.update(profile.id!, {
      liked_item_ids: liked, liked_outfit_ids: likedOutfits,
    })
  } else if (body.dislike === true) {
    // −8 Kombi-Gewichtung: Items in disliked aufnehmen
    for (const iid of (outfit.item_ids ?? [])) {
      if (!disliked.includes(iid)) disliked.push(iid)
    }
    const dislikedOutfits = [...(profile.disliked_outfit_ids ?? [])]
    if (!dislikedOutfits.includes(id)) dislikedOutfits.push(id)
    await db.profile.update(profile.id!, {
      disliked_item_ids: disliked, disliked_outfit_ids: dislikedOutfits,
    })
  }

  await db.outfits.update(id, updates)
  return serializeOutfit((await db.outfits.get(id))! as Outfit & { id: number })
}

async function markOutfitWorn(id: number) {
  const outfit = await db.outfits.get(id)
  if (!outfit) throw new Error('Outfit not found')
  const timesWorn = (outfit.times_worn ?? 0) + 1
  const wornDates = [...(outfit.worn_dates ?? []), new Date().toISOString()]
  await db.outfits.update(id, { times_worn: timesWorn, worn_dates: wornDates })

  for (const itemId of (outfit.item_ids ?? [])) {
    const item = await db.clothing_items.get(itemId)
    if (item) {
      await db.clothing_items.update(itemId, {
        times_worn: (item.times_worn ?? 0) + 1,
        last_worn: new Date().toISOString(),
      })
    }
  }
  return { times_worn: timesWorn, worn_dates: wornDates }
}

async function getOutfitHistory(limit = 30) {
  const outfits = await db.outfits.filter(o => (o.times_worn ?? 0) > 0).toArray()
  outfits.sort((a, b) => {
    const lastA = a.worn_dates?.length ? a.worn_dates[a.worn_dates.length - 1] : a.created_at
    const lastB = b.worn_dates?.length ? b.worn_dates[b.worn_dates.length - 1] : b.created_at
    return new Date(lastB).getTime() - new Date(lastA).getTime()
  })
  return outfits.slice(0, limit).map(o => serializeOutfit(o as Outfit & { id: number }))
}

async function rateOutfit(id: number, rating: number) {
  return outfitFeedback(id, { rating })
}

// Gap 3: Startup-Check + Rebalancing-Funktionen
async function checkRebalancingStatus(): Promise<{
  isDue: boolean
  trend: ReturnType<typeof analyzeFeedbackTrends>
}> {
  const profile = await getOrCreateProfile()
  const trend = analyzeFeedbackTrends(profile.feedback_history ?? [])
  return { isDue: isRebalancingDue(profile), trend }
}

async function runWeeklyRebalancing() {
  const profile = await getOrCreateProfile()
  const updates = applyWeeklyRebalancing(profile)
  await db.profile.update(profile.id!, { ...updates, updated_at: new Date().toISOString() })
  return { ok: true, applied: Object.keys(updates) }
}

// Gap 2: Feedback-Reason persistieren + Profil-Updates anwenden
async function processFeedbackForOutfit(
  outfitId: number,
  reason: FeedbackReason,
  context: { outfitOccasion?: string; outfitColors?: string[]; outfitStyles?: string[] },
) {
  const profile = await getOrCreateProfile()
  const payload: FeedbackPayload = { reason, ...context }
  const updates = processFeedback(profile, payload)
  await db.profile.update(profile.id!, { ...updates, updated_at: new Date().toISOString() })
  // Outfit als disliked markieren
  await db.outfits.update(outfitId, { is_favourite: false })
  return { ok: true }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

async function getProfile() {
  return serializeProfile(await getOrCreateProfile())
}

async function updateProfile(body: Partial<UserProfile>) {
  const profile = await getOrCreateProfile()
  await db.profile.update(profile.id!, { ...body, updated_at: new Date().toISOString() })
  return serializeProfile((await db.profile.get(profile.id!))! as UserProfile & { id: number })
}

// ─── Recommendations ──────────────────────────────────────────────────────────

async function getPurgeList() {
  const items   = await db.clothing_items.filter(i => i.is_active === true).toArray()
  const profile = await getOrCreateProfile()
  return purgeRecommendations(items, profile)
}

async function getGaps() {
  const items   = await db.clothing_items.filter(i => i.is_active === true).toArray()
  const profile = await getOrCreateProfile()
  return gapAnalysis(items, profile)
}

// Gap 8: Wardrobe-Gap-Analyse
async function getWardrobeGaps() {
  const items   = await db.clothing_items.filter(i => i.is_active === true).toArray()
  const profile = await getOrCreateProfile()
  const activeStyles = profile.active_styles ?? []
  return analyzeWardrobeGaps(items, activeStyles)
}

async function getSummary() {
  const items   = await db.clothing_items.filter(i => i.is_active === true).toArray()
  const profile = await getOrCreateProfile()
  const purge = purgeRecommendations(items, profile)
  const gaps  = gapAnalysis(items, profile)
  const catCount: Record<string,number> = {}
  for (const item of items) catCount[item.category] = (catCount[item.category] ?? 0) + 1
  return {
    total_items: items.length, categories: catCount,
    purge_count: purge.length, gap_count: gaps.length,
    top_purge: purge.slice(0,3), top_gaps: gaps.slice(0,3),
  }
}

// ─── Capsule-Analyse (#10) ────────────────────────────────────────────────────

async function getCapsuleAnalysis(topN = 8) {
  const items   = await db.clothing_items.filter(i => i.is_active === true).toArray()
  const profile = await getOrCreateProfile()
  if (!items.length) return []

  const rules = interpretProfile(profile)
  const allOutfits: any[] = []
  const seenCombos = new Set<string>()

  for (const [occ, weight] of Object.entries(rules.occasion_weights)) {
    if (!weight) continue
    const occOutfits = generateOutfits(items, occ, undefined, 30, profile, rules)
    for (const od of occOutfits) {
      const key = [...od.item_ids].sort().join(',')
      if (!seenCombos.has(key)) { seenCombos.add(key); allOutfits.push(od) }
    }
  }

  if (!allOutfits.length) {
    const fallback = generateOutfits(items, 'casual', undefined, 30, profile, rules)
    allOutfits.push(...fallback)
  }

  return analyzeCapsule(items, allOutfits, topN).map(c => ({
    id: c.item.id,
    name: c.item.name,
    category: c.item.category,
    subcategory: c.item.subcategory,
    color_primary: c.item.color_primary,
    image_path: c.item.image_data ?? c.item.image_path,
    outfit_count: c.outfitCount,
    versatility_score: Math.round(c.versatilityScore * 100),
  }))
}

// ─── Weather ─────────────────────────────────────────────────────────────────

async function getWeather(lat = 53.5753, lon = 10.0153) {
  return fetchWeather(lat, lon)
}

// ─── Similar items (simplified — category + color match, no CLIP) ─────────────

async function getSimilarItems(id: number, topK = 3) {
  const item = await db.clothing_items.get(id)
  if (!item) return []
  const others = await db.clothing_items.filter(i => i.is_active === true && i.id !== id).toArray()
  const scored = others.map(o => {
    let sim = 0
    if (o.category === item.category) sim += 0.4
    if (o.color_primary === item.color_primary) sim += 0.3
    const itemTags = new Set(item.style_tags ?? [])
    const overlap = (o.style_tags ?? []).filter(t => itemTags.has(t)).length
    sim += (overlap / Math.max(itemTags.size, 1)) * 0.3
    return { item: serializeItem(o), similarity: Math.round(sim * 1000) / 1000 }
  })
  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
}

// ─── Intent-based Outfit-Generierung ─────────────────────────────────────────

async function generateAndSaveOutfitsWithIntent(
  intentParams: OutfitGenerationParams,
  season?: string,
  count = 12,
): Promise<any[]> {
  const items   = await db.clothing_items.filter(i => i.is_active === true).toArray()
  const profile = await getOrCreateProfile()
  if (!items.length) return []

  // Kürzlich getragene Signaturen sichern (wie im Standardflow)
  const fourteenDaysAgo = Date.now() - 14 * 86400000
  const recentlyWorn = await db.outfits
    .filter(o => {
      const lastWorn = o.worn_dates?.length ? o.worn_dates[o.worn_dates.length - 1] : null
      return !!lastWorn && new Date(lastWorn).getTime() > fourteenDaysAgo
    })
    .toArray()
  const wornSignatures = recentlyWorn.map(o => [...o.item_ids].sort().join(','))

  // Temporäres Profil — NICHT persistiert
  const tempProfile: UserProfile = { ...profile }

  // hard_excludes → blacklist_categories (temp)
  if (intentParams.hard_excludes.length) {
    tempProfile.blacklist_categories = [
      ...(profile.blacklist_categories ?? []),
      ...intentParams.hard_excludes,
    ]
  }

  // style_boosts → style_scores temporär anheben
  if (Object.keys(intentParams.style_boosts).length) {
    const tempScores = { ...(profile.style_scores ?? {}) }
    for (const [style, score] of Object.entries(intentParams.style_boosts)) {
      tempScores[style] = Math.min(100, score)
    }
    tempProfile.style_scores = tempScores
    const topStyles = Object.entries(tempScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => s)
    tempProfile.active_styles = topStyles
  }

  // sprezzatura
  if (intentParams.sprezzatura_mode !== undefined) {
    tempProfile.sprezzatura_mode = intentParams.sprezzatura_mode
  }

  const rules = interpretProfile(tempProfile)

  // formality_range → formality_floor
  if (intentParams.formality_range) {
    rules.formality_floor = intentParams.formality_range[0]
  }

  const effectiveOccasion = intentParams.occasion ?? 'casual'
  const rainPriority      = intentParams.rain_priority

  // Alte nicht-favorisierte AI-Outfits löschen (Standardflow)
  const oldOutfits = await db.outfits.filter(o => o.is_ai_generated && !o.is_favourite).toArray()
  await db.outfits.bulkDelete(oldOutfits.map(o => o.id!))

  // Yield before heavy computation so loading state renders.
  await new Promise(r => setTimeout(r, 0))

  const degradationRef = { level: 0 as 0 | 1 | 2 | 3 }
  const outfitData = generateOutfits(
    items, effectiveOccasion, season, count,
    tempProfile, rules, wornSignatures, undefined, rainPriority, degradationRef,
  )

  // Geblockte Item-IDs herausfiltern
  const blacklistSet = new Set(intentParams.blacklist_items.map(String))
  const filtered = blacklistSet.size
    ? outfitData.filter(o => !(o.item_ids as number[]).some(id => blacklistSet.has(String(id))))
    : outfitData

  // hard_requires: nur Outfits behalten die mind. ein Required-Item enthalten
  const requiredSet = new Set(intentParams.hard_requires)
  const withRequired = requiredSet.size
    ? filtered.filter(o => {
        const subcats = (o.item_ids as number[])
          .map((id: number) => items.find(i => i.id === id)?.subcategory)
          .filter(Boolean)
        return [...requiredSet].some(r => subcats.includes(r))
      })
    : filtered

  const source = withRequired.length >= 2 ? withRequired : filtered

  // Bulk insert instead of sequential add+get.
  const nowStr = new Date().toISOString()
  const intentRecords = source.slice(0, count).map(od => ({
    item_ids:        od.item_ids,
    occasion:        od.occasion,
    name:            (od.notes ?? '').slice(0, 200) || undefined,
    is_ai_generated: true,
    is_favourite:    false,
    times_worn:      0,
    worn_dates:      [] as string[],
    score_breakdown: od.score_breakdown ?? undefined,
    score_insight:   od.score_insight   ?? undefined,
    hash:            od.hash            ?? undefined,
    active_styles:   od.active_styles   ?? undefined,
    base_layer_ids:  od.base_layer_ids  ?? undefined,
    created_at:      nowStr,
  }))
  const intentIds = (await db.outfits.bulkAdd(intentRecords, { allKeys: true })) as number[]
  const intentSaved = await db.outfits.bulkGet(intentIds)
  const result = intentSaved
    .map((o, i) => o ? serializeOutfit(o as Outfit & { id: number }, source[i]?.score ?? 0) : null)
    .filter((o): o is ReturnType<typeof serializeOutfit> => o !== null)
  ;(result as any)._degradationLevel = degradationRef.level
  return result
}

// ─── Batch Background Repair ─────────────────────────────────────────────────

/**
 * Re-runs background removal on every active item whose stored image is a JPEG
 * (i.e. uploaded before the PNG-preservation fix). Calls onProgress after each
 * item so the UI can show a progress indicator.
 * Returns the number of items successfully repaired.
 */
async function batchRepairBackgrounds(
  onProgress?: (done: number, total: number) => void,
  reprocessAll = false,
): Promise<number> {
  const all = await db.clothing_items.toArray()
  const targets = all.filter(i => {
    if (!i.is_active) return false
    const img = (i.image_data ?? i.image_path ?? '').trim()
    if (!img) return false
    // When reprocessAll=true, include already-processed PNGs so the user can
    // apply improved cleanAlphaMatte settings to items with artefacts.
    if (!reprocessAll && img.startsWith('data:image/png')) return false
    return true
  })

  onProgress?.(0, targets.length)
  if (targets.length === 0) return 0

  // 120-second hard timeout per item — guards against a hung ONNX worker
  const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
    ])

  let repaired = 0
  for (const item of targets) {
    try {
      const src = item.image_data ?? item.image_path!
      const blob = await withTimeout(removeBackground(src), 120_000)
      const dataUrl = await blobToDataUrl(blob)
      await db.clothing_items.update(item.id!, { image_data: dataUrl, image_path: dataUrl })
      repaired++
    } catch {
      // Skip this item; leave original intact, counter still advances
    }
    onProgress?.(repaired, targets.length)
  }
  return repaired
}

// ─── Public api object (same interface as before) ─────────────────────────────

export const api = {
  // Wardrobe
  uploadItem,
  checkItem,
  getCategories: () => Promise.resolve(getAllCategories()),
  getColorPalette: () => Promise.resolve(getColorPaletteForUI()),
  getItems,
  updateItem,
  deleteItem,
  markItemWorn,
  getSimilarItems,

  // Outfits
  generateOutfits: (occasion?: string, season?: string, count = 50, occasionContext?: string, rainPriority?: boolean) =>
    generateAndSaveOutfits(occasion, season, count, occasionContext, rainPriority),
  generateOutfitsWithIntent: (params: OutfitGenerationParams, season?: string, count = 50) =>
    generateAndSaveOutfitsWithIntent(params, season, count),
  getOutfits: listOutfits,
  createOutfit,
  updateOutfit,
  deleteOutfit,
  outfitFeedback,
  markOutfitWorn,
  getOutfitHistory,
  rateOutfit,
  processFeedbackForOutfit,
  checkRebalancingStatus,
  runWeeklyRebalancing,

  // Profile
  getProfile,
  updateProfile,

  // Recommendations
  getPurgeList,
  getGaps,
  getSummary,
  getCapsuleAnalysis,
  getWardrobeGaps,

  // Feature 4: Wear Tracking
  recordWear: _recordWear,

  // Weather
  getWeather,

  // Maintenance
  batchRepairBackgrounds: (onProgress?: (done: number, total: number) => void, reprocessAll?: boolean) =>
    batchRepairBackgrounds(onProgress, reprocessAll),
}
