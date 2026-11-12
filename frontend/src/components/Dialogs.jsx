import { useEffect, useRef, useState } from 'react'
import { onToast, onAsk, notify } from '../dialog.js'
import { t } from '../i18n.js'

/** Shows every message and question of the app. Mounted once, at the very top. */
export default function Dialogs() {
  const [toasts, setToasts] = useState([])
  const [q, setQ] = useState(null)
  const [text, setText] = useState('')
  const [bad, setBad] = useState('')
  const input = useRef(null)

  useEffect(() => onToast(m => {
    setToasts(l => [...l.filter(x => x.message !== m.message), m].slice(-4))
    setTimeout(() => setToasts(l => l.filter(x => x.id !== m.id)), m.kind === 'error' ? 8000 : 4500)
  }), [])
  useEffect(() => onAsk(d => { setText(''); setBad(''); setQ(d) }), [])
  useEffect(() => { if (q?.kind === 'text') setTimeout(() => input.current?.focus(), 30) }, [q])

  // the browser's own "please fill out this field" bubble is replaced by the app's message
  useEffect(() => {
    const invalid = e => {
      e.preventDefault()
      const el = e.target
      const label = (el.labels?.[0] || el.parentElement?.querySelector('label'))?.textContent?.trim() || el.getAttribute('placeholder') || ''
      notify((label ? label + ': ' : '') + (el.validationMessage || t('Please check this field.')))
      if (!invalid.busy) { invalid.busy = true; el.focus?.(); setTimeout(() => { invalid.busy = false }, 300) }
    }
    const crash = e => notify(t('Something went wrong. Please try again.'))
    // an error banner that appears below the fold is brought into view
    const watch = new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(n => {
      const el = n.nodeType === 1 ? (n.matches?.('.err') ? n : n.querySelector?.('.err')) : null
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })))
    watch.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('invalid', invalid, true)
    window.addEventListener('unhandledrejection', crash)
    return () => { watch.disconnect(); document.removeEventListener('invalid', invalid, true); window.removeEventListener('unhandledrejection', crash) }
  }, [])

  const close = v => { q?.resolve(v); setQ(null) }
  const submit = e => {
    e.preventDefault()
    if (q.kind === 'confirm') return close(true)
    if (text.length < (q.minLength || 0)) return setBad(t('Please type at least {n} characters.', { n: q.minLength }))
    close(text)
  }

  return (
    <>
      <div className="msgs" aria-live="polite">
        {toasts.map(m => (
          <div key={m.id} className={'msg ' + m.kind} role={m.kind === 'error' ? 'alert' : 'status'} onClick={() => setToasts(l => l.filter(x => x.id !== m.id))}>
            <span>{m.kind === 'error' ? '⚠️' : m.kind === 'ok' ? '✅' : 'ℹ️'}</span><span>{m.message}</span>
          </div>
        ))}
      </div>
      {q && (
        <div className="modal-back" onMouseDown={e => { if (e.target === e.currentTarget) close(q.kind === 'confirm' ? false : null) }}>
          <form className="modal" role="dialog" aria-modal="true" onSubmit={submit} onKeyDown={e => { if (e.key === 'Escape') close(q.kind === 'confirm' ? false : null) }}>
            {q.title && <h2>{t(q.title)}</h2>}
            <p>{q.message}</p>
            {q.kind === 'text' && <>
              <input ref={input} type={q.type} value={text} onChange={e => { setText(e.target.value); setBad('') }} autoComplete="new-password" />
              {bad && <div className="err" style={{ marginTop: 8 }}>{bad}</div>}
            </>}
            <div className="iact" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn ghost sm" onClick={() => close(q.kind === 'confirm' ? false : null)}>{t('Cancel')}</button>
              <button className={'btn sm' + (q.danger ? ' danger' : '')} autoFocus={q.kind === 'confirm'}>{t(q.confirmText)}</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
