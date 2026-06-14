// Direct port of backend/app/services/style_tagger.py

interface CategoryDef {
  parent: string
  display: string
  style_tags: string[]
  seasons: string[]
  formality: number
  description: string
}

export const CATEGORIES: Record<string, CategoryDef> = {

  // ── OBERKÖRPER ──────────────────────────────────────────────────────────────
  oxford_hemd:        { parent:'tops', display:'Oxford-Hemd',                  style_tags:['classic','formal','business'],                          seasons:['spring','summer','autumn','winter'], formality:4, description:'Button-Down Oxford — der Klassiker für Business & Smart Casual' },
  leinenhemd:         { parent:'tops', display:'Leinenhemd',                   style_tags:['classic','casual','smart_casual'],                      seasons:['spring','summer'],                   formality:2, description:'Leicht, luftig — ideal für Sommer und Urlaub' },
  flanellhemd:        { parent:'tops', display:'Flanellhemd',                  style_tags:['casual','british','classic'],                           seasons:['autumn','winter'],                   formality:2, description:'Weiches Baumwollgewebe — Countryside-Klassiker aus Schottland und Wales' },
  poloshirt:          { parent:'tops', display:'Poloshirt',                    style_tags:['classic','casual','smart_casual'],                      seasons:['spring','summer'],                   formality:2, description:'Gepflegtes Casual — zwischen T-Shirt und Hemd' },
  strickpullover_rund:{ parent:'tops', display:'Strickpullover (Rundhals)',    style_tags:['classic','casual','old_money','smart_casual'],          seasons:['autumn','winter'],                   formality:2, description:'Crewneck — zeitlos, perfekt über Oxford-Hemd' },
  strickpullover_v:   { parent:'tops', display:'Strickpullover (V-Ausschnitt)',style_tags:['classic','smart_casual','old_money','smart_casual'], seasons:['autumn','winter'],                   formality:3, description:'V-Neck — eleganter als Rundhals, gut mit Hemd darunter' },
  troyer:             { parent:'tops', display:'Troyer / Half-Zip',            style_tags:['classic','casual','smart_casual','old_money'],          seasons:['autumn','winter'],                   formality:2, description:'Half-Zip Pullover — sportlich-eleganter Layering-Piece' },
  rollkragen:         { parent:'tops', display:'Rollkragenpullover',           style_tags:['classic','smart_casual','old_money'],                  seasons:['autumn','winter'],                   formality:3, description:'Sophisticated — Old Money Klassiker, ersetzt das Hemd' },
  strickweste:        { parent:'tops', display:'Strickweste (Ärmellos)',       style_tags:['classic','smart_casual','old_money','business'],        seasons:['spring','autumn','winter'],          formality:3, description:'Sleeveless Knit — ideal über Hemd, klassisch britisch' },
  weste:              { parent:'tops', display:'Weste (Gilet)',                style_tags:['classic','formal','business','old_money'],             seasons:['spring','autumn','winter'],          formality:4, description:'Teil des 3-Teilers — hochgradig formal und elegant' },
  t_shirt:            { parent:'tops', display:'T-Shirt (plain)',              style_tags:['casual'],                                              seasons:['spring','summer'],                   formality:1, description:'Basis-Layer — nur in hochwertigen Neutralfarben empfohlen' },

  // ── JACKEN & MÄNTEL ─────────────────────────────────────────────────────────
  blazer:             { parent:'outerwear', display:'Blazer',                  style_tags:['classic','business','formal','smart_casual'],           seasons:['spring','autumn','winter'],          formality:4, description:'Universeller Elevator — hebt jedes Outfit eine Stufe an' },
  sakko:              { parent:'outerwear', display:'Sakko / Sport Coat',      style_tags:['classic','smart_casual','smart_casual'],             seasons:['spring','autumn','winter'],          formality:3, description:'Ungefütterter Blazer — lässiger als klassischer Blazer' },
  tweed_sakko:        { parent:'outerwear', display:'Tweed-Sakko',             style_tags:['classic','british','old_money','smart_casual'],         seasons:['autumn','winter'],                   formality:3, description:'Britischer Klassiker — Herringbone/Houndstooth, zeitlos' },
  wollmantel:         { parent:'outerwear', display:'Wollmantel / Overcoat',   style_tags:['classic','formal','old_money'],                        seasons:['autumn','winter'],                   formality:4, description:'Der eleganteste Mantel — Kaschmir oder Wolle' },
  peacoat:            { parent:'outerwear', display:'Peacoat',                 style_tags:['classic','casual','smart_casual','british'],            seasons:['autumn','winter'],                   formality:3, description:'Maritimer Ursprung — navy oder schwarz, sehr vielseitig' },
  trenchcoat:         { parent:'outerwear', display:'Trenchcoat',              style_tags:['classic','formal','british'],                           seasons:['spring','autumn'],                   formality:4, description:'Britisch par excellence — Beige/Camel über allem' },
  dufflecoat:         { parent:'outerwear', display:'Dufflecoat',              style_tags:['classic','british','old_money','casual'],              seasons:['autumn','winter'],                   formality:2, description:'Montgomery-Mantel — Toggle-Verschluss, ikonisch britisch seit WWII' },
  harrington:         { parent:'outerwear', display:'Harrington-Jacke',        style_tags:['classic','british','casual','smart_casual'],            seasons:['spring','autumn'],                   formality:2, description:'Leichte Blouson-Jacke mit Reißverschluss — Mod-Klassiker seit den 1930ern' },
  field_jacket:       { parent:'outerwear', display:'Field-Jacket',            style_tags:['casual','british'],                                    seasons:['spring','autumn'],                   formality:1, description:'Militärischer Heritage-Look — M65-Stil, viele Taschen' },
  gesteppte_weste:    { parent:'outerwear', display:'Gesteppte Weste / Gilet', style_tags:['casual','british','classic'],                          seasons:['autumn','winter'],                   formality:2, description:'Quilted Gilet — Countryside-Essenzial, über Hemd oder Pullover' },
  strickjacke:        { parent:'outerwear', display:'Strickjacke / Cardigan',  style_tags:['classic','casual','old_money','smart_casual'],          seasons:['spring','autumn','winter'],          formality:2, description:'Old Money Staple — über Hemd oder unter Blazer' },
  wachsjacke:         { parent:'outerwear', display:'Wachsjacke',              style_tags:['british','old_money','classic','casual'],               seasons:['autumn','winter','spring'],          formality:2, description:'Barbour-Stil — englisches Countryside-Ikonenstück, wetterfest und zeitlos' },

  // ── HOSEN ──────────────────────────────────────────────────────────────────
  chino:              { parent:'bottoms', display:'Chino',                     style_tags:['classic','smart_casual','smart_casual'],             seasons:['spring','summer','autumn','winter'], formality:3, description:'Universalwaffe — die beste Grundlage für Smart Casual' },
  anzughose:          { parent:'bottoms', display:'Anzughose',                 style_tags:['formal','business','classic'],                          seasons:['spring','autumn','winter'],          formality:5, description:'Hochgradig formal — mit Blazer oder Sakko' },
  wollhose:           { parent:'bottoms', display:'Wollhose',                  style_tags:['classic','formal','old_money','british'],              seasons:['autumn','winter'],                   formality:4, description:'Wollgewebe, ungefüttert — vielseitiger als Anzughose, Old-Money-Kernstück' },
  flanellhose:        { parent:'bottoms', display:'Flanellhose',               style_tags:['classic','formal','old_money','british'],              seasons:['autumn','winter'],                   formality:4, description:'Grey Flannels — britische Menswear-Ikone, mit Brogue oder Loafer' },
  jeans_dunkel:       { parent:'bottoms', display:'Jeanshose (Regular Fit)',  style_tags:['classic','casual','smart_casual'],                      seasons:['spring','summer','autumn','winter'], formality:2, description:'Klassische Jeanshose — vielseitiger Grundstein für Casual und Smart Casual, z. B. mit Blazer und Brogue' },
  cord_hose:          { parent:'bottoms', display:'Cordhose',                  style_tags:['british','classic','casual'],                          seasons:['autumn','winter'],                   formality:2, description:'Britische Countryside-Seele — Braun, Grün, Beige' },
  leinenhose:         { parent:'bottoms', display:'Leinenhose',                style_tags:['classic','casual','old_money'],                        seasons:['spring','summer'],                   formality:2, description:'Mediterrane Eleganz — perfekt im Sommer' },

  // ── SCHUHE ─────────────────────────────────────────────────────────────────
  oxford_schuh:       { parent:'shoes', display:'Oxford-Schuh',                style_tags:['classic','formal','business'],                          seasons:['spring','summer','autumn','winter'], formality:5, description:'Der formalste Schuh — Cap-Toe, Wholecut oder Plain' },
  derby:              { parent:'shoes', display:'Derby',                       style_tags:['classic','business','smart_casual'],                    seasons:['spring','summer','autumn','winter'], formality:4, description:'Etwas lässiger als Oxford — vielseitiger Allrounder' },
  brogue:             { parent:'shoes', display:'Brogue',                      style_tags:['classic','british','smart_casual'],                     seasons:['spring','autumn','winter'],          formality:3, description:'Britisch durch und durch — Lochverzierungen, sehr elegant' },
  loafer:             { parent:'shoes', display:'Loafer',                      style_tags:['classic','smart_casual','old_money'],                  seasons:['spring','summer','autumn'],          formality:3, description:'Old Money Schuh Nr. 1 — Penny Loafer oder Tassel' },
  penny_loafer:       { parent:'shoes', display:'Penny Loafer',                style_tags:['classic','old_money','smart_casual'],                  seasons:['spring','summer','autumn'],          formality:3, description:'The Standard Formula: Navy Blazer + Khaki + Penny Loafer' },
  tassel_loafer:      { parent:'shoes', display:'Tassel Loafer',               style_tags:['classic','old_money','british','smart_casual'],         seasons:['spring','summer','autumn'],          formality:3, description:'Fransen-Loafer — Quintessenz britischen Old-Money-Stils' },
  chelsea_boot:       { parent:'shoes', display:'Chelsea Boot',                style_tags:['classic','smart_casual','casual','british'],            seasons:['autumn','winter','spring'],          formality:3, description:'Britischer Klassiker — vielseitig von Jeans bis Chino' },
  chukka_boot:        { parent:'shoes', display:'Chukka Boot / Desert Boot',   style_tags:['classic','casual','british'],                          seasons:['autumn','winter','spring'],          formality:2, description:'Zwei Ösen, Knöchelhöhe — Clarks-Ursprung, ungekünstelte Eleganz' },
  monkstrap:          { parent:'shoes', display:'Monkstrap',                   style_tags:['classic','business','formal','old_money'],             seasons:['spring','summer','autumn','winter'], formality:4, description:'Charakterstück — Single oder Double Monk, sehr stilbewusst' },
  boots:              { parent:'shoes', display:'Stiefel (Boots)',             style_tags:['casual','classic','british'],                           seasons:['autumn','winter'],                   formality:2, description:'Kniehoch oder knöchelhoch — robust und vielseitig für Herbst/Winter' },
  sneaker_minimal:    { parent:'shoes', display:'Sneaker (minimal/clean)',     style_tags:['casual','minimalist','smart_casual'],                  seasons:['spring','summer','autumn'],          formality:1, description:'Nur in Weiß oder solid Neutral — clean, kein Logo' },
  summer_loafer:      { parent:'shoes', display:'Summer Loafer',               style_tags:['classic','old_money','smart_casual','casual'],          seasons:['spring','summer'],                   formality:2, description:'Leichter Loafer ohne Socken — Old Money Sommer-Essenzial, Riviera & Ivy League' },

  // ── ACCESSOIRES ─────────────────────────────────────────────────────────────
  krawatte:           { parent:'accessories', display:'Krawatte',              style_tags:['formal','classic','business'],                          seasons:['spring','summer','autumn','winter'], formality:5, description:'Maximale Formalität — Seide, Wolle oder Strick' },
  einstecktuch:       { parent:'accessories', display:'Einstecktuch / Pocket Square', style_tags:['classic','formal','old_money'],                seasons:['spring','summer','autumn','winter'], formality:4, description:'Das Detail das Kenner erkennen — nie passend zur Krawatte' },
  guertel_leder:      { parent:'accessories', display:'Ledergürtel',           style_tags:['classic','formal'],                                    seasons:['spring','summer','autumn','winter'], formality:3, description:'Regel: Gürtelfarbe = Schuhfarbe — immer' },
  uhr_klassisch:      { parent:'accessories', display:'Uhr (klassisch)',       style_tags:['classic','old_money'],                                 seasons:['spring','summer','autumn','winter'], formality:3, description:'Leder- oder Metallband — schlicht, keine Smartwatch' },
  schal_kaschmir:     { parent:'accessories', display:'Schal (Wolle/Kaschmir)',style_tags:['classic','old_money','british'],                       seasons:['autumn','winter'],                   formality:3, description:'Old Money Signature — Kaschmir in Camel oder Navy' },
  muetze_woll:        { parent:'accessories', display:'Wollmütze',             style_tags:['casual','classic'],                                    seasons:['winter'],                            formality:1, description:'Nur in Neutralfarben — nicht mit formellen Outfits' },
  leder_handschuhe:   { parent:'accessories', display:'Leder-Handschuhe',     style_tags:['classic','british','old_money'],                       seasons:['winter'],                            formality:3, description:'Britisches Refinement — ungefüttert oder Kaschmir-gefüttert' },
}

// COLOR_BOOST_RULES: ergänzen Item-Basis-Tags wenn Farbe + Kategorie zusammen
// eine stilistische Aussage verstärken.
//
// Prinzipien:
//  [farbe, null, tags]      → Farbe allein gibt jedem Item diesen Tag-Boost
//  [null, kategorie, tags]  → Kategorie gibt immer diesen Boost (farb-unabhängig)
//  [farbe, kategorie, tags] → Nur bei spezifischer Combo sinnvoll, sparsam einsetzen
//
const COLOR_BOOST_RULES: Array<[string|null, string|null, string[]]> = [

  // Farb-Familie → Old Money (diese Farbtöne signalisieren Old Money unabhängig vom Stück)
  ['camel',         null, ['old_money']],
  ['cream',         null, ['old_money']],
  ['ivory',         null, ['old_money']],
  ['tan',           null, ['old_money']],
  ['sand',          null, ['old_money']],

  // Navy → Classic (navy ist die klassischste Farbe im Herrenschrank)
  ['navy',          null, ['classic']],

  // Britische Signal-Farbtöne
  ['burgundy',      null, ['british', 'classic']],
  ['bordeaux',      null, ['british', 'classic']],
  ['oxblood',       null, ['british']],
  ['forest green',  null, ['british']],
  ['olive',         null, ['british']],
  ['brown',         null, ['british']],

  // Spezifische Farb+Kategorie-Combos (nur wo Farbe die Stil-Bedeutung deutlich verändert)
  ['navy',          'blazer',      ['old_money']],  // Navy Blazer ist stärker als navy allein → old_money
  ['navy',          'sakko',       ['old_money']],
  ['navy',          'peacoat',     ['british']],
  ['grey',          'flanellhose', ['british', 'old_money']],  // Grey Flannels = britische Menswear-Ikone
  ['grey',          'wollhose',    ['british', 'old_money']],
  ['charcoal',      'anzughose',   ['old_money']],

  // Kategorie-Boosts (farb-unabhängig — das Kleidungsstück ist per se britisch/old money)
  [null, 'tweed_sakko',      ['british']],
  [null, 'flanellhose',      ['british']],
  [null, 'wollhose',         ['british', 'old_money']],
  [null, 'cord_hose',        ['british']],
  [null, 'trenchcoat',       ['british']],
  [null, 'peacoat',          ['british']],
  [null, 'dufflecoat',       ['british']],
  [null, 'harrington',       ['british']],
  [null, 'field_jacket',     ['british']],
  [null, 'flanellhemd',      ['british']],
  [null, 'gesteppte_weste',  ['british']],
  [null, 'wachsjacke',       ['british', 'old_money']],
  [null, 'chelsea_boot',     ['british']],
  [null, 'chukka_boot',      ['british']],
  [null, 'boots',            ['british']],
  [null, 'tassel_loafer',    ['old_money']],
  [null, 'einstecktuch',     ['old_money']],
  [null, 'schal_kaschmir',   ['old_money']],
  [null, 'leder_handschuhe', ['british']],
  [null, 'strickweste',      ['old_money']],
]

// ─── Blueprint v3.0: 6-Archetyp-Scores pro Kleidungsstück ───────────────────
//
// Basis-Scores (0–100) pro Subkategorie für alle 6 Archetypen.
// Spalten: old_money (om), british_countryside (bc), english_gentleman (eg),
//          smart_casual (sc), riviera (ri), ivy_league (il)
// Merge-Logik: bc = max(alt:old_england, alt:rugged_classic)
//              eg = alt:business_formal
//              sc = max(alt:smart_casual, alt:smart_casual)

const ARCHETYPE_BASE_SCORES: Record<string, Record<string, number>> = {
  // ── OBERKÖRPER ──────────────────────────────────────────────────────────────
  oxford_hemd:          { old_money:45, british_countryside:55, english_gentleman:60, smart_casual:80, riviera:65, ivy_league:95, italian_elegance:60 },
  leinenhemd:           { old_money:65, british_countryside:30, english_gentleman:10, smart_casual:75, riviera:90, ivy_league:60, italian_elegance:90 },
  flanellhemd:          { old_money:30, british_countryside:85, english_gentleman:10, smart_casual:55, riviera:10, ivy_league:40, italian_elegance:15 },
  poloshirt:            { old_money:50, british_countryside:30, english_gentleman:10, smart_casual:70, riviera:65, ivy_league:75, italian_elegance:80 },
  strickpullover_rund:  { old_money:80, british_countryside:65, english_gentleman:20, smart_casual:65, riviera:30, ivy_league:70, italian_elegance:70 },
  strickpullover_v:     { old_money:75, british_countryside:60, english_gentleman:35, smart_casual:75, riviera:40, ivy_league:75, italian_elegance:70 },
  troyer:               { old_money:55, british_countryside:55, english_gentleman:15, smart_casual:65, riviera:35, ivy_league:60, italian_elegance:45 },
  rollkragen:           { old_money:85, british_countryside:50, english_gentleman:25, smart_casual:75, riviera:40, ivy_league:45, italian_elegance:80 },
  strickweste:          { old_money:75, british_countryside:65, english_gentleman:40, smart_casual:70, riviera:30, ivy_league:70, italian_elegance:60 },
  weste:                { old_money:60, british_countryside:55, english_gentleman:85, smart_casual:55, riviera:20, ivy_league:50, italian_elegance:40 },
  t_shirt:              { old_money:15, british_countryside:45, english_gentleman:0,  smart_casual:60, riviera:40, ivy_league:35, italian_elegance:45 },

  // ── JACKEN & MÄNTEL ─────────────────────────────────────────────────────────
  blazer:               { old_money:70, british_countryside:50, english_gentleman:80, smart_casual:85, riviera:75, ivy_league:85, italian_elegance:85 },
  sakko:                { old_money:65, british_countryside:55, english_gentleman:50, smart_casual:85, riviera:70, ivy_league:75, italian_elegance:90 },
  tweed_sakko:          { old_money:70, british_countryside:95, english_gentleman:30, smart_casual:70, riviera:15, ivy_league:60, italian_elegance:35 },
  wollmantel:           { old_money:85, british_countryside:70, english_gentleman:75, smart_casual:65, riviera:30, ivy_league:55, italian_elegance:75 },
  peacoat:              { old_money:55, british_countryside:70, english_gentleman:30, smart_casual:65, riviera:45, ivy_league:65, italian_elegance:45 },
  trenchcoat:           { old_money:70, british_countryside:80, english_gentleman:65, smart_casual:70, riviera:50, ivy_league:55, italian_elegance:55 },
  dufflecoat:           { old_money:65, british_countryside:80, english_gentleman:20, smart_casual:55, riviera:20, ivy_league:60, italian_elegance:30 },
  harrington:           { old_money:35, british_countryside:70, english_gentleman:5,  smart_casual:70, riviera:55, ivy_league:60, italian_elegance:40 },
  field_jacket:         { old_money:15, british_countryside:80, english_gentleman:0,  smart_casual:50, riviera:15, ivy_league:30, italian_elegance:20 },
  gesteppte_weste:      { old_money:40, british_countryside:80, english_gentleman:5,  smart_casual:45, riviera:15, ivy_league:50, italian_elegance:20 },
  strickjacke:          { old_money:75, british_countryside:65, english_gentleman:15, smart_casual:70, riviera:50, ivy_league:65, italian_elegance:75 },
  wachsjacke:           { old_money:75, british_countryside:95, english_gentleman:5,  smart_casual:55, riviera:10, ivy_league:25, italian_elegance:15 },

  // ── HOSEN ───────────────────────────────────────────────────────────────────
  chino:                { old_money:60, british_countryside:55, english_gentleman:20, smart_casual:80, riviera:65, ivy_league:85, italian_elegance:75 },
  anzughose:            { old_money:65, british_countryside:45, english_gentleman:90, smart_casual:60, riviera:30, ivy_league:55, italian_elegance:70 },
  wollhose:             { old_money:80, british_countryside:80, english_gentleman:70, smart_casual:75, riviera:35, ivy_league:55, italian_elegance:75 },
  flanellhose:          { old_money:85, british_countryside:85, english_gentleman:65, smart_casual:70, riviera:30, ivy_league:50, italian_elegance:75 },
  jeans_dunkel:         { old_money:35, british_countryside:85, english_gentleman:5,  smart_casual:90, riviera:45, ivy_league:65, italian_elegance:50 },
  cord_hose:            { old_money:40, british_countryside:85, english_gentleman:10, smart_casual:55, riviera:20, ivy_league:55, italian_elegance:40 },
  leinenhose:           { old_money:70, british_countryside:25, english_gentleman:10, smart_casual:65, riviera:90, ivy_league:65, italian_elegance:90 },

  // ── SCHUHE ──────────────────────────────────────────────────────────────────
  oxford_schuh:         { old_money:70, british_countryside:60, english_gentleman:95, smart_casual:65, riviera:25, ivy_league:55, italian_elegance:55 },
  derby:                { old_money:65, british_countryside:65, english_gentleman:75, smart_casual:80, riviera:35, ivy_league:60, italian_elegance:60 },
  brogue:               { old_money:70, british_countryside:90, english_gentleman:45, smart_casual:75, riviera:30, ivy_league:65, italian_elegance:40 },
  loafer:               { old_money:80, british_countryside:50, english_gentleman:40, smart_casual:70, riviera:85, ivy_league:75, italian_elegance:95 },
  penny_loafer:         { old_money:80, british_countryside:50, english_gentleman:40, smart_casual:70, riviera:80, ivy_league:90, italian_elegance:85 },
  tassel_loafer:        { old_money:85, british_countryside:65, english_gentleman:45, smart_casual:65, riviera:75, ivy_league:70, italian_elegance:85 },
  chelsea_boot:         { old_money:55, british_countryside:75, english_gentleman:30, smart_casual:80, riviera:35, ivy_league:50, italian_elegance:60 },
  chukka_boot:          { old_money:45, british_countryside:70, english_gentleman:20, smart_casual:65, riviera:30, ivy_league:55, italian_elegance:50 },
  monkstrap:            { old_money:70, british_countryside:55, english_gentleman:75, smart_casual:70, riviera:40, ivy_league:50, italian_elegance:65 },
  boots:                { old_money:25, british_countryside:80, english_gentleman:10, smart_casual:55, riviera:15, ivy_league:30, italian_elegance:20 },
  sneaker_minimal:      { old_money:20, british_countryside:30, english_gentleman:5,  smart_casual:85, riviera:40, ivy_league:60, italian_elegance:45 },
  summer_loafer:        { old_money:90, british_countryside:30, english_gentleman:25, smart_casual:70, riviera:90, ivy_league:75, italian_elegance:95 },

  // ── ACCESSOIRES ─────────────────────────────────────────────────────────────
  krawatte:             { old_money:55, british_countryside:60, english_gentleman:95, smart_casual:55, riviera:15, ivy_league:70, italian_elegance:60 },
  einstecktuch:         { old_money:80, british_countryside:65, english_gentleman:75, smart_casual:55, riviera:55, ivy_league:60, italian_elegance:80 },
  guertel_leder:        { old_money:55, british_countryside:50, english_gentleman:65, smart_casual:60, riviera:40, ivy_league:55, italian_elegance:60 },
  uhr_klassisch:        { old_money:75, british_countryside:60, english_gentleman:70, smart_casual:65, riviera:65, ivy_league:65, italian_elegance:80 },
  schal_kaschmir:       { old_money:85, british_countryside:75, english_gentleman:50, smart_casual:60, riviera:30, ivy_league:65, italian_elegance:70 },
  muetze_woll:          { old_money:30, british_countryside:55, english_gentleman:5,  smart_casual:50, riviera:10, ivy_league:45, italian_elegance:15 },
  leder_handschuhe:     { old_money:70, british_countryside:80, english_gentleman:55, smart_casual:50, riviera:15, ivy_league:55, italian_elegance:50 },
}

// Farb-Modifikatoren: addieren/subtrahieren je Archetyp (Klammer: [min 0, max 100])
const COLOR_ARCHETYPE_MODIFIERS: Record<string, Partial<Record<string, number>>> = {
  camel:           { old_money:+15, riviera:+5, italian_elegance:+8 },
  cream:           { old_money:+12, riviera:+8, italian_elegance:+10 },
  ivory:           { old_money:+12, riviera:+5, italian_elegance:+8 },
  sand:            { old_money:+8,  riviera:+10, italian_elegance:+8 },
  ecru:            { old_money:+10, riviera:+8, italian_elegance:+8 },
  taupe:           { old_money:+10 },
  navy:            { old_money:+5,  ivy_league:+5, english_gentleman:+5 },
  grey:            { english_gentleman:+5, smart_casual:+5 },
  charcoal:        { english_gentleman:+8 },
  anthracite:      { english_gentleman:+8 },
  olive:           { british_countryside:+10 },
  brown:           { british_countryside:+8, italian_elegance:+8 },
  'light brown':   { british_countryside:+5 },
  tan:             { british_countryside:+5, old_money:+5, italian_elegance:+8 },
  burgundy:        { british_countryside:+10, ivy_league:+5, smart_casual:+5 },
  bordeaux:        { british_countryside:+10, ivy_league:+5 },
  oxblood:         { british_countryside:+8 },
  'forest green':  { british_countryside:+12 },
  white:           { riviera:+8,  ivy_league:+5, italian_elegance:+5 },
  'light blue':    { riviera:+10, ivy_league:+5, italian_elegance:+8 },
  coral:           { riviera:+8 },
  rust:            { british_countryside:+10, italian_elegance:+10 },
  black:           { old_money:-10, british_countryside:-5, riviera:-20, italian_elegance:-20 },
  tobacco:         { italian_elegance:+15, old_money:+5 },
  terracotta:      { italian_elegance:+12, riviera:+8 },
  ochre:           { italian_elegance:+10 },
  'mid blue':      { italian_elegance:+12, riviera:+5 },
  'bottle green':  { italian_elegance:+8, british_countryside:+5 },
  sage:            { italian_elegance:+8, riviera:+5 },
  'dusty rose':    { italian_elegance:+6, old_money:+5 },
}

// Muster-Modifikatoren
const PATTERN_ARCHETYPE_MODIFIERS: Record<string, Partial<Record<string, number>>> = {
  herringbone:    { british_countryside:+12, old_money:+5 },
  check:          { british_countryside:+10, ivy_league:+5 },
  fine_check:     { british_countryside:+8,  ivy_league:+5 },
  houndstooth:    { british_countryside:+12 },
  stripe:         { ivy_league:+8, english_gentleman:+5 },
  solid:          { old_money:+5,  smart_casual:+5, italian_elegance:+5 },
  subtle_texture: { old_money:+5, italian_elegance:+8 },
  madras:         { ivy_league:+10 },
  plaid:          { british_countryside:+8 },
  solid_textured: { italian_elegance:+8 },
}

const ALL_ARCHETYPES = ['old_money','british_countryside','english_gentleman','smart_casual','riviera','ivy_league','italian_elegance']

/**
 * Berechnet 8-Archetyp-Scores (0–100) für ein Kleidungsstück.
 * Blueprint Phase 2 — Merkmals-Vektor style_scores.
 */
export function computeArchetypeScores(categoryKey: string, colorPrimary: string, pattern?: string): Record<string, number> {
  const base = ARCHETYPE_BASE_SCORES[categoryKey]
  const scores: Record<string, number> = {}

  for (const arch of ALL_ARCHETYPES) {
    scores[arch] = base?.[arch] ?? 30
  }

  const colorKey = colorPrimary.toLowerCase().trim()
  const colorMods = COLOR_ARCHETYPE_MODIFIERS[colorKey]
  if (colorMods) {
    for (const [arch, delta] of Object.entries(colorMods)) {
      if (delta == null) continue
      scores[arch] = Math.max(0, Math.min(100, (scores[arch] ?? 30) + delta))
    }
  }

  if (pattern) {
    const patMods = PATTERN_ARCHETYPE_MODIFIERS[pattern.toLowerCase()]
    if (patMods) {
      for (const [arch, delta] of Object.entries(patMods)) {
        if (delta == null) continue
        scores[arch] = Math.max(0, Math.min(100, (scores[arch] ?? 30) + delta))
      }
    }
  }

  return scores
}

// ─── Hybrid-System: Bridge-Stile pro Subkategorie ────────────────────────────
// Deterministisch aus subcategory abgeleitet — kein Vision API, kein externer Dienst.
// Ein Item kann mehrere Bridge-Stile haben: das macht es zum Brücken-Item für Hybrid-Outfits.

export const ITEM_BRIDGE_STYLES: Record<string, string[]> = {
  chelsea_boot:       ['smart_casual', 'british_countryside', 'ivy_league'],
  brogue:             ['british_countryside', 'ivy_league', 'smart_casual', 'old_money'],
  penny_loafer:       ['ivy_league', 'old_money', 'smart_casual', 'riviera'],
  loafer:             ['old_money', 'smart_casual', 'riviera', 'ivy_league'],
  tassel_loafer:      ['old_money', 'british_countryside', 'smart_casual'],
  derby:              ['smart_casual', 'british_countryside', 'ivy_league', 'english_gentleman'],
  oxford_schuh:       ['english_gentleman', 'old_money'],
  monkstrap:          ['smart_casual', 'old_money', 'english_gentleman'],
  chukka_boot:        ['british_countryside', 'smart_casual'],
  boots:              ['british_countryside', 'smart_casual'],
  sneaker_minimal:    ['smart_casual', 'ivy_league'],
  summer_loafer:      ['old_money', 'riviera', 'smart_casual', 'ivy_league'],
  oxford_hemd:        ['ivy_league', 'smart_casual', 'old_money', 'english_gentleman'],
  leinenhemd:         ['riviera', 'smart_casual', 'old_money', 'ivy_league'],
  flanellhemd:        ['british_countryside', 'smart_casual'],
  poloshirt:          ['ivy_league', 'smart_casual', 'riviera', 'old_money'],
  rollkragen:         ['old_money', 'smart_casual', 'english_gentleman'],
  strickpullover_rund:['old_money', 'smart_casual', 'british_countryside', 'ivy_league'],
  strickpullover_v:   ['smart_casual', 'old_money', 'ivy_league', 'english_gentleman'],
  strickweste:        ['british_countryside', 'smart_casual', 'old_money', 'ivy_league'],
  weste:              ['english_gentleman', 'smart_casual', 'old_money'],
  troyer:             ['smart_casual', 'old_money', 'riviera'],
  t_shirt:            ['smart_casual', 'riviera'],
  blazer:             ['ivy_league', 'smart_casual', 'old_money', 'english_gentleman'],
  sakko:              ['smart_casual', 'old_money', 'british_countryside', 'english_gentleman'],
  tweed_sakko:        ['british_countryside', 'old_money', 'smart_casual'],
  wollmantel:         ['old_money', 'english_gentleman', 'british_countryside'],
  peacoat:            ['smart_casual', 'british_countryside', 'ivy_league'],
  trenchcoat:         ['smart_casual', 'british_countryside', 'old_money', 'english_gentleman'],
  dufflecoat:         ['british_countryside', 'ivy_league', 'smart_casual'],
  harrington:         ['smart_casual', 'ivy_league', 'british_countryside'],
  field_jacket:       ['british_countryside', 'smart_casual'],
  gesteppte_weste:    ['british_countryside', 'smart_casual'],
  strickjacke:        ['old_money', 'smart_casual', 'ivy_league'],
  wachsjacke:         ['british_countryside', 'old_money', 'smart_casual'],
  chino:              ['ivy_league', 'smart_casual', 'old_money', 'english_gentleman'],
  anzughose:          ['english_gentleman', 'old_money'],
  wollhose:           ['old_money', 'british_countryside', 'english_gentleman'],
  flanellhose:        ['british_countryside', 'old_money', 'english_gentleman'],
  jeans_dunkel:       ['smart_casual', 'ivy_league'],
  cord_hose:          ['british_countryside', 'smart_casual', 'ivy_league'],
  leinenhose:         ['riviera', 'old_money', 'smart_casual'],
  krawatte:           ['english_gentleman', 'ivy_league', 'old_money'],
  einstecktuch:       ['english_gentleman', 'old_money', 'smart_casual'],
  guertel_leder:      ['english_gentleman', 'smart_casual', 'old_money'],
  uhr_klassisch:      ['old_money', 'smart_casual', 'english_gentleman'],
  schal_kaschmir:     ['old_money', 'british_countryside', 'smart_casual'],
}

// ─── Gap 9: Weatherproof-Subkategorien ────────────────────────────────────────
// Items die bei Regen bevorzugt werden (weatherproof=true).
// Geschlossene Lederschuhe > Loafer; Wachsjacke > offene Jacken.

const WEATHERPROOF_SUBCATS = new Set([
  'wachsjacke',    // Barbour-Stil — explizit wetterfest
  'trenchcoat',    // Belted — wetterfest per Konstruktion
  'oxford_schuh',  // Geschlossene Lederschuhe
  'derby',         // Geschlossene Lederschuhe
  'chelsea_boot',  // Geschlossene Stiefel
  'wollmantel',    // Overcoat — schützt vor Nässe
  'peacoat',       // Dichtes Wollgewebe
])

// ─── Blueprint v2.0 Phase 2: Sprezzatura-Exceptions pro Subkategorie ──────────
// Loafer → no_socks_ok (OLD MONEY + RIVIERA Fix)
// Leinenhemd → open_collar_ok (RIVIERA Fix)

const SPREZZATURA_EXCEPTIONS_MAP: Record<string, string[]> = {
  loafer:        ['no_socks_ok', 'open_collar_ok'],
  penny_loafer:  ['no_socks_ok'],
  tassel_loafer: ['no_socks_ok'],
  summer_loafer: ['no_socks_ok', 'open_collar_ok'],
  leinenhemd:    ['open_collar_ok'],
  oxford_hemd:   ['open_collar_ok'],
  poloshirt:     ['open_collar_ok'],
}

// ─── Blueprint v2.0 Phase 2: Context-Overrides auf Item-Ebene ────────────────
// Tweed-Sakko: in Riviera-Context (Capri-Look 1960s) → old_money score boost
const ITEM_CONTEXT_OVERRIDES: Record<string, Record<string, Record<string, number>>> = {
  tweed_sakko: { riviera: { riviera: 35, british_countryside: 90, italian_elegance:35 } },
  flanellhose:  { riviera: { riviera: 25, british_countryside: 85, italian_elegance:75 } },
}

export function tagItem(categoryKey: string, color: string) {
  const cat: CategoryDef = CATEGORIES[categoryKey] ?? {
    parent: 'tops',
    display: categoryKey.replace(/_/g, ' '),
    style_tags: ['casual'],
    seasons: ['spring','summer','autumn','winter'],
    formality: 2,
    description: '',
  }

  const styleTags = [...cat.style_tags]
  const colorLower = color.toLowerCase().trim()

  for (const [ruleColor, ruleCat, extraTags] of COLOR_BOOST_RULES) {
    const colorMatch = ruleColor === null || colorLower === ruleColor
    const catMatch   = ruleCat === null   || categoryKey === ruleCat
    if (colorMatch && catMatch) {
      for (const tag of extraTags) {
        if (!styleTags.includes(tag)) styleTags.push(tag)
      }
    }
  }

  const style_scores = computeArchetypeScores(categoryKey, colorLower)
  const formality_base = cat.formality * 20

  // Blueprint v2.0: anchor_eligible=true für ALLE Kategorien (nicht nur Hosen/Sakkos)
  const anchor_eligible = true

  // Blueprint v2.0: Sprezzatura-Exceptions item-spezifisch
  const sprezzatura_exceptions = SPREZZATURA_EXCEPTIONS_MAP[categoryKey] ?? []

  // Blueprint v2.0: Context-Overrides auf Item-Ebene
  const context_overrides = ITEM_CONTEXT_OVERRIDES[categoryKey] ?? {}

  // Gap 9: weatherproof — automatisch für bestimmte Subkategorien
  const weatherproof = WEATHERPROOF_SUBCATS.has(categoryKey)

  /*
   * TAGGING-PHILOSOPHIE (siehe src/data/stylePhilosophy.ts):
   * style_scores sind Affinitätswerte (0–100), keine harten Kategorien.
   * Ein Item kann mehrere hohe Scores haben — das ist gewünscht.
   * bridge_styles ergänzen die style_scores um Verbindungs-Stile.
   * primary_style ist nur der höchste Score — kein Ausschlusskriterium.
   * Items mit hohen Scores in zwei Stilen sind Brücken-Items und
   * besonders wertvoll für Hybrid-Outfits.
   */
  const bridge_styles = ITEM_BRIDGE_STYLES[categoryKey] ?? []
  const primary_style = Object.entries(style_scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  return {
    category:     cat.parent,
    subcategory:  categoryKey,
    display_name: cat.display,
    style_tags:   styleTags,
    season:       cat.seasons,
    formality:    cat.formality,
    formality_base,
    style_scores,
    description:  cat.description,
    anchor_eligible,
    sprezzatura_exceptions,
    context_overrides,
    weatherproof,
    bridge_styles,
    primary_style,
  }
}

export function getAllCategories() {
  const PARENT_ORDER = ['tops','outerwear','bottoms','shoes','accessories']
  const PARENT_LABELS: Record<string,string> = {
    tops:        'Oberkörper',
    outerwear:   'Jacken & Mäntel',
    bottoms:     'Hosen',
    shoes:       'Schuhe',
    accessories: 'Accessoires',
  }

  const groups: Record<string, any[]> = {}
  for (const p of PARENT_ORDER) groups[p] = []

  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (cat.parent in groups) {
      groups[cat.parent].push({
        key,
        display:     cat.display,
        formality:   cat.formality,
        description: cat.description,
      })
    }
  }

  for (const p of PARENT_ORDER) {
    groups[p].sort((a, b) => b.formality - a.formality)
  }

  return PARENT_ORDER
    .filter(p => groups[p].length > 0)
    .map(p => ({ group: PARENT_LABELS[p], parent: p, items: groups[p] }))
}

export function getColorPaletteForUI() {
  const COLOR_HEX: Record<string,string> = {
    'white':'#F5F5F0','cream':'#F5F0E1','ivory':'#F0EBD7','beige':'#C9B49A','sand':'#D2C3A5',
    'camel':'#C19A6B','tan':'#B49164','light brown':'#A07850','brown':'#6D4C41','dark brown':'#461E2E',
    'khaki':'#B4AA82','olive':'#5A6440','forest green':'#326446','sage':'#8CAF8C',
    'navy':'#1A2744','midnight blue':'#141450','cobalt':'#0046B4','light blue':'#ADD2EB',
    'denim blue':'#5578A0','slate':'#64788C','grey':'#969696','charcoal':'#37373C',
    'anthracite':'#2D3237','black':'#141414','burgundy':'#641E32','bordeaux':'#780020',
    'oxblood':'#501414','wine':'#5A1423','rust':'#B45028','coral':'#D2785A',
    'blush':'#DCAFA5','ice blue':'#B9D7E6','lavender':'#C8B9D7',
  }

  return [
    { group:'Neutrals & Weiß',     colors:['white','cream','ivory','beige','sand'] },
    { group:'Erdtöne',              colors:['camel','tan','light brown','brown','dark brown','khaki'] },
    { group:'Grüntöne',             colors:['olive','forest green','sage'] },
    { group:'Blau & Marine',        colors:['navy','midnight blue','cobalt','light blue','denim blue','slate'] },
    { group:'Grau & Schwarz',       colors:['grey','charcoal','anthracite','black'] },
    { group:'Burgund & Dunkeltöne', colors:['burgundy','bordeaux','oxblood','wine'] },
    { group:'Warme Töne & Akzente', colors:['rust','coral','blush','ice blue','lavender'] },
  ].map(g => ({
    group: g.group,
    colors: g.colors
      .filter(n => COLOR_HEX[n])
      .map(n => ({ name: n, hex: COLOR_HEX[n] })),
  }))
}
