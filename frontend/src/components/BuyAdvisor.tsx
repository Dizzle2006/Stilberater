import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDropzone } from 'react-dropzone'
import {
  Camera, Upload, X, ChevronDown, Loader2,
  ShoppingBag, CheckCircle, AlertCircle, XCircle,
  Shirt, Sparkles, RefreshCw,
} from 'lucide-react'
import { api } from '../utils/api'

// ─── Typen ────────────────────────────────────────────────────────────────────

interface CheckResult {
  outfit_count: number
  style_score: number
  verdict: 'kaufen' | 'überlegen' | 'nicht_kaufen'
  verdict_label: string
  verdict_color: string
  reasons: string[]
  color_detected: string
  color_used: string
  style_tags: string[]
  formality: number
  category_display: string
}

interface CategoryItem {
  key: string
  display: string
  description: string
  formality: number
}

interface CategoryGroup {
  group: string
  items: CategoryItem[]
}

// ─── Hilfskomponenten ─────────────────────────────────────────────────────────

function VerdictIcon({ verdict }: { verdict: string }) {
  if (verdict === 'kaufen')       return <CheckCircle  size={36} color="#4ade80" />
  if (verdict === 'überlegen')    return <AlertCircle  size={36} color="#facc15" />
  return                                  <XCircle     size={36} color="#f87171" />
}

function FormalityBar({ level }: { level: number }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1,2,3,4,5].map(n => (
        <div key={n} style={{
          width: 16, height: 6,
          borderRadius: 3,
          background: n <= level ? 'var(--accent)' : 'var(--border2)',
          transition: 'background 300ms',
        }} />
      ))}
      <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>
        {['', 'sehr lässig', 'lässig', 'smart casual', 'business', 'formal'][level] ?? ''}
      </span>
    </div>
  )
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

interface BuyAdvisorProps {
  onClose: () => void
}

type Step = 'capture' | 'categorize' | 'analyzing' | 'result'

export default function BuyAdvisor({ onClose }: BuyAdvisorProps) {
  const [step, setStep] = useState<Step>('capture')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [categoryKey, setCategoryKey] = useState('')
  const [categories, setCategories] = useState<CategoryGroup[]>([])
  const [result, setResult] = useState<CheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cameraMode, setCameraMode] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Kategorien laden
  useEffect(() => {
    api.getCategories().then((d: any) => setCategories(d)).catch(() => {})
  }, [])

  // Kamera sauber beenden wenn Komponente unmountet
  useEffect(() => {
    return () => {
      stopCamera()
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [])

  // ── Kamera ────────────────────────────────────────────────────────────────

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraMode(true)
    } catch {
      setError('Kamera nicht verfügbar — bitte Foto hochladen.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraMode(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width  = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      const f = new File([blob], 'foto.jpg', { type: 'image/jpeg' })
      const url = URL.createObjectURL(f)
      setFile(f)
      setPreview(url)
      stopCamera()
      setStep('categorize')
    }, 'image/jpeg', 0.92)
  }

  // ── Dropzone ──────────────────────────────────────────────────────────────

  const onDrop = useCallback((files: File[]) => {
    if (!files.length) return
    const f = files[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStep('categorize')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    disabled: cameraMode,
    maxFiles: 1,
  })

  // ── Analyse starten ────────────────────────────────────────────────────────

  const analyse = async () => {
    if (!file || !categoryKey) return
    setStep('analyzing')
    setError(null)
    try {
      const data = await api.checkItem(file, categoryKey)
      setResult(data as CheckResult)
      setStep('result')
    } catch (e: any) {
      setError(e.message ?? 'Analyse fehlgeschlagen')
      setStep('categorize')
    }
  }

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setCategoryKey('')
    setResult(null)
    setError(null)
    setStep('capture')
  }

  const selectedCategory = categories.flatMap(g => g.items).find(i => i.key === categoryKey)

  // ── OVERLAY-CONTAINER ──────────────────────────────────────────────────────

  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'flex-end',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 430,
        margin: '0 auto',
        background: 'var(--bg)',
        borderRadius: '20px 20px 0 0',
        maxHeight: '92vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 280ms cubic-bezier(0.32,0.72,0,1)',
      }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 12px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingBag size={20} color="var(--accent)" />
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text)' }}>
                Kaufberater
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                {step === 'capture'    && 'Foto machen oder hochladen'}
                {step === 'categorize' && 'Kategorie auswählen'}
                {step === 'analyzing'  && 'Wird analysiert…'}
                {step === 'result'     && 'Deine Empfehlung'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--bg2)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} color="var(--muted)" />
          </button>
        </div>

        {/* ── Progress-Dots ───────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 0 6px' }}>
          {(['capture','categorize','result'] as const).map((s, i) => {
            const active = (
              s === 'capture'    ? step === 'capture' || step === 'analyzing' || step === 'categorize' :
              s === 'categorize' ? step === 'categorize' || step === 'analyzing' :
              step === 'result'
            )
            const done = (
              s === 'capture'    ? step !== 'capture' :
              s === 'categorize' ? step === 'result' || step === 'analyzing' :
              step === 'result'
            )
            return (
              <div key={i} style={{
                width: done ? 20 : (active && s === (step === 'analyzing' ? 'categorize' : step) ? 20 : 6),
                height: 6,
                borderRadius: 3,
                background: done || (s === step) ? 'var(--accent)' : 'var(--border2)',
                transition: 'all 300ms',
              }} />
            )
          })}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ════════════════════════════════════════════════════ */}
          {/* SCHRITT 1: Foto */}
          {/* ════════════════════════════════════════════════════ */}
          {step === 'capture' && (
            <div style={{ padding: '16px 20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Kamera-Ansicht */}
              {cameraMode ? (
                <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', display: 'block', maxHeight: 340, objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    display: 'flex', justifyContent: 'center', padding: '12px 0',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
                  }}>
                    <button
                      onClick={capturePhoto}
                      style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: '#fff', border: '3px solid rgba(255,255,255,0.6)',
                        cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                      }}
                    />
                  </div>
                  <button onClick={stopCamera} style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                    width: 32, height: 32, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={15} color="#fff" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Kamera-Button */}
                  <button
                    onClick={startCamera}
                    style={{
                      width: '100%', padding: '20px 16px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1.5px solid var(--border2)',
                      background: 'var(--surface)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                      transition: 'border-color 200ms',
                    }}
                  >
                    <Camera size={28} color="var(--accent)" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text)' }}>
                        Foto aufnehmen
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        Kamera öffnen und Kleidungsstück fotografieren
                      </div>
                    </div>
                  </button>

                  {/* Upload-Zone */}
                  <div
                    {...getRootProps()}
                    style={{
                      width: '100%', padding: '20px 16px',
                      borderRadius: 'var(--radius-lg)',
                      border: `1.5px dashed ${isDragActive ? 'var(--accent)' : 'var(--border2)'}`,
                      background: isDragActive ? 'rgba(201,184,154,.06)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                      transition: 'all 200ms',
                    }}
                  >
                    <input {...getInputProps()} />
                    <Upload size={28} color="var(--accent)" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text)' }}>
                        Foto hochladen
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        JPG, PNG oder WebP — hier ablegen oder klicken
                      </div>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center', padding: '4px 0' }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════ */}
          {/* SCHRITT 2: Kategorisieren */}
          {/* ════════════════════════════════════════════════════ */}
          {(step === 'categorize') && (
            <div style={{ padding: '16px 20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Vorschau + Neu-Foto-Button */}
              <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <img
                  src={preview!}
                  alt="Vorschau"
                  style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                />
                <button
                  onClick={reset}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                    width: 30, height: 30, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <RefreshCw size={14} color="#fff" />
                </button>
              </div>

              {/* Kategorie-Dropdown */}
              <div>
                <label style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  display: 'block', marginBottom: 6,
                }}>
                  Was ist das? *
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={categoryKey}
                    onChange={e => setCategoryKey(e.target.value)}
                    style={{
                      width: '100%', appearance: 'none',
                      background: 'var(--bg)',
                      border: '1px solid var(--border2)',
                      borderRadius: 'var(--radius)',
                      padding: '9px 36px 9px 12px',
                      fontSize: 14,
                      color: categoryKey ? 'var(--text)' : 'var(--muted)',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <option value="" disabled>Kategorie auswählen…</option>
                    {categories.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.items.map(item => (
                          <option key={item.key} value={item.key}>{item.display}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown size={15} color="var(--muted)" style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)', pointerEvents: 'none',
                  }} />
                </div>
                {selectedCategory && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                      {selectedCategory.description}
                    </div>
                    <FormalityBar level={selectedCategory.formality} />
                  </div>
                )}
              </div>

              {error && (
                <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>
              )}

              {/* Analyse-Button */}
              <button
                onClick={analyse}
                disabled={!categoryKey}
                style={{
                  width: '100%', padding: '13px 16px',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  background: categoryKey ? 'var(--accent)' : 'var(--border2)',
                  color: categoryKey ? '#0a0a0a' : 'var(--muted)',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 16,
                  cursor: categoryKey ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 200ms',
                }}
              >
                <Sparkles size={16} />
                {categoryKey ? 'Analysieren' : 'Kategorie auswählen'}
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════ */}
          {/* SCHRITT 3: Analysieren (Ladeanimation) */}
          {/* ════════════════════════════════════════════════════ */}
          {step === 'analyzing' && (
            <div style={{
              padding: '48px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            }}>
              {preview && (
                <div style={{
                  width: 110, height: 110, borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  border: '2px solid var(--border2)',
                }}>
                  <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>
                  Wird analysiert…
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Outfit-Potenzial wird berechnet
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════ */}
          {/* SCHRITT 4: Ergebnis */}
          {/* ════════════════════════════════════════════════════ */}
          {step === 'result' && result && (
            <div style={{ padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Foto + Verdict nebeneinander */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {preview && (
                  <div style={{
                    width: 90, height: 110, borderRadius: 'var(--radius)', overflow: 'hidden',
                    border: '1.5px solid var(--border2)', flexShrink: 0,
                  }}>
                    <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                {/* Hauptverdikt-Box */}
                <div style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                  background: `${result.verdict_color}14`,
                  border: `1.5px solid ${result.verdict_color}40`,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <VerdictIcon verdict={result.verdict} />
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 22,
                    color: result.verdict_color,
                    lineHeight: 1.1,
                  }}>
                    {result.verdict_label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {result.category_display}
                  </div>
                </div>
              </div>

              {/* Kennzahlen */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Outfit-Potenzial */}
                <div style={{
                  padding: '14px', borderRadius: 'var(--radius)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Neue Outfits
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 32, fontWeight: 300,
                    color: result.outfit_count >= 3 ? '#4ade80' : result.outfit_count >= 1 ? '#facc15' : '#f87171',
                    lineHeight: 1,
                  }}>
                    {result.outfit_count}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    Kombinationen möglich
                  </div>
                </div>

                {/* Stil-Score */}
                <div style={{
                  padding: '14px', borderRadius: 'var(--radius)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Stil-Match
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, marginBottom: 6 }}>
                    <div style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 32, fontWeight: 300,
                      color: result.style_score >= 70 ? '#4ade80' : result.style_score >= 50 ? '#facc15' : '#f87171',
                      lineHeight: 1,
                    }}>
                      {result.style_score}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--muted)', paddingBottom: 3 }}>%</div>
                  </div>
                  {/* Score-Balken */}
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--border2)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${result.style_score}%`,
                      background: result.style_score >= 70 ? '#4ade80' : result.style_score >= 50 ? '#facc15' : '#f87171',
                      borderRadius: 2,
                      transition: 'width 600ms cubic-bezier(0.34,1.56,0.64,1)',
                    }} />
                  </div>
                </div>
              </div>

              {/* Formalitätslevel + Stil-Tags */}
              <div style={{
                padding: '12px 14px', borderRadius: 'var(--radius)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Formalität
                  </div>
                  <FormalityBar level={result.formality} />
                </div>

                {result.style_tags.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Stil-Tags
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {result.style_tags.map(tag => (
                        <span key={tag} style={{
                          padding: '3px 10px', borderRadius: 12,
                          fontSize: 11, background: 'var(--bg)',
                          border: '1px solid var(--border2)', color: 'var(--muted)',
                        }}>
                          {tag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Begründungen */}
              <div style={{
                padding: '14px', borderRadius: 'var(--radius)',
                background: 'var(--surface)', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Warum?
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.reasons.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: 'var(--accent)', marginTop: 6, flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aktions-Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <button
                  onClick={reset}
                  style={{
                    width: '100%', padding: '12px 16px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border2)',
                    background: 'transparent',
                    color: 'var(--muted)',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <RefreshCw size={14} />
                  Anderes Kleidungsstück prüfen
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  )
}
