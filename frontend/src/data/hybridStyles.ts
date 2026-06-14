/**
 * Hybrid-Stil-Definitionen — stilhistorisch legitimierte Kombinations-Profile.
 * Bis zu 3 aktive Stile im Nutzerprofil möglich.
 * Kein Vision API, kein externer Dienst — rein regelbasiert.
 */

export interface HybridStyleProfile {
  id: string
  name: string
  name_de: string
  components: string[]           // 2–3 Stil-IDs
  ratio: number[]                // gleiche Länge wie components, Summe = 1.0
  description_de: string
  anchor_subcategories: string[]
  bridge_colors: string[]
  formality_range: [number, number]
  example_combos: string[]
  occasion_fit: string[]
  blocked_subcategories: string[]
}

export const HYBRID_STYLE_PROFILES: Record<string, HybridStyleProfile> = {

  british_gentry: {
    id: 'british_gentry',
    name: 'British Gentry',
    name_de: 'Britische Landaristokratie',
    components: ['old_money', 'british_countryside'],
    ratio: [0.6, 0.4],
    description_de: 'Old Money Qualität trifft britische Countryside-Ästhetik — ' +
      'Wollstoffe, Erdtöne, Lederschuhe mit Charakter. Niemals laut, immer distinkt.',
    anchor_subcategories: ['tweed_sakko','flanellhose','wollhose','brogue',
      'tassel_loafer','rollkragen','strickpullover_rund','wollmantel','cord_hose'],
    bridge_colors: ['camel','navy','olive','brown','grey','cream','burgundy','tan'],
    formality_range: [50, 80],
    example_combos: [
      'Tweed-Sakko + Flanellhose (grau) + Brogue (braun)',
      'Rollkragen (camel) + Wollhose (dunkelgrau) + Chelsea Boot',
      'Strickpullover (navy) + Cord-Hose (braun) + Brogue',
      'Wachsjacke (olive) + Flanellhose + Brogue',
    ],
    occasion_fit: ['social_events','leisure','office_casual','special_occasions'],
    blocked_subcategories: ['sneaker_minimal','jeans_dunkel','t_shirt','harrington'],
  },

  smart_country: {
    id: 'smart_country',
    name: 'Smart Country',
    name_de: 'Smart Country — entspannt britisch',
    components: ['british_countryside', 'smart_casual'],
    ratio: [0.5, 0.5],
    description_de: 'Countryside-Heritage trifft moderne Lässigkeit — ' +
      'robuste Materialien ohne Steifheit, Chelsea Boot als Anker, ' +
      'kein Tweed-Zwang aber immer Qualitätssignal.',
    anchor_subcategories: ['chelsea_boot','chino','peacoat','harrington',
      'brogue','strickpullover_rund','cord_hose','strickjacke'],
    bridge_colors: ['navy','olive','brown','camel','ecru','grey','forest green'],
    formality_range: [30, 60],
    example_combos: [
      'Strickpullover (olive) + Chino + Chelsea Boot',
      'Peacoat (navy) + Cord-Hose + Brogue (braun)',
      'Harrington + Chino (khaki) + Boots',
      'Strickjacke (camel) + Jeans (dunkel) + Chelsea Boot',
    ],
    occasion_fit: ['leisure','office_casual','social_events'],
    blocked_subcategories: ['oxford_schuh','anzughose','krawatte'],
  },

  modern_gentleman: {
    id: 'modern_gentleman',
    name: 'Modern Gentleman',
    name_de: 'Moderner Gentleman',
    components: ['english_gentleman', 'smart_casual'],
    ratio: [0.55, 0.45],
    description_de: 'Formale Struktur mit entspannter Silhouette — ' +
      'für moderne Büros und gehobene Events ohne Krawattenzwang. ' +
      'Rollkragen oder OCBD statt Hemd+Krawatte.',
    anchor_subcategories: ['sakko','chino','chelsea_boot','rollkragen',
      'strickpullover_v','derby','monkstrap','anzughose'],
    bridge_colors: ['navy','grey','white','camel','charcoal','stone'],
    formality_range: [45, 75],
    example_combos: [
      'Sakko (herringbone) + Chino (dunkelgrau) + Chelsea Boot',
      'Rollkragen (navy) + Anzughose (mittelgrau) + Derby',
      'Blazer (navy) + Chino + Monkstrap',
      'Strickpullover V + Anzughose (mittelgrau) + Oxford',
    ],
    occasion_fit: ['office_casual','office_formal','social_events'],
    blocked_subcategories: ['tweed_sakko','boots','t_shirt','sneaker_minimal'],
  },

  ivy_smart: {
    id: 'ivy_smart',
    name: 'Ivy Smart',
    name_de: 'Ivy League Smart Casual',
    components: ['ivy_league', 'smart_casual'],
    ratio: [0.5, 0.5],
    description_de: 'Preppy-Grundlage mit modernem Smart-Casual-Finish — ' +
      'Navy Blazer und Chino als Anker, Chelsea Boot statt Penny Loafer, ' +
      'kein Krawattenzwang aber immer polished.',
    anchor_subcategories: ['oxford_hemd','chino','chelsea_boot','blazer',
      'penny_loafer','strickpullover_v','jeans_dunkel'],
    bridge_colors: ['navy','khaki','white','grey','light blue','olive'],
    formality_range: [35, 65],
    example_combos: [
      'Navy Blazer + Chino (khaki) + Chelsea Boot (schwarz)',
      'Oxford-Hemd (hellblau) + dunkle Jeans + Chelsea Boot',
      'Strickpullover V (navy) + Chino (grau) + Penny Loafer',
      'Poloshirt (weiß) + Chino (navy) + Sneaker Minimal',
    ],
    occasion_fit: ['office_casual','social_events','leisure'],
    blocked_subcategories: ['anzughose','oxford_schuh','krawatte','tweed_sakko'],
  },

  quiet_british: {
    id: 'quiet_british',
    name: 'Quiet British',
    name_de: 'Stille britische Eleganz',
    components: ['old_money', 'smart_casual'],
    ratio: [0.7, 0.3],
    description_de: 'Old Money Substanz mit entspannter Silhouette — ' +
      'Kaschmir und Merinowolle in gedeckten Tönen, Loafer ohne Socken ' +
      'im Sommer, kein Formaldruck aber immer Qualitätssignal.',
    anchor_subcategories: ['rollkragen','strickpullover_rund','flanellhose',
      'loafer','penny_loafer','wollmantel','strickjacke','leinenhose'],
    bridge_colors: ['camel','cream','navy','grey','ecru','sand','taupe'],
    formality_range: [40, 75],
    example_combos: [
      'Rollkragen (camel) + Flanellhose (mittelgrau) + Loafer (braun)',
      'Kaschmir-Pullover (navy) + Chino (beige) + Penny Loafer',
      'Strickjacke (grau) + Wollhose (dunkelblau) + Chelsea Boot',
      'Leinenhemd (weiß) + Leinenhose (sand) + Loafer (wildleder)',
    ],
    occasion_fit: ['leisure','social_events','office_casual'],
    blocked_subcategories: ['tweed_sakko','flanellhemd','boots','field_jacket'],
  },

  continental_gentleman: {
    id: 'continental_gentleman',
    name: 'Continental Gentleman',
    name_de: 'Kontinentaler Gentleman',
    components: ['old_money', 'riviera'],
    ratio: [0.65, 0.35],
    description_de: 'Europäische Eleganz ohne Steifheit — ' +
      'Leinenanzug im Sommer, Kaschmir im Herbst, immer Loafer. ' +
      "Côte d'Azur trifft Mayfair. Sprezzatura als Lebenseinstellung.",
    anchor_subcategories: ['leinenhose','leinenhemd','loafer','penny_loafer',
      'rollkragen','strickpullover_rund','sakko'],
    bridge_colors: ['white','cream','navy','sand','camel','light blue'],
    formality_range: [45, 75],
    example_combos: [
      'Leinenhemd (weiß, offen) + Leinenhose (sand) + Loafer (wildleder)',
      'Rollkragen (camel) + Chino (beige) + Penny Loafer',
      'Sakko (ungefüttert, navy) + Leinenhose (weiß) + Loafer',
      'Strickpullover (creme) + Leinenhose (navy) + Loafer',
    ],
    occasion_fit: ['leisure','social_events','special_occasions'],
    blocked_subcategories: ['tweed_sakko','boots','flanellhemd','cord_hose'],
  },

  anglo_italian: {
    id: 'anglo_italian',
    name: 'Anglo-Italian',
    name_de: 'Anglo-Italienischer Stil',
    components: ['english_gentleman', 'italian_elegance'],
    ratio: [0.5, 0.5],
    description_de: 'Englische Struktur trifft neapolitanische Weichheit — ' +
      'Savile-Row-Disziplin in Fresco und weicher Schulter. Grenadine-Krawatte, ' +
      'Suede-Schuhe zu Anzügen, ein gelöstes Element. Der Stil von Drake\u2019s London.',
    anchor_subcategories: ['sakko','anzughose','oxford_hemd','monkstrap','derby',
      'loafer','tassel_loafer','krawatte','einstecktuch','wollhose'],
    bridge_colors: ['mid blue','navy','tobacco','cream','grey','burgundy','white','stone'],
    formality_range: [55, 90],
    example_combos: [
      'Mid-blue Anzug + weißes Hemd + Knit-Tie + Suede-Loafer',
      'Sakko (navy hopsack) + Anzughose (grau) + Grenadine-Krawatte + Derby',
      'Tobacco-Sakko + cream Wollhose + offenes Hemd + Tassel Loafer',
      'Light-grey Anzug + pale pink Hemd + burgundy Tie + braune Oxford',
    ],
    occasion_fit: ['office_formal','office_casual','social_events','special_occasions'],
    blocked_subcategories: ['boots','field_jacket','flanellhemd','sneaker_minimal','wachsjacke'],
  },

  mediterranean_money: {
    id: 'mediterranean_money',
    name: 'Mediterranean Money',
    name_de: 'Mediterranes Old Money',
    components: ['italian_elegance', 'riviera', 'old_money'],
    ratio: [0.45, 0.3, 0.25],
    description_de: 'Italienisches Old Money an der Küste — Leinen und Fresco, ' +
      'Strickpolo statt Hemd, Suede-Loafer ohne Socken. Capri trifft Mailand ' +
      'trifft Mayfair. Sonnengewärmte Palette, höchste Stoffqualität.',
    anchor_subcategories: ['leinenhemd','leinenhose','poloshirt','loafer',
      'summer_loafer','penny_loafer','sakko','strickpullover_rund','chino'],
    bridge_colors: ['white','cream','sand','mid blue','navy','tobacco','terracotta','sage','ecru'],
    formality_range: [35, 70],
    example_combos: [
      'Strickpolo (rust) + Leinenhose (cream) + Summer Loafer',
      'Leinenhemd (weiß, offen) + Fresco-Hose (mid blue) + Suede-Loafer',
      'Unstrukturiertes Sakko (stone) + Leinenhose (sand) + Loafer',
      'Strickpolo (sage) + Chino (tobacco) + Penny Loafer (suede)',
    ],
    occasion_fit: ['leisure','social_events','special_occasions','office_casual'],
    blocked_subcategories: ['tweed_sakko','boots','flanellhemd','cord_hose','wachsjacke','field_jacket','dufflecoat'],
  },

  heritage_gentleman: {
    id: 'heritage_gentleman',
    name: 'Heritage Gentleman',
    name_de: 'Britischer Heritage-Gentleman',
    components: ['old_money', 'english_gentleman', 'british_countryside'],
    ratio: [0.4, 0.35, 0.25],
    description_de: 'Die volle britische Tradition — City-Schärfe unter der Woche, ' +
      'Tweed am Wochenende, Old-Money-Qualität durchgehend. Town-and-Country ' +
      'als Lebensform: Flanell, Brogue, Wachsjacke und Worsted im selben Schrank.',
    anchor_subcategories: ['flanellhose','wollhose','tweed_sakko','sakko','brogue',
      'oxford_schuh','rollkragen','strickweste','wollmantel','wachsjacke','tassel_loafer'],
    bridge_colors: ['navy','grey','camel','cream','olive','brown','burgundy','forest green','tan'],
    formality_range: [45, 90],
    example_combos: [
      'Tweed-Sakko + graue Flanellhose + Oxford-Hemd + Brogue',
      'Navy Anzug + weißes Hemd + burgundy Tie + Oxford — City-Tag',
      'Rollkragen (camel) + Wollhose (charcoal) + Tassel Loafer',
      'Wachsjacke (olive) + Strickweste + Flanellhose + Brogue — Country-Tag',
    ],
    occasion_fit: ['office_formal','office_casual','social_events','leisure','special_occasions'],
    blocked_subcategories: ['sneaker_minimal','t_shirt','harrington'],
  },

  gentleman_sprezzatura: {
    id: 'gentleman_sprezzatura',
    name: 'Gentleman Sprezzatura',
    name_de: 'Gentleman mit Sprezzatura',
    components: ['old_money', 'italian_elegance', 'english_gentleman'],
    ratio: [0.4, 0.35, 0.25],
    description_de: 'Das Beste beider Traditionen — englische Garderobe, ' +
      'italienisch getragen. Quiet Luxury als Basis, weiche Konstruktion, ' +
      'ein bewusst gelöstes Detail. Für den, der beide Sprachen spricht.',
    anchor_subcategories: ['sakko','rollkragen','flanellhose','wollhose','loafer',
      'tassel_loafer','strickpullover_rund','poloshirt','wollmantel','einstecktuch'],
    bridge_colors: ['navy','mid blue','camel','cream','tobacco','grey','burgundy','stone'],
    formality_range: [50, 85],
    example_combos: [
      'Rollkragen (cream) + Flanellhose (tobacco) + Suede Chelsea Boot',
      'Sakko (mid blue) + Strickpolo (navy) + Wollhose (grau) + Loafer',
      'Camel Polocoat + Rollkragen (bottle green) + Flanell + Suede Boot',
      'Navy Sakko + offenes Hemd + cream Hose + Tassel Loafer — kein Gürtelzwang',
    ],
    occasion_fit: ['office_casual','social_events','special_occasions','leisure'],
    blocked_subcategories: ['boots','field_jacket','sneaker_minimal','flanellhemd','harrington'],
  },

}

/**
 * Findet Hybrid-Profil für 2–3 gegebene Stile (reihenfolgeunabhängig, exakte Menge).
 */
export function findHybridProfile(...styles: string[]): HybridStyleProfile | null {
  const want = [...new Set(styles)].sort().join('|')
  for (const profile of Object.values(HYBRID_STYLE_PROFILES)) {
    const have = [...profile.components].sort().join('|')
    if (have === want) return profile
  }
  return null
}

// ─── Stil-Kerndaten für dynamische Hybrid-Synthese ───────────────────────────
// Kompakte Essenz jedes Archetyps: Anker-Subkategorien, Kernfarben,
// Formalitätsspanne, harte Tabus. Quelle: styleBibles v5.0.

interface StyleCore {
  name_de: string
  anchors: string[]
  colors: string[]
  formality: [number, number]
  blocked: string[]
}

export const STYLE_CORES: Record<string, StyleCore> = {
  old_money: {
    name_de: 'Old Money',
    anchors: ['rollkragen','strickpullover_rund','flanellhose','wollhose','loafer','penny_loafer','tassel_loafer','wollmantel','strickjacke','sakko','blazer'],
    colors: ['navy','camel','cream','ivory','stone','grey','charcoal','burgundy','tan'],
    formality: [45, 85],
    blocked: ['sneaker_minimal','t_shirt'],
  },
  british_countryside: {
    name_de: 'British Countryside',
    anchors: ['tweed_sakko','cord_hose','flanellhemd','wachsjacke','brogue','boots','chukka_boot','gesteppte_weste','field_jacket','flanellhose','moleskin'],
    colors: ['olive','brown','tan','forest green','rust','heather','cream','burgundy','mustard'],
    formality: [25, 65],
    blocked: ['sneaker_minimal','anzughose'],
  },
  english_gentleman: {
    name_de: 'English Gentleman',
    anchors: ['anzughose','oxford_schuh','krawatte','weste','oxford_hemd','wollmantel','derby','monkstrap','einstecktuch','sakko'],
    colors: ['navy','charcoal','grey','white','burgundy','cream','mid blue'],
    formality: [60, 100],
    blocked: ['t_shirt','sneaker_minimal','boots','harrington','field_jacket'],
  },
  smart_casual: {
    name_de: 'Smart Casual',
    anchors: ['chino','sakko','chelsea_boot','jeans_dunkel','strickpullover_rund','derby','poloshirt','harrington','strickjacke'],
    colors: ['navy','grey','white','camel','olive','stone','charcoal','brown'],
    formality: [30, 65],
    blocked: [],
  },
  riviera: {
    name_de: 'Riviera',
    anchors: ['leinenhemd','leinenhose','summer_loafer','loafer','poloshirt','chino','sakko'],
    colors: ['white','sand','sky blue','navy','ecru','cream','terracotta','coral'],
    formality: [20, 55],
    blocked: ['boots','tweed_sakko','flanellhemd','cord_hose','wollmantel','wachsjacke'],
  },
  ivy_league: {
    name_de: 'Ivy League',
    anchors: ['oxford_hemd','chino','penny_loafer','blazer','strickpullover_rund','poloshirt','krawatte','tweed_sakko'],
    colors: ['navy','khaki','white','burgundy','kelly green','yellow','grey','olive'],
    formality: [30, 70],
    blocked: [],
  },
  italian_elegance: {
    name_de: 'Italian Elegance',
    anchors: ['sakko','loafer','tassel_loafer','summer_loafer','leinenhemd','leinenhose','poloshirt','rollkragen','strickjacke','anzughose','flanellhose'],
    colors: ['mid blue','tobacco','cream','navy','white','terracotta','rust','sage','stone','bottle green'],
    formality: [35, 85],
    blocked: ['flanellhemd','field_jacket','wachsjacke','boots'],
  },
}

/** Schlüssel für dynamische Hybride: 'custom:a+b+c' (sortiert). */
export function customHybridKey(styles: string[]): string {
  return 'custom:' + [...new Set(styles)].sort().join('+')
}

/**
 * Synthetisiert ein Hybrid-Profil für JEDE Kombination aus 2–3 Stilen.
 * Garantiert volle Abdeckung aller Bedürfniskombinationen, auch ohne
 * vordefiniertes Profil. Gewichte default: gleichverteilt oder explizit.
 */
export function synthesizeHybrid(styles: string[], ratio?: number[]): HybridStyleProfile {
  const ids = [...new Set(styles)].filter(s => STYLE_CORES[s]).slice(0, 3)
  const cores = ids.map(id => STYLE_CORES[id])
  const weights = (ratio && ratio.length === ids.length)
    ? ratio
    : ids.map(() => 1 / ids.length)

  // Bridge-Farben: Schnittmenge zuerst (verbindend), dann gewichtete Top-Farben
  const colorCount: Record<string, number> = {}
  cores.forEach((c, i) => c.colors.forEach(col => {
    colorCount[col] = (colorCount[col] ?? 0) + weights[i]
  }))
  const bridge_colors = Object.entries(colorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)
    .map(([c]) => c)

  // Anker: gewichtete Union, Schnittmengen-Anker zuerst
  const anchorCount: Record<string, number> = {}
  cores.forEach((c, i) => c.anchors.forEach(a => {
    anchorCount[a] = (anchorCount[a] ?? 0) + weights[i] + (1 / cores.length)
  }))
  const anchor_subcategories = Object.entries(anchorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([a]) => a)

  // Blockiert: nur was in KEINEM Stil Anker ist und in mindestens einem blockiert
  const allAnchors = new Set(cores.flatMap(c => c.anchors))
  const blocked_subcategories = [...new Set(cores.flatMap(c => c.blocked))]
    .filter(b => !allAnchors.has(b))

  // Formalität: gewichteter Korridor (Überlappung bevorzugt)
  const lo = Math.round(cores.reduce((s2, c, i) => s2 + c.formality[0] * weights[i], 0))
  const hi = Math.round(cores.reduce((s2, c, i) => s2 + c.formality[1] * weights[i], 0))

  const name_de = cores.map(c => c.name_de).join(' × ')
  return {
    id: customHybridKey(ids),
    name: name_de,
    name_de,
    components: ids,
    ratio: weights.map(w => Math.round(w * 100) / 100),
    description_de: `Individueller Stil-Mix aus ${name_de} — Brückenfarben und ` +
      'Anker-Pieces werden aus den Stilregeln beider Traditionen abgeleitet. ' +
      'Outfits bewegen sich im gemeinsamen Formalitätskorridor.',
    anchor_subcategories,
    bridge_colors,
    formality_range: [lo, hi],
    example_combos: [],
    occasion_fit: ['office_casual','social_events','leisure'],
    blocked_subcategories,
  }
}

/**
 * Löst einen Hybrid-Key auf — vordefinierte IDs ODER 'custom:a+b+c'.
 * Zentrale Auflösungsfunktion für Engine, Interpreter und UI.
 */
export function resolveHybridProfile(key: string | undefined | null, ratio?: number[]): HybridStyleProfile | undefined {
  if (!key) return undefined
  if (HYBRID_STYLE_PROFILES[key]) return HYBRID_STYLE_PROFILES[key]
  if (key.startsWith('custom:')) {
    const styles = key.slice(7).split('+').filter(Boolean)
    if (styles.length >= 2) return synthesizeHybrid(styles, ratio)
  }
  return undefined
}

/**
 * Gibt alle Hybrid-Profile zurück die einen bestimmten Stil enthalten.
 */
export function getHybridProfilesForStyle(style: string): HybridStyleProfile[] {
  return Object.values(HYBRID_STYLE_PROFILES).filter(p =>
    p.components.includes(style as string)
  )
}
