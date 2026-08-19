import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import { registerServiceWorker } from './pwa'
import { UnitCreator } from './unitCreator'
import { LengthMeasurement } from './lengthMeasurement'
import { AreaMeasurement } from './areaMeasurement'
import { HistoryView } from './historyView'
import { deleteUnit, listSavedUnits, saveUnit, type SavedUnit } from './storage'

const strings = {
  ja: {
    tagline: '好きなものを、ものさしに。', primary: '撮ったもので測る', reuse: 'また使う', empty: '保存したものはまだありません', standard: 'cm・inchで測る',
    use: 'これで測る', edit: '編集', remove: '削除', back: 'ホームへ', history: '履歴',
    name: '名前をつける・変更', save: '保存', deleteQuestion: 'この画像を削除しますか？', cancel: 'キャンセル',
  },
  en: {
    tagline: 'Measure with anything.', primary: 'Measure with a photo', reuse: 'Use again', empty: 'Nothing saved yet', standard: 'Measure in cm / inch',
    use: 'Measure with this', edit: 'Edit', remove: 'Delete', back: 'Home', history: 'History',
    name: 'Add or change name', save: 'Save', deleteQuestion: 'Delete this image?', cancel: 'Cancel',
  },
} as const

type Locale = keyof typeof strings
type Screen = 'home' | 'create' | 'unit-actions' | 'length-measurement' | 'area-measurement' | 'history'

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
  const [areaTarget, setAreaTarget] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState('')
  const t = strings[locale]

  const refreshUnits = React.useCallback(async () => {
    try { setUnits(await listSavedUnits()) } catch { setUnits([]) }
  }, [])

  React.useEffect(() => { document.documentElement.lang = locale }, [locale])
  React.useEffect(() => { void refreshUnits() }, [refreshUnits])

  const switchLocale = (next: Locale) => {
    localStorage.setItem('nankobun.locale', next)
    setLocale(next)
  }

  const startMeasurement = (unit: SavedUnit) => {
    setActiveUnit(unit)
    setAreaTarget(null)
    setScreen('length-measurement')
  }

  const openUnitActions = (unit: SavedUnit) => {
    setActiveUnit(unit)
    setEditName(unit.name ?? '')
    setScreen('unit-actions')
  }

  if (screen === 'create') {
    return <UnitCreator locale={locale} onClose={() => { setScreen('home'); void refreshUnits() }} onSaved={refreshUnits} onReadyToMeasure={startMeasurement} />
  }

  if (screen === 'unit-actions' && activeUnit) {
    return <main className="editor-screen center-content">
      <button className="text-button" onClick={() => setScreen('home')}>← {t.back}</button>
      <div className="cutout-preview checker"><img src={activeUnit.imageDataUrl} alt={activeUnit.name || ''} /></div>
      <button className="primary-button" onClick={() => startMeasurement(activeUnit)}>{t.use}</button>
      <label className="field-label">{t.name}<input value={editName} onChange={(e) => setEditName(e.target.value)} /></label>
      <button className="secondary-button" onClick={async () => {
        const updated = { ...activeUnit, name: editName.trim() || undefined }
        await saveUnit(updated)
        setActiveUnit(updated)
        await refreshUnits()
      }}>{t.save}</button>
      <button className="danger-button" onClick={async () => {
        if (!window.confirm(t.deleteQuestion)) return
        await deleteUnit(activeUnit.id)
        await refreshUnits()
        setActiveUnit(null)
        setScreen('home')
      }}>{t.remove}</button>
    </main>
  }

  if (screen === 'length-measurement' && activeUnit) {
    return <LengthMeasurement locale={locale} unit={activeUnit} onClose={() => setScreen('home')} onArea={(target) => { setAreaTarget(target); setScreen('area-measurement') }} />
  }

  if (screen === 'area-measurement' && activeUnit && areaTarget) {
    return <AreaMeasurement locale={locale} unit={activeUnit} target={areaTarget} onClose={() => setScreen('home')} />
  }

  if (screen === 'history') {
    return <HistoryView locale={locale} onClose={() => setScreen('home')} />
  }

  return <main className="app-shell">
    <header className="topbar">
      <div><h1>NANKOBUN SCALE</h1><p>{t.tagline}</p></div>
      <div className="language-switch" aria-label="Language">
        <button className={locale === 'ja' ? 'active' : ''} onClick={() => switchLocale('ja')}>日本語</button>
        <button className={locale === 'en' ? 'active' : ''} onClick={() => switchLocale('en')}>EN</button>
      </div>
    </header>

    <section className="primary-section"><button className="primary-button" onClick={() => setScreen('create')}>{t.primary}</button></section>

    <section className="saved-section">
      <div className="section-heading"><h2>{t.reuse}</h2></div>
      {units.length === 0 ? <div className="empty-card">{t.empty}</div> : <div className="saved-grid">
        {units.map((unit) => <article className="saved-card" key={unit.id}>
          <button className="saved-image-button" onClick={() => openUnitActions(unit)}><img src={unit.imageDataUrl} alt={unit.name || ''} /></button>
          {unit.name && <strong>{unit.name}</strong>}
          <div className="saved-actions">
            <button onClick={() => startMeasurement(unit)}>{t.use}</button>
            <button onClick={() => openUnitActions(unit)}>{t.edit}</button>
          </div>
        </article>)}
      </div>}
    </section>

    <section className="secondary-section">
      <button className="secondary-button" onClick={() => setScreen('history')}>{t.history}</button>
      <button className="secondary-button" disabled>{t.standard}</button>
    </section>
  </main>
}

registerServiceWorker()
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
