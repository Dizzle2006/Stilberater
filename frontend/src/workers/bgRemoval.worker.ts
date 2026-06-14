/// <reference lib="webworker" />
import { removeBackground as _remove, preload as _preload } from '@imgly/background-removal'

const BG_CONFIG = {
  publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
  model: 'isnet' as const,
  output: { format: 'image/png' as const, quality: 1 },
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, buffer, mimeType } = e.data

  if (type === 'preload') {
    await _preload(BG_CONFIG).catch(() => {})
    return
  }

  if (type === 'remove') {
    try {
      const blob = new Blob([buffer], { type: mimeType ?? 'image/png' })
      const result = await _remove(blob as any, {
        ...BG_CONFIG,
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) {
            self.postMessage({ id, type: 'progress', pct: Math.round((current / total) * 100) })
          }
        },
      })
      const cleaned = await cleanAlphaMatte(result)
      const resized = await resizePng(cleaned, 900)
      const out = await resized.arrayBuffer()
      self.postMessage({ id, type: 'done', buffer: out }, [out])
    } catch (err: any) {
      self.postMessage({ id, type: 'error', message: err?.message ?? String(err) })
    }
  }
}

// Removes stray background pixels (alpha < 15) and solidifies near-opaque
// clothing pixels (alpha > 220) to reduce the "halo" and transparency artefacts.
async function cleanAlphaMatte(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const { width, height } = bitmap
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let i = 3; i < data.length; i += 4) {
    const a = data[i]
    if (a < 15) {
      // Near-transparent: fully remove to eliminate stray background pixels
      data[i] = 0
      data[i - 3] = 0
      data[i - 2] = 0
      data[i - 1] = 0
    } else if (a > 220) {
      // Near-opaque: make fully solid to fix semi-transparent clothing artefacts
      data[i] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.convertToBlob({ type: 'image/png' })
}

async function resizePng(blob: Blob, maxPx: number): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = new OffscreenCanvas(w, h)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  return canvas.convertToBlob({ type: 'image/png' })
}
