import React from 'react'
import './ordinaryMeasurement.css'

type Locale = 'ja' | 'en'
type Point3 = { x: number; y: number; z: number }
type Capability = 'checking' | 'supported' | 'unsupported'

type Props = { locale: Locale; onClose: () => void }

const copy = {
  ja: {
    back: 'ホームへ', checking: 'この端末でcm・inch測定を使えるか確認しています…',
    unsupported: 'この端末・ブラウザではcm・inch測定を利用できません。',
    unsupportedHelp: '「撮ったもので測る」はそのまま利用できます。',
    start: 'AR測定を開始', startFailed: 'AR測定を開始できませんでした。端末・ブラウザの対応状況をご確認ください。',
    aim: '中央の印を測りたい位置に合わせてください', first: '始点を置く', second: '終点を置く',
    reset: 'やり直す', waiting: '平面を検出しています…', result: '測定結果',
    end: 'AR測定を終了', cm: 'cm', inch: 'inch',
  },
  en: {
    back: 'Home', checking: 'Checking whether cm / inch measurement is available on this device…',
    unsupported: 'cm / inch measurement is not available on this device or browser.',
    unsupportedHelp: 'You can still use Measure with a photo.',
    start: 'Start AR measurement', startFailed: 'Couldn’t start AR measurement. Check device and browser support.',
    aim: 'Aim the center marker at the point you want to measure', first: 'Set start point', second: 'Set end point',
    reset: 'Start over', waiting: 'Looking for a surface…', result: 'Result',
    end: 'End AR measurement', cm: 'cm', inch: 'inch',
  },
} as const

function distance(a: Point3, b: Point3) {
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
}

export function OrdinaryMeasurement({ locale, onClose }: Props) {
  const t = copy[locale]
  const [capability, setCapability] = React.useState<Capability>('checking')
  const [startError, setStartError] = React.useState(false)
  const [active, setActive] = React.useState(false)
  const [current, setCurrent] = React.useState<Point3 | null>(null)
  const [firstPoint, setFirstPoint] = React.useState<Point3 | null>(null)
  const [secondPoint, setSecondPoint] = React.useState<Point3 | null>(null)
  const overlayRef = React.useRef<HTMLDivElement>(null)
  const sessionRef = React.useRef<any>(null)
  const hitTestRef = React.useRef<any>(null)
  const referenceSpaceRef = React.useRef<any>(null)

  React.useEffect(() => {
    let cancelled = false
    const check = async () => {
      const xr = (navigator as any).xr
      if (!xr?.isSessionSupported) { if (!cancelled) setCapability('unsupported'); return }
      try {
        const ok = await xr.isSessionSupported('immersive-ar')
        if (!cancelled) setCapability(ok ? 'supported' : 'unsupported')
      } catch {
        if (!cancelled) setCapability('unsupported')
      }
    }
    void check()
    return () => { cancelled = true }
  }, [])

  React.useEffect(() => () => {
    try { hitTestRef.current?.cancel?.() } catch { /* no-op */ }
    try { sessionRef.current?.end?.() } catch { /* no-op */ }
  }, [])

  const stopSession = async () => {
    const session = sessionRef.current
    sessionRef.current = null
    hitTestRef.current = null
    referenceSpaceRef.current = null
    setActive(false); setCurrent(null); setFirstPoint(null); setSecondPoint(null)
    try { await session?.end?.() } catch { /* no-op */ }
  }

  const startSession = async () => {
    setStartError(false)
    const xr = (navigator as any).xr
    const overlay = overlayRef.current
    if (!xr || !overlay) { setStartError(true); return }
    try {
      const session = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: overlay },
      })
      sessionRef.current = session
      session.addEventListener('end', () => {
        sessionRef.current = null; hitTestRef.current = null; referenceSpaceRef.current = null
        setActive(false); setCurrent(null); setFirstPoint(null); setSecondPoint(null)
      }, { once: true })

      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl', { xrCompatible: true, alpha: true }) as any
      if (!gl) throw new Error('webgl')
      if (gl.makeXRCompatible) await gl.makeXRCompatible()
      const XRLayer = (window as any).XRWebGLLayer
      if (!XRLayer) throw new Error('layer')
      session.updateRenderState({ baseLayer: new XRLayer(session, gl) })

      const referenceSpace = await session.requestReferenceSpace('local')
      const viewerSpace = await session.requestReferenceSpace('viewer')
      const hitTestSource = await session.requestHitTestSource({ space: viewerSpace })
      referenceSpaceRef.current = referenceSpace
      hitTestRef.current = hitTestSource
      setActive(true)

      const onFrame = (_time: number, frame: any) => {
        if (sessionRef.current !== session) return
        const results = frame.getHitTestResults(hitTestSource)
        if (results.length > 0) {
          const pose = results[0].getPose(referenceSpace)
          if (pose) {
            const p = pose.transform.position
            setCurrent({ x: p.x, y: p.y, z: p.z })
          }
        } else {
          setCurrent(null)
        }
        session.requestAnimationFrame(onFrame)
      }
      session.requestAnimationFrame(onFrame)
    } catch {
      try { await sessionRef.current?.end?.() } catch { /* no-op */ }
      sessionRef.current = null
      setActive(false)
      setStartError(true)
    }
  }

  const resultMeters = firstPoint && secondPoint ? distance(firstPoint, secondPoint) : null

  return <main className="editor-screen ordinary-screen">
    <button className="text-button" onClick={() => { void stopSession(); onClose() }}>← {t.back}</button>
    <h2>cm / inch</h2>

    {capability === 'checking' && <p className="muted" role="status">{t.checking}</p>}
    {capability === 'unsupported' && <div className="ordinary-unavailable" role="status"><p>{t.unsupported}</p><p className="muted">{t.unsupportedHelp}</p></div>}
    {capability === 'supported' && !active && <button className="primary-button" onClick={() => void startSession()}>{t.start}</button>}
    {startError && <p className="error-copy" role="alert">{t.startFailed}</p>}

    <div ref={overlayRef} className={active ? 'xr-overlay active' : 'xr-overlay'}>
      {active && <>
        <div className="xr-crosshair" aria-hidden="true"><span /><span /></div>
        <div className="xr-controls">
          <p className="xr-copy">{current ? t.aim : t.waiting}</p>
          {resultMeters !== null ? <div className="xr-result" aria-live="polite"><span>{t.result}</span><strong>{(resultMeters * 100).toFixed(1)} {t.cm}</strong><strong>{(resultMeters / 0.0254).toFixed(2)} {t.inch}</strong></div> : null}
          {!firstPoint ? <button className="primary-button" disabled={!current} onClick={() => current && setFirstPoint(current)}>{t.first}</button> : !secondPoint ? <button className="primary-button" disabled={!current} onClick={() => current && setSecondPoint(current)}>{t.second}</button> : <button className="primary-button" onClick={() => { setFirstPoint(null); setSecondPoint(null) }}>{t.reset}</button>}
          <button className="secondary-button" onClick={() => void stopSession()}>{t.end}</button>
        </div>
      </>}
    </div>
  </main>
}
