import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { t as tt, locale } from '../i18n.js'
import { STATUS, CATEGORY, fmtDate, initial, fmtCode, names } from '../ui.js'
import PeriodFilter, { periodOf, periodQuery } from '../components/PeriodFilter.jsx'

const STATUS_COLOR = { OPEN: '#1b7f7a', REFERRED: '#c99a2e', COURT: '#b23a2a', RESOLVED: '#2d7a3e' }
const EXTRA = ['#6b4fa0', '#d0702f', '#3a7ca5', '#a14b6e', '#5f8a2d']
const CAT_COLOR = { HR: '#2d7a3e', FINANCE: '#c99a2e', MANAGEMENT: '#1b7f7a', COURT: '#b23a2a', UNCLEAR: '#8a8099' }

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function Kpi({ icon, label, value, sub, tone }) {
  return (
    <div className={'kpi ' + tone}>
      <div className="kicon">{icon}</div>
      <div><b>{value}</b><span>{label}</span>{sub && <small>{sub}</small>}</div>
    </div>
  )
}

function AreaChart({ data }) {
  const W = 640, H = 210, L = 30, R = 10, T = 14, B = 26
  const max = Math.max(3, ...data.map(d => d.count))
  const x = i => L + (i * (W - L - R)) / Math.max(1, data.length - 1)
  const y = v => T + (1 - v / max) * (H - T - B)
  const pts = data.map((d, i) => [x(i), y(d.count)])
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = line + ` L${x(data.length - 1)} ${H - B} L${x(0)} ${H - B} Z`
  const ticks = [0, Math.round(max / 2), max]
  const label = d => new Date(d + 'T00:00:00').toLocaleDateString(locale(), { month: 'short', day: 'numeric' })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="area" role="img" aria-label="Cases per day">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2d7a3e" stopOpacity=".4" /><stop offset="100%" stopColor="#2d7a3e" stopOpacity="0" /></linearGradient></defs>
      {ticks.map(t => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="grid" /><text x={L - 6} y={y(t) + 4} textAnchor="end" className="axis">{t}</text></g>)}
      <path d={area} fill="url(#ag)" />
      <path d={line} fill="none" stroke="#2d7a3e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={data[i].count ? 4 : 2} className={data[i].count ? 'dot' : 'dot0'}><title>{tt('{x}: {n} cases', { x: label(data[i].date), n: data[i].count })}</title></circle>)}
      <text x={L} y={H - 6} className="axis">{label(data[0].date)}</text>
      <text x={x(Math.floor(data.length / 2))} y={H - 6} textAnchor="middle" className="axis">{label(data[Math.floor(data.length / 2)].date)}</text>
      <text x={W - R} y={H - 6} textAnchor="end" className="axis">{label(data[data.length - 1].date)}</text>
    </svg>
  )
}

function Donut({ byStatus, total }) {
  const r = 54, C = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="donutwrap">
      <svg viewBox="0 0 140 140" className="donut" role="img" aria-label="Cases by status">
        <circle cx="70" cy="70" r={r} className="track" />
        {total > 0 && Object.entries(byStatus).filter(([, n]) => n > 0).map(([k, n]) => {
          const len = (n / total) * C
          const el = <circle key={k} cx="70" cy="70" r={r} fill="none" stroke={STATUS_COLOR[k]} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)"><title>{tt('{x}: {n} cases', { x: tt(STATUS[k].label), n })}</title></circle>
          offset += len
          return el
        })}
        <text x="70" y="68" textAnchor="middle" className="dnum">{total}</text>
        <text x="70" y="86" textAnchor="middle" className="axis">cases</text>
      </svg>
      <div className="legend">
        {Object.entries(byStatus).map(([k, n]) => (
          <div key={k}><i style={{ background: STATUS_COLOR[k] }} />{STATUS[k].label}<b>{n}</b></div>
        ))}
      </div>
    </div>
  )
}

function Bars({ items, color }) {
  const max = Math.max(1, ...items.map(i => i.count))
  if (!items.length) return <p className="muted">Nothing to show yet.</p>
  return (
    <div className="bars">
      {items.map(i => (
        <div className="bar" key={i.name}>
          <div className="bname">{i.name}</div>
          <div className="btrack"><div className="bfill" style={{ width: Math.max(4, (i.count / max) * 100) + '%', background: i.color || color }} /></div>
          <b>{i.count}</b>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ me, onOpen, goNew, go }) {
  const [d, setD] = useState(null)
  const [recent, setRecent] = useState([])
  const [err, setErr] = useState('')
  const [period, setPeriod] = useState(() => periodOf('30d'))
  const [busy, setBusy] = useState(false)

  useEffect(() => { api('/cases?size=6').then(r => setRecent(r.items)).catch(() => {}) }, [])
  useEffect(() => {
    if (period.key === 'custom' && (!period.from || !period.to)) return
    setBusy(true)
    api('/reports/overview' + (periodQuery(period) ? '?' + periodQuery(period) : '')).then(x => { setD(x); setErr('') }).catch(e => setErr(e.message)).finally(() => setBusy(false))
  }, [period])

  if (err) return <div className="err">{err}</div>
  if (!d) return <div className="muted">Loading your reports…</div>

  const t = d.totals
  const active = d.byStatus.OPEN + d.byStatus.REFERRED + d.byStatus.COURT
  const rate = t.cases ? Math.round((d.byStatus.RESOLVED / t.cases) * 100) : 0
  const rangeLabel = period.key === 'all' ? tt('last 30 days') : d.daily.length === 1 ? d.daily[0].date : d.daily[0].date + ' → ' + d.daily[d.daily.length - 1].date
  const cats = Object.entries(d.byCategory).map(([k, n]) => ({ name: CATEGORY[k].icon + ' ' + CATEGORY[k].label, count: n, color: CAT_COLOR[k] || EXTRA[Math.abs([...k].reduce((a, ch) => a + ch.charCodeAt(0), 0)) % EXTRA.length] }))
  const first = (me.fullName || '').split(' ')[0]

  return (
    <>
      <div className="dash-hero">
        <img className="seal" src="/logo.png" alt="" />
        <div style={{ flex: 1 }}>
          <h1>{tt(greeting()) + ', ' + first + ' 👋'}</h1>
          <p>{t.cases === 0 ? tt('Welcome! Register the first case to see your reports come alive.') : tt('{a} cases in this period · {b} still being handled.', { a: t.cases, b: active })}</p>
        </div>
        <button className="btn light" onClick={goNew}>➕ Register case</button>
      </div>

      <div className={'card periodbar' + (busy ? ' busy' : '')}>
        <PeriodFilter value={period} onChange={setPeriod} />
        <small className="muted">{period.key === 'all' ? tt('Showing all cases since the start.') : tt('Showing cases registered {r}.', { r: rangeLabel })}</small>
      </div>

      {(d.flow.overdue > 0 || d.flow.courtUnacknowledged > 0 || d.flow.expectedToday > 0) && (
        <div className="alerts">
          {d.flow.overdue > 0 && <button className="alert red" onClick={() => go('queue')}><b>{d.flow.overdue}</b><span>⏰ people did not come back on time</span></button>}
          {d.flow.courtUnacknowledged > 0 && <button className="alert red" onClick={() => go('cases')}><b>{d.flow.courtUnacknowledged}</b><span>⚖️ {tt('court issues waiting for your acknowledgment')}</span></button>}
          {d.flow.expectedToday > 0 && <button className="alert gold" onClick={() => go('queue')}><b>{d.flow.expectedToday}</b><span>🚪 expected at the door today</span></button>}
        </div>
      )}

      <section className="ledger" aria-label={tt('Totals')}>
        <div className="lg k-total"><span className="lg-label">{tt('Total cases')}</span><b>{t.cases}</b><small>{rangeLabel}</small></div>
        <div className="lg k-active"><span className="lg-label">{tt('Still active')}</span><b>{active}</b><small>{tt('{n} in court', { n: d.byStatus.COURT })}</small></div>
        <div className="lg k-done"><span className="lg-label">{tt('Resolved')}</span><b>{d.byStatus.RESOLVED}</b>
          <div className="lg-meter" role="img" aria-label={tt('{n}% resolution rate', { n: rate })}><i style={{ width: rate + '%' }} /></div><small>{tt('{n}% resolution rate', { n: rate })}</small></div>
        <div className="lg k-wait"><span className="lg-label">{tt('Waiting in departments')}</span><b>{d.flow.waitingInDepartments}</b><small>{tt('issues sent, not yet resolved')}</small></div>
      </section>
      <section className="minis" aria-label={tt('More numbers')}>
        <div className={'mini-stat' + (d.flow.expectedToday ? ' gold' : '')}><b>{d.flow.expectedToday}</b><span>{tt('Expected today')}<em>{tt('{n} overdue', { n: d.flow.overdue })}</em></span></div>
        <div className={'mini-stat' + (d.flow.courtUnacknowledged ? ' red' : '')}><b>{d.flow.courtUnacknowledged}</b><span>{tt('Court, not acknowledged')}</span></div>
        <div className="mini-stat"><b>{t.people}</b><span>{tt('People served')}<em>{tt('{n} came back', { n: t.returningPeople })}</em></span></div>
        <div className="mini-stat"><b>{t.churches}</b><span>{tt('Churches reached')}</span></div>
        <div className="mini-stat"><b>{t.letters}</b><span>{tt('Letters issued')}</span></div>
        <div className="mini-stat"><b>{t.churchMembers}</b><span>{tt('Church members reporting')}<em>{tt('not employees')}</em></span></div>
        <div className="mini-stat"><b>{t.reportedOn}</b><span>{tt('Employees reported on')}</span></div>
        <div className={'mini-stat' + (t.repeatReportedOn ? ' gold' : '')}><b>{t.repeatReportedOn}</b><span>{tt('Repeat complaints')}<em>{tt('employees in 2+ cases')}</em></span></div>
      </section>

      <div className="dgrid">
        <div className="card wide"><h2>Cases per day <small className="inl">{rangeLabel}</small></h2><AreaChart data={d.daily} /></div>
        <div className="card"><h2>Cases by status</h2><Donut byStatus={d.byStatus} total={t.cases} /></div>
        <div className="card"><h2>What people bring <small className="inl">issues by type</small></h2><Bars items={cats} /></div>
        <div className="card"><h2>Issues by department <small className="inl">waiting vs resolved</small></h2>
          {d.byDepartment.length === 0 && <p className="muted">No departments yet.</p>}
          <div className="bars">
            {d.byDepartment.map(x => { const tot = Math.max(1, x.pending + x.resolved); return (
              <div key={x.name}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem' }}><b>{x.name}</b><span className="muted">{tt('{a} waiting · {b} resolved', { a: x.pending, b: x.resolved })}</span></div>
                <div className="stack"><i style={{ width: (x.resolved / tot) * 100 + '%', background: '#2d7a3e' }} /><i style={{ width: (x.pending / tot) * 100 + '%', background: '#c99a2e' }} /></div></div>) })}
          </div>
          <div className="legend row2"><span>🟩 resolved</span><span>🟨 waiting</span></div>
        </div>
        <div className="card"><h2>Busiest churches</h2><Bars items={d.topChurches.map(c => ({ name: c.name, count: c.count }))} color="#2d7a3e" /></div>
        <div className="card"><h2>Latest cases</h2>
          {recent.length === 0 && <p className="muted">No cases yet.</p>}
          {recent.map(c => (
            <button key={c.id} className="mini" onClick={() => onOpen(c.id)}>
              <span className="mrow"><span className="avatar sm">{initial(c.complainants[0])}</span><span><b>{names(c.complainants)}</b><small>{fmtCode(c.code)} · {c.churchName} · {fmtDate(c.createdAt)}</small></span></span>
              <span className={'badge ' + STATUS[c.status].cls}>{STATUS[c.status].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="dgrid">
        <div className="card wide"><h2>{tt('Which sub-city has the most issues')} <small className="inl">{tt('by the church of the person who came')}</small></h2>
          {d.bySubCity.length === 0 && <p className="muted">{tt('No cases yet.')}</p>}
          <table className="rank">
            <thead><tr><th>{tt('Sub-city')}</th><th>{tt('Issues')}</th><th>{tt('Cases')}</th><th>{tt('Resolved')}</th><th>{tt('What kind of issues')}</th></tr></thead>
            <tbody>{d.bySubCity.map((r, i) => (
              <tr key={r.name}><td><b>{i + 1}. {r.name === '—' ? tt('Not set') : r.name}</b></td>
                <td><div className="rbar"><i style={{ width: (r.issues / Math.max(1, d.bySubCity[0].issues)) * 100 + '%' }} /><span>{r.issues}</span></div></td>
                <td>{r.cases}</td><td>{r.resolved}</td>
                <td><div className="catchips">{Object.entries(r.byCategory).sort((a, b) => b[1] - a[1]).map(([k, n]) => <span key={k} className="catchip" title={CATEGORY[k].label}>{CATEGORY[k].icon} {CATEGORY[k].label} {n}</span>)}</div></td></tr>))}
            </tbody>
          </table>
        </div>
        <div className="card wide"><h2>{tt('Churches with the most issues')}</h2>
          {d.churchesByIssues.length === 0 && <p className="muted">{tt('No cases yet.')}</p>}
          <table className="rank">
            <thead><tr><th>{tt('Church')}</th><th>{tt('Sub-city')}</th><th>{tt('Issues')}</th><th>{tt('Cases')}</th><th>{tt('What kind of issues')}</th></tr></thead>
            <tbody>{d.churchesByIssues.map((r, i) => (
              <tr key={r.name}><td><b>{i + 1}. {r.name}</b></td><td>{r.subCity === '—' ? '—' : r.subCity}</td>
                <td><div className="rbar"><i style={{ width: (r.issues / Math.max(1, d.churchesByIssues[0].issues)) * 100 + '%' }} /><span>{r.issues}</span></div></td>
                <td>{r.cases}</td>
                <td><div className="catchips">{Object.entries(r.byCategory).sort((a, b) => b[1] - a[1]).map(([k, n]) => <span key={k} className="catchip" title={CATEGORY[k].label}>{CATEGORY[k].icon} {CATEGORY[k].label} {n}</span>)}</div></td></tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
