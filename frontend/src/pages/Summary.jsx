import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { t } from '../i18n.js'
import { STATUS, CATEGORY, fmtDate, fmtCode, names, fmtDay } from '../ui.js'
import { downloadCsv } from '../sheet.js'
import PeriodFilter, { periodOf, periodQuery } from '../components/PeriodFilter.jsx'

const ROLE_IN_CASE = { SUBJECT: 'Reported on', COMPLAINANT: 'Reported' }

/** Which kefle ketema brings which kind of issue (for example, Bole and finance assessments). */
function SubCityTable({ rows }) {
  const cats = Object.keys(CATEGORY)
  const maxIssues = Math.max(1, ...rows.map(r => r.issues))
  if (!rows.length) return <p className="muted">{t('Nothing in this period.')}</p>
  return (
    <div className="tablewrap">
      <table className="sumtable subtable">
        <thead><tr><th>{t('Kefle ketema')}</th><th>{t('Cases')}</th><th>{t('Issues')}</th><th>{t('Resolved')}</th><th>{t('Most common issue')}</th><th>{t('By type of issue')}</th></tr></thead>
        <tbody>{rows.map(r => {
          const top = cats.map(k => [k, r.byCategory[k] || 0]).sort((a, b) => b[1] - a[1])[0]
          return (
            <tr key={r.name} style={{ cursor: 'default' }}>
              <td><b>{r.name === '—' ? t('Not set') : r.name}</b>
                <div className="mbar"><i style={{ width: Math.max(4, (r.issues / maxIssues) * 100) + '%' }} /></div></td>
              <td>{r.cases}</td><td>{r.issues}</td>
              <td>{r.resolved}<small className="muted"> · {r.issues ? Math.round((r.resolved / r.issues) * 100) : 0}%</small></td>
              <td>{top && top[1] > 0 ? <b>{CATEGORY[top[0]].icon} {t(CATEGORY[top[0]].label)} ({top[1]})</b> : '—'}</td>
              <td><div className="catchips">{cats.filter(k => r.byCategory[k]).map(k => <span key={k} className="catchip" title={t(CATEGORY[k].label)}>{CATEGORY[k].icon} {r.byCategory[k]}</span>)}</div></td>
            </tr>)
        })}</tbody>
      </table>
    </div>
  )
}

const STATUS_COLOR = { OPEN: '#1b7f7a', REFERRED: '#c99a2e', COURT: '#b23a2a', RESOLVED: '#2d7a3e' }

function Bars({ items }) {
  const max = Math.max(1, ...items.map(i => i.count))
  if (!items.length) return <p className="muted">{t('Nothing in this period.')}</p>
  return (
    <div className="bars">{items.map(i => (
      <div className="bar" key={i.name}>
        <div className="bname">{i.name}</div>
        <div className="btrack"><div className="bfill" style={{ width: Math.max(4, (i.count / max) * 100) + '%', background: i.color || '#2d7a3e' }} /></div>
        <b>{i.count}</b>
      </div>))}
    </div>
  )
}

function Stat({ icon, label, value, sub }) {
  return <div className="kpi k1"><div className="kicon">{icon}</div><div><b>{value}</b><span>{label}</span>{sub && <small>{sub}</small>}</div></div>
}

/** Every case in one place, for weeks when a hundred cases come in. */
export default function Summary({ me, onOpen }) {
  const [period, setPeriod] = useState(() => periodOf('week'))
  const [status, setStatus] = useState('')
  const [deptId, setDeptId] = useState('')
  const [q, setQ] = useState('')
  const [qNow, setQNow] = useState('')
  const [page, setPage] = useState(0)
  const [depts, setDepts] = useState([])
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api('/departments').then(setDepts).catch(() => {}) }, [])
  useEffect(() => { const h = setTimeout(() => { setQNow(q.trim()); setPage(0) }, 350); return () => clearTimeout(h) }, [q])

  const query = (pg, size) => [periodQuery(period), status && 'status=' + status, deptId && 'departmentId=' + deptId, qNow && 'q=' + encodeURIComponent(qNow), 'page=' + pg, 'size=' + size].filter(Boolean).join('&')

  useEffect(() => {
    if (period.key === 'custom' && (!period.from || !period.to)) return
    setBusy(true)
    api('/summary?' + query(page, 25)).then(x => { setD(x); setErr('') }).catch(e => setErr(e.message)).finally(() => setBusy(false))
  }, [period, status, deptId, qNow, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const reset = fn => v => { fn(v); setPage(0) }

  const exportAll = async () => {
    setErr('')
    try {
      const rows = []
      for (let pg = 0; ; pg++) {
        const r = await api('/summary?' + query(pg, 100))
        rows.push(...r.rows)
        if (rows.length >= r.total || !r.rows.length) break
      }
      downloadCsv('case-summary.csv',
        ['Code', 'Registered', 'Church', 'Kefle ketema', 'Reported by', 'About', 'Status', 'Issues', 'Resolved issues', 'Departments', 'Open church comments', 'Letter issued'],
        rows.map(r => [fmtCode(r.code), r.createdAt.slice(0, 10), r.churchName, r.subCity || '', r.complainants.join('; '), r.subjects.join('; '), r.status, r.issueCount, r.resolvedCount, r.departments.join('; '), r.openInquiries, r.letterIssued ? 'yes' : 'no']))
    } catch (x) { setErr(x.message) }
  }

  const pages = d ? Math.max(1, Math.ceil(d.total / d.size)) : 1
  const rate = d && d.issues ? Math.round((d.issuesResolved / d.issues) * 100) : 0

  return (
    <>
      <h1>{t('Summary')}</h1>
      <p className="muted">{t('All cases in one place. Choose a period, then narrow down by status, department or name.')}</p>
      {err && <div className="err">{err}</div>}

      <div className={'card periodbar' + (busy ? ' busy' : '')}>
        <PeriodFilter value={period} onChange={reset(setPeriod)} />
        <div className="sumfilters">
          <select value={status} onChange={e => reset(setStatus)(e.target.value)} aria-label={t('Status')}>
            <option value="">{t('Any status')}</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{t(v.label)}</option>)}
          </select>
          <select value={deptId} onChange={e => reset(setDeptId)(e.target.value)} aria-label={t('Department')}>
            <option value="">{t('Any department')}</option>
            {depts.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={'🔍 ' + t('Name, church or case code')} />
        </div>
      </div>

      {!d ? <div className="muted">{t('Loading…')}</div> : (
        <>
          {d.truncated && <div className="banner warn">{t('Very many cases match. Showing the newest 5000; narrow the period to see them all.')}</div>}
          <div className="kpis">
            <Stat icon="📚" label={t('Cases')} value={d.cases} />
            <Stat icon="🧩" label={t('Issues')} value={d.issues} sub={t('{n}% resolved', { n: rate })} />
            <Stat icon="✅" label={t('Issues resolved')} value={d.issuesResolved} />
            <Stat icon="✉️" label={t('Letters issued')} value={d.letters} />
            <Stat icon="💬" label={t('Waiting on a church comment')} value={d.withOpenInquiry} />
            <Stat icon="⏰" label={t('Late in departments')} value={d.lateIssues} />
            <Stat icon="🔥" label={t('Urgent right now')} value={d.urgentIssues} />
          </div>

          {d.waitingForAdmin.length > 0 && (
            <div className="card pending">
              <h2>{me.role === 'ADMIN' ? t('Waiting for your decision') : t('Church replies waiting for the administrator')} <span className="count">{d.waitingForAdmin.length}</span></h2>
              {d.waitingForAdmin.map(w => (
                <button key={w.id} className="mini" onClick={() => onOpen(w.caseId)}>
                  <span className="mrow"><span className="avatar sm">💬</span><span><b>{fmtCode(w.caseCode)} · {w.churchName}</b>
                    <small>{w.departmentName ? w.departmentName + ' · ' : ''}{(w.finding || '').slice(0, 110)}{(w.finding || '').length > 110 ? '…' : ''}</small></span></span>
                  <span className="badge s-ref">{t('Decide')}</span>
                </button>
              ))}
            </div>
          )}

          {d.escalations.length > 0 && (
            <div className="card pending esc">
              <h2>🚨 {t('Late: not solved by the date')} <span className="count">{d.escalations.length}</span></h2>
              <p className="hint">{t('These issues passed their date in the department. The administrator was told automatically.')}</p>
              {d.escalations.map(e => (
                <button key={e.caseId + e.department + e.category} className="mini" onClick={() => onOpen(e.caseId)}>
                  <span className="mrow"><span className="avatar sm">{CATEGORY[e.category].icon}</span><span><b>{fmtCode(e.code)} · {e.churchName}{e.subCity ? ' · ' + e.subCity : ''}</b>
                    <small>{e.department} · {t(CATEGORY[e.category].label)}</small></span></span>
                  <span className="flag late">⏰ {t('{n} days late', { n: e.daysLate })}{e.urgent ? ' · 🔥' : ''}</span>
                </button>
              ))}
            </div>
          )}

          <div className="card">
            <h2>📍 {t('Issues by kefle ketema')}</h2>
            <p className="hint">{t('Where the issues come from, and what kind they are.')}</p>
            <SubCityTable rows={d.subCities} />
          </div>

          <div className="dgrid">
            <div className="card"><h2>{t('By status')}</h2><Bars items={Object.entries(d.byStatus).map(([k, n]) => ({ name: t(STATUS[k].label), count: n, color: STATUS_COLOR[k] }))} /></div>
            <div className="card"><h2>{t('By type of issue')}</h2><Bars items={Object.entries(d.byCategory).map(([k, n]) => ({ name: CATEGORY[k].icon + ' ' + t(CATEGORY[k].label), count: n }))} /></div>
            <div className="card"><h2>{t('By department')}</h2><Bars items={d.byDepartment} /></div>
            <div className="card"><h2>{t('By church')}</h2><Bars items={d.byChurch} /></div>
            {d.daily.length > 1 && <div className="card wide"><h2>{t('Cases per day')}</h2>
              <Bars items={d.daily.slice(-14).map(x => ({ name: fmtDay(x.date), count: x.count }))} /></div>}
          </div>

          {d.leaders.length > 0 && (
            <div className="card">
              <h2>✝️ {t('Issues involving leaders and priests')} <span className="count">{d.leaders.length}</span></h2>
              <div className="tablewrap">
                <table className="sumtable">
                  <thead><tr><th>{t('Leader')}</th><th>{t('Church')}</th><th>{t('Case')}</th><th>{t('In the case')}</th><th>{t('Issues')}</th><th>{t('Resolved')}</th><th>{t('Status')}</th></tr></thead>
                  <tbody>{d.leaders.map(l => (
                    <tr key={l.caseId + l.leader} onClick={() => onOpen(l.caseId)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && onOpen(l.caseId)}>
                      <td><b>{l.leader}</b></td>
                      <td>{l.churchName}{l.subCity && <small className="muted"> · {l.subCity}</small>}</td>
                      <td>{fmtCode(l.code)}</td>
                      <td>{t(ROLE_IN_CASE[l.roleInCase])}</td>
                      <td><div className="catchips">{l.categories.map(k => <span key={k} className="catchip" title={t(CATEGORY[k].label)}>{CATEGORY[k].icon} {t(CATEGORY[k].label)}</span>)}</div></td>
                      <td>{l.resolvedCount}/{l.issueCount}</td>
                      <td><span className={'badge ' + STATUS[l.status].cls}>{t(STATUS[l.status].label)}</span></td>
                    </tr>))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card">
            <div className="sumhead">
              <h2>{t('All cases in this view')} <span className="count">{d.total}</span></h2>
              <button className="btn ghost sm" style={{ margin: 0 }} onClick={exportAll}>⬇ {t('Download as CSV')}</button>
            </div>
            {d.rows.length === 0 ? <p className="muted">{t('No cases match these filters.')}</p> : (
              <div className="tablewrap">
                <table className="sumtable">
                  <thead><tr><th>{t('Code')}</th><th>{t('Registered')}</th><th>{t('Church')}</th><th>{t('Kefle ketema')}</th><th>{t('Reported by')}</th><th>{t('Status')}</th><th>{t('Issues')}</th><th>{t('Departments')}</th><th /></tr></thead>
                  <tbody>{d.rows.map(r => (
                    <tr key={r.id} onClick={() => onOpen(r.id)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && onOpen(r.id)}>
                      <td><b>{fmtCode(r.code)}</b></td>
                      <td>{fmtDate(r.createdAt)}</td>
                      <td>{r.churchName}</td>
                      <td>{r.subCity || '—'}</td>
                      <td>{names(r.complainants)}{r.subjects.length > 0 && <small className="muted"> · {t('about')} {names(r.subjects)}</small>}</td>
                      <td><span className={'badge ' + STATUS[r.status].cls}>{t(STATUS[r.status].label)}</span></td>
                      <td>{r.resolvedCount}/{r.issueCount}</td>
                      <td>{r.departments.join(', ') || '—'}</td>
                      <td>{r.openInquiries > 0 && <span className="badge s-ref" title={t('Church comment in progress')}>💬 {r.openInquiries}</span>}</td>
                    </tr>))}
                  </tbody>
                </table>
              </div>
            )}
            {pages > 1 && (
              <div className="pager">
                <button className="btn ghost sm" disabled={page === 0} onClick={() => setPage(page - 1)}>← {t('Previous')}</button>
                <span>{t('Page {a} of {b}', { a: page + 1, b: pages })}</span>
                <button className="btn ghost sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>{t('Next')} →</button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
