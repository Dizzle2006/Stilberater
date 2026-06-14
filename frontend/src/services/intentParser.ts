// Intent-Parser — vollständig regelbasiert, kein LLM, kein externer Dienst.
import type { UserProfile } from '../db/index'
import type { ProfileRules } from './profileInterpreter'
import {
  OCCASION_MAP, FORMALITY_MAP, STYLE_MAP,
  WEATHER_MAP, EMOTION_MAP, EXCLUDE_MAP, REQUIRE_MAP,
  PHRASE_MAP, REFERENCE_MAP,
  type PhraseResult,
} from '../data/intentKeywords'

// ── Typen ────────────────────────────────────────────────────────────────────

export interface EmotionContext {
  mood: 'confident' | 'relaxed' | 'nervous' | 'bold' | 'subtle' | 'festive'
  formality_hint: number
}

export interface DebugMatch {
  token: string
  rule: string
  dimension: string
  value: unknown
  confidence: number
}

export interface ParsedIntent {
  occasion:         string | null
  formality_target: number | null
  formality_delta:  number
  style_boosts:     Record<string, number>
  style_blocks:     string[]
  hard_excludes:    string[]
  hard_requires:    string[]
  sprezzatura_mode: boolean | null
  temp_override:    number | null
  rain_mode:        boolean
  blacklist_items:  string[]
  negations:        string[]
  emotion:          EmotionContext | null
  confidence:       number
  fallback_used:    boolean
  raw_tokens:       string[]
  debug_matches:    DebugMatch[]
}

export interface IntentParserConfig {
  fuzzy_threshold:  number  // default 0.82
  negation_window:  number  // default 4
  min_confidence:   number  // default 0.25
  max_style_boosts: number  // default 3
}

export interface OutfitGenerationParams {
  occasion:         string | null
  formality_range:  [number, number]
  style_boosts:     Record<string, number>
  hard_excludes:    string[]
  hard_requires:    string[]
  sprezzatura_mode: boolean
  temp_override:    number | null
  rain_priority:    boolean
  blacklist_items:  string[]
}

const DEFAULT_CONFIG: IntentParserConfig = {
  fuzzy_threshold:  0.82,
  negation_window:  4,
  min_confidence:   0.25,
  max_style_boosts: 3,
}

// ── Stopp-Wörter (reduzieren Nenner in Konfidenz-Formel) ─────────────────────
// Nur inhaltlich neutrale Service-Wörter — kein Stil-Signal.
const STOPWORDS = new Set([
  'ich','bin','ist','war','wird','sein','haben','hab','habe',
  'ein','eine','einer','einen','einem','eines',
  'der','die','das','dem','den','des',
  'und','oder','aber','auch','noch','doch','mal','ja','nein','halt','denn',
  'fuer','in','an','zu','auf','von','mit','bei','nach','aus','ohne','ueber','unter',
  'was','wie','wer','wo','wann','warum','ob',
  'es','er','sie','wir','ihr','mein','meine','meinen','meinem','meiner',
  'heut','heute','morgen','jetzt','dann','so','nur','schon','gern','gerne',
  'will','soll','kann','muss','mag','moechte','wuerde','haette',
  'sein','haben','werden','gehen','kommen','machen','anziehen','tragen',
  'a','the','i','am','is','are','my','me','we','us','do','of','to','an','in',
])

// ── Levenshtein-Distanz ──────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  return dp[m][n]
}

function fuzzyMatch(
  token: string,
  candidates: string[],
  threshold: number,
): { match: string | null; similarity: number } {
  let best: string | null = null
  let bestSim = 0
  for (const c of candidates) {
    const maxLen = Math.max(token.length, c.length)
    if (maxLen === 0) continue
    const dist = levenshtein(token, c)
    const sim = 1 - dist / maxLen
    if (sim > bestSim) { bestSim = sim; best = c }
  }
  return bestSim >= threshold
    ? { match: best, similarity: bestSim }
    : { match: null, similarity: bestSim }
}

// ── Tippfehler-Korrektur ─────────────────────────────────────────────────────

const CORRECTION_DICT: Record<string, string> = {
  // elegant
  'elagant':    'elegant',
  'elgant':     'elegant',
  'legant':     'elegant',
  'elegnat':    'elegant',
  'elegantt':   'elegant',
  // formal
  'formel':     'formal',
  'formell':    'formal',
  'fromel':     'formal',
  // casual
  'kasuell':    'casual',
  'kasuall':    'casual',
  'kasual':     'casual',
  'casaul':     'casual',
  'causal':     'casual',
  // lässig → laessig
  'laessigh':   'laessig',
  'lassig':     'laessig',
  'laessig':    'laessig',
  // business
  'bussines':   'business',
  'busines':    'business',
  'bussiness':  'business',
  'bussnis':    'business',
  // dinner
  'dinnar':     'dinner',
  'diner':      'dinner',
  'dinne':      'dinner',
  // restaurant
  'restrauant': 'restaurant',
  'resturant':  'restaurant',
  'restuarant': 'restaurant',
  // sommerlich
  'sommelig':   'sommerlich',
  'sommrlich':  'sommerlich',
  // britisch
  'britsh':     'britisch',
  'brittisch':  'britisch',
  'britich':    'britisch',
  // klassisch
  'klassich':   'klassisch',
  'klasisch':   'klassisch',
  // sportlich
  'sportich':   'sportlich',
  'sporlich':   'sportlich',
  // gemütlich → gemuetlich
  'gemuetich':  'gemuetlich',
  'gemutlich':  'gemuetlich',
  'gemuetich2': 'gemuetlich',
  // entspannt
  'entpannt':   'entspannt',
  'entspan':    'entspannt',
  'entspanen':  'entspannt',
  // schick
  'schik':      'schick',
  'schikk':     'schick',
  'chik':       'schick',
  'chicck':     'schick',
  'schikc':     'schick',
  // wichtig
  'wichtigs':   'wichtig',
  'wichtiges':  'wichtige',
  // büro → buero (kein Tippfehler nötig — wird durch normStr() bereits korrekt)
  'buero':      'buero',
  // treffen
  'trffen':     'treffen',
  'trefen':     'treffen',
  // gscheits (bairisch)
  'gscheits':   'ordentlich',
  'gscheid':    'ordentlich',
  'gscheids':   'ordentlich',
  // bissl (österr.)
  'bissl':      'bisschen',
  'bisserl':    'bisschen',
}

// ── Normalisierung ───────────────────────────────────────────────────────────

function normStr(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}

function normalize(raw: string): string[] {
  // Lowercase + Umlaut-Normalisierung
  let s = normStr(raw)
  // Satzzeichen entfernen (außer Apostroph und Bindestrich)
  s = s.replace(/[^\w\s'\-]/g, ' ')
  // Tokenisieren: split auf Whitespace + Bindestriche
  const tokens = s.split(/[\s\-]+/).filter(t => t.length > 1)
  // Tippfehler-Korrektur per Token
  return tokens.map(t => CORRECTION_DICT[t] ?? t)
}

// ── Negations-Trigger ────────────────────────────────────────────────────────

const SINGLE_NEGATION_TRIGGERS = new Set([
  'nicht', 'kein', 'keine', 'keinen', 'keiner', 'keines',
  'ohne', 'nie', 'niemals', 'nix', 'noe', 'nein',
  'weder', 'ungern', 'ablehnen',
])

interface NegatedToken { token: string; negated: boolean; index: number }

function markNegations(tokens: string[], window: number): NegatedToken[] {
  const result: NegatedToken[] = tokens.map((t, i) => ({ token: t, negated: false, index: i }))
  let negateUntil = -1
  for (let i = 0; i < result.length; i++) {
    const t = result[i].token
    if (SINGLE_NEGATION_TRIGGERS.has(t)) {
      result[i].token = '' // entfernen (trigger wird nicht gematcht)
      negateUntil = i + window
    } else if (i <= negateUntil) {
      // Doppelte Negation: "nicht un-..." → positiv
      if (t.startsWith('un') && t.length > 3) {
        result[i] = { token: t.slice(2), negated: false, index: i }
      } else {
        result[i].negated = true
      }
    }
  }
  return result
}

// ── Keyword-Index ────────────────────────────────────────────────────────────

type Dimension = 'occasion' | 'formality' | 'style' | 'weather' | 'emotion'
  | 'exclude' | 'require' | 'reference'

interface IndexEntry {
  keyword: string
  dimension: Dimension
  effect: unknown
  base_confidence: number
}

let _keywordIndex: Map<string, IndexEntry[]> | null = null
let _allKeywords: string[] | null = null

function buildKeywordIndex(): Map<string, IndexEntry[]> {
  const idx = new Map<string, IndexEntry[]>()

  function add(keyword: string, entry: Omit<IndexEntry, 'keyword'>) {
    const norm = normStr(keyword)
    if (!idx.has(norm)) idx.set(norm, [])
    idx.get(norm)!.push({ keyword: norm, ...entry })
  }

  for (const row of OCCASION_MAP) {
    for (const kw of row.keywords) {
      add(kw, { dimension: 'occasion', base_confidence: row.confidence,
        effect: { occasion: row.occasion, formality_hint: row.formality_hint } })
    }
  }
  for (const row of FORMALITY_MAP) {
    for (const kw of row.keywords) {
      add(kw, { dimension: 'formality', base_confidence: 0.9,
        effect: { delta: row.delta, target: row.target, sprezzatura: row.sprezzatura ?? false } })
    }
  }
  for (const row of STYLE_MAP) {
    for (const kw of row.keywords) {
      add(kw, { dimension: 'style', base_confidence: 0.9,
        effect: { style: row.style, boost: row.boost } })
    }
  }
  for (const row of WEATHER_MAP) {
    for (const kw of row.keywords) {
      add(kw, { dimension: 'weather', base_confidence: 0.9,
        effect: {
          temp_override: row.temp_override ?? null,
          rain_mode: row.rain_mode ?? false,
          season_hint: row.season_hint,
        } })
    }
  }
  for (const row of EMOTION_MAP) {
    for (const kw of row.keywords) {
      add(kw, { dimension: 'emotion', base_confidence: 0.75,
        effect: { mood: row.mood, formality_hint: row.formality_hint } })
    }
  }
  for (const row of EXCLUDE_MAP) {
    for (const kw of row.keywords) {
      add(kw, { dimension: 'exclude', base_confidence: 0.95,
        effect: { excludes: row.excludes } })
    }
  }
  for (const row of REQUIRE_MAP) {
    for (const kw of row.keywords) {
      add(kw, { dimension: 'require', base_confidence: 0.95,
        effect: { requires: row.requires } })
    }
  }
  for (const row of REFERENCE_MAP) {
    for (const kw of row.keywords) {
      add(kw, { dimension: 'reference', base_confidence: 0.9,
        effect: { flag: row.flag } })
    }
  }

  return idx
}

function getKeywordIndex(): Map<string, IndexEntry[]> {
  if (!_keywordIndex) _keywordIndex = buildKeywordIndex()
  return _keywordIndex
}

function getAllKeywords(): string[] {
  if (!_allKeywords) _allKeywords = [...getKeywordIndex().keys()]
  return _allKeywords
}

// ── Phrase-Erkennung ─────────────────────────────────────────────────────────

const _phraseLookup: Map<string, PhraseResult> = new Map(
  PHRASE_MAP.map(p => [normStr(p.phrase), p.result])
)

function detectPhrases(tokens: string[]): {
  phraseResults: PhraseResult[]
  consumedIndices: Set<number>
} {
  const consumed = new Set<number>()
  const phraseResults: PhraseResult[] = []
  const MAX_LEN = 8

  for (let i = 0; i < tokens.length; i++) {
    if (consumed.has(i)) continue
    for (let len = Math.min(MAX_LEN, tokens.length - i); len >= 2; len--) {
      const candidate = tokens.slice(i, i + len).join(' ')
      if (_phraseLookup.has(candidate)) {
        phraseResults.push(_phraseLookup.get(candidate)!)
        for (let j = i; j < i + len; j++) consumed.add(j)
        break
      }
    }
  }
  return { phraseResults, consumedIndices: consumed }
}

// ── Haupt-Funktion ────────────────────────────────────────────────────────────

export function parseIntent(
  input: string,
  config: Partial<IntentParserConfig> = {},
): ParsedIntent {
  const cfg: IntentParserConfig = { ...DEFAULT_CONFIG, ...config }

  // ── SCHRITT 1: Normalisierung
  const rawTokens = normalize(input)

  // ── SCHRITT 3: Phrase-Erkennung (vor Negations-Marking für volle Phrase-Texte)
  const { phraseResults, consumedIndices } = detectPhrases(rawTokens)

  // ── SCHRITT 2: Negations-Markierung der nicht-phrasen-konsumierten Tokens
  const remainingTokens = rawTokens
    .map((t, i) => ({ t, i }))
    .filter(({ i }) => !consumedIndices.has(i))
    .map(({ t }) => t)
  const negatedTokens = markNegations(remainingTokens, cfg.negation_window)

  // ── SCHRITT 4: Dimension-Matching
  const debugMatches: DebugMatch[] = []
  const idx = getKeywordIndex()
  const allKws = getAllKeywords()

  // Gewichtete Match-Punkte für Konfidenz
  let weightedMatchSum = 0
  const negationLog: string[] = []

  // Signals sammeln
  const occasionSignals: Array<{ occasion: string; confidence: number; formality_hint: number }> = []
  const formalitySignals: Array<{ delta: number; target?: number; sprezzatura: boolean; weight: number }> = []
  const styleBoostMap: Record<string, number> = {}
  const styleBlockSet: Set<string> = new Set()
  const hardExcludes: string[] = []
  const hardRequires: string[] = []
  let tempOverride: number | null = null
  let rainMode = false
  let emotionSignal: EmotionContext | null = null
  let emotionBestConf = 0

  // Phrase-Ergebnisse anwenden
  for (const pr of phraseResults) {
    weightedMatchSum += 1.5
    if (pr.occasion !== undefined) occasionSignals.push({ occasion: pr.occasion!, confidence: 0.95, formality_hint: 0 })
    if (pr.formality_delta !== undefined) formalitySignals.push({ delta: pr.formality_delta, sprezzatura: pr.sprezzatura_mode === true, weight: 1.5 })
    if (pr.sprezzatura_mode === true) formalitySignals.push({ delta: 0, sprezzatura: true, weight: 1.5 })
    if (pr.hard_excludes) hardExcludes.push(...pr.hard_excludes)
    if (pr.hard_requires) hardRequires.push(...pr.hard_requires)
    if (pr.emotion) emotionSignal = pr.emotion as EmotionContext
  }

  // Token-Dimension-Matching
  for (const nt of negatedTokens) {
    const token = nt.token
    if (!token) continue

    // Direkt-Lookup
    let entries = idx.get(token)
    let matchWeight = 1.0
    let matchedToken = token
    let matchType = 'direct'

    // Fuzzy-Fallback
    if (!entries) {
      const { match, similarity } = fuzzyMatch(token, allKws, cfg.fuzzy_threshold)
      if (match) {
        entries = idx.get(match)!
        matchWeight = 0.7
        matchedToken = match
        matchType = 'fuzzy'
      }
    }

    if (!entries) continue

    for (const entry of entries) {
      weightedMatchSum += entry.dimension === 'emotion' ? matchWeight * 0.55 : matchWeight

      const dm: DebugMatch = {
        token: matchedToken,
        rule: matchType,
        dimension: entry.dimension,
        value: entry.effect,
        confidence: entry.base_confidence * matchWeight,
      }
      debugMatches.push(dm)

      if (nt.negated) {
        negationLog.push(token)
        // Negierte Effekte invertieren
        switch (entry.dimension) {
          case 'formality': {
            const eff = entry.effect as { delta: number; sprezzatura: boolean }
            formalitySignals.push({ delta: -eff.delta, sprezzatura: false, weight: matchWeight * 0.8 })
            break
          }
          case 'style': {
            const eff = entry.effect as { style: string; boost: number }
            styleBlockSet.add(eff.style)
            break
          }
          case 'exclude': {
            // Negierte Ausschlüsse → Require
            const eff = entry.effect as { excludes: string[] }
            hardRequires.push(...eff.excludes)
            break
          }
          // occasion, weather, emotion, require, reference bei Negation ignorieren
        }
        continue
      }

      // Positive Anwendung
      switch (entry.dimension) {
        case 'occasion': {
          const eff = entry.effect as { occasion: string; formality_hint: number }
          occasionSignals.push({ occasion: eff.occasion, confidence: entry.base_confidence * matchWeight, formality_hint: eff.formality_hint })
          break
        }
        case 'formality': {
          const eff = entry.effect as { delta: number; target?: number; sprezzatura: boolean }
          formalitySignals.push({ delta: eff.delta, target: eff.target, sprezzatura: eff.sprezzatura, weight: matchWeight })
          break
        }
        case 'style': {
          const eff = entry.effect as { style: string; boost: number }
          styleBoostMap[eff.style] = (styleBoostMap[eff.style] ?? 0) + eff.boost
          break
        }
        case 'weather': {
          const eff = entry.effect as { temp_override: number | null; rain_mode: boolean }
          if (eff.rain_mode) rainMode = true
          if (eff.temp_override !== null) {
            tempOverride = tempOverride === null
              ? eff.temp_override
              : Math.round((tempOverride + eff.temp_override) / 2)
          }
          break
        }
        case 'emotion': {
          const eff = entry.effect as { mood: EmotionContext['mood']; formality_hint: number }
          const conf = entry.base_confidence * matchWeight
          if (conf > emotionBestConf) {
            emotionBestConf = conf
            emotionSignal = { mood: eff.mood, formality_hint: eff.formality_hint }
          }
          break
        }
        case 'exclude': {
          const eff = entry.effect as { excludes: string[] }
          hardExcludes.push(...eff.excludes)
          break
        }
        case 'require': {
          const eff = entry.effect as { requires: string[] }
          hardRequires.push(...eff.requires)
          break
        }
        // reference: logged but not applied structurally here
      }
    }
  }

  // ── SCHRITT 5: Konfidenz-Berechnung
  // Nenner: nur inhaltlich bedeutsame Tokens (Stopp-Wörter herausgefiltert)
  const meaningfulCount = rawTokens.filter(t => !STOPWORDS.has(t) && t.length > 1).length
  const confidence = Math.min(1.0, weightedMatchSum / Math.max(meaningfulCount, 3))

  // ── SCHRITT 6: Konflikt-Auflösung
  const { occasion, formality_delta, formality_target, sprezzatura_mode } =
    resolveConflicts(occasionSignals, formalitySignals, styleBoostMap, emotionSignal)

  // Style-Boosts auf max_style_boosts begrenzen
  const topStyles = Object.entries(styleBoostMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, cfg.max_style_boosts)
  const cappedStyleBoosts: Record<string, number> = Object.fromEntries(topStyles)

  // Phrase-Overrides haben Priorität für confidence / fallback_used
  let finalFallback = false
  let finalConfidence = confidence
  for (const pr of phraseResults) {
    if (pr.fallback_used !== undefined) finalFallback = pr.fallback_used
    if (pr.confidence !== undefined) finalConfidence = Math.min(finalConfidence, pr.confidence)
  }

  // ── SCHRITT 7: Fallback
  if (finalConfidence < cfg.min_confidence && !finalFallback) finalFallback = true

  if (finalFallback) {
    return {
      occasion: null, formality_target: null, formality_delta: 0,
      style_boosts: {}, style_blocks: [], hard_excludes: [], hard_requires: [],
      sprezzatura_mode: null, temp_override: null, rain_mode: false,
      blacklist_items: [], negations: negationLog,
      emotion: null, confidence: Math.min(finalConfidence, 0.2),
      fallback_used: true, raw_tokens: rawTokens, debug_matches: debugMatches,
    }
  }

  // ── SCHRITT 8: Output Assembly
  return {
    occasion,
    formality_target,
    formality_delta,
    style_boosts:     cappedStyleBoosts,
    style_blocks:     [...styleBlockSet],
    hard_excludes:    [...new Set(hardExcludes)],
    hard_requires:    [...new Set(hardRequires)],
    sprezzatura_mode,
    temp_override:    tempOverride,
    rain_mode:        rainMode,
    blacklist_items:  [],
    negations:        negationLog,
    emotion:          emotionSignal,
    confidence:       finalConfidence,
    fallback_used:    false,
    raw_tokens:       rawTokens,
    debug_matches:    debugMatches,
  }
}

// ── Konflikt-Auflösung ───────────────────────────────────────────────────────

function resolveConflicts(
  occasionSignals: Array<{ occasion: string; confidence: number; formality_hint: number }>,
  formalitySignals: Array<{ delta: number; target?: number; sprezzatura: boolean; weight: number }>,
  _styleBoosts: Record<string, number>,
  emotionSignal: EmotionContext | null,
): {
  occasion: string | null
  formality_delta: number
  formality_target: number | null
  sprezzatura_mode: boolean | null
} {
  // KONFLIKT B: Anlass — höchste Konfidenz gewinnt, bei Gleichstand: event
  let occasion: string | null = null
  if (occasionSignals.length === 1) {
    occasion = occasionSignals[0].occasion
  } else if (occasionSignals.length > 1) {
    const sorted = [...occasionSignals].sort((a, b) => {
      if (Math.abs(a.confidence - b.confidence) < 0.05) {
        // Tie: event > office > leisure
        const rank: Record<string, number> = { event: 3, office: 2, travel: 1, leisure: 0, beach: 0 }
        return (rank[b.occasion] ?? 0) - (rank[a.occasion] ?? 0)
      }
      return b.confidence - a.confidence
    })
    occasion = sorted[0].occasion
  }

  // KONFLIKT A: Formalität — gewichteter Mittelwert
  let formality_delta = 0
  let formality_target: number | null = null
  let sprezzatura_mode: boolean | null = null

  if (formalitySignals.length > 0) {
    // Target hat Priorität
    const targets = formalitySignals.filter(s => s.target !== undefined)
    if (targets.length) {
      formality_target = Math.round(
        targets.reduce((s, f) => s + f.target! * f.weight, 0) /
        targets.reduce((s, f) => s + f.weight, 0)
      )
    }

    // Gewichteter Mittelwert der Deltas
    const totalWeight = formalitySignals.reduce((s, f) => s + f.weight, 0)
    if (totalWeight > 0) {
      const rawDelta = formalitySignals.reduce((s, f) => s + f.delta * f.weight, 0) / totalWeight
      formality_delta = Math.round(Math.max(-30, Math.min(30, rawDelta)))
    }

    // KONFLIKT A: Wenn formale UND casual Signale beide vorhanden → sprezzatura
    const hasFormals  = formalitySignals.some(f => f.delta > 5)
    const hasCasuals  = formalitySignals.some(f => f.delta < -5)
    if (hasFormals && hasCasuals) sprezzatura_mode = true

    // Explizites Sprezzatura-Flag aus Signals
    if (formalitySignals.some(f => f.sprezzatura)) sprezzatura_mode = true
  }

  // Emotion beeinflusst Formalität wenn keine expliziten Signale
  if (formalitySignals.length === 0 && emotionSignal) {
    formality_delta = Math.round(emotionSignal.formality_hint * 0.6)
  }

  return { occasion, formality_delta, formality_target, sprezzatura_mode }
}

// ── Intent → Outfit-Parameter Bridge ────────────────────────────────────────

export function intentToOutfitParams(
  intent: ParsedIntent,
  currentProfile: UserProfile,
  currentRules: ProfileRules,
): OutfitGenerationParams {
  // Formalitäts-Range berechnen
  let formality_range: [number, number]
  if (intent.formality_target !== null) {
    formality_range = [
      Math.max(0,   intent.formality_target - 15),
      Math.min(100, intent.formality_target + 15),
    ]
  } else {
    const baseMin = currentProfile.formality_range?.[0] ?? 30
    const baseMax = currentProfile.formality_range?.[1] ?? 85
    formality_range = [
      Math.max(0,   baseMin + intent.formality_delta),
      Math.min(100, baseMax + intent.formality_delta),
    ]
  }

  // Style-Boosts: Profile-Basis + Intent-Boosts
  const profileScores = currentProfile.style_scores ?? {}
  const mergedBoosts: Record<string, number> = {}
  for (const [style, boost] of Object.entries(intent.style_boosts)) {
    mergedBoosts[style] = Math.min(100, (profileScores[style] ?? 50) + boost)
  }

  return {
    occasion:         intent.occasion,
    formality_range,
    style_boosts:     mergedBoosts,
    hard_excludes:    intent.hard_excludes,
    hard_requires:    intent.hard_requires,
    sprezzatura_mode: intent.sprezzatura_mode ?? currentRules.sprezzatura_mode,
    temp_override:    intent.temp_override,
    rain_priority:    intent.rain_mode,
    blacklist_items:  intent.blacklist_items,
  }
}
