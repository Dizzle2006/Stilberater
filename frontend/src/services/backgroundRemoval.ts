let _worker: Worker | null = null
let _msgId = 0

function getWorker(): Worker {
  if (!_worker) {
    _worker = new Worker(
      new URL('../workers/bgRemoval.worker.ts', import.meta.url),
      { type: 'module' },
    )
  }
  return _worker
}

export function preloadBackgroundRemoval(): void {
  getWorker().postMessage({ type: 'preload' })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export function removeBackground(
  source: File | Blob | string,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    const worker = getWorker()
    const id = ++_msgId
    const blob = typeof source === 'string' ? dataUrlToBlob(source) : source
    const buffer = await blob.arrayBuffer()

    const handler = (e: MessageEvent) => {
      if (e.data.id !== id) return
      const { type, pct, buffer: out, message } = e.data
      if (type === 'progress') {
        onProgress?.(pct)
      } else if (type === 'done') {
        worker.removeEventListener('message', handler)
        resolve(new Blob([out], { type: 'image/png' }))
      } else if (type === 'error') {
        worker.removeEventListener('message', handler)
        reject(new Error(message))
      }
    }

    worker.addEventListener('message', handler)
    worker.postMessage({ id, type: 'remove', buffer, mimeType: blob.type }, [buffer])
  })
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result as string)
    reader.onerror = rej
    reader.readAsDataURL(blob)
  })
}
