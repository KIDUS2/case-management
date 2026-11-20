import { useEffect, useRef, useState } from 'react'
import { blob } from '../api.js'
import { onPreview, kindOf } from '../preview.js'
import { fmtSize } from '../ui.js'
import { t } from '../i18n.js'

const MIME = { pdf: 'application/pdf', image: null, text: 'text/plain;charset=utf-8' }

/** Shows a document on top of the page, so nobody has to download it just to look. Mounted once, at the top of the app. */
export default function FilePreview() {
  const [file, setFile] = useState(null)
  const [state, setState] = useState({ loading: false, url: null, text: '', err: '' })
  const back = useRef(null)
  const urlRef = useRef(null)

  useEffect(() => onPreview(f => setFile({ ...f, kind: kindOf(f.name) })), [])

  useEffect(() => {
    if (!file) return
    if (file.kind === 'none') { setState({ loading: false, url: null, text: '', err: '' }); return }
    let live = true
    setState({ loading: true, url: null, text: '', err: '' });
    (file.local ? Promise.resolve(file.local) : blob(file.path)).then(async b => {
      if (!live) return
      const kind = file.kind
      if (kind === 'text') { setState({ loading: false, url: null, text: (await b.text()).slice(0, 200000), err: '' }); return }
      const typed = MIME[kind] ? new Blob([b], { type: MIME[kind] }) : b
      const url = URL.createObjectURL(typed)
      urlRef.current = url
      setState({ loading: false, url, text: '', err: '' })
    }).catch(e => live && setState({ loading: false, url: null, text: '', err: e.message }))
    return () => { live = false; if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null } }
  }, [file])

  useEffect(() => {
    if (!file) return
    const key = e => { if (e.key === 'Escape') setFile(null) }
    document.addEventListener('keydown', key)
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prev }
  }, [file])

  if (!file) return null
  const download = async () => { try { const b = file.local || await blob(file.path); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000) } catch (e) { setState(s => ({ ...s, err: e.message })) } }

  return (
    <div className="pvback" ref={back} onMouseDown={e => { if (e.target === back.current) setFile(null) }}>
      <div className="pvpanel" role="dialog" aria-modal="true" aria-label={file.name}>
        <header className="pvhead">
          <span className="pvico" aria-hidden="true">{file.kind === 'image' ? '🖼️' : file.kind === 'pdf' ? '📕' : '📄'}</span>
          <div className="grow"><b>{file.name}</b>{file.size ? <small>{fmtSize(file.size)}</small> : null}</div>
          {state.url && file.kind === 'pdf' && <a className="btn ghost sm" href={state.url} target="_blank" rel="noreferrer">↗ {t('Open in new tab')}</a>}
          <button className="btn sm" onClick={download}>⬇️ {t('Download')}</button>
          <button className="btn ghost sm pvx" onClick={() => setFile(null)} aria-label={t('Close')}>✕</button>
        </header>
        <div className="pvbody">
          {state.loading && <div className="pvmsg"><span className="spinner" aria-hidden="true" />{t('Loading…')}</div>}
          {state.err && <div className="pvmsg err">{state.err}</div>}
          {!state.loading && !state.err && file.kind === 'none' && <div className="pvmsg">📄<b>{t('This kind of file cannot be shown here.')}</b><span>{t('Word and Excel files must be downloaded to open them.')}</span><button className="btn" onClick={download}>⬇️ {t('Download')}</button></div>}
          {state.url && file.kind === 'pdf' && <iframe title={file.name} src={state.url} />}
          {state.url && file.kind === 'image' && <img src={state.url} alt={file.name} />}
          {!state.loading && file.kind === 'text' && !state.err && <pre>{state.text}</pre>}
        </div>
      </div>
    </div>
  )
}
