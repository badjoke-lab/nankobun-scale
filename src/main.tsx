import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import { registerServiceWorker } from './pwa'

const strings = {
  ja: {
    tagline: '好きなものを、ものさしに。',
    primary: '撮ったもので測る',
    reuse: 'また使う',
    empty: '保存したものはまだありません',
    standard: 'cm・inchで測る',
  },
  en: {
    tagline: 'Measure with anything.',
    primary: 'Measure with a photo',
    reuse: 'Use again',
    empty: 'Nothing saved yet',
    standard: 'Measure in cm / inch',
  },
} as const

type Locale = keyof typeof strings

function detectLocale(): Locale {
  const saved = localStorage.getItem('nankobun.locale')
  if (saved === 'ja' || saved === 'en') return saved
  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

function App() {
  const [locale, setLocale] = React.useState<Locale>(detectLocale)
  const t = strings[locale]

  React.useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const switchLocale = (next: Locale) => {
    localStorage.setItem('nankobun.locale', next)
    setLocale(next)
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
        <button className="primary-button">{t.primary}</button>
      </section>

      <section className="saved-section">
        <div className="section-heading">
          <h2>{t.reuse}</h2>
        </div>
        <div className="empty-card">{t.empty}</div>
      </section>

      <section className="secondary-section">
        <button className="secondary-button">{t.standard}</button>
      </section>
    </main>
  )
}

registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
