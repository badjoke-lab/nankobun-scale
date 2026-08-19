import React from 'react'
import type { SavedUnit } from './storage'

type Locale = 'ja' | 'en'
type Point = { x: number; y: number }

type Props = {
  locale: Locale
  unit: SavedUnit
  onClose: () => void
  onArea: (target: string) => void
}

const copy = {
  ja: {
    capture: '測りたいものを用意してください', camera: '撮影する', library: '写真から選ぶ',
    chooseMode: 'どちらを測りますか？', length: '長さ', area: '面積', endpoints: '測りたい長さの両端をタップ',
    adjust: '撮ったものの大きさや向きを決めてください', repeat: '並べる', confirm: 'この測定で決定',
    remeasure: '測り直す', back: '戻る', scale: '大きさ', rotation: '向き', result: '測定結果',
  },
  en: {
    capture: 'Choose what you want to measure', camera: 'Take photo', library: 'Choose photo',
    chooseMode: 'What do you want to measure?', length: 'Length', area: 'Area', endpoints: 'Tap both ends of the length',
    adjust: 'Set the size and angle', repeat: 'Repeat', confirm: 'Confirm measurement', remeasure: 'Measure again',
    back: 'Back', scale: 'Size', rotation: 'Angle', result: 'Result',
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
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    if (data[(y * canvas.width + x) * 4 + 3] > 0) {
      minX = Math.min(minX, x); minY = Math.min(minY, y)
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
    }
  }
  if (maxX < minX || maxY < minY) return { width: 0, height: 0 }
  return { width: maxX - minX + 1, height: maxY - minY + 1 }
}

export function LengthMeasurement({ locale, unit, onClose, onArea }: Props) {
  const t = copy[locale]
  const cameraInput = React.useRef<HTMLInputElement>(null)
  const libraryInput = React.useRef<HTMLInputElement>(null)
  const [target, setTarget] = React.useState<string | null>(null)
  const [targetAspect, setTargetAspect] = React.useState(1)
  const [modeChosen, setModeChosen] = React.useState(false)
  const [points, setPoints] = React.useState<Point[]>([])
  const [scale, setScale] = React.useState(0.22)
  const [rotation, setRotation] = React.useState(0)
  const [unitBounds, setUnitBounds] = React.useState({ width: 1, height: 1 })
  const [repeated, setRepeated] = React.useState(false)
  const [confirmed, setConfirmed] = React.useState(false)
  const [dragPoint, setDragPoint] = React.useState<number | null>(null)
  const [unitPosition, setUnitPosition] = React.useState<Point>({ x: 0.5, y: 0.5 })
  const [dragUnit, setDragUnit] = React.useState(false)

  React.useEffect(() => { void effectiveBounds(unit.imageDataUrl).then(setUnitBounds) }, [unit.imageDataUrl])

  const chooseTarget = async (file?: File) => {
    const value = await readFile(file)
    if (!value) return
    const image = await loadImage(value)
    setTargetAspect(image.naturalHeight / Math.max(image.naturalWidth, 1))
    setTarget(value); setModeChosen(false); setPoints([]); setRepeated(false); setConfirmed(false)
  }

  const normalizedPoint = (event: React.PointerEvent<HTMLDivElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) }
  }

  const stagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (confirmed || !target || points.length >= 2) return
    setPoints((old) => [...old, normalizedPoint(event)])
    setRepeated(false)
  }

  const stagePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (confirmed) return
    if (dragPoint !== null) {
      const next = normalizedPoint(event)
      setPoints((old) => old.map((p, i) => i === dragPoint ? next : p)); setRepeated(false)
    } else if (dragUnit) {
      setUnitPosition(normalizedPoint(event)); setRepeated(false)
    }
  }

  if (!target) return <main className="camera-screen source-choice-screen">
    <button className="ghost-button top-left" onClick={onClose}>←</button>
    <div className="camera-copy">{t.capture}</div>
    <div className="source-choice-actions">
      <button className="primary-button" onClick={() => cameraInput.current?.click()}>{t.camera}</button>
      <button className="secondary-button" onClick={() => libraryInput.current?.click()}>{t.library}</button>
    </div>
    <input ref={cameraInput} className="hidden-file-input" type="file" accept="image/*" capture="environment" onChange={(e) => void chooseTarget(e.target.files?.[0])}/>
    <input ref={libraryInput} className="hidden-file-input" type="file" accept="image/*" onChange={(e) => void chooseTarget(e.target.files?.[0])}/>
  </main>

  if (!modeChosen) return <main className="editor-screen center-content">
    <button className="text-button" onClick={onClose}>← {t.back}</button>
    <h2>{t.chooseMode}</h2>
    <div className="cutout-preview"><img src={target} alt="" /></div>
    <button className="primary-button" onClick={() => setModeChosen(true)}>{t.length}</button>
    <button className="secondary-button" onClick={() => onArea(target)}>{t.area}</button>
  </main>

  const a = points[0], b = points[1]
  const dx = a && b ? b.x - a.x : 0
  const dy = a && b ? (b.y - a.y) * targetAspect : 0
  const distance = Math.hypot(dx, dy)
  const axisAngle = Math.atan2(dy, dx)
  const theta = rotation * Math.PI / 180
  const aspect = unitBounds.height / Math.max(unitBounds.width, 1)
  const unitWidth = scale
  const unitHeight = scale * aspect
  const projected = Math.abs(unitWidth * Math.cos(theta - axisAngle)) + Math.abs(unitHeight * Math.sin(theta - axisAngle))
  const value = projected > 0 ? distance / projected : 0
  const full = Math.floor(value)
  const fraction = Math.max(0, value - full)

  const copies = repeated && a && b ? Array.from({ length: full + (fraction > 0.0001 ? 1 : 0) }, (_, i) => {
    const start = i * projected
    const centerDistance = start + projected / 2
    const cx = a.x + Math.cos(axisAngle) * centerDistance
    const cy = a.y + Math.sin(axisAngle) * centerDistance / Math.max(targetAspect, 1e-9)
    const isFraction = i === full && fraction > 0.0001
    return { i, cx, cy, fraction: isFraction ? fraction : 1 }
  }) : []

  return <main className="editor-screen length-screen">
    <button className="text-button" onClick={onClose}>← {t.back}</button>
    <h2>{confirmed ? t.result : points.length < 2 ? t.endpoints : t.adjust}</h2>
    <div className="length-stage" onPointerDown={stagePointerDown} onPointerMove={stagePointerMove} onPointerUp={() => { setDragPoint(null); setDragUnit(false) }} onPointerCancel={() => { setDragPoint(null); setDragUnit(false) }}>
      <img src={target} alt="" draggable={false}/>
      {a && <span className="endpoint" onPointerDown={(e) => { e.stopPropagation(); setDragPoint(0); e.currentTarget.setPointerCapture(e.pointerId) }} style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%` }} />}
      {b && <span className="endpoint" onPointerDown={(e) => { e.stopPropagation(); setDragPoint(1); e.currentTarget.setPointerCapture(e.pointerId) }} style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%` }} />}
      {a && b && <span className="measure-line" style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%`, width: `${distance * 100}%`, transform: `rotate(${axisAngle}rad)` }} />}
      {!confirmed && a && b && !repeated && <img src={unit.imageDataUrl} alt="" onPointerDown={(e) => { e.stopPropagation(); setDragUnit(true); e.currentTarget.setPointerCapture(e.pointerId) }} style={{ position: 'absolute', left: `${unitPosition.x * 100}%`, top: `${unitPosition.y * 100}%`, width: `${unitWidth * 100}%`, transform: `translate(-50%,-50%) rotate(${rotation}deg)`, touchAction: 'none' }} />}
      {copies.map((copy) => <div key={copy.i} className="unit-copy-clip" style={{ left: `${copy.cx * 100}%`, top: `${copy.cy * 100}%`, width: `${projected * 100}%`, clipPath: copy.fraction < 1 ? `inset(0 ${(1-copy.fraction)*100}% 0 0)` : undefined, transform: `translate(-50%,-50%) rotate(${axisAngle}rad)` }}>
        <img src={unit.imageDataUrl} alt="" style={{ width: `${unitWidth / Math.max(projected, 1e-9) * 100}%`, transform: `rotate(${rotation - axisAngle * 180 / Math.PI}deg)` }}/>
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
