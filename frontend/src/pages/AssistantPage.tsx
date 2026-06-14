import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Image } from 'lucide-react'
import { parseIntent, intentToOutfitParams } from '../services/intentParser'
import type { ParsedIntent, OutfitGenerationParams } from '../services/intentParser'
import { STYLE_BOARDS } from '../data/styleBoards'
import type { StyleBoard } from '../data/styleBoards'
import { db } from '../db/index'
import { interpretProfile } from '../services/profileInterpreter'
import { STRINGS } from '../constants/strings'

// ── SVG-Farbpaletten-Streifen ─────────────────────────────────────────────────

function ColorSwatches({ colors }: { colors: string[] }) {
  const w = 100 / colors.length
  return (
    <svg width="100%" height="20" style={{ display: 'block', borderRadius: '6px 6px 0 0', overflow: 'hidden' }}>
      {colors.map((c, i) => (
        <rect key={i} x={`${i * w}%`} y={0} width={`${w}%`} height={20} fill={c} />
      ))}
    </svg>
  )
}

// ── Erkannter Intent – Vorschau ───────────────────────────────────────────────

const OCCASION_LABELS: Record<string, string> = {
  office: 'Büro', event: 'Event', leisure: 'Freizeit', travel: 'Reise', beach: 'Strand',
}
const MOOD_LABELS: Record<string, string> = {
  confident: 'Selbstbewusst', relaxed: 'Entspannt', nervous: 'Nervös',
  bold: 'Mutig', subtle: 'Dezent', festive: 'Festlich',
}

function IntentPreview({ intent }: { intent: ParsedIntent }) {
  const rows: Array<{ label: string; value: string }> = []

  if (intent.occasion)
    rows.push({ label: STRINGS.assistant.occasionLabel, value: OCCASION_LABELS[intent.occasion] ?? intent.occasion })

  if (intent.formality_delta !== 0 || intent.formality_target !== null) {
    const val = intent.formality_target !== null
      ? `Ziel ${intent.formality_target}`
      : `${intent.formality_delta > 0 ? '+' : ''}${intent.formality_delta}`
    rows.push({ label: STRINGS.assistant.formalityLabel, value: val })
  }

  const styleKeys = Object.keys(intent.style_boosts)
  if (styleKeys.length)
    rows.push({ label: STRINGS.assistant.styleLabel, value: styleKeys.map(s => s.replace(/_/g, ' ')).join(', ') })

  if (intent.emotion)
    rows.push({ label: 'Stimmung', value: MOOD_LABELS[intent.emotion.mood] ?? intent.emotion.mood })

  if (intent.rain_mode)
    rows.push({ label: 'Wetter', value: 'Regenoutfit' })

  if (intent.temp_override !== null)
    rows.push({ label: 'Temperatur', value: `~${intent.temp_override}°C` })

  if (!rows.length) return null

  const pct = Math.round(intent.confidence * 100)

  return (
    <div style={{
      marginTop: 12,
      padding: '10px 14px',
      borderRadius: 14,
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {STRINGS.assistant.detectedLabel}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: pct >= 70 ? 'var(--accent)' : 'var(--muted)',
        }}>
          {STRINGS.assistant.confidenceLabel}: {pct}%
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
        {rows.map(r => (
          <div key={r.label} style={{ fontSize: 12, color: 'var(--text)' }}>
            <span style={{ color: 'var(--muted)' }}>{r.label}: </span>
            <span style={{ fontWeight: 600 }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bild-Board-Grid ────────────────────────────────────────────────────────────

function BoardCard({
  board, selected, onSelect,
}: {
  board: StyleBoard
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex', flexDirection: 'column', textAlign: 'left',
        padding: 0, borderRadius: 14,
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        background: selected ? 'var(--accent-light)' : 'var(--bg2)',
        cursor: 'pointer', overflow: 'hidden',
        transition: 'border-color 150ms, background 150ms',
      }}
    >
      <ColorSwatches colors={board.colors} />
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 5, lineHeight: 1.3 }}>
          {board.name_de}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {board.key_pieces_de.map(p => (
            <span key={p} style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 8,
              background: 'var(--bg3)', color: 'var(--muted)',
            }}>
              {p}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
          {board.description_de}
        </div>
      </div>
    </button>
  )
}

// ── Hauptseite ─────────────────────────────────────────────────────────────────

type Tab = 'text' | 'image'

export default function AssistantPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab]   = useState<Tab>('text')
  const [inputText, setInputText]   = useState('')
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null)
  const [selectedBoard, setSelectedBoard] = useState<StyleBoard | null>(null)
  const [previewSrc, setPreviewSrc]   = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Echtzeit-Parsing
  useEffect(() => {
    if (inputText.length < 3) { setParsedIntent(null); return }
    const intent = parseIntent(inputText)
    setParsedIntent(intent)
  }, [inputText])

  // ── Bild-Upload
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPreviewSrc(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  // ── Outfits zeigen (Text-Tab)
  async function submitText() {
    if (!inputText.trim() && !parsedIntent) return
    setLoading(true)
    try {
      const intent = parsedIntent ?? parseIntent(inputText)
      const params = await buildParams(intent)
      navigate('/', { state: { intentParams: params } })
    } finally {
      setLoading(false)
    }
  }

  // ── Outfits zeigen (Bild-Tab)
  async function submitBoard() {
    if (!selectedBoard) return
    setLoading(true)
    try {
      const profiles = await db.profile.toArray()
      const profile  = profiles[0]
      const rules    = profile ? interpretProfile(profile) : null
      const params: OutfitGenerationParams = {
        occasion:         selectedBoard.occasion_fit[0] ?? null,
        formality_range:  [
          Math.max(0, selectedBoard.formality_target - 15),
          Math.min(100, selectedBoard.formality_target + 15),
        ],
        style_boosts:     selectedBoard.style_weights,
        hard_excludes:    [],
        hard_requires:    [],
        sprezzatura_mode: rules?.sprezzatura_mode ?? false,
        temp_override:    null,
        rain_priority:    false,
        blacklist_items:  [],
      }
      navigate('/', { state: { intentParams: params, boardName: selectedBoard.name_de } })
    } finally {
      setLoading(false)
    }
  }

  async function buildParams(intent: ParsedIntent): Promise<OutfitGenerationParams> {
    const profiles = await db.profile.toArray()
    const profile  = profiles[0]
    const rules    = profile ? interpretProfile(profile) : null
    if (!profile || !rules) {
      return {
        occasion:         intent.occasion,
        formality_range:  [Math.max(0, 30 + intent.formality_delta), Math.min(100, 85 + intent.formality_delta)],
        style_boosts:     intent.style_boosts,
        hard_excludes:    intent.hard_excludes,
        hard_requires:    intent.hard_requires,
        sprezzatura_mode: intent.sprezzatura_mode ?? false,
        temp_override:    intent.temp_override,
        rain_priority:    intent.rain_mode,
        blacklist_items:  intent.blacklist_items,
      }
    }
    return intentToOutfitParams(intent, profile, rules)
  }

  const canSubmitText  = inputText.trim().length >= 3
  const canSubmitBoard = !!selectedBoard

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 44px) + 12px) 20px 0' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1 }}>
          Assistent
        </h1>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, marginBottom: 0 }}>
          Beschreibe deinen Look — ganz natürlich
        </div>
      </div>

      {/* Tab-Bar */}
      <div style={{
        display: 'flex', padding: '16px 20px 0', gap: 0,
        borderBottom: '1.5px solid var(--border)',
      }}>
        {(['text', 'image'] as Tab[]).map(tab => {
          const label = tab === 'text' ? STRINGS.assistant.tabText : STRINGS.assistant.tabImage
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: '0 0 auto', padding: '0 20px 12px',
                background: 'transparent', border: 'none',
                borderBottom: `2.5px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                marginBottom: -1.5,
                color: activeTab === tab ? 'var(--accent)' : 'var(--muted2)',
                fontSize: 14, fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer', transition: 'color 150ms',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Inhalt */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }}>

        {/* ── Tab 1: Text / Sprache ── */}
        {activeTab === 'text' && (
          <>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 10 }}>
              {STRINGS.assistant.placeholder}
            </div>

            <div style={{ position: 'relative' }}>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={'z. B. „Heute Dinner, elegant aber nicht zu steif“'}
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 14px', borderRadius: 14,
                  background: 'var(--bg2)', border: '1.5px solid var(--border)',
                  color: 'var(--text)', fontSize: 14, lineHeight: 1.6,
                  resize: 'none', outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Aktions-Zeile */}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button
                onClick={submitText}
                disabled={!canSubmitText || loading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 12,
                  background: canSubmitText ? 'var(--accent)' : 'var(--bg2)',
                  border: `1.5px solid ${canSubmitText ? 'var(--accent)' : 'var(--border)'}`,
                  color: canSubmitText ? '#fff' : 'var(--muted)',
                  fontSize: 14, fontWeight: 600, cursor: canSubmitText ? 'pointer' : 'default',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Wird geladen…' : STRINGS.assistant.submitBtn}
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>

            {/* Echtzeit-Vorschau */}
            {parsedIntent && parsedIntent.confidence >= 0.3 && (
              <IntentPreview intent={parsedIntent} />
            )}

            {/* Beispiele */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
                Beispiele
              </div>
              {[
                'Heute Dinner, elegant aber nicht zu steif',
                'Wichtiges Meeting — auf Nummer sicher',
                'Wochenende, mega entspannt, bloß kein Sakko',
                'Sommerlich, Côte d\'Azur Feeling, sockless',
                'British, tweed, countryside vibe',
              ].map(ex => (
                <button
                  key={ex}
                  onClick={() => setInputText(ex)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '9px 14px', borderRadius: 10, marginBottom: 6,
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    color: 'var(--muted)', fontSize: 13, cursor: 'pointer',
                    transition: 'background 150ms',
                  }}
                >
                  „{ex}"
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Tab 2: Bild-Inspiration ── */}
        {activeTab === 'image' && (
          <>
            {/* Bild-Upload */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', minHeight: previewSrc ? 'auto' : 120,
                borderRadius: 14, border: '2px dashed var(--border)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8, cursor: 'pointer',
                background: 'var(--bg2)', marginBottom: 16, overflow: 'hidden',
              }}
            >
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt="Inspiration"
                  style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <>
                  <Image size={28} color="var(--muted2)" strokeWidth={1.5} />
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {STRINGS.assistant.imageHint}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted2)' }}>
                    JPG, PNG, HEIC
                  </span>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
              {STRINGS.assistant.pickBoardHint}
            </div>

            {/* Board-Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {STYLE_BOARDS.map(board => (
                <BoardCard
                  key={board.id}
                  board={board}
                  selected={selectedBoard?.id === board.id}
                  onSelect={() => setSelectedBoard(
                    selectedBoard?.id === board.id ? null : board
                  )}
                />
              ))}
            </div>

            {/* Submit */}
            {canSubmitBoard && (
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={submitBoard}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px 20px', borderRadius: 14,
                    background: 'var(--accent)', color: '#fff', border: 'none',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Wird geladen…' : STRINGS.assistant.boardSelectBtn}
                  {!loading && <ArrowRight size={17} />}
                </button>
                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                  {selectedBoard?.name_de}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
