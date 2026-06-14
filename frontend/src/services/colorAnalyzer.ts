// Browser-port of backend/app/services/color_analyzer.py
// Uses Canvas API instead of Pillow

const COLOR_PALETTE: Record<string, [number, number, number]> = {
  'white':        [245,245,240], 'cream':        [245,240,225], 'ivory':        [240,235,215],
  'beige':        [201,184,154], 'sand':         [210,195,165], 'camel':        [193,154,107],
  'tan':          [180,145,100], 'light brown':  [160,120, 80], 'brown':        [109, 76, 65],
  'dark brown':   [ 70, 45, 30], 'khaki':        [180,170,130], 'olive':        [ 90,100, 60],
  'forest green': [ 50,100, 70], 'sage':         [140,175,140], 'navy':         [ 26, 39, 68],
  'midnight blue':[ 20, 20, 80], 'cobalt':       [  0, 70,180], 'light blue':   [173,210,235],
  'denim blue':   [ 85,120,160], 'slate':        [100,120,140], 'grey':         [150,150,150],
  'charcoal':     [ 55, 55, 60], 'anthracite':   [ 45, 50, 55], 'black':        [ 20, 20, 20],
  'burgundy':     [100, 30, 50], 'bordeaux':     [120,  0, 32], 'oxblood':      [ 80, 20, 20],
  'wine':         [ 90, 20, 35], 'rust':         [180, 80, 40], 'coral':        [210,120, 90],
  'blush':        [220,175,165], 'ice blue':     [185,215,230], 'lavender':     [200,185,215],
}

function colorDistance(c1: [number,number,number], c2: [number,number,number]): number {
  return Math.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2)
}

function nearestColorName(r: number, g: number, b: number): string {
  let best = 'grey'
  let bestDist = Infinity
  for (const [name, rgb] of Object.entries(COLOR_PALETTE)) {
    const d = colorDistance([r,g,b], rgb)
    if (d < bestDist) { bestDist = d; best = name }
  }
  return best
}

export async function extractDominantColor(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      try {
        const SIZE = 80
        const canvas = document.createElement('canvas')
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, SIZE, SIZE)
        const data = ctx.getImageData(0, 0, SIZE, SIZE).data

        const cx = SIZE / 2, cy = SIZE / 2
        let wr = 0, wg = 0, wb = 0, totalW = 0

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2]
          const brightness = (r + g + b) / 3
          if (brightness > 230 || brightness < 20) continue

          const px = (i / 4) % SIZE
          const py = Math.floor((i / 4) / SIZE)
          const dist = Math.sqrt((px - cx)**2 + (py - cy)**2)
          const weight = Math.max(0.1, 1.0 - dist / (SIZE * 0.65))

          wr += r * weight; wg += g * weight; wb += b * weight; totalW += weight
        }

        if (totalW === 0) {
          // All pixels were too bright (white clothing) or too dark — average everything
          let ar = 0, ag = 0, ab = 0, cnt = 0
          for (let i = 0; i < data.length; i += 4) {
            ar += data[i]; ag += data[i+1]; ab += data[i+2]; cnt++
          }
          resolve(cnt > 0 ? nearestColorName(Math.round(ar/cnt), Math.round(ag/cnt), Math.round(ab/cnt)) : 'grey')
          return
        }

        resolve(nearestColorName(
          Math.round(wr / totalW),
          Math.round(wg / totalW),
          Math.round(wb / totalW),
        ))
      } catch { resolve('grey') }
      finally { URL.revokeObjectURL(url) }
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve('grey') }
    img.src = url
  })
}

export async function fileToBase64(file: File, maxPx = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      try {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        // Preserve transparency: use PNG for PNG inputs (bg-removed items), JPEG for others
        resolve(file.type === 'image/png'
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', quality))
      } catch (e) { reject(e) }
      finally { URL.revokeObjectURL(url) }
    }
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}
