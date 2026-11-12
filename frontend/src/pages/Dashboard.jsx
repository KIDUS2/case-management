import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { STATUS, CATEGORY, fmtDate, initial, fmtCode, names } from '../ui.js'

const STATUS_COLOR = { OPEN: '#8b6fe0', REFERRED: '#e5a23b', COURT: '#e07a52', RESOLVED: '#3fb585' }
const CAT_COLOR = { HR: '#8b6fe0', FINANCE: '#3fb585', MANAGEMENT: '#4f9fe0', COURT: '#e07a52', UNCLEAR: '#9a97a8' }

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
  const label = d => new Date(d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="area" role="img" aria-label="Cases per day, last 30 days">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b6fe0" stopOpacity=".45" /><stop offset="100%" stopColor="#8b6fe0" stopOpacity="0" /></linearGradient></defs>
      {ticks.map(t => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="grid" /><text x={L - 6} y={y(t) + 4} textAnchor="end" className="axis">{t}</text></g>)}
      <path d={area} fill="url(#ag)" />
      <path d={line} fill="none" stroke="#8b6fe0" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={data[i].count ? 4 : 2} className={data[i].count ? 'dot' : 'dot0'}><title>{label(data[i].date)}: {data[i].count} case{data[i].count === 1 ? '' : 's'}</title></circle>)}
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
          const el = <circle key={k} cx="70" cy="70" r={r} fill="none" stroke={STATUS_COLOR[k]} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)"><title>{STATUS[k].label}: {n}</title></circle>
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

export default function Dashboard({ me, onOpen, goNew }) {
  const [d, setD] = useState(null)
  const [recent, setRecent] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    api('/reports/overview').then(setD).catch(e => setErr(e.message))
    api('/cases?size=6').then(r => setRecent(r.items)).catch(() => {})
  }, [])

  if (err) return <div className="err">{err}</div>
  if (!d) return <div className="muted">Loading your reports…</div>

  const t = d.totals
  const active = d.byStatus.OPEN + d.byStatus.REFERRED + d.byStatus.COURT
  const rate = t.cases ? Math.round((d.byStatus.RESOLVED / t.cases) * 100) : 0
  const week = d.daily.slice(-7).reduce((s, x) => s + x.count, 0)
  const cats = Object.entries(d.byCategory).map(([k, n]) => ({ name: CATEGORY[k].icon + ' ' + CATEGORY[k].label, count: n, color: CAT_COLOR[k] }))
  const first = (me.fullName || '').split(' ')[0]

  return (
    <>
      <div className="dash-hero">
        <div>
          <h1>{greeting()}, {first} 👋</h1>
          <p>{t.cases === 0 ? 'Welcome! Register the first case to see your reports come alive.' : `${week} new case${week === 1 ? '' : 's'} this week · ${active} still being handled.`}</p>
        </div>
        <button className="btn light" onClick={goNew}>➕ Register case</button>
      </div>

      <div className="kpis">
        <Kpi icon="📚" label="Total cases" value={t.cases} sub={`${week} in the last 7 days`} tone="k1" />
        <Kpi icon="🟣" label="Still active" value={active} sub={`${d.byStatus.COURT} in court`} tone="k2" />
        <Kpi icon="✅" label="Resolved" value={d.byStatus.RESOLVED} sub={`${rate}% resolution rate`} tone="k3" />
        <Kpi icon="🙋" label="People served" value={t.people} sub={`${t.returningPeople} came back`} tone="k4" />
        <Kpi icon="⛪" label="Churches reached" value={t.churches} tone="k5" />
        <Kpi icon="✉️" label="Letters issued" value={t.letters} tone="k6" />
        <Kpi icon="🙏" label="Church members reporting" value={t.churchMembers} sub="not employees" tone="k4" />
        <Kpi icon="👤" label="Employees reported on" value={t.reportedOn} tone="k5" />
        <Kpi icon="⚠️" label="Repeat complaints" value={t.repeatReportedOn} sub="employees in 2+ cases" tone="k2" />
      </div>

      <div className="dgrid">
        <div className="card wide"><h2>Cases per day <small className="inl">last 30 days</small></h2><AreaChart data={d.daily} /></div>
        <div className="card"><h2>Cases by status</h2><Donut byStatus={d.byStatus} total={t.cases} /></div>
        <div className="card"><h2>What people bring <small className="inl">issues by type</small></h2><Bars items={cats} /></div>
        <div className="card"><h2>Busiest churches</h2><Bars items={d.topChurches.map(c => ({ name: c.name, count: c.count }))} color="#8b6fe0" /></div>
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
    </>
  )
}
