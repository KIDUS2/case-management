import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { STATUS, CATEGORY, WORKING, fmtDate, initial, fmtCode, names, copyText } from '../ui.js'

export default function Cases({ openId, setOpenId, goNew, fresh }) {
  if (openId) return <CaseDetail id={openId} fresh={fresh} onBack={() => setOpenId(null)} onOpen={setOpenId} />
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
      <div className="head"><div><h1>Cases</h1><p className="muted">Every report and request that came to the desk.</p></div>
        <button className="btn" onClick={goNew}>➕ Register case</button></div>
      {err && <div className="err">{err}</div>}
      <div className="tiles">
        {tiles.map(t => (
          <button key={t.key} className={'tile' + (status === t.key ? ' on' : '')} onClick={() => setStatus(t.key)}>
            <span className="ti">{t.icon}</span><b>{t.n ?? '–'}</b><small>{t.label}</small>
          </button>
        ))}
      </div>
      <input className="search" placeholder="🔍 Search by name, church or case code…" value={q} onChange={e => setQ(e.target.value)} />
      <div className={loading ? 'fade' : ''}>
        {data.items.map(c => (
          <button key={c.id} className={'case ' + STATUS[c.status].cls} onClick={() => onOpen(c.id)}>
            <div className="avatar">{initial(c.complainants[0])}</div>
            <div className="grow">
              <div className="ctitle"><b>{names(c.complainants)}</b><span className={'badge ' + STATUS[c.status].cls}>{STATUS[c.status].label}</span></div>
              <small>⛪ {c.churchName}{c.complainants.length > 1 ? ` · group of ${c.complainants.length}` : ''}</small>
              {c.subjects.length > 0 && <small className="about">👤 About: {names(c.subjects)}</small>}
              <div className="cats">{c.categories.map(k => <span key={k} className="cat">{CATEGORY[k].icon} {CATEGORY[k].label}</span>)}</div>
            </div>
            <div className="cside"><span className="codechip">{fmtCode(c.code)}</span><span>{c.issueCount} issue{c.issueCount === 1 ? '' : 's'}{c.letterIssued ? ' · ✉️' : ''}</span><small>{fmtDate(c.createdAt)}</small></div>
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

function PersonRow({ p }) {
  return (
    <div className="prow">
      <div className="avatar">{initial(p.fullName)}</div>
      <div className="grow">
        <b>{p.fullName}</b>
        <small>⛪ {p.churchName} · {WORKING[p.workingStatus]}{p.phone ? ' · ' + p.phone : ''}</small>
        {p.complaintsAgainst > 1 && <small className="warn">⚠️ {p.complaintsAgainst} cases are about this person</small>}
        {p.totalCases > 1 && p.complaintsAgainst <= 1 && <small>In {p.totalCases} cases on record</small>}
      </div>
    </div>
  )
}

function CaseDetail({ id, fresh, onBack, onOpen }) {
  const [c, setC] = useState(null)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => { setC(null); api('/cases/' + id).then(setC).catch(e => setErr(e.message)) }, [id])

  if (err) return <><button className="btn ghost" onClick={onBack}>← Back</button><div className="err">{err}</div></>
  if (!c) return <div className="muted">Loading…</div>
  const st = STATUS[c.status]
  const copy = async () => { if (await copyText(fmtCode(c.code))) { setCopied(true); setTimeout(() => setCopied(false), 1800) } }

  return (
    <>
      <button className="btn ghost back" onClick={onBack}>← All cases</button>
      {fresh && <div className="fresh">✅ <b>Case registered.</b> Give this code to the person. They can quote it when they come back, and staff can type it to find the case at once.</div>}
      <div className={'hero-card ' + st.cls}>
        <div className="grow">
          <small className="onhero">Case code</small>
          <div className="bigcode">{fmtCode(c.code)}</div>
          <div className="onhero">{names(c.complainants.map(p => p.fullName))}{c.complainants.length > 1 ? ` (group of ${c.complainants.length})` : ''}</div>
        </div>
        <div className="heroside">
          <span className="badge light">{st.icon} {st.label}</span>
          <button className="btn light sm" onClick={copy}>{copied ? '✔ Copied' : '📋 Copy code'}</button>
        </div>
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
            <small style={{ marginTop: 12 }}>Registered {fmtDate(c.createdAt)} by @{c.createdBy}</small>
          </div>
        </div>
        <div>
          <div className="card">
            <h2>{c.complainants.length > 1 ? `Reported by a group (${c.complainants.length})` : 'Reported by'}</h2>
            {c.complainants.map(p => <PersonRow key={p.id} p={p} />)}
          </div>
          <div className="card">
            <h2>Who it is about</h2>
            {c.subjects.length === 0 && <p className="muted">No one in particular. This is a request or general matter.</p>}
            {c.subjects.map(p => <PersonRow key={p.id} p={p} />)}
          </div>
          <div className="card">
            <h2>Related cases</h2>
            {c.relatedCases.length === 0 && <p className="muted">None of these people are in another case.</p>}
            {c.relatedCases.map(o => (
              <button key={o.id} className="mini" onClick={() => onOpen(o.id)}>
                <span><b>{fmtCode(o.code)}</b><small>{names(o.complainants)}{o.subjects.length ? ' → ' + names(o.subjects) : ''}</small></span>
                <span className={'badge ' + STATUS[o.status].cls}>{STATUS[o.status].label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
