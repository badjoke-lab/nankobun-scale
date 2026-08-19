import React from 'react'
import { deleteMeasurement, listSavedMeasurements, type SavedMeasurement } from './storage'
import { downloadMeasurement, shareMeasurement, type PresentationOptions } from './resultRenderer'

type Locale = 'ja' | 'en'
type Props = { locale: Locale; onClose: () => void; onRemeasure: (measurement: SavedMeasurement) => void }

const copy = {
  ja: {
    title: '履歴', back: '戻る', empty: '保存した測定結果はありません', remove: '削除', deleteQuestion: 'この測定結果を削除しますか？', length: '長さ', area: '面積', closeDetail: '履歴へ',
    adjust: '見た目を整える', opacity: '基準画像の透明度', outline: '輪郭表示', boundary: '測定範囲を表示', resultText: '結果文字を表示', unitName: '名前を表示', png: 'PNGで保存', jpeg: 'JPEGで保存', share: '共有', remeasure: 'この条件から測り直す',
    exportFailed: '画像を作成できませんでした。もう一度お試しください。', shareUnavailable: 'この端末では共有を利用できません', historyFailed: '履歴を読み込めませんでした。もう一度お試しください。', retry: 'もう一度', previewLabel: '保存した測定結果',
  },
  en: {
    title: 'History', back: 'Back', empty: 'No saved measurements', remove: 'Delete', deleteQuestion: 'Delete this measurement?', length: 'Length', area: 'Area', closeDetail: 'History',
    adjust: 'Adjust display', opacity: 'Unit opacity', outline: 'Show outline', boundary: 'Show measurement boundary', resultText: 'Show result text', unitName: 'Show name', png: 'Save as PNG', jpeg: 'Save as JPEG', share: 'Share', remeasure: 'Measure again from these settings',
    exportFailed: 'Couldn’t create the image. Please try again.', shareUnavailable: 'Sharing isn’t available on this device', historyFailed: 'Couldn’t load history. Please try again.', retry: 'Try again', previewLabel: 'Saved measurement result',
  },
} as const

const defaultPresentation: PresentationOptions = { unitOpacity: 0.72, showUnitOutline: true, showBoundary: true, showResultText: true, showUnitName: true }

export function HistoryView({ locale, onClose, onRemeasure }: Props) {
  const t = copy[locale]
  const [items, setItems] = React.useState<SavedMeasurement[]>([])
  const [active, setActive] = React.useState<SavedMeasurement | null>(null)
  const [presentation, setPresentation] = React.useState<PresentationOptions>(defaultPresentation)
  const [exportError, setExportError] = React.useState('')
  const [historyError, setHistoryError] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setHistoryError(false)
    try { setItems(await listSavedMeasurements()) }
    catch { setItems([]); setHistoryError(true) }
  }, [])
  React.useEffect(() => { void refresh() }, [refresh])

  const openDetail = (item: SavedMeasurement) => { setActive(item); setPresentation(defaultPresentation); setExportError('') }
  const exportFile = async (format: 'png' | 'jpeg') => {
    if (!active || busy) return
    setExportError(''); setBusy(true)
    try { await downloadMeasurement(active, presentation, format) }
    catch { setExportError(t.exportFailed) }
    finally { setBusy(false) }
  }
  const share = async () => {
    if (!active || busy) return
    setExportError(''); setBusy(true)
    try { const shared = await shareMeasurement(active, presentation); if (!shared) setExportError(t.shareUnavailable) }
    catch { setExportError(t.exportFailed) }
    finally { setBusy(false) }
  }

  if (active) return <main className="editor-screen history-detail-screen">
    <button className="text-button" aria-label={t.closeDetail} onClick={() => setActive(null)}>← {t.closeDetail}</button>
    <h2>{active.mode === 'length' ? t.length : t.area}</h2>
    <div className="history-result-card" aria-label={t.previewLabel}>
      <div className="history-preview-wrap">
        <img className="history-target" src={active.targetImageDataUrl} alt="" />
        <div className="history-preview-result" aria-live="polite"><img src={active.unitImageDataUrl} alt={active.unitName || ''} style={{ opacity: presentation.unitOpacity, filter: presentation.showUnitOutline ? 'drop-shadow(1px 0 #ffd21a) drop-shadow(-1px 0 #ffd21a) drop-shadow(0 1px #ffd21a) drop-shadow(0 -1px #ffd21a)' : undefined }} /><strong>× {active.resultValue.toFixed(1)}</strong></div>
      </div>
      {active.unitName && presentation.showUnitName && <p>{active.unitName}</p>}
      <time>{new Date(active.createdAt).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en')}</time>
    </div>
    <section className="presentation-panel" aria-labelledby="presentation-heading">
      <h2 id="presentation-heading">{t.adjust}</h2>
      <label className="range-label">{t.opacity}<input aria-label={t.opacity} type="range" min="0.1" max="1" step="0.05" value={presentation.unitOpacity} onChange={(e) => setPresentation((old) => ({ ...old, unitOpacity: Number(e.target.value) }))} /></label>
      <label className="toggle-row"><input type="checkbox" checked={presentation.showUnitOutline} onChange={(e) => setPresentation((old) => ({ ...old, showUnitOutline: e.target.checked }))} /><span>{t.outline}</span></label>
      <label className="toggle-row"><input type="checkbox" checked={presentation.showBoundary} onChange={(e) => setPresentation((old) => ({ ...old, showBoundary: e.target.checked }))} /><span>{t.boundary}</span></label>
      <label className="toggle-row"><input type="checkbox" checked={presentation.showResultText} onChange={(e) => setPresentation((old) => ({ ...old, showResultText: e.target.checked }))} /><span>{t.resultText}</span></label>
      {active.unitName && <label className="toggle-row"><input type="checkbox" checked={presentation.showUnitName} onChange={(e) => setPresentation((old) => ({ ...old, showUnitName: e.target.checked }))} /><span>{t.unitName}</span></label>}
    </section>
    <button className="primary-button" onClick={() => onRemeasure(active)}>{t.remeasure}</button>
    <div className="export-actions">
      <button className="secondary-button" disabled={busy} onClick={() => void exportFile('png')}>{t.png}</button>
      <button className="secondary-button" disabled={busy} onClick={() => void exportFile('jpeg')}>{t.jpeg}</button>
      <button className="secondary-button" disabled={busy} onClick={() => void share()}>{t.share}</button>
    </div>
    {exportError && <p className="error-copy" role="alert">{exportError}</p>}
    <button className="danger-button" onClick={async () => { if (!window.confirm(t.deleteQuestion)) return; await deleteMeasurement(active.id); setActive(null); await refresh() }}>{t.remove}</button>
  </main>

  return <main className="editor-screen history-screen">
    <button className="text-button" aria-label={t.back} onClick={onClose}>← {t.back}</button>
    <h2>{t.title}</h2>
    {historyError ? <div role="alert"><p className="error-copy">{t.historyFailed}</p><button className="secondary-button" onClick={() => void refresh()}>{t.retry}</button></div> : items.length === 0 ? <div className="empty-card">{t.empty}</div> : <div className="history-list">{items.map((item) => <button className="history-item" key={item.id} onClick={() => openDetail(item)} aria-label={`${item.mode === 'length' ? t.length : t.area} × ${item.resultValue.toFixed(1)}`}>{item.previewDataUrl || item.targetImageDataUrl ? <img src={item.previewDataUrl || item.targetImageDataUrl} alt="" /> : <div className="history-placeholder" aria-hidden="true" />}<span><strong>{item.mode === 'length' ? t.length : t.area} · × {item.resultValue.toFixed(1)}</strong><small>{new Date(item.createdAt).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en')}</small></span></button>)}</div>}
  </main>
}
