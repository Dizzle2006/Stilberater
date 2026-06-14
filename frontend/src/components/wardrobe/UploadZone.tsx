import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Loader2, X, ChevronDown, Sparkles, Undo2 } from 'lucide-react'
import { useWardrobeStore } from '../../store/wardrobe'
import { api } from '../../utils/api'
import { removeBackground } from '../../services/backgroundRemoval'
import toast from 'react-hot-toast'

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

interface ColorItem {
  name: string
  hex: string
}

interface ColorGroup {
  group: string
  colors: ColorItem[]
}

export default function UploadZone() {
  const { fetch: fetchItems } = useWardrobeStore()

  const [file, setFile] = useState<File | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [bgRemoved, setBgRemoved] = useState(false)
  const [removingBg, setRemovingBg] = useState(false)
  const [bgProgress, setBgProgress] = useState(0)
  const [categoryKey, setCategoryKey] = useState('')
  const [colorOverride, setColorOverride] = useState<string | null>(null)
  const [customColorText, setCustomColorText] = useState('')
  const [patternKey, setPatternKey] = useState('solid')
  const [uploading, setUploading] = useState(false)

  const [categories, setCategories] = useState<CategoryGroup[]>([])
  const [palette, setPalette] = useState<ColorGroup[]>([])
  const [categoryOpen, setCategoryOpen] = useState(false)
  const categoryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getCategories().then((data: any) => setCategories(data)).catch(() => {})
    api.getColorPalette().then((data: any) => setPalette(data)).catch(() => {})
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return
    const f = files[0]
    setOriginalFile(f)
    setBgRemoved(false)
    setCategoryKey('')
    setColorOverride(null)

    const originalUrl = URL.createObjectURL(f)
    setFile(f)
    setPreview(originalUrl)

    // Hintergrund automatisch entfernen
    setRemovingBg(true)
    setBgProgress(0)
    try {
      const blob = await Promise.race([
        removeBackground(f, setBgProgress),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('Timeout')), 180_000)
        ),
      ])
      const newFile = new File([blob], f.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' })
      URL.revokeObjectURL(originalUrl)
      setFile(newFile)
      setPreview(URL.createObjectURL(newFile))
      setBgRemoved(true)
    } catch (err: any) {
      toast.error(`Hintergrund konnte nicht entfernt werden: ${err?.message ?? String(err)}`.slice(0, 120))
    } finally {
      setRemovingBg(false)
      setBgProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    disabled: uploading || !!file,
    noClick: !!file,
    noDrag: !!file,
  })

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setOriginalFile(null)
    setPreview(null)
    setBgRemoved(false)
    setRemovingBg(false)
    setBgProgress(0)
    setCategoryKey('')
    setColorOverride(null)
    setCustomColorText('')
    setPatternKey('solid')
  }

  const handleRemoveBg = async () => {
    if (!file || removingBg) return
    if (bgRemoved && originalFile) {
      // Revert to original
      if (preview) URL.revokeObjectURL(preview)
      setFile(originalFile)
      setPreview(URL.createObjectURL(originalFile))
      setBgRemoved(false)
      return
    }
    setRemovingBg(true)
    setBgProgress(0)
    try {
      const blob = await Promise.race([
        removeBackground(file, setBgProgress),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('Timeout')), 180_000)
        ),
      ])
      const newFile = new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' })
      if (preview) URL.revokeObjectURL(preview)
      setFile(newFile)
      setPreview(URL.createObjectURL(newFile))
      setBgRemoved(true)
      toast.success('Hintergrund entfernt')
    } catch (err: any) {
      toast.error(`Fehlgeschlagen: ${err?.message ?? String(err)}`.slice(0, 120))
    } finally {
      setRemovingBg(false)
      setBgProgress(0)
    }
  }

  const handleSubmit = async () => {
    if (!file || !categoryKey) return
    setUploading(true)
    try {
      await api.uploadItem(file, categoryKey, colorOverride ?? undefined, patternKey)
      toast.success('Kleidungsstück gespeichert')
      await fetchItems()
      reset()
    } catch (e: any) {
      toast.error(e.message ?? 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  const selectedCategory = categories.flatMap(g => g.items).find(i => i.key === categoryKey)

  /* ── DROP ZONE (State 1: no file selected) ─────────────────────────── */
  if (!file) {
    return (
      <div
        {...getRootProps()}
        style={{
          border: `1.5px dashed ${isDragActive ? 'var(--accent)' : 'var(--border2)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? 'rgba(201,184,154,.06)' : 'transparent',
          transition: 'all 200ms',
        }}
      >
        <input {...getInputProps()} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Upload size={28} color="var(--accent)" />
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text)' }}>
              Kleidungsstück hinzufügen
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
              Foto hier ablegen oder klicken — JPG, PNG, WebP
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── TAGGING FORM (State 2: file selected) ─────────────────────────── */
  return (
    <div style={{
      border: '1px solid var(--border2)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--surface)',
    }}>
      {/* Image preview */}
      <div style={{ position: 'relative' }}>
        <img
          src={preview!}
          alt="Vorschau"
          style={{
            width: '100%', height: 220, objectFit: 'cover', display: 'block',
            background: bgRemoved ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 16px 16px' : undefined,
          }}
        />
        <button
          onClick={reset}
          disabled={uploading || removingBg}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
            width: 30, height: 30, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={15} color="#fff" />
        </button>
        {/* Remove background button */}
        <button
          onClick={handleRemoveBg}
          disabled={uploading || removingBg}
          title={bgRemoved ? 'Rückgängig' : 'Hintergrund entfernen'}
          style={{
            position: 'absolute', top: 8, left: 8,
            background: bgRemoved ? 'rgba(45,72,48,0.85)' : 'rgba(0,0,0,0.55)',
            border: 'none', borderRadius: 20,
            padding: '5px 10px', cursor: uploading || removingBg ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            color: '#fff', fontSize: 11, fontFamily: 'inherit',
            transition: 'background 150ms',
          }}
        >
          {removingBg ? (
            <>
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              {bgProgress > 0 ? `${bgProgress}%` : '…'}
            </>
          ) : bgRemoved ? (
            <><Undo2 size={12} /> Original</>
          ) : (
            <><Sparkles size={12} /> Hintergrund</>
          )}
        </button>
      </div>

      {/* Form */}
      <div style={{ padding: '18px 16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Category dropdown */}
        <div ref={categoryRef} style={{ position: 'relative' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Kleidungsart *
          </label>
          <button
            type="button"
            disabled={uploading}
            onClick={() => setCategoryOpen(o => !o)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg2)',
              border: `1px solid ${categoryOpen ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius: 'var(--radius)',
              padding: '10px 12px',
              fontSize: 14,
              color: categoryKey ? 'var(--text)' : 'var(--muted)',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              transition: 'border-color 150ms',
            }}
          >
            <span>{selectedCategory ? selectedCategory.display : 'Kategorie auswählen…'}</span>
            <ChevronDown
              size={15}
              color="var(--muted)"
              style={{ flexShrink: 0, transform: categoryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
            />
          </button>

          {categoryOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: 'var(--bg2)',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              zIndex: 200,
              maxHeight: 260,
              overflowY: 'auto',
            }}>
              {categories.map(group => (
                <div key={group.group}>
                  <div style={{
                    padding: '8px 12px 4px',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    borderTop: '1px solid var(--border)',
                    marginTop: 2,
                  }}>
                    {group.group}
                  </div>
                  {group.items.map(item => (
                    <div
                      key={item.key}
                      onClick={() => { setCategoryKey(item.key); setCategoryOpen(false) }}
                      style={{
                        padding: '9px 12px',
                        fontSize: 14,
                        color: 'var(--text)',
                        cursor: 'pointer',
                        background: categoryKey === item.key ? 'var(--accent-light)' : 'transparent',
                        fontWeight: categoryKey === item.key ? 600 : 400,
                        transition: 'background 100ms',
                      }}
                      onMouseEnter={e => { if (categoryKey !== item.key) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg3)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = categoryKey === item.key ? 'var(--accent-light)' : 'transparent' }}
                    >
                      {item.display}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {selectedCategory && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
              {selectedCategory.description} · Formalität {selectedCategory.formality}/5
            </div>
          )}
        </div>

        {/* Color picker */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Farbe
          </label>

          {/* Freies Textfeld für eigene Farbnamen */}
          <input
            type="text"
            value={customColorText}
            disabled={uploading}
            placeholder="Eigene Farbe eingeben (z.B. dunkelolive, rostbraun, taubenblau…)"
            onChange={e => {
              const val = e.target.value
              setCustomColorText(val)
              setColorOverride(val.trim().toLowerCase() || null)
            }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 10px',
              border: `1px solid ${customColorText ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius: 'var(--radius)',
              background: 'var(--bg2)',
              fontSize: 13,
              color: 'var(--text)',
              fontFamily: 'inherit',
              marginBottom: 10,
              outline: 'none',
              transition: 'border-color 150ms',
            }}
          />

          {!colorOverride && !customColorText && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontStyle: 'italic' }}>
              Wird automatisch erkannt — Palette oder Text für manuellen Override
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {palette.map(group => (
              <div key={group.group}>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 5 }}>
                  {group.group}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {group.colors.map(c => {
                    const isSelected = colorOverride === c.name && !customColorText
                    return (
                      <button
                        key={c.name}
                        title={c.name}
                        onClick={() => {
                          if (isSelected) {
                            setColorOverride(null)
                          } else {
                            setCustomColorText('')
                            setColorOverride(c.name)
                          }
                        }}
                        disabled={uploading}
                        style={{
                          width: 26, height: 26,
                          borderRadius: '50%',
                          background: c.hex,
                          border: isSelected ? '2.5px solid var(--accent)' : '1.5px solid rgba(0,0,0,0.12)',
                          cursor: 'pointer',
                          outline: isSelected ? '2px solid var(--surface)' : 'none',
                          outlineOffset: isSelected ? '-4px' : '0',
                          boxShadow: isSelected ? '0 0 0 3px var(--accent)' : 'none',
                          transition: 'all 120ms',
                          flexShrink: 0,
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {colorOverride && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: customColorText
                  ? 'var(--accent)'
                  : (palette.flatMap(g => g.colors).find(c => c.name === colorOverride)?.hex ?? '#999'),
                border: '1px solid rgba(0,0,0,0.1)',
                flexShrink: 0,
              }} />
              {colorOverride.charAt(0).toUpperCase() + colorOverride.slice(1)} gesetzt
              <button
                onClick={() => { setColorOverride(null); setCustomColorText('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--muted)', fontSize: 11, marginLeft: 4 }}
              >
                zurücksetzen
              </button>
            </div>
          )}
        </div>

        {/* Pattern picker */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Muster
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {([
              { id: 'solid',          label: 'Uni' },
              { id: 'subtle_texture', label: 'Textur' },
              { id: 'stripe',         label: 'Streifen' },
              { id: 'fine_check',     label: 'Karo' },
              { id: 'houndstooth',    label: 'Hahnentritt' },
              { id: 'other',          label: 'Anderes' },
            ] as const).map(p => (
              <button
                key={p.id}
                type="button"
                disabled={uploading}
                onClick={() => setPatternKey(p.id)}
                style={{
                  padding: '5px 11px', borderRadius: 20, fontSize: 12,
                  background: patternKey === p.id ? 'var(--accent)' : 'var(--bg3)',
                  color: patternKey === p.id ? '#fff' : 'var(--muted)',
                  border: `1.5px solid ${patternKey === p.id ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'all 120ms',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!categoryKey || uploading}
          style={{
            width: '100%',
            padding: '11px 16px',
            borderRadius: 'var(--radius)',
            border: 'none',
            background: !categoryKey || uploading ? 'var(--border2)' : 'var(--accent)',
            color: !categoryKey || uploading ? 'var(--muted)' : '#fff',
            fontFamily: 'var(--font-serif)',
            fontSize: 15,
            cursor: !categoryKey || uploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 200ms',
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Wird gespeichert…
            </>
          ) : categoryKey && selectedCategory ? (
            `${selectedCategory.display} speichern`
          ) : (
            'Kategorie auswählen'
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
