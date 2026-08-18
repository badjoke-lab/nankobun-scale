import React from 'react'
import type { SavedUnit } from './storage'
import { saveUnit } from './storage'

type Locale = 'ja' | 'en'
type Point = { x: number; y: number }

type Props = {
  locale: Locale
  onClose: () => void
  onReadyToMeasure: (unit: SavedUnit) => void
  onSaved: () => void
}

const copy = {
  ja: {
    capture: '測る基準にしたいものを撮ってください', choose: '使いたい部分を囲んでください', chooseHelp: '画像の上を順番にタップして、使いたい部分を囲みます。',
    undo: '1点戻す', reset: 'やり直す', next: '確認する', confirm: 'この部分を使いますか？', use: '使う', reselect: '選び直す',
    whatNext: 'この画像をどうしますか？', measure: 'これで測る', save: '保存する', name: '名前をつける（任意）', optional: '空欄のままでも保存できます',
    saved: '保存しました', home: 'ホームへ', invalid: '3点以上で囲んでください', failed: '保存できませんでした。もう一度お試しください。',
  },
  en: {
    capture: 'Take a photo of what you want to measure with', choose: 'Outline the part you want to use', chooseHelp: 'Tap around the part you want to use.',
    undo: 'Undo point', reset: 'Start over', next: 'Review', confirm: 'Use this part?', use: 'Use', reselect: 'Choose again',
    whatNext: 'What would you like to do with this image?', measure: 'Measure with this', save: 'Save', name: 'Add a name (optional)', optional: 'You can save it without a name',
    saved: 'Saved', home: 'Home', invalid: 'Use at least 3 points to outline the part', failed: 'Couldn’t save. Please try again.',
  },
} as const

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function makeMaskedImage(source: string, polygon: Point[]): Promise<string> {
  const image = await loadImage(source)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.beginPath()
  polygon.forEach((point, index) => {
    const x = point.x * canvas.width
    const y = point.y * canvas.height
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(image, 0, 0)
  return canvas.toDataURL('image/png')
}

export function UnitCreator({ locale, onClose, onReadyToMeasure, onSaved }: Props) {
  const t = copy[locale]
  const [source, setSource] = React.useState<string | null>(null)
  const [polygon, setPolygon] = React.useState<Point[]>([])
  const [masked, setMasked] = React.useState<string | null>(null)
  const [step, setStep] = React.useState<'capture'|'select'|'confirm'|'branch'|'save'|'saved'>('capture')
  const [name, setName] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [savedUnit, setSavedUnit] = React.useState<SavedUnit | null>(null)

  const chooseFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setSource(String(reader.result)); setPolygon([]); setMasked(null); setSavedUnit(null); setMessage(''); setStep('select')
    }
    reader.readAsDataURL(file)
  }

  const addPoint = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!source) return
    const rect = event.currentTarget.getBoundingClientRect()
    setPolygon((points) => [...points, {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    }])
    setMessage('')
  }

  const review = async () => {
    if (!source || polygon.length < 3) { setMessage(t.invalid); return }
    setMasked(await makeMaskedImage(source, polygon))
    setStep('confirm')
  }

  const makeUnit = (): SavedUnit => ({
    id: crypto.randomUUID(), name: name.trim() || undefined, imageDataUrl: masked!, sourceImageDataUrl: source || undefined, polygon, createdAt: new Date().toISOString(),
  })

  const save = async () => {
    try {
      const unit = makeUnit()
      await saveUnit(unit)
      setSavedUnit(unit)
      await onSaved()
      setStep('saved')
    } catch { setMessage(t.failed) }
  }

  if (step === 'capture') return <main className="camera-screen">
    <button className="ghost-button top-left" onClick={onClose}>←</button><div className="camera-copy">{t.capture}</div>
    <label className="shutter-file"><input type="file" accept="image/*" capture="environment" onChange={(e) => chooseFile(e.target.files?.[0])} /><span className="shutter" aria-label={t.capture} /></label>
  </main>

  if (step === 'select' && source) {
    const points = polygon.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')
    return <main className="editor-screen">
      <h2>{t.choose}</h2><p className="muted">{t.chooseHelp}</p>
      <div className="selection-stage" onPointerDown={addPoint}>
        <img src={source} alt="" draggable={false} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {polygon.length > 1 && <polyline points={points} fill={polygon.length >= 3 ? 'rgba(255,210,26,.22)' : 'none'} stroke="#ffd21a" strokeWidth="1.2" />}
          {polygon.map((p, i) => <circle key={i} cx={p.x * 100} cy={p.y * 100} r="1.6" fill="#ffd21a" />)}
        </svg>
      </div>
      {message && <p className="error-copy">{message}</p>}
      <div className="button-row"><button onClick={() => setPolygon((p) => p.slice(0,-1))}>{t.undo}</button><button onClick={() => setPolygon([])}>{t.reset}</button></div>
      <button className="primary-button" onClick={review}>{t.next}</button>
    </main>
  }

  if (step === 'confirm' && masked) return <main className="editor-screen center-content">
    <h2>{t.confirm}</h2><div className="cutout-preview checker"><img src={masked} alt="" /></div>
    <button className="primary-button" onClick={() => setStep('branch')}>{t.use}</button><button className="text-button" onClick={() => setStep('select')}>{t.reselect}</button>
  </main>

  if (step === 'branch' && masked) return <main className="editor-screen center-content">
    <h2>{t.whatNext}</h2><div className="cutout-preview checker"><img src={masked} alt="" /></div>
    <button className="primary-button" onClick={() => onReadyToMeasure(makeUnit())}>{t.measure}</button><button className="secondary-button" onClick={() => setStep('save')}>{t.save}</button>
  </main>

  if (step === 'save' && masked) return <main className="editor-screen center-content">
    <div className="cutout-preview checker"><img src={masked} alt="" /></div>
    <label className="field-label">{t.name}<input value={name} onChange={(e) => setName(e.target.value)} /></label><p className="muted">{t.optional}</p>
    {message && <p className="error-copy">{message}</p>}<button className="primary-button" onClick={save}>{t.save}</button><button className="text-button" onClick={() => setStep('branch')}>←</button>
  </main>

  return <main className="editor-screen center-content">
    <h2>{t.saved}</h2><div className="cutout-preview checker"><img src={masked!} alt="" /></div>
    <button className="primary-button" onClick={() => savedUnit && onReadyToMeasure(savedUnit)}>{t.measure}</button><button className="secondary-button" onClick={onClose}>{t.home}</button>
  </main>
}
