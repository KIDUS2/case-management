import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { STATUS, CATEGORY, WORKING, ROLE, fmtDate, initial } from '../ui.js'

export default function Cases({ openId, setOpenId, goNew }) {
  if (openId) return <CaseDetail id={openId} onBack={() => setOpenId(null)} onOpen={setOpenId} />
  return <CaseList onOpen={setOpenId} goNew={goNew} />
}

function CaseList({ onOpen, goNew }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ items: [], total: 0, size: 12 })
  const [sum, setSum] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { api('/cases/summary').then(setSum).catch(e => setErr(e.message)) }, [])
  useEffect(() => { setPage(0) }, [q, status])
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      const p = new URLSearchParams({ page, size: 12 })
      if (q.trim()) p.set('q', q.trim())
      if (status) p.set('status', status)
      api('/cases?' + p).then(d => { setData(d); setErr('') }).catch(e => setErr(e.message)).finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [q, status, page])

  const pages = Math.max(1, Math.ceil(data.total / data.size))
  const tiles = [
    { key: '', label: 'All cases', n: sum?.total, icon: '📚' },
    { key: 'OPEN', label: 'Open', n: sum?.open, icon: '🟣' },
    { key: 'REFERRED', label: 'Referred', n: sum?.referred, icon: '➡️' },
    { key: 'COURT', label: 'In court', n: sum?.court, icon: '⚖️' },
    { key: 'RESOLVED', label: 'Resolved', n: sum?.resolved, icon: '✅' },
  ]

  return (
    <>
      <div className="head"><div><h1>Cases</h1><p className="muted">Every person who came to the desk and what they brought.</p></div>
        <button className="btn" onClick={goNew}>➕ Register case</button></div>
      {err && <div className="err">{err}</div>}
      <div className="tiles">
        {tiles.map(t => (
          <button key={t.key} className={'tile' + (status === t.key ? ' on' : '')} onClick={() => setStatus(t.key)}>
            <span className="ti">{t.icon}</span><b>{t.n ?? '–'}</b><small>{t.label}</small>
          </button>
        ))}
      </div>
      <input className="search" placeholder="🔍 Search by name, church or case number…" value={q} onChange={e => setQ(e.target.value)} />
      <div className={loading ? 'fade' : ''}>
        {data.items.map(c => (
          <button key={c.id} className={'case ' + STATUS[c.status].cls} onClick={() => onOpen(c.id)}>
            <div className="avatar">{initial(c.personName)}</div>
            <div className="grow">
              <div className="ctitle"><b>{c.personName}</b><span className={'badge ' + STATUS[c.status].cls}>{STATUS[c.status].label}</span></div>
              <small>⛪ {c.churchName} · {c.caseNo}</small>
              <div className="cats">{c.categories.map(k => <span key={k} className="cat">{CATEGORY[k].icon} {CATEGORY[k].label}</span>)}</div>
            </div>
            <div className="cside"><span>{c.issueCount} issue{c.issueCount === 1 ? '' : 's'}</span>{c.letterIssued && <span>✉️</span>}<small>{fmtDate(c.createdAt)}</small></div>
          </button>
        ))}
        {!loading && !data.items.length && (
          <div className="card empty">🌿<br />{q || status ? 'No cases match your search.' : 'No cases yet. Register the first one!'}</div>
        )}
      </div>
      {data.total > data.size && (
        <div className="pager">
          <button className="btn ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>← Previous</button>
          <span className="muted">Page {page + 1} of {pages}</span>
          <button className="btn ghost" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </>
  )
}

function CaseDetail({ id, onBack, onOpen }) {
  const [c, setC] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { setC(null); api('/cases/' + id).then(setC).catch(e => setErr(e.message)) }, [id])

  if (err) return <><button className="btn ghost" onClick={onBack}>← Back</button><div className="err">{err}</div></>
  if (!c) return <div className="muted">Loading…</div>
  const st = STATUS[c.status]

  return (
    <>
      <button className="btn ghost back" onClick={onBack}>← All cases</button>
      <div className={'hero-card ' + st.cls}>
        <div className="avatar big">{initial(c.person.fullName)}</div>
        <div className="grow">
          <small className="onhero">{c.caseNo}</small>
          <h1>{c.person.fullName}</h1>
          <div className="onhero">⛪ {c.person.churchName}</div>
        </div>
        <span className="badge light">{st.icon} {st.label}</span>
      </div>

      <div className="cols">
        <div>
          <div className="card">
            <h2>Issues <span className="count">{c.issues.length}</span></h2>
            {c.issues.map((i, k) => (
              <div className="issue-row" key={i.id}>
                <div className="iicon">{CATEGORY[i.category].icon}</div>
                <div><b>{k + 1}. {CATEGORY[i.category].label}</b><p>{i.description || <span className="muted">No detail written yet.</span>}</p></div>
              </div>
            ))}
          </div>
          <div className="card">
            <h2>Discussion notes</h2>
            <p className="notes">{c.discussionNotes || <span className="muted">No notes were written.</span>}</p>
            <span className={'pill ' + (c.letterIssued ? 'yes' : 'no')}>{c.letterIssued ? '✉️ Letter issued' : '✉️ Letter not issued yet'}</span>
          </div>
        </div>
        <div>
          <div className="card">
            <h2>About the person</h2>
            <dl>
              <dt>Working status</dt><dd>{WORKING[c.person.workingStatus]}</dd>
              <dt>Role in this case</dt><dd>{ROLE[c.roleInCase]}</dd>
              <dt>Phone</dt><dd>{c.person.phone || '—'}</dd>
              <dt>Cases on record</dt><dd>{c.person.totalCases} total · {c.person.openCases} still active</dd>
              <dt>Registered</dt><dd>{fmtDate(c.createdAt)} by @{c.createdBy}</dd>
            </dl>
          </div>
          <div className="card">
            <h2>Other cases by this person</h2>
            {c.otherCases.length === 0 && <p className="muted">This is their only case so far.</p>}
            {c.otherCases.map(o => (
              <button key={o.id} className="mini" onClick={() => onOpen(o.id)}>
                <span><b>{o.caseNo}</b><small>{fmtDate(o.createdAt)} · {o.issueCount} issue{o.issueCount === 1 ? '' : 's'}</small></span>
                <span className={'badge ' + STATUS[o.status].cls}>{STATUS[o.status].label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
