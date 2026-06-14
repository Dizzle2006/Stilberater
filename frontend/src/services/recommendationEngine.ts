// Port of backend/app/services/recommendation_engine.py
import type { ClothingItem, UserProfile } from '../db/index'

const SHOPPING_LINKS = {
  zalando: (q: string) => `https://www.zalando.de/catalog/?q=${q}`,
  amazon:  (q: string) => `https://www.amazon.de/s?k=${q}`,
}

// Maps profile persona names (German) and look_identity keys to their item style tag equivalents.
// 'smart_casual' is explicitly included for klassisch/elegant profiles because the classic
// British wardrobe (Blazer + dunkle Jeans + Brogue) IS smart casual by definition.
const PERSONA_TO_STYLE_TAGS: Record<string, string[]> = {
  'klassisch':            ['classic', 'british', 'old_money', 'formal', 'business', 'smart_casual'],
  'smart_casual':         ['smart_casual', 'classic', 'casual', 'british', 'old_money'],
  'english_gentleman':    ['formal', 'business', 'classic', 'old_money', 'smart_casual'],
  'elegant':              ['formal', 'old_money', 'classic', 'business', 'smart_casual', 'british'],
  'minimalistisch':       ['minimalist', 'casual', 'classic'],
  // look_identity keys (raw)
  'klassisch_zeitlos':    ['classic', 'british', 'old_money', 'formal', 'business', 'smart_casual'],
  'elegantes_casual':     ['formal', 'old_money', 'classic', 'casual', 'smart_casual', 'british'],
  'minimalistisch_modern':['minimalist', 'casual', 'classic'],
}

// Heritage tags — British/Old Money items are given more benefit of the doubt in purge scoring
const HERITAGE_TAGS = new Set(['british', 'old_money'])

function buildProfileTagSet(profile: UserProfile): Set<string> {
  const tags = new Set<string>()
  for (const persona of (profile.style_personas ?? [])) {
    const mapped = PERSONA_TO_STYLE_TAGS[persona] ?? [persona]
    for (const t of mapped) tags.add(t)
  }
  if (profile.look_identity) {
    const mapped = PERSONA_TO_STYLE_TAGS[profile.look_identity] ?? []
    for (const t of mapped) tags.add(t)
  }
  return tags
}

export function purgeRecommendations(items: ClothingItem[], profile: UserProfile): any[] {
  const flagged: any[] = []
  const now = new Date()
  const profileTagSet = buildProfileTagSet(profile)
  const avoidedColors = new Set((profile.avoided_colors ?? []).map(c => c.toLowerCase()))

  for (const item of items) {
    if (!item.is_active) continue
    const reasons: string[] = []
    let score = 0

    const refDate = item.purchased_at ?? item.created_at
    const ageDays = refDate ? Math.floor((now.getTime() - new Date(refDate).getTime()) / 86400000) : 0
    if ((item.times_worn ?? 0) < 3 && ageDays > 180) {
      reasons.push(`Nur ${item.times_worn}x getragen in ${ageDays} Tagen`)
      score += 3
    }

    if (item.last_worn) {
      const daysSince = Math.floor((now.getTime() - new Date(item.last_worn).getTime()) / 86400000)
      if (daysSince > 365) {
        reasons.push(`Zuletzt vor ${daysSince} Tagen getragen`)
        score += 2
      }
    }

    // Style check: only flag if profile has tags AND item shares none — plus item must have tags.
    // Heritage items (british/old_money) are softer-penalised: they're hallmarks of the
    // klassisch/elegant wardrobe even when the overlap logic misses them.
    const itemStyles = new Set(item.style_tags ?? [])
    const hasStyleMismatch = profileTagSet.size && itemStyles.size && ![...itemStyles].some(s => profileTagSet.has(s))
    if (hasStyleMismatch) {
      const itemHasHeritage = [...itemStyles].some(t => HERITAGE_TAGS.has(t))
      if (itemHasHeritage) {
        // Heritage item with style gap → soft warning, not a hard purge driver
        reasons.push(`Stil leicht außerhalb des Profils — aber britisches Heritage-Stück`)
        score += 1
      } else {
        reasons.push(`Stil passt nicht zu deinem Profil (${[...itemStyles].join(', ')})`)
        score += 2
      }
    }

    if (avoidedColors.has((item.color_primary ?? '').toLowerCase())) {
      reasons.push(`Farbe '${item.color_primary}' gemieden`)
      score += 2
    }

    if (score >= 2) {
      flagged.push({
        item_id: item.id, item_name: item.name, category: item.category,
        image_path: item.image_data ?? item.image_path,
        purge_score: score, reasons,
        suggestion: score >= 4 ? 'Verkaufen (Vinted/eBay)' : 'Spenden / Tauschen',
        sell_link: `https://www.vinted.de/catalog?search_text=${encodeURIComponent(item.name ?? '')}`,
      })
    }
  }

  return flagged.sort((a, b) => b.purge_score - a.purge_score)
}

export function gapAnalysis(items: ClothingItem[], profile: UserProfile): any[] {
  const gaps: any[] = []
  const active = items.filter(i => i.is_active)
  const catCount: Record<string, number> = {}
  for (const item of active) catCount[item.category] = (catCount[item.category] ?? 0) + 1

  for (const cat of ['tops','bottoms','shoes']) {
    if (!catCount[cat]) {
      gaps.push(makeGap(cat, 'Basis-Kategorie fehlt komplett', profile, 'high'))
    } else if (catCount[cat] < 3) {
      gaps.push(makeGap(cat, `Nur ${catCount[cat]} Items — mehr Vielfalt empfohlen`, profile, 'medium'))
    }
  }

  const colors = new Set(active.map(i => (i.color_primary ?? '').toLowerCase()))
  const missingNeutrals = ['white','black','beige','navy'].filter(n => !colors.has(n))
  if (missingNeutrals.length) {
    gaps.push({
      category: 'tops / bottoms',
      reason: `Neutrale Basics fehlen: ${missingNeutrals.join(', ')}`,
      priority: 'high',
      suggestions: missingNeutrals.slice(0,2).map(c => ({
        label: `${c.charAt(0).toUpperCase()+c.slice(1)} Basic Top`,
        zalando: SHOPPING_LINKS.zalando(`${c}+basic+shirt`),
        amazon:  SHOPPING_LINKS.amazon(`${c}+basic+shirt`),
      })),
    })
  }

  if (!catCount['outerwear']) {
    gaps.push(makeGap('outerwear', 'Kein Outerwear — Outfit-Optionen eingeschränkt', profile, 'medium'))
  }

  if ((profile.style_personas ?? []).includes('formal') && (catCount['tops'] ?? 0) < 2) {
    gaps.push(makeGap('tops', 'Zu wenig formelle Tops für Business-Look', profile, 'high', 'formal'))
  }

  return gaps
}

function makeGap(category: string, reason: string, profile: UserProfile, priority: string, style = ''): any {
  const budgetKw: Record<string,string> = { low:'günstig', medium:'', high:'premium' }
  const bkw = budgetKw[profile.budget_range ?? 'medium'] ?? ''
  const styleKw = style || (profile.style_personas?.[0] ?? '')
  const query = [styleKw, category, bkw].filter(Boolean).join('+')
  const label = styleKw ? `${styleKw.charAt(0).toUpperCase()+styleKw.slice(1)} ${category}` : category.charAt(0).toUpperCase()+category.slice(1)
  return {
    category, reason, priority,
    suggestions: [
      { label: `${label} — Zalando`, zalando: SHOPPING_LINKS.zalando(query) },
      { label: `${label} — Amazon`,  amazon:  SHOPPING_LINKS.amazon(query)  },
    ],
  }
}
