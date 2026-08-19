import React from 'react'
import type { SavedUnit } from './storage'

type Locale = 'ja' | 'en'
type Point = { x: number; y: number }
type DrawMode = 'freehand' | 'polygon'
type Tile = { index: number; x: number; y: number }

type Props = {
  locale: Locale
  unit: SavedUnit
  target: string
  onClose: () => void
}

const copy = {
  ja: {
    back: '戻る', outline: '測りたい範囲を囲む', freehand: '指で囲む', polygon: '点で囲む', reset: 'やり直す',
    adjust: '撮ったものの大きさや向きを決めてください', fill: '敷きつめる', confirm: 'この測定で決定',
    remeasure: '測り直す', scale: '大きさ', rotation: '向き', result: '測定結果', invalid: '測る範囲を囲み直してください',
    approx: '約', pieces: '個分',
  },
  en: {
    back: 'Back', outline: 'Outline the area to measure', freehand: 'Draw around it', polygon: 'Place points', reset: 'Start over',
    adjust: 'Set the size and angle', fill: 'Fill area', confirm: 'Confirm measurement', remeasure: 'Measure again',
    scale: 'Size', rotation: 'Angle', result: 'Result', invalid: 'Please outline the area again', approx: 'About', pieces: 'of these',
  },
} as const

function polygonArea(points: Point[]) {
  if (points.length < 3) return 0
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length]
    area += a.x * b.y - b.x * a.y
  }
  return Math.abs(area) / 2
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function imageMeta(src: string) {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  const max = 256
  const factor = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight))
  canvas.width = Math.max(1, Math.round(image.naturalWidth * factor))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * factor))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  let alpha = 0
  for (let i = 3; i < data.length; i += 4) alpha += data[i] / 255
  return {
    image,
    effectiveRatio: alpha / (canvas.width * canvas.height),
    aspect: image.naturalHeight / image.naturalWidth,
  }
}

function makeTiles(origin: Point, scale: number, unitAspect: number, targetAspect: number, rotation: number): Tile[] {
  const theta = rotation * Math.PI / 180
  const ux = scale * Math.cos(theta)
  const uy = scale * Math.sin(theta) / targetAspect
  const vx = -scale * unitAspect * Math.sin(theta)
  const vy = scale * unitAspect * Math.cos(theta) / targetAspect
  const minStep = Math.max(0.01, Math.min(scale, scale * unitAspect / targetAspect))
  const extent = Math.ceil(2.5 / minStep) + 2
  const result: Tile[] = []
  let index = 0
  for (let row = -extent; row <= extent; row++) {
    for (let col = -extent; col <= extent; col++) {
      const x = origin.x + col * ux + row * vx
      const y = origin.y + col * uy + row * vy
      if (x > -0.8 && x < 1.8 && y > -0.8 && y < 1.8) result.push({ index: index++, x, y })
    }
  }
  return result
}

async function calculateAreaContribution(
  region: Point[], unitSrc: string, origin: Point, scale: number, rotation: number, targetAspect: number,
): Promise<number> {
  if (region.length < 3) return 0
  const unit = await imageMeta(unitSrc)
  const width = 384
  const height = Math.max(1, Math.round(width * targetAspect))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const tileWidth = scale * width
  const tileHeight = tileWidth * unit.aspect
  const denominator = Math.max(1e-6, tileWidth * tileHeight * unit.effectiveRatio)
  const tiles = makeTiles(origin, scale, unit.aspect, targetAspect, rotation)

  ctx.save()
  ctx.beginPath()
  region.forEach((p, i) => {
    const x = p.x * width, y = p.y * height
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.clip()

  const theta = rotation * Math.PI / 180
  for (const tile of tiles) {
    ctx.save()
    ctx.translate(tile.x * width, tile.y * height)
    ctx.rotate(theta)
    ctx.drawImage(unit.image, -tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight)
    ctx.restore()
  }
  ctx.restore()

  const data = ctx.getImageData(0, 0, width, height).data
  let coveredAlpha = 0
  for (let i = 3; i < data.length; i += 4) coveredAlpha += data[i] / 255
  return coveredAlpha / denominator
}

export function AreaMeasurement({ locale, unit, target, onClose }: Props) {
  const t = copy[locale]
  const [mode, setMode] = React.useState<DrawMode>('freehand')
  const [region, setRegion] = React.useState<Point[]>([])
  const [drawing, setDrawing] = React.useState(false)
  const [regionDone, setRegionDone] = React.useState(false)
  const [scale, setScale] = React.useState(0.2)
  const [rotation, setRotation] = React.useState(0)
  const [origin, setOrigin] = React.useState<Point>({ x: 0.5, y: 0.5 })
  const [dragOrigin, setDragOrigin] = React.useState(false)
  const [filled, setFilled] = React.useState(false)
  const [confirmed, setConfirmed] = React.useState(false)
  const [unitAspect, setUnitAspect] = React.useState(1)
  const [targetAspect, setTargetAspect] = React.useState(1)
  const [value, setValue] = React.useState(0)

  React.useEffect(() => { void imageMeta(unit.imageDataUrl).then((m) => setUnitAspect(m.aspect)) }, [unit.imageDataUrl])
  React.useEffect(() => { void loadImage(target).then((img) => setTargetAspect(img.naturalHeight / img.naturalWidth)) }, [target])

  React.useEffect(() => {
    let cancelled = false
    if (!filled) return
    void calculateAreaContribution(region, unit.imageDataUrl, origin, scale, rotation, targetAspect).then((next) => {
      if (!cancelled) setValue(next)
    })
    return () => { cancelled = true }
  }, [filled, origin, region, rotation, scale, targetAspect, unit.imageDataUrl])

  const norm = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) }
  }

  const down = (event: React.PointerEvent<HTMLDivElement>) => {
    if (confirmed) return
    if (regionDone) {
      setDragOrigin(true); setOrigin(norm(event)); setFilled(false); return
    }
    if (mode === 'polygon') { setRegion((old) => [...old, norm(event)]); return }
    setDrawing(true); setRegion([norm(event)]); event.currentTarget.setPointerCapture(event.pointerId)
  }

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (confirmed) return
    if (dragOrigin && regionDone) { setOrigin(norm(event)); setFilled(false); return }
    if (drawing && mode === 'freehand') {
      const next = norm(event)
      setRegion((old) => old.length === 0 || Math.hypot(next.x - old[old.length - 1].x, next.y - old[old.length - 1].y) > 0.01 ? [...old, next] : old)
    }
  }

  const up = () => { setDrawing(false); setDragOrigin(false) }
  const valid = region.length >= 3 && polygonArea(region) > 0.002
  const tiles = filled ? makeTiles(origin, scale, unitAspect, targetAspect, rotation) : []
  const polygonCss = region.map((p) => `${p.x * 100}% ${p.y * 100}%`).join(',')

  return <main className="editor-screen area-screen">
    <button className="text-button" onClick={onClose}>← {t.back}</button>
    <h2>{confirmed ? t.result : regionDone ? t.adjust : t.outline}</h2>

    {!regionDone && <div className="button-row">
      <button className={mode === 'freehand' ? 'selected-option' : ''} onClick={() => { setMode('freehand'); setRegion([]) }}>{t.freehand}</button>
      <button className={mode === 'polygon' ? 'selected-option' : ''} onClick={() => { setMode('polygon'); setRegion([]) }}>{t.polygon}</button>
    </div>}

    <div className="area-stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <img src={target} alt="" draggable={false} />
      {region.length > 1 && <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points={region.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')} fill="rgba(255,210,26,.16)" stroke="#ffd21a" strokeWidth="1" /></svg>}
      {filled && valid && <div className="tile-layer" style={{ clipPath: `polygon(${polygonCss})` }}>
        {tiles.map((tile) => <img key={tile.index} src={unit.imageDataUrl} alt="" style={{ left: `${tile.x * 100}%`, top: `${tile.y * 100}%`, width: `${scale * 100}%`, transform: `translate(-50%,-50%) rotate(${rotation}deg)` }} />)}
      </div>}
      {regionDone && !confirmed && !filled && <img className="area-origin-unit" src={unit.imageDataUrl} alt="" style={{ left: `${origin.x * 100}%`, top: `${origin.y * 100}%`, width: `${scale * 100}%`, transform: `translate(-50%,-50%) rotate(${rotation}deg)` }} />}
    </div>

    {!regionDone && <>
      {!valid && region.length > 0 && <p className="error-copy">{t.invalid}</p>}
      <div className="button-row"><button onClick={() => setRegion([])}>{t.reset}</button><button disabled={!valid} onClick={() => setRegionDone(true)}>{t.adjust}</button></div>
    </>}

    {regionDone && !confirmed && <>
      <label className="range-label">{t.scale}<input type="range" min="0.05" max="0.6" step="0.01" value={scale} onChange={(e) => { setScale(Number(e.target.value)); setFilled(false) }} /></label>
      <label className="range-label">{t.rotation}<input type="range" min="-180" max="180" step="1" value={rotation} onChange={(e) => { setRotation(Number(e.target.value)); setFilled(false) }} /></label>
      {!filled ? <button className="primary-button" onClick={() => setFilled(true)}>{t.fill}</button> : <button className="primary-button" onClick={() => setConfirmed(true)}>{t.confirm}</button>}
    </>}

    {filled && <div className="result-card"><img src={unit.imageDataUrl} alt="" /><strong>× {value.toFixed(1)}</strong><span>{locale === 'ja' ? `${t.approx}${value.toFixed(1)}${t.pieces}` : `${t.approx} ${value.toFixed(1)} ${t.pieces}`}</span></div>}
    {confirmed && <button className="secondary-button" onClick={() => { setConfirmed(false); setFilled(true) }}>{t.remeasure}</button>}
  </main>
}
