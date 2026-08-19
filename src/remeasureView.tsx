import React from 'react'
import { saveMeasurement, type Point, type SavedMeasurement } from './storage'

type Locale = 'ja' | 'en'
type Props = { locale: Locale; source: SavedMeasurement; onClose: () => void }

const copy = {
  ja: {
    title: 'この条件から測り直す', back: '履歴へ', scale: '大きさ', rotation: '向き', save: '新しい測定として保存', saved: '保存しました', failed: '保存できませんでした',
    hintLength: '端点をドラッグして変更できます', hintArea: '基準画像の位置をドラッグして変更できます', start: '始点', end: '終点', origin: '基準画像の位置', stageLength: '測定する長さの端点を調整', stageArea: '基準画像の位置を調整', loadFailed: '画像を読み込めませんでした。履歴に戻ってもう一度お試しください。',
  },
  en: {
    title: 'Measure again from these settings', back: 'History', scale: 'Size', rotation: 'Angle', save: 'Save as a new measurement', saved: 'Saved', failed: 'Couldn’t save',
    hintLength: 'Drag the endpoints to change them', hintArea: 'Drag the unit origin to change it', start: 'Start point', end: 'End point', origin: 'Unit position', stageLength: 'Adjust the measurement endpoints', stageArea: 'Adjust the unit position', loadFailed: 'Couldn’t load the image. Return to history and try again.',
  },
} as const

function loadImage(src: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src }) }

async function effectiveBounds(src: string) {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(image, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1
  for (let y=0;y<canvas.height;y++) for (let x=0;x<canvas.width;x++) if (data[(y*canvas.width+x)*4+3] > 0) { minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y) }
  return maxX < minX ? { width: 1, height: 1 } : { width: maxX-minX+1, height: maxY-minY+1 }
}

async function areaValue(source: SavedMeasurement, scale: number, rotation: number, origin: Point) {
  if (source.geometry.mode !== 'area') return source.resultValue
  const unit = await loadImage(source.unitImageDataUrl)
  const targetAspect = source.geometry.targetAspect
  const width = 320, height = Math.max(1, Math.round(width * targetAspect))
  const alphaCanvas = document.createElement('canvas'); alphaCanvas.width = Math.min(256, unit.naturalWidth); alphaCanvas.height = Math.max(1, Math.round(alphaCanvas.width * unit.naturalHeight / unit.naturalWidth))
  const ac = alphaCanvas.getContext('2d', { willReadFrequently: true })!; ac.drawImage(unit,0,0,alphaCanvas.width,alphaCanvas.height)
  const ad = ac.getImageData(0,0,alphaCanvas.width,alphaCanvas.height).data; let alpha = 0; for(let i=3;i<ad.length;i+=4) alpha += ad[i]/255
  const ratio = alpha/(alphaCanvas.width*alphaCanvas.height)
  const unitAspect = unit.naturalHeight/unit.naturalWidth, tileW = scale*width, tileH = tileW*unitAspect
  const denom = Math.max(1e-6,tileW*tileH*ratio)
  const canvas = document.createElement('canvas'); canvas.width=width; canvas.height=height; const ctx=canvas.getContext('2d',{willReadFrequently:true})!
  ctx.save(); ctx.beginPath(); source.geometry.region.forEach((p,i)=>{ const x=p.x*width,y=p.y*height; i?ctx.lineTo(x,y):ctx.moveTo(x,y) }); ctx.closePath(); ctx.clip()
  const theta=rotation*Math.PI/180, ux=scale*Math.cos(theta), uy=scale*Math.sin(theta)/targetAspect, vx=-scale*unitAspect*Math.sin(theta), vy=scale*unitAspect*Math.cos(theta)/targetAspect
  const extent=Math.ceil(3/Math.max(.01,Math.min(scale,scale*unitAspect/targetAspect)))+2
  for(let r=-extent;r<=extent;r++) for(let c=-extent;c<=extent;c++){ const x=origin.x+c*ux+r*vx,y=origin.y+c*uy+r*vy; if(x<-.8||x>1.8||y<-.8||y>1.8) continue; ctx.save(); ctx.translate(x*width,y*height); ctx.rotate(theta); ctx.drawImage(unit,-tileW/2,-tileH/2,tileW,tileH); ctx.restore() }
  ctx.restore(); const data=ctx.getImageData(0,0,width,height).data; let covered=0; for(let i=3;i<data.length;i+=4) covered+=data[i]/255
  return covered/denom
}

export function RemeasureView({ locale, source, onClose }: Props) {
  const t = copy[locale]
  const [scale,setScale] = React.useState(source.geometry.unitScale)
  const [rotation,setRotation] = React.useState(source.geometry.unitRotation)
  const [endpoints,setEndpoints] = React.useState<[Point,Point]>(source.geometry.mode==='length' ? source.geometry.endpoints : [{x:0,y:0},{x:0,y:0}])
  const [origin,setOrigin] = React.useState<Point>(source.geometry.mode==='area' ? source.geometry.tilingOrigin : {x:.5,y:.5})
  const [drag,setDrag] = React.useState<number | 'origin' | null>(null)
  const [bounds,setBounds] = React.useState({width:1,height:1})
  const [value,setValue] = React.useState(source.resultValue)
  const [status,setStatus] = React.useState<'idle'|'saved'|'error'>('idle')
  const [loadFailed,setLoadFailed] = React.useState(false)

  React.useEffect(()=>{ let cancelled=false; void effectiveBounds(source.unitImageDataUrl).then(v=>{if(!cancelled)setBounds(v)}).catch(()=>{if(!cancelled)setLoadFailed(true)}); return()=>{cancelled=true} },[source.unitImageDataUrl])
  React.useEffect(()=>{
    if(source.geometry.mode==='length'){
      const [a,b]=endpoints, aspect=source.geometry.targetAspect, dx=b.x-a.x, dy=(b.y-a.y)*aspect, distance=Math.hypot(dx,dy), axis=Math.atan2(dy,dx), theta=rotation*Math.PI/180, unitAspect=bounds.height/Math.max(bounds.width,1)
      const projected=Math.abs(scale*Math.cos(theta-axis))+Math.abs(scale*unitAspect*Math.sin(theta-axis)); setValue(projected>0?distance/projected:0)
    } else { let cancelled=false; void areaValue(source,scale,rotation,origin).then(v=>{if(!cancelled)setValue(v)}).catch(()=>{if(!cancelled)setLoadFailed(true)}); return()=>{cancelled=true} }
  },[bounds,endpoints,origin,rotation,scale,source])

  const norm=(e:React.PointerEvent<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))}}
  const move=(e:React.PointerEvent<HTMLDivElement>)=>{ if(drag===0||drag===1){const p=norm(e);setEndpoints(old=>old.map((x,i)=>i===drag?p:x) as [Point,Point])} else if(drag==='origin') setOrigin(norm(e)) }
  const save=async()=>{ setStatus('idle'); try { await saveMeasurement({ ...source, id: crypto.randomUUID(), createdAt:new Date().toISOString(), resultValue:value, geometry: source.geometry.mode==='length' ? { ...source.geometry, endpoints, unitScale:scale, unitRotation:rotation } : { ...source.geometry, tilingOrigin:origin, unitScale:scale, unitRotation:rotation } }); setStatus('saved') } catch { setStatus('error') } }

  if(loadFailed) return <main className="editor-screen center-content"><button className="text-button" onClick={onClose} aria-label={t.back}>← {t.back}</button><p className="error-copy" role="alert">{t.loadFailed}</p></main>

  return <main className="editor-screen remeasure-screen">
    <button className="text-button" onClick={onClose} aria-label={t.back}>← {t.back}</button><h2>{t.title}</h2>
    <div className="remeasure-stage" role="group" aria-label={source.geometry.mode==='length'?t.stageLength:t.stageArea} onPointerMove={move} onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)}>
      <img src={source.targetImageDataUrl} alt="" draggable={false}/>
      {source.geometry.mode==='length' ? <>{endpoints.map((p,i)=><button type="button" key={i} className="endpoint" aria-label={i===0?t.start:t.end} style={{left:`${p.x*100}%`,top:`${p.y*100}%`}} onPointerDown={e=>{e.stopPropagation();setDrag(i);e.currentTarget.setPointerCapture(e.pointerId)}}/>)}<span className="measure-line" aria-hidden="true" style={{left:`${endpoints[0].x*100}%`,top:`${endpoints[0].y*100}%`,width:`${Math.hypot(endpoints[1].x-endpoints[0].x,endpoints[1].y-endpoints[0].y)*100}%`,transform:`rotate(${Math.atan2(endpoints[1].y-endpoints[0].y,endpoints[1].x-endpoints[0].x)}rad)`}}/></> : <><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points={source.geometry.region.map(p=>`${p.x*100},${p.y*100}`).join(' ')} fill="rgba(255,210,26,.16)" stroke="#ffd21a" strokeWidth="1"/></svg><button type="button" className="unit-drag-control" aria-label={t.origin} style={{left:`${origin.x*100}%`,top:`${origin.y*100}%`,width:`${Math.max(scale*100,12)}%`}} onPointerDown={e=>{e.stopPropagation();setDrag('origin');e.currentTarget.setPointerCapture(e.pointerId)}}><img className="area-origin-unit" src={source.unitImageDataUrl} alt="" style={{width:'100%',transform:`rotate(${rotation}deg)`}}/></button></>}
    </div>
    <p className="muted">{source.geometry.mode==='length'?t.hintLength:t.hintArea}</p>
    <label className="range-label">{t.scale}<input aria-label={t.scale} type="range" min="0.05" max="0.6" step="0.01" value={scale} onChange={e=>setScale(Number(e.target.value))}/></label>
    <label className="range-label">{t.rotation}<input aria-label={t.rotation} type="range" min="-180" max="180" step="1" value={rotation} onChange={e=>setRotation(Number(e.target.value))}/></label>
    <div className="result-card" aria-live="polite"><img src={source.unitImageDataUrl} alt={source.unitName||''}/><strong>× {value.toFixed(1)}</strong></div>
    <button className="primary-button" onClick={()=>void save()}>{t.save}</button>{status==='saved'&&<p className="success-copy" role="status">{t.saved}</p>}{status==='error'&&<p className="error-copy" role="alert">{t.failed}</p>}
  </main>
}
