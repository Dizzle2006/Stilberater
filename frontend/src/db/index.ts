import Dexie, { type Table } from 'dexie'

// Gap 2: Feedback-Reason Union Type
export type FeedbackReason = 'too_formal' | 'wrong_color' | 'wrong_occasion' | 'style_mismatch'

// Gap 3: Feedback-Eintrag für Trend-Erkennung
export interface FeedbackEntry {
  reason: FeedbackReason
  outfitOccasion?: string
  outfitColors?: string[]
  outfitStyles?: string[]
  outfitSubcats?: string[]
  timestamp: string
}

export interface ClothingItem {
  id?: number
  name: string
  category: string
  subcategory?: string
  color_primary: string
  color_secondary?: string
  pattern: string
  style_tags: string[]
  season: string[]
  brand?: string
  image_data?: string   // base64 encoded image
  image_path?: string   // kept for UI compat — same as image_data here
  // Blueprint Phase 2: 8-Archetyp-Scores (0–100) per item
  style_scores?: Record<string, number>
  // Blueprint Phase 2: Formalitätsstufe 0–100 (Blueprint-Skala)
  formality_base?: number
  // Anker-Priorität: markierte Favoriten werden bevorzugt als Anker gewählt
  favorite?: boolean
  // Blueprint v2.0 Phase 2: anchor_eligible — alle Kategorien wählbar als Anker
  anchor_eligible?: boolean
  // Blueprint v2.0 Phase 2: item-spezifische Regelausnahmen (z.B. 'no_socks_ok', 'open_collar_ok')
  sprezzatura_exceptions?: string[]
  // Blueprint v2.0 Phase 2: stil-spezifische Score-Overrides auf Item-Ebene
  context_overrides?: Record<string, Record<string, number>>
  // Hybrid-System: Brücken-Stile (verbindet Outfits ohne gemeinsamen primären Stil)
  bridge_styles?: string[]
  // Hybrid-System: dominantester Stil (höchster style_scores-Wert)
  primary_style?: string
  // Gap 9: wetterfest — Items die bei Regen bevorzugt werden
  weatherproof?: boolean
  // Phase 7 (DB v3.0): Extended item metadata for new scoring rules
  colour_family?: string          // e.g. 'warm_neutral' | 'coastal' | 'earth' | 'accent' | 'cool_neutral'
  fabric_weight?: 'light' | 'medium' | 'heavy'
  fabric_family?: string          // e.g. 'wool' | 'cotton' | 'linen' | 'silk' | 'knit' | 'leather'
  pattern_type?: string           // PatternType: 'solid'|'stripe'|'check'|'plaid'|'herringbone'|…
  pattern_scale?: 'micro' | 'small' | 'medium' | 'large' | 'bold'
  texture_family?: string         // e.g. 'smooth' | 'woven' | 'rough' | 'napped' | 'knit'
  palette_fit?: string[]          // style IDs this item's palette is best matched to
  formality_score?: number        // 1–10 on the Phase 5 formality scale
  times_worn: number
  last_worn?: string    // ISO string
  is_active: boolean
  notes?: string
  created_at: string    // ISO string
  purchased_at?: string // ISO string
}

export interface Outfit {
  id?: number
  name?: string
  item_ids: number[]
  occasion: string
  season?: string
  rating?: number
  is_ai_generated: boolean
  is_favourite: boolean
  times_worn: number
  worn_dates: string[]  // ISO strings
  score_breakdown?: Record<string, number>
  score_insight?: string
  created_at: string
  // Blueprint Phase 5: Deduplizierungs-Hash (sortierte item_ids als Pipe-String)
  hash?: string
  // Dominante Stil-Archetypen in diesem Outfit
  active_styles?: string[]
  // IDs der versteckten Basisschichten (T-Shirt unter Strickware, Hemd unter Pullover)
  base_layer_ids?: number[]
  // v5.1 (#9): Erklärbarkeit — welche Stilregeln gegriffen haben
  score_reasons?: string[]
}

export interface UserProfile {
  id?: number
  style_personas: string[]
  preferred_colors: string[]
  avoided_colors: string[]
  preferred_occasions: string[]
  body_type?: string
  budget_range?: string
  preferred_brands: string[]
  liked_item_ids: number[]
  disliked_item_ids: number[]
  liked_outfit_ids: number[]
  disliked_outfit_ids: number[]
  onboarding_complete: boolean
  updated_at: string
  context_primary?: string
  lifestyle_context?: string
  perception_goal?: string
  look_identity?: string
  fit_preference?: string
  color_world: string[]
  shoe_style?: string
  occasion_weights: Record<string, number>
  style_scores: Record<string, number>
  structure_preference?: string
  pattern_preference: string[]
  combination_boldness?: number
  style_image_picks: string[]
  // Blueprint Phase 3: Top-3 aktive Stil-Archetypen des Nutzers
  active_styles?: string[]
  // Blueprint Phase 3: Formalitäts-Bereich [min, max] (0–100)
  formality_range?: [number, number]
  // Blueprint Phase 3: Blacklist von Kategorien (nie in Outfits)
  blacklist_categories?: string[]
  // Blueprint v2.0 Phase 3: sprezzatura_mode — aktiviert Context-Overrides global
  sprezzatura_mode?: boolean
  // Blueprint v2.0 Phase 3: Anlass-Frequenz — gewichtet Formality-Range dynamisch
  anlass_frequenz?: { buero?: number; events?: number; freizeit?: number }
  // Blueprint v2.0 Phase 3: Temperatur-Zone für Season-Bias
  temp_zone?: 'mitteleuropaeisch' | 'mediterran' | 'kalt' | 'warm'
  // Blueprint v2.0 Phase 7: Gesamt-Interaktionen für exponentielle Lernrate
  interaction_count?: number
  // Gap 2: Letzte 30 Feedback-Einträge für Trend-Erkennung
  feedback_history?: FeedbackEntry[]
  // Gap 3: Zeitstempel des letzten Rebalancings
  last_rebalance_at?: string
  // Gap 7: Büro-Konfiguration — moderne Büroumgebung erlaubt Selvedge Denim
  buero_config?: { modern_office?: boolean }
  // Hybrid-System: aktiver Hybrid-Stil-Key (aus HYBRID_STYLE_PROFILES)
  hybrid_profile?: string
  // Hybrid-System: individuelle Gewichtung der Hybrid-Komponenten
  hybrid_ratio?: number[]
  // v5.1 (#3): persönlicher Farbtyp — 'hoch' | 'mittel' | 'gedaempft'
  contrast_type?: string
}

class StilberaterDB extends Dexie {
  clothing_items!: Table<ClothingItem>
  outfits!: Table<Outfit>
  profile!: Table<UserProfile>

  constructor() {
    super('stilberater')
    this.version(1).stores({
      clothing_items: '++id, category, is_active, created_at',
      outfits: '++id, occasion, is_favourite, created_at',
      profile: '++id',
    })
    this.version(2).stores({
      clothing_items: '++id, category, is_active, created_at',
      outfits: '++id, occasion, is_favourite, created_at',
      profile: '++id',
    }).upgrade(tx => {
      // Subcategories that are weatherproof by construction (mirrors styleTagger.ts)
      const WEATHERPROOF_SUBCATS = new Set([
        'wachsjacke','trenchcoat','oxford_schuh','derby','chelsea_boot','wollmantel','peacoat',
      ])
      return tx.table('clothing_items').toCollection().modify((item: any) => {
        if (item.weatherproof === undefined) item.weatherproof = WEATHERPROOF_SUBCATS.has(item.subcategory ?? '')
        if (item.anchor_eligible === undefined) item.anchor_eligible = true
        if (item.sprezzatura_exceptions === undefined) item.sprezzatura_exceptions = []
        if (item.context_overrides === undefined) item.context_overrides = {}
      })
    })
    this.version(3).stores({
      clothing_items: '++id, category, is_active, created_at',
      outfits: '++id, occasion, is_favourite, created_at',
      profile: '++id',
    }).upgrade(tx => {
      return tx.table('profile').toCollection().modify((profile: any) => {
        if (profile.feedback_history === undefined) profile.feedback_history = []
        if (profile.last_rebalance_at === undefined) profile.last_rebalance_at = null
        if (profile.buero_config === undefined) profile.buero_config = { modern_office: false }
        if (profile.sprezzatura_mode === undefined) profile.sprezzatura_mode = false
        if (profile.interaction_count === undefined) profile.interaction_count = 0
        if (profile.active_styles === undefined) profile.active_styles = []
        if (profile.anlass_frequenz === undefined) profile.anlass_frequenz = {}
        if (profile.combination_boldness === undefined) profile.combination_boldness = 3
      })
    })
    this.version(4).stores({
      clothing_items: '++id, category, is_active, created_at',
      outfits: '++id, occasion, is_favourite, created_at',
      profile: '++id',
    }).upgrade(tx => {
      const ITEM_BRIDGES: Record<string, string[]> = {
        chelsea_boot:       ['smart_casual', 'british_countryside', 'ivy_league'],
        brogue:             ['british_countryside', 'ivy_league', 'smart_casual', 'old_money'],
        penny_loafer:       ['ivy_league', 'old_money', 'smart_casual', 'riviera', 'italian_elegance'],
        loafer:             ['old_money', 'smart_casual', 'riviera', 'ivy_league', 'italian_elegance'],
        tassel_loafer:      ['old_money', 'british_countryside', 'smart_casual', 'italian_elegance'],
        derby:              ['smart_casual', 'british_countryside', 'ivy_league', 'english_gentleman'],
        oxford_schuh:       ['english_gentleman', 'old_money'],
        monkstrap:          ['smart_casual', 'old_money', 'english_gentleman'],
        chukka_boot:        ['british_countryside', 'smart_casual'],
        boots:              ['british_countryside', 'smart_casual'],
        sneaker_minimal:    ['smart_casual', 'ivy_league'],
        oxford_hemd:        ['ivy_league', 'smart_casual', 'old_money', 'english_gentleman'],
        leinenhemd:         ['riviera', 'smart_casual', 'old_money', 'italian_elegance'],
        flanellhemd:        ['british_countryside', 'smart_casual'],
        poloshirt:          ['ivy_league', 'smart_casual', 'riviera', 'italian_elegance'],
        rollkragen:         ['old_money', 'smart_casual', 'english_gentleman', 'italian_elegance'],
        strickpullover_rund:['old_money', 'smart_casual', 'british_countryside', 'ivy_league'],
        strickpullover_v:   ['smart_casual', 'old_money', 'ivy_league', 'english_gentleman'],
        strickweste:        ['british_countryside', 'smart_casual', 'old_money', 'ivy_league'],
        weste:              ['english_gentleman', 'smart_casual', 'old_money'],
        troyer:             ['smart_casual', 'old_money', 'riviera'],
        t_shirt:            ['smart_casual', 'riviera'],
        blazer:             ['ivy_league', 'smart_casual', 'old_money', 'english_gentleman'],
        sakko:              ['smart_casual', 'old_money', 'italian_elegance', 'english_gentleman'],
        tweed_sakko:        ['british_countryside', 'old_money', 'smart_casual'],
        wollmantel:         ['old_money', 'english_gentleman', 'british_countryside'],
        peacoat:            ['smart_casual', 'british_countryside', 'ivy_league'],
        trenchcoat:         ['smart_casual', 'british_countryside', 'old_money', 'english_gentleman'],
        dufflecoat:         ['british_countryside', 'ivy_league', 'smart_casual'],
        harrington:         ['smart_casual', 'ivy_league', 'british_countryside'],
        field_jacket:       ['british_countryside', 'smart_casual'],
        gesteppte_weste:    ['british_countryside', 'smart_casual'],
        strickjacke:        ['old_money', 'smart_casual', 'ivy_league'],
        chino:              ['ivy_league', 'smart_casual', 'old_money', 'english_gentleman'],
        anzughose:          ['english_gentleman', 'old_money', 'italian_elegance'],
        wollhose:           ['old_money', 'british_countryside', 'english_gentleman'],
        flanellhose:        ['british_countryside', 'old_money', 'english_gentleman'],
        jeans_dunkel:       ['smart_casual', 'ivy_league'],
        cord_hose:          ['british_countryside', 'smart_casual', 'ivy_league'],
        leinenhose:         ['riviera', 'old_money', 'smart_casual', 'italian_elegance'],
        krawatte:           ['english_gentleman', 'ivy_league', 'old_money'],
        einstecktuch:       ['english_gentleman', 'old_money', 'smart_casual'],
        guertel_leder:      ['english_gentleman', 'smart_casual', 'old_money'],
        uhr_klassisch:      ['old_money', 'smart_casual', 'english_gentleman'],
        schal_kaschmir:     ['old_money', 'british_countryside', 'smart_casual'],
      }
      return tx.table('clothing_items').toCollection().modify((item: any) => {
        if (!item.bridge_styles || item.bridge_styles.length === 0) {
          item.bridge_styles = ITEM_BRIDGES[item.subcategory ?? ''] ?? []
        }
        if (!item.primary_style && item.style_scores) {
          const entries = Object.entries(item.style_scores as Record<string, number>)
          if (entries.length) {
            item.primary_style = entries.sort((a, b) => b[1] - a[1])[0][0]
          }
        }
      })
    })
    // ─── Phase 7: Extended schema fields (colour_family, fabric_weight, …) ───
    this.version(5).stores({
      clothing_items: '++id, category, is_active, created_at',
      outfits: '++id, occasion, is_favourite, created_at',
      profile: '++id',
    }).upgrade(tx => {
      // Derive sensible defaults from existing subcategory / pattern fields
      const FABRIC_WEIGHT_BY_SUBCAT: Record<string, 'light' | 'medium' | 'heavy'> = {
        leinenhemd: 'light', leinenhose: 'light',
        oxford_hemd: 'medium', flanellhemd: 'heavy', chino: 'medium',
        anzughose: 'medium', wollhose: 'heavy', flanellhose: 'heavy',
        tweed_sakko: 'heavy', sakko: 'medium', blazer: 'medium',
        wollmantel: 'heavy', peacoat: 'heavy', trenchcoat: 'medium',
        dufflecoat: 'heavy', strickpullover_rund: 'medium', strickpullover_v: 'medium',
        strickjacke: 'medium', rollkragen: 'medium', troyer: 'medium',
        t_shirt: 'light', poloshirt: 'light',
      }
      const FABRIC_FAMILY_BY_SUBCAT: Record<string, string> = {
        leinenhemd: 'linen', leinenhose: 'linen',
        oxford_hemd: 'cotton', flanellhemd: 'wool', chino: 'cotton',
        anzughose: 'wool', wollhose: 'wool', flanellhose: 'wool',
        tweed_sakko: 'wool', sakko: 'wool', blazer: 'wool',
        wollmantel: 'wool', peacoat: 'wool', trenchcoat: 'cotton',
        strickpullover_rund: 'knit', strickpullover_v: 'knit',
        strickjacke: 'knit', rollkragen: 'knit', troyer: 'knit',
        t_shirt: 'cotton', poloshirt: 'cotton',
        oxford_schuh: 'leather', brogue: 'leather', derby: 'leather',
        chelsea_boot: 'leather', loafer: 'leather', penny_loafer: 'leather',
      }
      return tx.table('clothing_items').toCollection().modify((item: any) => {
        if (item.colour_family === undefined)  item.colour_family = null
        if (item.fabric_weight === undefined)  item.fabric_weight = FABRIC_WEIGHT_BY_SUBCAT[item.subcategory ?? ''] ?? 'medium'
        if (item.fabric_family === undefined)  item.fabric_family = FABRIC_FAMILY_BY_SUBCAT[item.subcategory ?? ''] ?? 'cotton'
        if (item.pattern_type === undefined)   item.pattern_type = item.pattern ?? 'solid'
        if (item.pattern_scale === undefined)  item.pattern_scale = 'small'
        if (item.texture_family === undefined) item.texture_family = 'smooth'
        if (item.palette_fit === undefined)    item.palette_fit = item.bridge_styles ?? []
        if (item.formality_score === undefined) item.formality_score = null
      })
    })
  }
}

export const db = new StilberaterDB()

export function newProfile(): UserProfile {
  return {
    style_personas: [],
    preferred_colors: [],
    avoided_colors: [],
    preferred_occasions: [],
    preferred_brands: [],
    liked_item_ids: [],
    disliked_item_ids: [],
    liked_outfit_ids: [],
    disliked_outfit_ids: [],
    onboarding_complete: false,
    updated_at: new Date().toISOString(),
    color_world: [],
    occasion_weights: {},
    style_scores: {},
    pattern_preference: [],
    style_image_picks: [],
  }
}
