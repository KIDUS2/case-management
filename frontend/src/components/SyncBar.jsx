import { useCallback, useEffect, useRef, useState } from 'react'
import { outbox, flush, dropItem, retryItem } from '../offline.js'
import { askConfirm } from '../dialog.js'
import { t } from '../i18n.js'
import { fmtDate } from '../ui.js'

/** Shows when the connection is down or cases are waiting to be sent, and sends them as soon as the internet is back. */
export default function SyncBar({ me }) {
  const [items, setItems] = useState([])
  const [down, setDown] = useState(!navigator.onLine)
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const pending = useRef(false)

  const load = useCallback(() => outbox(me.username).then(setItems).catch(() => {}), [me.username])
  const send = useCallback(async () => { setSending(true); try { await flush(me.username) } finally { setSending(false); load() } }, [me.username, load])

  useEffect(() => {
    load(); send()
    const on = () => { setDown(false); send() }, off = () => setDown(true)
    const ok = () => { setDown(false); if (pending.current) send() }
    window.addEventListener('online', on); window.addEventListener('offline', off)
    window.addEventListener('net-ok', ok); window.addEventListener('net-fail', off)
    window.addEventListener('outbox-changed', load)
    return () => {
      window.removeEventListener('online', on); window.removeEventListener('offline', off)
      window.removeEventListener('net-ok', ok); window.removeEventListener('net-fail', off)
      window.removeEventListener('outbox-changed', load)
    }
  }, [load, send])
  // while something waits, keep trying (a connection can come and go without the browser noticing)
  const waiting = items.filter(i => i.status !== 'rejected'), rejected = items.filter(i => i.status === 'rejected')
  pending.current = waiting.length > 0
  useEffect(() => { if (!waiting.length) return; const h = setInterval(send, 20000); return () => clearInterval(h) }, [waiting.length, send])

  if (!down && !items.length) return null
  const bad = rejected.length > 0
  return (
    <div className={'syncbar' + (bad ? ' bad' : down ? ' down' : '')} role="status">
      <div className="synchead">
        <span aria-hidden="true">{bad ? '⚠️' : down ? '📴' : sending ? '🔄' : '🕓'}</span>
        <div className="grow">
          <b>{down ? t('No internet connection') : bad ? t('A saved case could not be registered') : t('Sending saved cases…')}</b>
          <small>
            {waiting.length > 0
              ? t('{n} case(s) saved on this device, waiting to be sent.', { n: waiting.length })
              : down ? t('You can still register cases. They are kept on this device and sent when the internet is back.') : ''}
            {bad && ' ' + t('{n} need(s) your attention.', { n: rejected.length })}
          </small>
        </div>
        {items.length > 0 && <button type="button" className="btn ghost sm" onClick={() => setOpen(o => !o)}>{open ? t('Hide') : t('View')}</button>}
        {waiting.length > 0 && !down && <button type="button" className="btn sm" disabled={sending} onClick={send}>{t('Send now')}</button>}
      </div>
      {open && items.map(i => (
        <div className="syncrow" key={i.id}>
          <div className="grow"><b>{i.label}</b><small>{fmtDate(new Date(i.createdAt).toISOString())}{i.files.length ? ` · ${i.files.length} ${t('document(s)')}` : ''}{i.caseId ? ' · ' + t('registered, uploading documents') : ''}</small>
            {i.status === 'rejected' && <small className="syncerr">{i.error}</small>}</div>
          {i.status === 'rejected' && <button type="button" className="btn ghost sm" onClick={async () => { await retryItem(i.id); send() }}>{t('Try again')}</button>}
          <button type="button" className="btn ghost sm" onClick={async () => { if (await askConfirm(t('Delete this saved case? It has not been registered yet and cannot be recovered.'), { title: t('Delete saved case'), confirmText: t('Delete'), danger: true })) dropItem(i.id) }}>{t('Delete')}</button>
        </div>
      ))}
    </div>
  )
}
