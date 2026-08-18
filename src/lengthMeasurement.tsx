import React from 'react'
import type { SavedUnit } from './storage'

type Locale = 'ja' | 'en'
type Point = { x: number; y: number }

type Props = {
  locale: Locale
  unit: SavedUnit
  onClose: () => void
}

const copy = {
  ja: {
    capture: '測りたいものを撮ってください',
    endpoints: '測りたい長さの両端をタップ',
    adjust: '撮ったものの大きさや向きを決めてください',
    repeat: '並べる',
    confirm: 'この測定で決定',
    remeasure: '測り直す',
    back: '戻る',
    scale: '大きさ',
    rotation: '向き',
    result: '測定結果',
    invalid: '2つの点を離して指定してください',
  },
  en: {
    capture: 'Take a photo of what you want to measure',
    endpoints: 'Tap both ends of the length',
    adjust: 'Set the size and angle',
    repeat: 'Repeat',
    confirm: 'Confirm measurement',
    remeasure: 'Measure again',
    back: 'Back',
    scale: 'Size',
    rotation: 'Angle',
    result: 'Result',
    invalid: 'Place the two points farther apart',
  },
} as const

function readFile(file?: File): Promise<string | null> {
  if (!file) return Promise.resolve(null)
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function effectiveBounds(src: string): Promise<{ width: number; height: number }> {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] > 0) {
        minX = Math.min(minX, x); minY = Math.min(minY, y)
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
      }
    }
  }
  if (maxX < minX || maxY < minY) return { width: 0, height: 0 }
  return { width: maxX - minX + 1, height: maxY - minY + 1 }
}

export function LengthMeasurement({ locale, unit, onClose }: Props) {
  const t = copy[locale]
  const [target, setTarget] = React.useState<string | null>(null)
  const [points, setPoints] = React.useState<Point[]>([])
  const [scale, setScale] = React.useState(0.22)
  const [rotation, setRotation] = React.useState(0)
  const [unitBounds, setUnitBounds] = React.useState({ width: 1, height: 1 })
  const [repeated, setRepeated] = React.useState(false)
  const [confirmed, setConfirmed] = React.useState(false)

  React.useEffect(() => { void effectiveBounds(unit.imageDataUrl).then(setUnitBounds) }, [unit.imageDataUrl])

  const chooseTarget = async (file?: File) => {
    const value = await readFile(file)
    if (!value) return
    setTarget(value); setPoints([]); setRepeated(false); setConfirmed(false)
  }

  const addPoint = (event: React.PointerEvent<HTMLDivElement>) => {
    if (confirmed || !target) return
    const rect = event.currentTarget.getBoundingClientRect()
    const point = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height }
    setPoints((old) => old.length >= 2 ? [point] : [...old, point])
    setRepeated(false)
  }

  if (!target) return <main className="camera-screen">
    <button className="ghost-button top-left" onClick={onClose}>←</button>
    <div className="camera-copy">{t.capture}</div>
    <label className="shutter-file"><input type="file" accept="image/*" capture="environment" onChange={(e) => void chooseTarget(e.target.files?.[0])}/><span className="shutter" /></label>
  </main>

  const a = points[0], b = points[1]
  const dx = a && b ? b.x - a.x : 0
  const dy = a && b ? b.y - a.y : 0
  const distance = Math.hypot(dx, dy)
  const axisAngle = Math.atan2(dy, dx)
  const theta = rotation * Math.PI / 180
  const aspect = unitBounds.height / Math.max(unitBounds.width, 1)
  const unitWidthNorm = scale
  const unitHeightNorm = scale * aspect
  const projected = Math.abs(unitWidthNorm * Math.cos(theta - axisAngle)) + Math.abs(unitHeightNorm * Math.sin(theta - axisAngle))
  const value = projected > 0 ? distance / projected : 0
  const full = Math.floor(value)
  const fraction = Math.max(0, value - full)

  const copies = repeated && a && b ? Array.from({ length: full + (fraction > 0.0001 ? 1 : 0) }, (_, i) => {
    const start = i * projected
    const cx = a.x + Math.cos(axisAngle) * (start + projected / 2)
    const cy = a.y + Math.sin(axisAngle) * (start + projected / 2)
    const isFraction = i === full && fraction > 0.0001
    return { i, cx, cy, fraction: isFraction ? fraction : 1 }
  }) : []

  return <main className="editor-screen length-screen">
    <button className="text-button" onClick={onClose}>← {t.back}</button>
    <h2>{confirmed ? t.result : points.length < 2 ? t.endpoints : t.adjust}</h2>
    <div className="length-stage" onPointerDown={addPoint}>
      <img src={target} alt="" draggable={false}/>
      {a && <span className="endpoint" style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%` }} />}
      {b && <span className="endpoint" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%` }} />}
      {a && b && <span className="measure-line" style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%`, width: `${distance * 100}%`, transform: `rotate(${axisAngle}rad)` }} />}
      {copies.map((copy) => <div key={copy.i} className="unit-copy-clip" style={{ left: `${copy.cx * 100}%`, top: `${copy.cy * 100}%`, width: `${projected * 100}%`, clipPath: copy.fraction < 1 ? `inset(0 ${(1-copy.fraction)*100}% 0 0)` : undefined, transform: `translate(-50%,-50%) rotate(${axisAngle}rad)` }}>
        <img src={unit.imageDataUrl} alt="" style={{ width: `${unitWidthNorm / projected * 100}%`, transform: `rotate(${rotation - axisAngle * 180 / Math.PI}deg)` }}/>
      </div>)}
    </div>

    {!confirmed && points.length === 2 && <>
      <label className="range-label">{t.scale}<input type="range" min="0.05" max="0.6" step="0.01" value={scale} onChange={(e) => { setScale(Number(e.target.value)); setRepeated(false) }}/></label>
      <label className="range-label">{t.rotation}<input type="range" min="-180" max="180" step="1" value={rotation} onChange={(e) => { setRotation(Number(e.target.value)); setRepeated(false) }}/></label>
      {!repeated ? <button className="primary-button" onClick={() => setRepeated(true)}>{t.repeat}</button> : <button className="primary-button" onClick={() => setConfirmed(true)}>{t.confirm}</button>}
    </>}

    {points.length === 2 && repeated && <div className="result-card"><img src={unit.imageDataUrl} alt=""/><strong>× {value.toFixed(1)}</strong></div>}
    {confirmed && <button className="secondary-button" onClick={() => { setConfirmed(false); setRepeated(true) }}>{t.remeasure}</button>}
  </main>
}
