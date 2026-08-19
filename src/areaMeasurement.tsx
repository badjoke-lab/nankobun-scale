import React from 'react'
import type { SavedUnit } from './storage'

type Locale = 'ja' | 'en'
type Point = { x: number; y: number }
type DrawMode = 'freehand' | 'polygon'

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

function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j]
    const crosses = ((a.y > point.y) !== (b.y > point.y)) &&
      point.x < (b.x - a.x) * (point.y - a.y) / ((b.y - a.y) || 1e-9) + a.x
    if (crosses) inside = !inside
  }
  return inside
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function effectiveRatio(src: string) {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  const max = 256
  const factor = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight))
  canvas.width = Math.max(1, Math.round(image.naturalWidth * factor))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * factor))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  let solid = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) solid++
  return { ratio: solid / (canvas.width * canvas.height), aspect: canvas.height / canvas.width }
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
  const [unitMeta, setUnitMeta] = React.useState({ ratio: 1, aspect: 1 })

  React.useEffect(() => { void effectiveRatio(unit.imageDataUrl).then(setUnitMeta) }, [unit.imageDataUrl])

  const norm = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) }
  }

  const down = (event: React.PointerEvent<HTMLDivElement>) => {
    if (confirmed) return
    if (regionDone) {
      setDragOrigin(true)
      setOrigin(norm(event))
      setFilled(false)
      return
    }
    if (mode === 'polygon') {
      setRegion((old) => [...old, norm(event)])
      return
    }
    setDrawing(true)
    setRegion([norm(event)])
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (confirmed) return
    if (dragOrigin && regionDone) {
      setOrigin(norm(event)); setFilled(false); return
    }
    if (drawing && mode === 'freehand') {
      const next = norm(event)
      setRegion((old) => old.length === 0 || Math.hypot(next.x - old[old.length - 1].x, next.y - old[old.length - 1].y) > 0.01 ? [...old, next] : old)
    }
  }

  const up = () => { setDrawing(false); setDragOrigin(false) }
  const valid = region.length >= 3 && polygonArea(region) > 0.002
  const unitArea = Math.max(0.000001, scale * (scale * unitMeta.aspect) * unitMeta.ratio)
  const value = polygonArea(region) / unitArea

  const cols = Math.ceil(1 / scale) + 4
  const rows = Math.ceil(1 / Math.max(scale * unitMeta.aspect, 0.02)) + 4
  const tiles = filled ? Array.from({ length: cols * rows }, (_, index) => {
    const col = index % cols - 2
    const row = Math.floor(index / cols) - 2
    return { index, x: origin.x + col * scale, y: origin.y + row * scale * unitMeta.aspect }
  }).filter((tile) => tile.x > -scale && tile.x < 1 + scale && tile.y > -scale && tile.y < 1 + scale) : []

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
