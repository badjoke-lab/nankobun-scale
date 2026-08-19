import React from 'react'
import { deleteMeasurement, listSavedMeasurements, type SavedMeasurement } from './storage'

type Locale = 'ja' | 'en'

type Props = {
  locale: Locale
  onClose: () => void
}

const copy = {
  ja: {
    title: '履歴', back: '戻る', empty: '保存した測定結果はありません', remove: '削除',
    deleteQuestion: 'この測定結果を削除しますか？', length: '長さ', area: '面積', closeDetail: '履歴へ',
  },
  en: {
    title: 'History', back: 'Back', empty: 'No saved measurements', remove: 'Delete',
    deleteQuestion: 'Delete this measurement?', length: 'Length', area: 'Area', closeDetail: 'History',
  },
} as const

export function HistoryView({ locale, onClose }: Props) {
  const t = copy[locale]
  const [items, setItems] = React.useState<SavedMeasurement[]>([])
  const [active, setActive] = React.useState<SavedMeasurement | null>(null)

  const refresh = React.useCallback(async () => {
    try { setItems(await listSavedMeasurements()) } catch { setItems([]) }
  }, [])

  React.useEffect(() => { void refresh() }, [refresh])

  if (active) return <main className="editor-screen history-detail-screen">
    <button className="text-button" onClick={() => setActive(null)}>← {t.closeDetail}</button>
    <h2>{active.mode === 'length' ? t.length : t.area}</h2>
    <div className="history-result-card">
      {active.targetImageDataUrl && <img className="history-target" src={active.targetImageDataUrl} alt="" />}
      <div className="result-card">
        {active.unitImageDataUrl && <img src={active.unitImageDataUrl} alt={active.unitName || ''} />}
        <strong>× {active.resultValue.toFixed(1)}</strong>
      </div>
      {active.unitName && <p>{active.unitName}</p>}
      <time>{new Date(active.createdAt).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en')}</time>
    </div>
    <button className="danger-button" onClick={async () => {
      if (!window.confirm(t.deleteQuestion)) return
      await deleteMeasurement(active.id)
      setActive(null)
      await refresh()
    }}>{t.remove}</button>
  </main>

  return <main className="editor-screen history-screen">
    <button className="text-button" onClick={onClose}>← {t.back}</button>
    <h2>{t.title}</h2>
    {items.length === 0 ? <div className="empty-card">{t.empty}</div> : <div className="history-list">
      {items.map((item) => <button className="history-item" key={item.id} onClick={() => setActive(item)}>
        {item.previewDataUrl || item.targetImageDataUrl ? <img src={item.previewDataUrl || item.targetImageDataUrl} alt="" /> : <div className="history-placeholder" />}
        <span><strong>{item.mode === 'length' ? t.length : t.area} · × {item.resultValue.toFixed(1)}</strong><small>{new Date(item.createdAt).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en')}</small></span>
      </button>)}
    </div>}
  </main>
}
