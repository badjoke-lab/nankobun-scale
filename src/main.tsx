import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import { registerServiceWorker } from './pwa'
import { UnitCreator } from './unitCreator'
import { deleteUnit, listSavedUnits, type SavedUnit } from './storage'

const strings = {
  ja: {
    tagline: '好きなものを、ものさしに。',
    primary: '撮ったもので測る',
    reuse: 'また使う',
    empty: '保存したものはまだありません',
    standard: 'cm・inchで測る',
    use: 'これで測る',
    edit: '編集',
    remove: '削除',
    measurePrompt: '測りたいものを撮ってください',
    gate4: '長さ・面積の測定は次の工程で実装します。',
    back: 'ホームへ',
  },
  en: {
    tagline: 'Measure with anything.',
    primary: 'Measure with a photo',
    reuse: 'Use again',
    empty: 'Nothing saved yet',
    standard: 'Measure in cm / inch',
    use: 'Measure with this',
    edit: 'Edit',
    remove: 'Delete',
    measurePrompt: 'Take a photo of what you want to measure',
    gate4: 'Length and area measurement are implemented in the next gate.',
    back: 'Home',
  },
} as const

type Locale = keyof typeof strings
type Screen = 'home' | 'create' | 'measure-start'

function detectLocale(): Locale {
  const saved = localStorage.getItem('nankobun.locale')
  if (saved === 'ja' || saved === 'en') return saved
  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

function App() {
  const [locale, setLocale] = React.useState<Locale>(detectLocale)
  const [screen, setScreen] = React.useState<Screen>('home')
  const [units, setUnits] = React.useState<SavedUnit[]>([])
  const [activeUnit, setActiveUnit] = React.useState<SavedUnit | null>(null)
  const t = strings[locale]

  const refreshUnits = React.useCallback(async () => {
    try { setUnits(await listSavedUnits()) } catch { setUnits([]) }
  }, [])

  React.useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  React.useEffect(() => { void refreshUnits() }, [refreshUnits])

  const switchLocale = (next: Locale) => {
    localStorage.setItem('nankobun.locale', next)
    setLocale(next)
  }

  const startMeasurement = (unit: SavedUnit) => {
    setActiveUnit(unit)
    setScreen('measure-start')
  }

  if (screen === 'create') {
    return <UnitCreator locale={locale} onClose={() => { setScreen('home'); void refreshUnits() }} onSaved={refreshUnits} onReadyToMeasure={startMeasurement} />
  }

  if (screen === 'measure-start' && activeUnit) {
    return <main className="camera-screen measure-placeholder">
      <button className="ghost-button top-left" onClick={() => setScreen('home')}>←</button>
      <div className="camera-copy">{t.measurePrompt}</div>
      <div className="active-unit-pill"><img src={activeUnit.imageDataUrl} alt="" />{activeUnit.name && <span>{activeUnit.name}</span>}</div>
      <p className="gate-note">{t.gate4}</p>
      <button className="secondary-button" onClick={() => setScreen('home')}>{t.back}</button>
    </main>
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>NANKOBUN SCALE</h1>
          <p>{t.tagline}</p>
        </div>
        <div className="language-switch" aria-label="Language">
          <button className={locale === 'ja' ? 'active' : ''} onClick={() => switchLocale('ja')}>日本語</button>
          <button className={locale === 'en' ? 'active' : ''} onClick={() => switchLocale('en')}>EN</button>
        </div>
      </header>

      <section className="primary-section">
        <button className="primary-button" onClick={() => setScreen('create')}>{t.primary}</button>
      </section>

      <section className="saved-section">
        <div className="section-heading"><h2>{t.reuse}</h2></div>
        {units.length === 0 ? <div className="empty-card">{t.empty}</div> : <div className="saved-grid">
          {units.map((unit) => <article className="saved-card" key={unit.id}>
            <button className="saved-image-button" onClick={() => startMeasurement(unit)}><img src={unit.imageDataUrl} alt={unit.name || ''} /></button>
            {unit.name && <strong>{unit.name}</strong>}
            <div className="saved-actions">
              <button onClick={() => startMeasurement(unit)}>{t.use}</button>
              <button onClick={async () => { await deleteUnit(unit.id); await refreshUnits() }}>{t.remove}</button>
            </div>
          </article>)}
        </div>}
      </section>

      <section className="secondary-section">
        <button className="secondary-button" disabled>{t.standard}</button>
      </section>
    </main>
  )
}

registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
