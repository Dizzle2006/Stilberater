// StyleAdvisor v5.1 (#7) — Maschinenlesbare Outfit-Exemplare
// Gold-Templates (Soll-Zustand) und Anti-Outfits (dokumentierte Fehler) je Stil.
// Der Scorer belohnt Nähe zu Gold-Exemplaren und bestraft Nähe zu Anti-Exemplaren.
// Matching: Subkategorie-Slots (Pflicht) + optionale Farb-Hints (Bonusverstärker).

export interface OutfitExemplar {
  name: string
  subcats: string[]            // Subkategorien die das Exemplar definieren
  colors?: string[]            // optionale Farb-Hints (color_primary, lowercase)
  note: string
}

export interface AntiExemplar {
  name: string
  subcats: string[]            // Subkategorien deren GEMEINSAMES Auftreten den Fehler markiert
  colors?: string[]            // optional: nur bei diesen Farben ein Fehler
  note: string
}

// ─── Gold-Exemplare ──────────────────────────────────────────────────────────

export const GOLD_EXEMPLARS: Record<string, OutfitExemplar[]> = {
  old_money: [
    { name: 'Heritage Blazer',   subcats: ['blazer','oxford_hemd','chino','penny_loafer'],            colors: ['navy','cream','camel','tan'], note: 'Navy Blazer + Camel Chino — DIE Formel' },
    { name: 'Rollkragen City',   subcats: ['rollkragen','flanellhose','loafer'],                      colors: ['camel','grey'],               note: 'Old-Money-Winterkern' },
    { name: 'Quiet Knit',        subcats: ['strickpullover_rund','chino','penny_loafer'],             colors: ['navy','cream','stone'],       note: 'Kaschmir auf Chino' },
    { name: 'Overcoat Layer',    subcats: ['wollmantel','rollkragen','flanellhose','chelsea_boot'],                                           note: 'Camel-Mantel-Silhouette' },
    { name: 'Cardigan Weekend',  subcats: ['strickjacke','oxford_hemd','chino','loafer'],                                                     note: 'Drei Schichten, kein Logo' },
    { name: 'Linen Summer',      subcats: ['leinenhemd','leinenhose','summer_loafer'],                colors: ['white','cream','sand'],       note: 'Sommerliche Zurückhaltung' },
    { name: 'V-Neck Office',     subcats: ['strickpullover_v','oxford_hemd','wollhose','derby'],                                              note: 'Hemd unter Feinstrick' },
    { name: 'Stone Quiet',       subcats: ['sakko','rollkragen','wollhose','tassel_loafer'],          colors: ['stone','navy','grey'],        note: 'Sakko über Rollkragen' },
  ],
  british_countryside: [
    { name: 'Tweed Standard',    subcats: ['tweed_sakko','flanellhose','brogue'],                                                              note: 'Town-and-Country-Kanon' },
    { name: 'Barbour Field',     subcats: ['wachsjacke','strickpullover_rund','cord_hose','boots'],   colors: ['olive','brown'],              note: 'Country-Vollformel' },
    { name: 'Moleskin Walk',     subcats: ['tweed_sakko','flanellhemd','cord_hose','chukka_boot'],                                            note: 'Robuste Texturen + glatter Schuh' },
    { name: 'Quilted Layer',     subcats: ['gesteppte_weste','flanellhemd','jeans_dunkel','boots'],                                           note: 'Modernes Heritage' },
    { name: 'Shetland Country',  subcats: ['strickpullover_rund','flanellhemd','cord_hose','brogue'],                                         note: 'Strick über Flanellhemd' },
    { name: 'Duffle Winter',     subcats: ['dufflecoat','rollkragen','flanellhose','chelsea_boot'],                                           note: 'Montgomery-Silhouette' },
  ],
  english_gentleman: [
    { name: 'City Suit',         subcats: ['anzughose','oxford_hemd','krawatte','oxford_schuh'],      colors: ['navy','charcoal','white'],    note: 'Savile-Row-Grundform' },
    { name: 'Three Piece',       subcats: ['weste','anzughose','oxford_hemd','krawatte','oxford_schuh'],                                      note: 'Dreiteiler — maximale Form' },
    { name: 'Overcoat Formal',   subcats: ['wollmantel','anzughose','oxford_hemd','oxford_schuh'],                                            note: 'Mantel deckt Sakkolänge' },
    { name: 'Monk Variation',    subcats: ['sakko','anzughose','oxford_hemd','monkstrap'],                                                    note: 'Charakterschuh im Rahmen' },
    { name: 'Turtleneck Formal', subcats: ['sakko','rollkragen','anzughose','derby'],                 colors: ['navy','charcoal','grey'],     note: 'Moderne Formalität ohne Krawatte' },
  ],
  smart_casual: [
    { name: 'Third Piece',       subcats: ['sakko','oxford_hemd','chino','chelsea_boot'],                                                     note: 'Smart-Casual-Definition' },
    { name: 'Knit & Denim',      subcats: ['strickpullover_rund','jeans_dunkel','chelsea_boot'],                                              note: 'Feinstrick + dunkler Denim' },
    { name: 'Peacoat Urban',     subcats: ['peacoat','rollkragen','jeans_dunkel','boots'],            colors: ['navy'],                       note: 'Maritime Winterform' },
    { name: 'Polo Sharp',        subcats: ['poloshirt','chino','loafer'],                                                                     note: 'Sommerlich gepflegt' },
    { name: 'Harrington Clean',  subcats: ['harrington','poloshirt','chino','sneaker_minimal'],                                               note: 'Sauberes Casual' },
    { name: 'Cardigan Office',   subcats: ['strickjacke','oxford_hemd','chino','derby'],                                                      note: 'Lockeres Büro' },
  ],
  riviera: [
    { name: 'Full Linen',        subcats: ['leinenhemd','leinenhose','summer_loafer'],                colors: ['white','sand','cream','sky blue'], note: 'Côte-d\u2019Azur-Basis' },
    { name: 'Riviera Polo',      subcats: ['poloshirt','leinenhose','summer_loafer'],                                                          note: 'Sockless Pflicht' },
    { name: 'Unlined Jacket',    subcats: ['sakko','leinenhemd','leinenhose','loafer'],                                                        note: 'Ungefüttertes Sakko über Leinen' },
    { name: 'Navy Coastal',      subcats: ['leinenhemd','chino','loafer'],                            colors: ['navy','white','sand'],         note: 'Maritime Klarheit' },
  ],
  ivy_league: [
    { name: 'Campus Classic',    subcats: ['blazer','oxford_hemd','chino','penny_loafer'],            colors: ['navy','khaki'],               note: 'Ivy-Grundformel' },
    { name: 'Shetland Campus',   subcats: ['strickpullover_rund','oxford_hemd','cord_hose','tassel_loafer'],                                  note: 'Collegiate Winter' },
    { name: 'Repp Formal',       subcats: ['blazer','oxford_hemd','krawatte','anzughose','penny_loafer'],                                     note: 'Preppy formal' },
    { name: 'Rugby Weekend',     subcats: ['poloshirt','chino','sneaker_minimal'],                                                            note: 'Sehr casual Ivy' },
    { name: 'Olive Weekend',     subcats: ['strickpullover_rund','oxford_hemd','chino','penny_loafer'], colors: ['olive','navy'],             note: 'Kragen über Crewneck' },
  ],
  italian_elegance: [
    { name: 'Agnelli Classic',   subcats: ['sakko','oxford_hemd','anzughose','loafer'],               colors: ['mid blue','white','navy'],    note: 'Fresco + Suede-Loafer' },
    { name: 'Strickpolo Estate', subcats: ['poloshirt','wollhose','loafer'],                          colors: ['rust','grey','navy','sage'],  note: 'Knit-Polo auf Fresco' },
    { name: 'Pitti Earth',       subcats: ['sakko','chino','loafer'],                                 colors: ['tobacco','cream','stone'],    note: 'Unstrukturiert + erdwarm' },
    { name: 'Cucinelli Layer',   subcats: ['rollkragen','flanellhose','chelsea_boot'],                colors: ['cream','tobacco','grey'],     note: 'Weicher Winterluxus' },
    { name: 'Milano Office',     subcats: ['sakko','oxford_hemd','krawatte','anzughose','derby'],                                             note: 'Weiche Schulter, formale Struktur' },
    { name: 'Linen Sprezzatura', subcats: ['leinenhemd','leinenhose','summer_loafer'],                colors: ['white','sand','mid blue'],    note: 'Knitter ist Feature' },
  ],
}

// ─── Anti-Exemplare — dokumentierte Stilbrüche ────────────────────────────────
// Gelten stilübergreifend (key 'global') oder stilspezifisch.

export const ANTI_EXEMPLARS: Record<string, AntiExemplar[]> = {
  global: [
    { name: 'Leinen zu Chelsea Boot',  subcats: ['leinenhose','chelsea_boot'],       note: 'Sommer-Leinen + Kaltwetter-Lederboot — Material, Gewicht und Saison kollidieren' },
    { name: 'Leinen zu Chukka',         subcats: ['leinenhose','chukka_boot'],        note: 'Boot-Volumen erdrückt die Leichtigkeit des Sommerleinens' },
    { name: 'Leinen zu Tweed-Sakko',    subcats: ['leinenhose','tweed_sakko'],        note: 'Sommerstoff + Wintertweed — gegensätzliche Jahreszeiten' },
    { name: 'Leinen zu Wollmantel',     subcats: ['leinenhose','wollmantel'],         note: 'Winter-Oberschicht über Sommerhose' },
    { name: 'Broken Suit falsch',     subcats: ['tweed_sakko','anzughose'],         note: 'Country-Sakko auf City-Anzughose — Register-Bruch' },
    { name: 'Boots zu Anzughose',     subcats: ['boots','anzughose'],               note: 'Klobiges Volumen bricht die formale Linie' },
    { name: 'Sneaker zu Anzughose',   subcats: ['sneaker_minimal','anzughose'],     note: 'Formalitätsanker fehlt komplett' },
    { name: 'Wachsjacke über Sakko',  subcats: ['wachsjacke','sakko'],              note: 'Utility über Tailoring — Sakko ragt heraus, Register kollidiert' },
    { name: 'Wachsjacke über Blazer', subcats: ['wachsjacke','blazer'],             note: 'Gleicher Bruch' },
    { name: 'Harrington über Sakko',  subcats: ['harrington','sakko'],              note: 'Kurze Jacke über langem Sakko — Längenbruch' },
    { name: 'Krawatte zu T-Shirt',    subcats: ['krawatte','t_shirt'],              note: 'Krawatte verlangt Kragen' },
    { name: 'Krawatte zu Polo',       subcats: ['krawatte','poloshirt'],            note: 'Gleicher Bruch' },
    { name: 'Feldjacke zu Anzughose', subcats: ['field_jacket','anzughose'],        note: 'Military-Utility vs. City-Formal' },
    { name: 'Oxford zu Jeans',        subcats: ['oxford_schuh','jeans_dunkel'],     note: 'Formalster Schuh auf Workwear — 4+ Stufen Spreizung' },
  ],
  old_money: [
    { name: 'Logo-Sneaker-Quiet',     subcats: ['sneaker_minimal','rollkragen','flanellhose'], note: 'Sneaker bricht das Quiet-Luxury-Register' },
  ],
  english_gentleman: [
    { name: 'Cord im Büro',           subcats: ['cord_hose','krawatte'],            note: 'Country-Hose mit City-Krawatte' },
  ],
  riviera: [
    { name: 'Boots am Strand',        subcats: ['boots','leinenhose'],              note: 'Schwerer Schuh auf Sommerleinen' },
  ],
  italian_elegance: [
    { name: 'Schwarz dominant',       subcats: ['sakko','anzughose'], colors: ['black'], note: 'Schwarzer Anzug tagsüber — italienisches Tabu' },
  ],
}

// ─── Matching-Funktionen ─────────────────────────────────────────────────────

interface MatchableItem {
  subcategory?: string
  color_primary?: string
}

/**
 * Gold-Match: Anteil der Exemplar-Subkategorien, die das Outfit abdeckt.
 * Volltreffer (alle Slots) = 1.0; Farb-Hints verstärken bis 1.2.
 * Rückgabe: bestes Match-Ergebnis über alle aktiven Stile.
 */
export function exemplarMatch(
  items: MatchableItem[], activeStyles: string[]
): { score: number; name: string | null } {
  const subcats = new Set(items.map(i => i.subcategory ?? ''))
  const colors  = new Set(items.map(i => (i.color_primary ?? '').toLowerCase()))
  let best = 0
  let bestName: string | null = null

  const styles = activeStyles.length ? activeStyles : Object.keys(GOLD_EXEMPLARS)
  for (const style of styles) {
    for (const ex of GOLD_EXEMPLARS[style] ?? []) {
      const hit = ex.subcats.filter(s => subcats.has(s)).length / ex.subcats.length
      if (hit < 0.75) continue   // mind. 3 von 4 Slots
      let score = hit
      if (ex.colors?.length) {
        const colorHit = ex.colors.some(c => [...colors].some(ic => ic.includes(c)))
        if (colorHit) score = Math.min(1.2, score + 0.2)
      }
      if (score > best) { best = score; bestName = ex.name }
    }
  }
  return { score: best, name: bestName }
}

/**
 * Anti-Match: prüft ob das Outfit ein dokumentiertes Anti-Exemplar enthält.
 * Alle Subkategorien des Anti-Exemplars müssen gleichzeitig vorkommen
 * (plus Farb-Bedingung falls definiert).
 */
export function antiExemplarMatch(
  items: MatchableItem[], activeStyles: string[]
): { hit: boolean; name: string | null; note: string | null } {
  const subcats = new Set(items.map(i => i.subcategory ?? ''))
  const colors  = [...new Set(items.map(i => (i.color_primary ?? '').toLowerCase()))]

  const pools = ['global', ...activeStyles]
  for (const pool of pools) {
    for (const anti of ANTI_EXEMPLARS[pool] ?? []) {
      const allPresent = anti.subcats.every(s => subcats.has(s))
      if (!allPresent) continue
      if (anti.colors?.length) {
        const colorHit = anti.colors.some(c => colors.some(ic => ic.includes(c)))
        if (!colorHit) continue
      }
      return { hit: true, name: anti.name, note: anti.note }
    }
  }
  return { hit: false, name: null, note: null }
}
