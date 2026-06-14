import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { STYLE_BOARDS } from '../data/styleBoards'
import type { StyleBoard } from '../data/styleBoards'
import type { OutfitGenerationParams } from '../services/intentParser'
import { db } from '../db/index'
import { interpretProfile } from '../services/profileInterpreter'
import { STRINGS } from '../constants/strings'

function ColorSwatches({ colors }: { colors: string[] }) {
  const w = 100 / colors.length
  return (
    <svg width="100%" height="22" style={{ display: 'block', borderRadius: '10px 10px 0 0', overflow: 'hidden' }}>
      {colors.map((c, i) => (
        <rect key={i} x={`${i * w}%`} y={0} width={`${w}%`} height={22} fill={c} />
      ))}
    </svg>
  )
}

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
        padding: 0, borderRadius: 14, overflow: 'hidden',
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        background: selected ? 'var(--accent-light)' : 'var(--bg2)',
        cursor: 'pointer', transition: 'border-color 150ms, background 150ms',
      }}
    >
      <ColorSwatches colors={board.colors} />
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: 'var(--text)',
          marginBottom: 5, lineHeight: 1.3,
        }}>
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

export default function StyleBoardSelectorPage() {
  const navigate  = useNavigate()
  const [selected, setSelected] = useState<StyleBoard | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function confirm() {
    if (!selected) return
    setLoading(true)
    try {
      const profiles = await db.profile.toArray()
      const profile  = profiles[0]
      const rules    = profile ? interpretProfile(profile) : null
      const params: OutfitGenerationParams = {
        occasion:         selected.occasion_fit[0] ?? null,
        formality_range:  [
          Math.max(0,   selected.formality_target - 15),
          Math.min(100, selected.formality_target + 15),
        ],
        style_boosts:     selected.style_weights,
        hard_excludes:    [],
        hard_requires:    [],
        sprezzatura_mode: rules?.sprezzatura_mode ?? false,
        temp_override:    null,
        rain_priority:    false,
        blacklist_items:  [],
      }
      navigate('/', { state: { intentParams: params, boardName: selected.name_de } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 44px) + 12px) 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={17} color="var(--muted)" />
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1 }}>
          {STRINGS.assistant.boardSelectorTitle}
        </h1>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 120px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {STYLE_BOARDS.map(board => (
            <BoardCard
              key={board.id}
              board={board}
              selected={selected?.id === board.id}
              onSelect={() => setSelected(selected?.id === board.id ? null : board)}
            />
          ))}
        </div>
      </div>

      {/* Sticky Footer */}
      {selected && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430,
          padding: '12px 20px calc(env(safe-area-inset-bottom, 20px) + 12px)',
          background: 'var(--nav-bg)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={confirm}
            disabled={loading}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 14,
              background: 'var(--accent)', color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Wird geladen…' : STRINGS.assistant.boardSelectBtn}
            {!loading && <ArrowRight size={17} />}
          </button>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
            {selected.name_de}
          </div>
        </div>
      )}
    </div>
  )
}
