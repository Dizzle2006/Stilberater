// StyleAdvisor Classical Menswear Database v4.0 — Colour Pair Database
// All scores extracted directly from PDF Part III.B (pages 23–25).
// Conflicts resolved: later/dedicated section overrides earlier section (rust+navy, sky blue+navy precedent).
// Symmetric lookup: keys are always sorted alphabetically.

export interface ColourPair {
  a: string
  b: string
  score: number
  notes: string
}

const RAW_PAIRS: ColourPair[] = [
  // ─── Navy base ──────────────────────────────────────────────────────────────
  { a: 'navy', b: 'camel',        score: 0.97, notes: 'Old Money hero — always works' },
  { a: 'navy', b: 'cream',        score: 0.95, notes: 'Classic clean' },
  { a: 'navy', b: 'ivory',        score: 0.95, notes: 'Classic clean' },
  { a: 'navy', b: 'ecru',         score: 0.94, notes: 'Crisp nautical' },
  { a: 'navy', b: 'khaki',        score: 0.94, notes: 'Ivy/smart casual staple' },
  { a: 'navy', b: 'sand',         score: 0.94, notes: 'Riviera baseline' },
  { a: 'navy', b: 'white',        score: 0.93, notes: 'Crisp — nautical lean' },
  { a: 'navy', b: 'stone',        score: 0.93, notes: 'Quiet luxury' },
  { a: 'navy', b: 'tan',          score: 0.90, notes: 'Clean warm contrast' },
  { a: 'navy', b: 'rust',         score: 0.88, notes: 'Warm accent on dark base' },
  { a: 'navy', b: 'burgundy',     score: 0.88, notes: 'Rich — as accent' },
  { a: 'navy', b: 'sky blue',     score: 0.87, notes: 'Tonal — needs texture diff' },
  { a: 'navy', b: 'kelly green',  score: 0.86, notes: 'Ivy accent pop' },
  { a: 'navy', b: 'terracotta',   score: 0.86, notes: 'Riviera cross' },
  { a: 'navy', b: 'pale pink',    score: 0.86, notes: 'English classic — OCBD + blazer' },
  { a: 'navy', b: 'pink',         score: 0.86, notes: 'English classic — OCBD + blazer' },
  { a: 'navy', b: 'dusty rose',   score: 0.86, notes: 'English classic — OCBD + blazer' },
  { a: 'navy', b: 'coral',        score: 0.85, notes: 'Coastal contrast' },
  { a: 'navy', b: 'yellow',       score: 0.84, notes: 'Bold Ivy pop' },
  { a: 'navy', b: 'saffron',      score: 0.84, notes: 'Ivy accent pop' },
  { a: 'navy', b: 'olive',        score: 0.83, notes: 'Smart casual standard' },
  { a: 'navy', b: 'mid-grey',     score: 0.92, notes: 'City canonical' },
  { a: 'navy', b: 'grey',         score: 0.92, notes: 'City canonical' },
  { a: 'navy', b: 'forest green', score: 0.72, notes: 'ONE as accent only' },
  { a: 'navy', b: 'dark tan',     score: 0.72, notes: 'Acceptable City' },
  { a: 'navy', b: 'brown',        score: 0.72, notes: 'Acceptable — needs confidence' },
  { a: 'navy', b: 'dark brown',   score: 0.72, notes: 'Acceptable — needs confidence' },
  { a: 'navy', b: 'cobalt',       score: 0.20, notes: 'Too similar — boring' },
  { a: 'navy', b: 'black',        score: 0.25, notes: 'AVOID — broken suit look' },

  // ─── Charcoal base ──────────────────────────────────────────────────────────
  { a: 'charcoal', b: 'pale blue',    score: 0.93, notes: 'Shirt on charcoal suit — very refined' },
  { a: 'charcoal', b: 'light blue',   score: 0.93, notes: 'Shirt on charcoal suit — very refined' },
  { a: 'charcoal', b: 'white',        score: 0.91, notes: 'Business standard' },
  { a: 'charcoal', b: 'cream',        score: 0.90, notes: 'Softer than white' },
  { a: 'charcoal', b: 'burgundy',     score: 0.90, notes: 'Formal authority' },
  { a: 'charcoal', b: 'camel',        score: 0.89, notes: 'Overcoat on suit — elegant' },
  { a: 'charcoal', b: 'stone',        score: 0.89, notes: 'City quiet' },
  { a: 'charcoal', b: 'forest green', score: 0.82, notes: 'Rich — accent only' },
  { a: 'charcoal', b: 'navy',         score: 0.42, notes: 'Too similar — strong fabric contrast needed' },
  { a: 'charcoal', b: 'black',        score: 0.38, notes: 'Avoid' },

  // ─── Mid-grey / grey base ─────────────────────────────────────────────────────
  // DB stores as 'grey' — both 'grey' and 'mid-grey' keys are provided
  { a: 'mid-grey', b: 'white',        score: 0.93, notes: 'Workhorse — suit + shirt' },
  { a: 'grey',     b: 'white',        score: 0.93, notes: 'Workhorse — suit + shirt' },
  { a: 'mid-grey', b: 'navy',         score: 0.92, notes: 'Classic separates' },
  { a: 'mid-grey', b: 'burgundy',     score: 0.91, notes: 'Flannel + tie — the English formula' },
  { a: 'grey',     b: 'burgundy',     score: 0.91, notes: 'Flannel + tie — the English formula' },
  { a: 'mid-grey', b: 'pink',         score: 0.89, notes: 'English classic' },
  { a: 'grey',     b: 'pink',         score: 0.89, notes: 'English classic' },
  { a: 'mid-grey', b: 'dusty rose',   score: 0.88, notes: 'English classic — shirt on suit' },
  { a: 'grey',     b: 'dusty rose',   score: 0.88, notes: 'English classic — shirt on suit' },
  { a: 'mid-grey', b: 'camel',        score: 0.88, notes: 'Warm tonal balance' },
  { a: 'grey',     b: 'camel',        score: 0.88, notes: 'Warm tonal balance' },
  { a: 'mid-grey', b: 'sky blue',     score: 0.85, notes: 'Soft and clean' },
  { a: 'grey',     b: 'sky blue',     score: 0.85, notes: 'Soft and clean' },
  { a: 'grey',     b: 'light blue',   score: 0.85, notes: 'Soft and clean' },
  { a: 'mid-grey', b: 'hunter green', score: 0.85, notes: 'City-country bridge' },
  { a: 'grey',     b: 'hunter green', score: 0.85, notes: 'City-country bridge' },

  // ─── Camel base ─────────────────────────────────────────────────────────────
  { a: 'camel', b: 'cream',      score: 0.93, notes: 'Tonal luxury — texture contrast required' },
  { a: 'camel', b: 'ivory',      score: 0.93, notes: 'Tonal luxury — texture contrast required' },
  { a: 'camel', b: 'burgundy',   score: 0.91, notes: 'Autumn richness' },
  { a: 'camel', b: 'forest green',score: 0.88, notes: 'Country heritage' },
  { a: 'camel', b: 'white',      score: 0.89, notes: 'Clean warm contrast' },
  { a: 'camel', b: 'stone',      score: 0.88, notes: 'Quiet tonal — texture critical' },
  { a: 'camel', b: 'slate blue', score: 0.84, notes: 'Warm/cool contrast' },
  { a: 'camel', b: 'rust',       score: 0.82, notes: 'Warm earth harmony' },
  { a: 'camel', b: 'black',      score: 0.72, notes: 'Continental only' },

  // ─── Cream base ──────────────────────────────────────────────────────────────
  { a: 'cream', b: 'forest green',    score: 0.91, notes: 'Heritage natural' },
  { a: 'cream', b: 'burgundy',        score: 0.88, notes: 'Refined warm contrast' },
  { a: 'cream', b: 'chocolate brown', score: 0.87, notes: 'Heritage warm' },

  // ─── Stone base ──────────────────────────────────────────────────────────────
  { a: 'stone', b: 'navy',        score: 0.93, notes: 'Quiet luxury' },
  { a: 'stone', b: 'charcoal',    score: 0.89, notes: 'City quiet' },
  { a: 'stone', b: 'burgundy',    score: 0.88, notes: 'Depth + warmth' },
  { a: 'stone', b: 'forest green',score: 0.86, notes: 'Country-smart' },

  // ─── Ivory base ──────────────────────────────────────────────────────────────
  { a: 'ivory', b: 'cobalt',  score: 0.89, notes: 'Elegant coastal' },
  { a: 'ivory', b: 'tan',     score: 0.88, notes: 'Warm harmonious tonal' },
  { a: 'ivory', b: 'slate',   score: 0.88, notes: 'Cool quiet luxury' },

  // ─── Chocolate / dark brown base ─────────────────────────────────────────────
  // DB stores this as 'brown' or 'dark brown' — all three keys map to same scores
  { a: 'chocolate brown', b: 'cream', score: 0.90, notes: 'Heritage anchor' },
  { a: 'chocolate brown', b: 'camel', score: 0.82, notes: 'Rich warm tonal' },
  { a: 'chocolate brown', b: 'navy',  score: 0.72, notes: 'Dark on dark' },
  { a: 'dark brown',      b: 'cream', score: 0.90, notes: 'Heritage anchor' },
  { a: 'dark brown',      b: 'camel', score: 0.82, notes: 'Rich warm tonal' },
  { a: 'dark brown',      b: 'navy',  score: 0.72, notes: 'Dark on dark' },

  // ─── Tan base ────────────────────────────────────────────────────────────────
  { a: 'tan', b: 'navy',  score: 0.90, notes: 'Clean contrast' },
  { a: 'tan', b: 'stone', score: 0.88, notes: 'Warm neutral stack' },
  { a: 'tan', b: 'olive', score: 0.87, notes: 'Country earthy' },

  // ─── Hard block ──────────────────────────────────────────────────────────────
  { a: 'brown', b: 'black', score: 0.05, notes: 'BLOCKED — absolute rule' },

  // ─── Forest green base ───────────────────────────────────────────────────────
  { a: 'forest green', b: 'cream',    score: 0.91, notes: 'Heritage classic' },
  { a: 'forest green', b: 'camel',    score: 0.88, notes: 'Tweed palette' },
  { a: 'forest green', b: 'brown',    score: 0.86, notes: 'Country staple' },
  { a: 'forest green', b: 'stone',    score: 0.86, notes: 'Country-smart' },
  { a: 'forest green', b: 'ecru',     score: 0.90, notes: 'Heritage natural' },
  { a: 'forest green', b: 'white',    score: 0.79, notes: 'Clean but less British' },
  { a: 'forest green', b: 'burgundy', score: 0.72, notes: 'Rich — one as accent' },
  { a: 'forest green', b: 'black',    score: 0.55, notes: 'Continental lean — use carefully' },

  // ─── Olive base ──────────────────────────────────────────────────────────────
  { a: 'olive', b: 'cream', score: 0.89, notes: 'Country + clean' },
  { a: 'olive', b: 'camel', score: 0.83, notes: 'Warm earthy' },
  { a: 'olive', b: 'navy',  score: 0.83, notes: 'Smart casual standard' },
  { a: 'olive', b: 'rust',  score: 0.83, notes: 'Earthy autumn' },

  // ─── Sage base ───────────────────────────────────────────────────────────────
  { a: 'sage', b: 'ivory', score: 0.90, notes: 'Soft classic' },
  { a: 'sage', b: 'stone', score: 0.90, notes: 'Quiet luxury' },
  { a: 'sage', b: 'camel', score: 0.86, notes: 'Warm muted' },

  // ─── Terracotta base ─────────────────────────────────────────────────────────
  { a: 'terracotta', b: 'ivory',  score: 0.93, notes: 'Riviera hero' },
  { a: 'terracotta', b: 'sand',   score: 0.91, notes: 'Warm earth harmony' },
  { a: 'terracotta', b: 'navy',   score: 0.86, notes: 'Warm/cool contrast' },
  { a: 'terracotta', b: 'white',  score: 0.83, notes: 'Bold coastal' },
  { a: 'terracotta', b: 'olive',  score: 0.79, notes: 'Earthy — countryside lean' },
  { a: 'terracotta', b: 'camel',  score: 0.65, notes: 'Texture diff required' },
  { a: 'terracotta', b: 'cobalt', score: 0.33, notes: 'Too loud' },

  // ─── Rust base ───────────────────────────────────────────────────────────────
  { a: 'rust', b: 'navy',     score: 0.88, notes: 'Smart casual staple' },
  { a: 'rust', b: 'camel',   score: 0.81, notes: 'Warm tonal' },
  { a: 'rust', b: 'khaki',   score: 0.81, notes: 'Collegiate earthy' },
  { a: 'rust', b: 'burgundy',score: 0.18, notes: 'AVOID — muddy' },

  // ─── Sky blue base ────────────────────────────────────────────────────────────
  { a: 'sky blue', b: 'white',  score: 0.93, notes: 'Coastal fresh' },
  { a: 'sky blue', b: 'cream',  score: 0.91, notes: 'Soft elegant' },
  { a: 'sky blue', b: 'sand',   score: 0.89, notes: 'Coastal minimal' },
  { a: 'sky blue', b: 'navy',   score: 0.87, notes: 'Tonal — texture diff required' },

  // ─── Cobalt base ─────────────────────────────────────────────────────────────
  { a: 'cobalt', b: 'white',  score: 0.91, notes: 'Mediterranean statement' },
  { a: 'cobalt', b: 'ivory',  score: 0.89, notes: 'Elegant coastal' },
  { a: 'cobalt', b: 'sand',   score: 0.87, notes: 'Riviera pop' },
  { a: 'cobalt', b: 'navy',   score: 0.20, notes: 'Too similar — boring' },

  // ─── Burgundy base ───────────────────────────────────────────────────────────
  { a: 'burgundy', b: 'grey',    score: 0.92, notes: 'Formal tie — the English formula' },
  { a: 'burgundy', b: 'navy',    score: 0.88, notes: 'Classic — as accent' },
  { a: 'burgundy', b: 'cream',   score: 0.89, notes: 'Rich elegant' },
  { a: 'burgundy', b: 'camel',   score: 0.91, notes: 'Autumnal classic' },
  { a: 'burgundy', b: 'stone',   score: 0.89, notes: 'Old Money quiet depth' },
  { a: 'burgundy', b: 'forest green', score: 0.72, notes: 'One as accent only' },
  { a: 'burgundy', b: 'rust',    score: 0.18, notes: 'AVOID — muddy' },

  // ─── Sand / Ecru base ────────────────────────────────────────────────────────
  { a: 'sand', b: 'navy',      score: 0.94, notes: 'Riviera baseline' },
  { a: 'sand', b: 'terracotta',score: 0.91, notes: 'Warm coastal earth' },
  { a: 'sand', b: 'cobalt',    score: 0.88, notes: 'Mediterranean pop' },
  { a: 'ecru', b: 'navy',         score: 0.94, notes: 'Crisp nautical' },
  { a: 'ecru', b: 'forest green', score: 0.90, notes: 'Heritage natural' },
  { a: 'ecru', b: 'brown',        score: 0.84, notes: 'Warm heritage' },

  // ─── Dusty rose base ─────────────────────────────────────────────────────────
  { a: 'dusty rose', b: 'ivory', score: 0.89, notes: 'Soft spring' },
  { a: 'dusty rose', b: 'grey',  score: 0.88, notes: 'English classic' },
  { a: 'dusty rose', b: 'navy',  score: 0.86, notes: 'OCBD + blazer' },
  { a: 'dusty rose', b: 'camel', score: 0.78, notes: 'Warm — use carefully' },

  // ─── Coral (new in v4.0) ─────────────────────────────────────────────────────
  { a: 'coral', b: 'cream', score: 0.90, notes: 'Warm Riviera' },
  { a: 'coral', b: 'navy',  score: 0.85, notes: 'Coastal contrast' },

  // ─── Saffron / Yellow (new in v4.0) ──────────────────────────────────────────
  { a: 'saffron', b: 'white', score: 0.87, notes: 'Clean summer' },
  { a: 'saffron', b: 'navy',  score: 0.84, notes: 'Ivy accent pop' },

  // ─── Kelly Green (new in v4.0) ───────────────────────────────────────────────
  { a: 'kelly green', b: 'navy',  score: 0.86, notes: 'Ivy accent' },
  { a: 'kelly green', b: 'white', score: 0.85, notes: 'Clean collegiate' },
  { a: 'kelly green', b: 'khaki', score: 0.83, notes: 'Campus casual' },

  // ─── White anchor ────────────────────────────────────────────────────────────
  { a: 'white', b: 'khaki', score: 0.96, notes: 'Three-colour harmony anchor (with navy)' },

  // ─── Italian Elegance expansion (v5.0) ─────────────────────────────────────
  { a: 'mid blue', b: 'tobacco',       score: 0.97, notes: 'Agnelli-Kanon — DIE italienische Paarung' },
  { a: 'mid blue', b: 'cream',         score: 0.93, notes: 'Sommerlicher Fresco-Klassiker' },
  { a: 'mid blue', b: 'white',         score: 0.92, notes: 'Neapolitanischer Standard' },
  { a: 'mid blue', b: 'ochre',         score: 0.89, notes: 'Komplementärwärme — Akzent klein' },
  { a: 'mid blue', b: 'lavender grey', score: 0.85, notes: 'Subtile Hemdenfarbe' },
  { a: 'mid blue', b: 'rust',          score: 0.88, notes: 'Strick auf hellem Blau' },
  { a: 'navy', b: 'tobacco',           score: 0.93, notes: 'Anglo-italienische Brücke' },
  { a: 'cream', b: 'tobacco',          score: 0.94, notes: 'Sonnengewärmtes Tonal' },
  { a: 'tobacco', b: 'white',          score: 0.93, notes: 'Pitti-Standard' },
  { a: 'tobacco', b: 'bottle green',   score: 0.88, notes: 'Erdige Tiefe' },
  { a: 'dusty rose', b: 'tobacco',     score: 0.84, notes: 'Mutig aber kanonisch' },
  { a: 'sage', b: 'tobacco',           score: 0.84, notes: 'Mediterrane Erde' },
  { a: 'stone', b: 'tobacco',          score: 0.89, notes: 'Quiet Italian' },
  { a: 'grey', b: 'tobacco',           score: 0.87, notes: 'Flannel + Strick' },
  { a: 'bottle green', b: 'stone',     score: 0.90, notes: 'Gedämpfte Eleganz' },
  { a: 'bottle green', b: 'cream',     score: 0.89, notes: 'Heritage natural — italienische Lesart' },
  { a: 'bottle green', b: 'camel',     score: 0.88, notes: 'Mantel + Rollkragen' },
  { a: 'bottle green', b: 'grey',      score: 0.86, notes: 'Winterstrick auf Flannel' },
  { a: 'bottle green', b: 'navy',      score: 0.78, notes: 'Eine Farbe als Akzent' },
  { a: 'ochre', b: 'cream',            score: 0.86, notes: 'Warmes Tonal' },
  { a: 'ochre', b: 'navy',             score: 0.87, notes: 'Strickweste auf Navy' },
  { a: 'ochre', b: 'grey',             score: 0.84, notes: 'Akzent auf neutral' },
  { a: 'sage', b: 'cream',             score: 0.89, notes: 'Sommerliche Zurückhaltung' },
  { a: 'sage', b: 'white',             score: 0.88, notes: 'Hochsommer-Strickpolo' },
  { a: 'sage', b: 'navy',              score: 0.82, notes: 'Gedämpfter Kontrast' },
  { a: 'lavender grey', b: 'charcoal', score: 0.84, notes: 'Hemd auf Anzug' },
  { a: 'denim blue', b: 'white',       score: 0.88, notes: 'Alto-basso casual' },
  { a: 'denim blue', b: 'cream',       score: 0.87, notes: 'Denim-Hemd + helle Hose' },
  { a: 'denim blue', b: 'stone',       score: 0.86, notes: 'Sakko über Denim-Hemd' },
  { a: 'denim blue', b: 'tobacco',     score: 0.85, notes: 'Hoch-Tief-Mix' },
  { a: 'aubergine', b: 'grey',         score: 0.83, notes: 'Tiefer Strick auf Flannel' },
  { a: 'aubergine', b: 'camel',        score: 0.82, notes: 'Herbstliche Tiefe' },
  { a: 'cigar brown', b: 'cream',      score: 0.89, notes: 'Tonal braun — Texturen Pflicht' },
  { a: 'cigar brown', b: 'tan',        score: 0.82, notes: 'Tonal — 3 Texturen nötig' },
  { a: 'cigar brown', b: 'mid blue',   score: 0.90, notes: 'Sakko + Hose italienisch' },
  { a: 'terracotta', b: 'cream',       score: 0.87, notes: 'Amalfi-Tonal' },
  { a: 'terracotta', b: 'white',       score: 0.88, notes: 'Sommerlicher Kontrast' },
  { a: 'terracotta', b: 'stone',       score: 0.85, notes: 'Erdiges Sommerduo' },
  { a: 'terracotta', b: 'olive',       score: 0.80, notes: 'Mediterran erdverbunden' },
  { a: 'mint', b: 'navy',              score: 0.83, notes: 'Sommerhemd-Akzent' },
  { a: 'mint', b: 'white',             score: 0.85, notes: 'Leichteste Sommerpaarung' },
  { a: 'pale yellow', b: 'mid blue',   score: 0.85, notes: 'Hemd auf Sommeranzug' },
  { a: 'pale yellow', b: 'stone',      score: 0.83, notes: 'Soft summer' },

  // ─── British depth expansion (v5.0) ─────────────────────────────────────────
  { a: 'olive', b: 'cream',            score: 0.89, notes: 'Countryside-Strick auf hell' },
  { a: 'olive', b: 'tan',              score: 0.87, notes: 'Wachsjacke + Chino' },
  { a: 'olive', b: 'burgundy',         score: 0.85, notes: 'Country-Akzentpaar' },
  { a: 'olive', b: 'rust',             score: 0.84, notes: 'Herbstlaub-Paarung' },
  { a: 'olive', b: 'grey',             score: 0.84, notes: 'Feldjacke auf Flannel' },
  { a: 'moss green', b: 'camel',       score: 0.86, notes: 'Strick + Mantel' },
  { a: 'moss green', b: 'cream',       score: 0.86, notes: 'Heritage soft' },
  { a: 'heather', b: 'grey',           score: 0.85, notes: 'Shetland auf Flannel' },
  { a: 'heather', b: 'brown',          score: 0.84, notes: 'Moorland-Töne' },
  { a: 'rust', b: 'cream',             score: 0.88, notes: 'Herbststrick auf hell' },
  { a: 'rust', b: 'brown',             score: 0.83, notes: 'Tonal warm — Texturkontrast' },
  { a: 'rust', b: 'grey',              score: 0.85, notes: 'Akzent auf Stadtneutral' },
  { a: 'mustard', b: 'navy',           score: 0.84, notes: 'Strickweste klassisch britisch' },
  { a: 'mustard', b: 'brown',          score: 0.83, notes: 'Tweed-Begleiter' },
  { a: 'mustard', b: 'olive',          score: 0.82, notes: 'Countryside-Akzent' },
  { a: 'bracken brown', b: 'cream',    score: 0.86, notes: 'Moorland auf hell' },
  { a: 'hunter green', b: 'tan',       score: 0.85, notes: 'Barbour-Formel' },
  { a: 'hunter green', b: 'cream',     score: 0.86, notes: 'Country-Klassik' },
  { a: 'oxblood', b: 'grey',           score: 0.88, notes: 'Schuh auf Flannel — sehr englisch' },
  { a: 'oxblood', b: 'navy',           score: 0.87, notes: 'Penny Loafer + Blazer' },
  { a: 'oxblood', b: 'khaki',          score: 0.86, notes: 'Ivy-Schuhformel' },
  { a: 'fawn', b: 'navy',              score: 0.88, notes: 'Covert Coat auf Stadt' },
  { a: 'fawn', b: 'brown',             score: 0.83, notes: 'Country tonal' },

]

// Build symmetric lookup map: sorted key → score
export const COLOUR_PAIRS: Record<string, number> = (() => {
  const map: Record<string, number> = {}
  for (const { a, b, score } of RAW_PAIRS) {
    const key = [a, b].sort().join('|')
    // Later entries in the array override earlier ones (allows section-specific overrides)
    map[key] = score
  }
  return map
})()

// Fallback score for unlisted pairs
export const COLOUR_PAIR_DEFAULT = 0.70

export function getColourPairScore(a: string, b: string): number {
  const key = [a.toLowerCase(), b.toLowerCase()].sort().join('|')
  return COLOUR_PAIRS[key] ?? COLOUR_PAIR_DEFAULT
}

// Colour families for palette-matching bonus
export const COLOUR_FAMILIES: Record<string, string[]> = {
  warm_neutral: ['camel', 'cream', 'ivory', 'stone', 'tan', 'biscuit', 'buff', 'warm beige', 'oatmeal', 'ecru', 'sand'],
  cool_neutral: ['charcoal', 'mid-grey', 'grey', 'light grey', 'off-white', 'pale blue', 'slate', 'slate blue', 'lavender grey', 'mid blue', 'denim blue'],
  earth:        ['brown', 'dark brown', 'chocolate brown', 'cigar brown', 'tobacco', 'rust', 'terracotta', 'ochre', 'bracken brown', 'olive', 'forest green', 'hunter green', 'moss green', 'sage', 'bottle green', 'fawn'],
  coastal:      ['navy', 'white', 'sand', 'sky blue', 'cobalt', 'ecru', 'coral', 'terracotta', 'saffron', 'seafoam', 'kelly green'],
  accent:       ['burgundy', 'dusty rose', 'yellow', 'pale yellow', 'saffron', 'kelly green', 'sage', 'mustard', 'pink', 'pale pink', 'coral', 'aubergine', 'mint', 'heather'],
}

export function getColourFamily(colour: string): string | null {
  const c = colour.toLowerCase()
  for (const [family, colours] of Object.entries(COLOUR_FAMILIES)) {
    if (colours.some(fc => c.includes(fc) || fc.includes(c))) return family
  }
  return null
}

// ─── v5.1 (#3): Paletten-Ebene — Helligkeit, Akzent-Budget, Trio-Logik ───────

// Wahrnehmungs-Helligkeit 0 (schwarz) – 100 (weiß) je Farbname
export const COLOUR_LIGHTNESS: Record<string, number> = {
  white: 97, 'off-white': 94, ivory: 92, cream: 90, ecru: 88, 'pale yellow': 88,
  sand: 80, stone: 75, 'light grey': 75, 'pale blue': 80, 'light blue': 78,
  'sky blue': 75, mint: 80, 'pale pink': 82, blush: 78, 'dusty rose': 65,
  beige: 78, khaki: 65, tan: 60, camel: 62, 'warm beige': 75, oatmeal: 82,
  buff: 72, biscuit: 70, fawn: 65, taupe: 60, 'lavender grey': 70,
  yellow: 80, saffron: 65, mustard: 55, ochre: 55, coral: 65, terracotta: 50,
  rust: 42, 'mid blue': 55, 'denim blue': 45, cobalt: 40, 'kelly green': 45,
  sage: 60, heather: 55, olive: 38, 'moss green': 40, 'forest green': 25,
  'hunter green': 22, 'bottle green': 22, grey: 50, 'mid-grey': 50, slate: 42,
  'slate blue': 45, brown: 30, 'light brown': 45, 'dark brown': 20,
  'chocolate brown': 22, 'cigar brown': 25, tobacco: 35, burgundy: 25,
  bordeaux: 22, oxblood: 25, aubergine: 22, maroon: 25, navy: 15,
  'dark tan': 45, charcoal: 18, anthracite: 18, black: 5, pink: 70,
}

export function getColourLightness(colour: string): number {
  const c = colour.toLowerCase()
  if (COLOUR_LIGHTNESS[c] != null) return COLOUR_LIGHTNESS[c]
  for (const [name, v] of Object.entries(COLOUR_LIGHTNESS)) {
    if (c.includes(name)) return v
  }
  return 50
}

export interface PaletteAnalysis {
  accentCount: number          // Farben aus der Akzent-Familie
  distinctFamilies: number     // Anzahl unterschiedlicher Farbfamilien
  valueContrast: number        // max. Helligkeitsdifferenz 0–100
  delta: number                // Score-Modifikator −0.15 … +0.05
  reasons: string[]
}

/**
 * Bewertet die Gesamtpalette eines Outfits (nicht nur Paare):
 * - >1 Akzentfarbe: Palette kippt ins Laute (−0.06 je weitere)
 * - >3 Farbfamilien gleichzeitig: visuell zersplittert (−0.08)
 * - Sehr geringer Helligkeitskontrast (<15): braucht Texturarbeit — kleines Minus,
 *   das die Engine bei gutem Texturkontrast wieder neutralisieren kann
 * - Klarer Kontrast (30–75): klassisch lesbar (+0.03)
 */
export function analyzePalette(colours: string[]): PaletteAnalysis {
  const cs = colours.map(c => c.toLowerCase()).filter(Boolean)
  const reasons: string[] = []
  let delta = 0

  const accentSet = new Set(COLOUR_FAMILIES.accent)
  const accentCount = cs.filter(c => [...accentSet].some(a => c.includes(a))).length
  if (accentCount > 1) {
    delta -= 0.06 * (accentCount - 1)
    reasons.push(`${accentCount} Akzentfarben — eine wäre stärker`)
  }

  const fams = new Set(cs.map(getColourFamily).filter(Boolean))
  if (fams.size > 3) {
    delta -= 0.08
    reasons.push('Mehr als 3 Farbfamilien — Palette zersplittert')
  }

  const lightness = cs.map(getColourLightness)
  const valueContrast = lightness.length >= 2
    ? Math.max(...lightness) - Math.min(...lightness)
    : 0
  if (cs.length >= 2 && valueContrast < 15) {
    delta -= 0.04
    reasons.push('Geringer Helligkeitskontrast — Texturen müssen tragen')
  } else if (valueContrast >= 30 && valueContrast <= 75) {
    delta += 0.03
    reasons.push('Ausgewogener Hell-Dunkel-Kontrast')
  }

  return { accentCount, distinctFamilies: fams.size, valueContrast, delta, reasons }
}

/**
 * Farbtyp-Personalisierung (#3): Abgleich Outfit-Kontrast ↔ persönlicher Kontrasttyp.
 * 'hoch': klare Hell-Dunkel-Kontraste stehen dem Träger (Navy+Weiß) → Bonus bei ≥45
 * 'gedaempft': tonale, weiche Paletten stehen besser (Stone+Cream) → Bonus bei ≤35
 * 'mittel'/undefined: neutral
 */
export function contrastTypeDelta(valueContrast: number, contrastType?: string): number {
  if (contrastType === 'hoch') {
    if (valueContrast >= 45) return 0.04
    if (valueContrast < 20)  return -0.04
  } else if (contrastType === 'gedaempft') {
    if (valueContrast <= 35) return 0.04
    if (valueContrast > 60)  return -0.04
  }
  return 0
}
