import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { dayDiff, fmtCode, fmtDay, initial, names } from '../ui.js'

const GROUPS = [
  { key: 'late', title: '⏰ Overdue', hint: 'Should have come already', test: d => d < 0, cls: 'late' },
  { key: 'today', title: '📍 Today', hint: 'Expected at the door today', test: d => d === 0, cls: 'today' },
  { key: 'tomorrow', title: 'Tomorrow', test: d => d === 1, cls: '' },
  { key: 'week', title: 'This week', test: d => d >= 2 && d <= 7, cls: '' },
  { key: 'later', title: 'Later', test: d => d > 7, cls: '' },
]

/** People who were sent to a department and asked to come back. Door staff recognise them here. */
export default function Queue({ onOpen, goNew }) {
  const [items, setItems] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(null)
  const [filter, setFilter] = useState('')

  const load = () => api('/queue?days=30').then(r => { setItems(r); setErr('') }).catch(e => setErr(e.message))
  useEffect(() => { load() }, [])

  const arrived = async it => {
    setBusy(it.caseId)
    try { await api(`/cases/${it.caseId}/arrived`, { method: 'POST' }); await load() } catch (x) { setErr(x.message) } finally { setBusy(null) }
  }

  const f = filter.trim().toLowerCase()
  const shown = (items || []).filter(i => !f || i.people.join(' ').toLowerCase().includes(f) || i.code.toLowerCase().includes(f.replace(/[^a-z0-9]/g, '')) || i.churchName.toLowerCase().includes(f))

  return (
    <>
      <div className="head"><div><h1>Door queue</h1><p className="muted">People who were asked to come back. Mark them “Arrived” when they reach the door.</p></div>
        <button className="btn" onClick={goNew}>➕ Register case</button></div>
      {err && <div className="err">{err}</div>}
      <input className="search" placeholder="Filter this list by name, church or code…" value={filter} onChange={e => setFilter(e.target.value)} />
      {items === null && <div className="muted">Loading…</div>}
      {items && items.length === 0 && <div className="card empty">🚪<br />Nobody is expected back right now.</div>}
      {GROUPS.map(g => {
        const rows = shown.filter(i => g.test(dayDiff(i.returnOn)))
        if (!rows.length) return null
        return (
          <section key={g.key}>
            <div className="group"><h2>{g.title}</h2><span className="count">{rows.length}</span>{g.hint && <small>{g.hint}</small>}</div>
            {rows.map(it => (
              <div className={'qrow ' + g.cls} key={it.caseId}>
                <div className="avatar">{initial(it.people[0])}</div>
                <div className="grow">
                  <b>{names(it.people)}</b>
                  <small>⛪ {it.churchName} · {it.issues} issue{it.issues === 1 ? '' : 's'}{it.departments.length ? ' · with ' + it.departments.join(', ') : ''}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="codechip">{fmtCode(it.code)}</span>
                  <small className={'iret ' + g.cls}>{fmtDay(it.returnOn)}</small>
                </div>
                <button className="btn ghost sm" onClick={() => onOpen(it.caseId)}>Open</button>
                <button className="btn sm ok" disabled={busy === it.caseId} onClick={() => arrived(it)}>🚪 Arrived</button>
              </div>
            ))}
          </section>
        )
      })}
      {items && items.length > 0 && shown.length === 0 && <div className="card empty">No match for “{filter}”.</div>}
    </>
  )
}
