import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { NOTE_ICON, ago, fmtDate } from '../ui.js'

export default function Notifications({ onOpen, onChanged }) {
  const [tab, setTab] = useState('unread')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  const load = () => api(`/notifications?unread=${tab === 'unread'}&page=${page}&size=20`).then(d => { setData(d); setErr('') }).catch(e => setErr(e.message))
  useEffect(() => { setPage(0) }, [tab])
  useEffect(() => { load() }, [tab, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const click = async n => {
    if (!n.read) { await api(`/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {}); onChanged() }
    if (n.caseId) onOpen(n.caseId); else load()
  }
  const readAll = async () => { await api('/notifications/read-all', { method: 'POST' }).catch(() => {}); onChanged(); load() }
  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1

  return (
    <>
      <div className="head"><div><h1>Notifications</h1><p className="muted">News about the cases you registered or the issues sent to your department.</p></div>
        {data?.unread > 0 && <button className="btn ghost" onClick={readAll}>✔ Mark all as read</button>}</div>
      {err && <div className="err">{err}</div>}
      <div className="tabs">
        <button className={'chip' + (tab === 'unread' ? ' on' : '')} onClick={() => setTab('unread')}>Unread{data ? ` (${data.unread})` : ''}</button>
        <button className={'chip' + (tab === 'all' ? ' on' : '')} onClick={() => setTab('all')}>All</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {!data && !err && <div className="gmsg">Loading…</div>}
        {data && data.items.length === 0 && <div className="empty">🔔<br />{tab === 'unread' ? 'You are all caught up.' : 'No notifications yet.'}</div>}
        {data && data.items.map(n => (
          <button key={n.id} className={'nitem' + (n.read ? '' : ' unread')} onClick={() => click(n)} title={fmtDate(n.createdAt)}>
            <span className="nicon">{NOTE_ICON[n.type] || '🔔'}</span>
            <span className="grow"><b>{n.title}</b>{n.body && <span className="nbody">{n.body}</span>}<small>{ago(n.createdAt)}</small></span>
            {!n.read && <span className="udot" />}
          </button>
        ))}
      </div>
      {data && data.total > data.size && (
        <div className="pager">
          <button className="btn ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>← Newer</button>
          <span className="muted">Page {page + 1} of {pages}</span>
          <button className="btn ghost" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Older →</button>
        </div>
      )}
    </>
  )
}
