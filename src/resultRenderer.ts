import type { SavedMeasurement } from './storage'

export type PresentationOptions = {
  unitOpacity: number
  showUnitOutline: boolean
  showBoundary: boolean
  showResultText: boolean
  showUnitName: boolean
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function drawUnit(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cx: number,
  cy: number,
  width: number,
  height: number,
  rotation: number,
  opacity: number,
  outline: boolean,
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rotation)
  if (outline) {
    ctx.globalAlpha = Math.min(1, opacity + 0.15)
    ctx.shadowColor = '#ffd21a'
    ctx.shadowBlur = 0
    for (const [x, y] of [[-3,0],[3,0],[0,-3],[0,3],[-2,-2],[2,-2],[-2,2],[2,2]]) {
      ctx.shadowOffsetX = Number(x)
      ctx.shadowOffsetY = Number(y)
      ctx.drawImage(image, -width / 2, -height / 2, width, height)
    }
    ctx.shadowColor = 'transparent'
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }
  ctx.globalAlpha = opacity
  ctx.drawImage(image, -width / 2, -height / 2, width, height)
  ctx.restore()
}

function clipPolygon(ctx: CanvasRenderingContext2D, points: {x:number;y:number}[], width: number, height: number) {
  ctx.beginPath()
  points.forEach((point, index) => {
    const x = point.x * width
    const y = point.y * height
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
}

export async function renderMeasurement(
  measurement: SavedMeasurement,
  options: PresentationOptions,
  mime: 'image/png' | 'image/jpeg' = 'image/png',
): Promise<Blob> {
  const target = await loadImage(measurement.targetImageDataUrl)
  const unit = await loadImage(measurement.unitImageDataUrl)
  const maxWidth = 1600
  const factor = Math.min(1, maxWidth / Math.max(target.naturalWidth, 1))
  const width = Math.max(1, Math.round(target.naturalWidth * factor))
  const height = Math.max(1, Math.round(target.naturalHeight * factor))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(target, 0, 0, width, height)

  if (measurement.geometry.mode === 'length') {
    const g = measurement.geometry
    const a = { x: g.endpoints[0].x * width, y: g.endpoints[0].y * height }
    const b = { x: g.endpoints[1].x * width, y: g.endpoints[1].y * height }
    const dx = b.x - a.x
    const dy = b.y - a.y
    const distance = Math.hypot(dx, dy)
    const axis = Math.atan2(dy, dx)
    const unitWidth = g.unitScale * width
    const unitHeight = unitWidth * unit.naturalHeight / Math.max(unit.naturalWidth, 1)
    const count = Math.max(measurement.resultValue, 1e-9)
    const step = distance / count
    const copies = Math.ceil(count - 1e-9)

    if (options.showBoundary) {
      ctx.save()
      ctx.strokeStyle = '#ffd21a'
      ctx.lineWidth = Math.max(3, width / 350)
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      ctx.restore()
    }

    for (let i = 0; i < copies; i++) {
      const center = (i + 0.5) * step
      const cx = a.x + Math.cos(axis) * center
      const cy = a.y + Math.sin(axis) * center
      const fraction = i === copies - 1 ? Math.min(1, count - Math.floor(count)) || 1 : 1
      ctx.save()
      if (fraction < 1) {
        ctx.translate(a.x, a.y)
        ctx.rotate(axis)
        ctx.beginPath()
        ctx.rect(-width * 2, -height * 2, distance + 0.5, height * 4)
        ctx.clip()
        ctx.rotate(-axis)
        ctx.translate(-a.x, -a.y)
      }
      drawUnit(ctx, unit, cx, cy, unitWidth, unitHeight, g.unitRotation * Math.PI / 180, options.unitOpacity, options.showUnitOutline)
      ctx.restore()
    }
  } else {
    const g = measurement.geometry
    const unitWidth = g.unitScale * width
    const unitHeight = unitWidth * unit.naturalHeight / Math.max(unit.naturalWidth, 1)
    const theta = g.unitRotation * Math.PI / 180
    const ux = unitWidth * Math.cos(theta)
    const uy = unitWidth * Math.sin(theta)
    const vx = -unitHeight * Math.sin(theta)
    const vy = unitHeight * Math.cos(theta)
    const origin = { x: g.tilingOrigin.x * width, y: g.tilingOrigin.y * height }
    const minStep = Math.max(8, Math.min(unitWidth, unitHeight))
    const extent = Math.ceil(Math.hypot(width, height) / minStep) + 3

    ctx.save()
    clipPolygon(ctx, g.region, width, height)
    ctx.clip()
    for (let row = -extent; row <= extent; row++) {
      for (let col = -extent; col <= extent; col++) {
        const cx = origin.x + col * ux + row * vx
        const cy = origin.y + col * uy + row * vy
        if (cx < -unitWidth || cx > width + unitWidth || cy < -unitHeight || cy > height + unitHeight) continue
        drawUnit(ctx, unit, cx, cy, unitWidth, unitHeight, theta, options.unitOpacity, options.showUnitOutline)
      }
    }
    ctx.restore()

    if (options.showBoundary) {
      ctx.save()
      ctx.strokeStyle = '#ffd21a'
      ctx.lineWidth = Math.max(3, width / 350)
      clipPolygon(ctx, g.region, width, height)
      ctx.stroke()
      ctx.restore()
    }
  }

  if (options.showResultText) {
    const label = `× ${measurement.resultValue.toFixed(1)}`
    ctx.save()
    ctx.font = `700 ${Math.max(28, Math.round(width / 18))}px -apple-system, BlinkMacSystemFont, sans-serif`
    const metrics = ctx.measureText(label)
    const pad = Math.max(14, width / 60)
    const boxW = metrics.width + pad * 2
    const boxH = Math.max(54, width / 14)
    const x = pad
    const y = height - boxH - pad
    ctx.fillStyle = 'rgba(0,0,0,.72)'
    ctx.fillRect(x, y, boxW, boxH)
    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x + pad, y + boxH / 2)
    if (options.showUnitName && measurement.unitName) {
      ctx.font = `500 ${Math.max(18, Math.round(width / 35))}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.fillText(measurement.unitName, x + boxW + pad, y + boxH / 2)
    }
    ctx.restore()
  }

  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('export failed')), mime, mime === 'image/jpeg' ? 0.92 : undefined))
}

export async function downloadMeasurement(measurement: SavedMeasurement, options: PresentationOptions, format: 'png' | 'jpeg') {
  const mime = format === 'png' ? 'image/png' : 'image/jpeg'
  const blob = await renderMeasurement(measurement, options, mime)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `nankobun-scale-${measurement.id}.${format === 'png' ? 'png' : 'jpg'}`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function shareMeasurement(measurement: SavedMeasurement, options: PresentationOptions) {
  const blob = await renderMeasurement(measurement, options, 'image/png')
  const file = new File([blob], `nankobun-scale-${measurement.id}.png`, { type: 'image/png' })
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    await navigator.share({ files: [file], title: 'NANKOBUN SCALE' })
    return true
  }
  return false
}
