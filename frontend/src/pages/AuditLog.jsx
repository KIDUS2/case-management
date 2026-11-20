import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { t } from '../i18n.js'
import { fmtDate } from '../ui.js'

const LABEL = {
  LOGIN: ['🔑', 'Signed in'], LOGIN_FAILED: ['⚠️', 'Wrong password'], LOGIN_BLOCKED: ['⛔', 'Blocked (locked)'],
  CASE_VIEW: ['👁️', 'Opened a case'], FILE_DOWNLOAD: ['📥', 'Downloaded a file'], STATUS_LOOKUP: ['🔎', 'Case checked by the public'], STATUS_MISS: ['❔', 'Wrong case check'],
}

/** Who did what: sign-ins, wrong passwords, cases opened, files downloaded. Only the administrator sees this. */
export default function AuditLog() {
  const [q, setQ] = useState('')
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => { const h = setTimeout(() => { setTerm(q); setPage(0) }, 300); return () => clearTimeout(h) }, [q])
  useEffect(() => { api(`/audit?q=${encodeURIComponent(term)}&page=${page}&size=40`).then(d => { setData(d); setErr('') }).catch(e => setErr(e.message)) }, [term, page])
  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1

  return (
    <>
      <div className="head"><div><h1>{t('Audit log')}</h1><p className="muted">{t('Who signed in, who opened which case, and who downloaded which file.')}</p></div></div>
      {err && <div className="err">{err}</div>}
      <input className="search" placeholder={t('Search by person, action or case…')} value={q} onChange={e => setQ(e.target.value)} />
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {!data && !err && <div className="gmsg">{t('Loading…')}</div>}
        {data && data.items.length === 0 && <div className="empty">🗒️<br />{t('Nothing recorded yet.')}</div>}
        {data && data.items.map(a => {
          const [icon, label] = LABEL[a.action] || ['•', a.action]
          return (
            <div className={'auditrow' + (a.action.startsWith('LOGIN_') ? ' warn' : '')} key={a.id}>
              <span className="nicon">{icon}</span>
              <span className="grow"><b>{a.username || '—'}</b> · {t(label)}{a.detail ? <span className="nbody">{a.detail}</span> : null}</span>
              <small>{fmtDate(a.at)}{a.ip ? ' · ' + a.ip : ''}</small>
            </div>
          )
        })}
      </div>
      {data && data.total > data.size && (
        <div className="pager">
          <button className="btn ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>← {t('Newer')}</button>
          <span className="muted">{t('Page {a} of {b}', { a: page + 1, b: pages })}</span>
          <button className="btn ghost" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>{t('Older')} →</button>
        </div>
      )}
    </>
  )
}
