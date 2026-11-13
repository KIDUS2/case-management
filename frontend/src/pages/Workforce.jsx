import { Fragment, useEffect, useState } from 'react'
import { api } from '../api.js'
import { t, locale } from '../i18n.js'
import { WORKING } from '../ui.js'

const money = n => Number(n || 0).toLocaleString(locale(), { maximumFractionDigits: 0 })

/** The staff of one church: who, in what position, on what salary. */
function Staff({ c }) {
  const [list, setList] = useState(null)
  useEffect(() => { api(`/employees?churchId=${c.id}&size=100`).then(r => setList(r.items)).catch(() => setList([])) }, [c.id])
  const staff = (list || []).filter(x => ['ACTIVE_EMPLOYEE', 'LEADER_PRIEST', 'CONTRACT', 'SUSPENDED'].includes(x.workingStatus))
  return (
    <div className="wf-detail">
      <div className="wf-pos">{c.positions.map(p => <span key={p.position} className="catchip">{p.position === '—' ? t('No position') : p.position} · {p.employees}{p.payroll > 0 ? ' · ' + money(p.payroll) : ''}</span>)}</div>
      {list === null && <p className="muted">…</p>}
      {list && staff.length === 0 && <p className="muted">{t('No staff registered for this church yet.')}</p>}
      {staff.length > 0 && (
        <table className="rank">
          <thead><tr><th>{t('Name')}</th><th>{t('Position')}</th><th>{t('Working status')}</th><th>{t('Phone number')}</th><th className="r">{t('Monthly salary (birr)')}</th></tr></thead>
          <tbody>{staff.map(x => (
            <tr key={x.id}><td><b>{x.fullName}</b></td><td>{x.position || '—'}</td><td>{t(WORKING[x.workingStatus])}</td><td>{x.phone || '—'}</td><td className="r">{x.salary != null ? money(x.salary) : '—'}</td></tr>))}
          </tbody>
        </table>
      )}
    </div>
  )
}

/** Admin only: how many people work in each church and sub-city, who the leaders are, and what the payroll is. */
export default function Workforce({ onOpenEmployees }) {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [sub, setSub] = useState('')
  const [sort, setSort] = useState('payroll')
  const [open, setOpen] = useState(null)

  useEffect(() => { api('/workforce').then(setD).catch(e => setErr(e.message)) }, [])
  if (err) return <div className="err">{err}</div>
  if (!d) return <div className="muted">…</div>

  const tot = d.totals
  const rows = d.churches
    .filter(c => c.name.toLowerCase().includes(q.trim().toLowerCase()) && (sub === '' || c.subCity === sub))
    .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'employees' ? b.employees - a.employees : Number(b.payroll) - Number(a.payroll)))
  const maxSub = Math.max(1, ...d.subCities.map(s => Number(s.payroll)))

  return (
    <>
      <div className="chx-head">
        <div><h1>{t('Staff & payroll')}</h1><p className="muted">{t('Who works in each church, in what position, and what the church costs every month. Only you can see salaries.')}</p></div>
        <button className="btn ghost" onClick={onOpenEmployees}>🪪 {t('Employees')}</button>
      </div>
      <div className="chx-stats wf-stats">
        <div className="chx-stat"><b>{tot.employees}</b><span>{t('Employees on staff')}</span></div>
        <div className="chx-stat"><b>{tot.leaders}</b><span>{t('Leaders and priests')}</span></div>
        <div className="chx-stat"><b>{money(tot.payroll)}</b><span>{t('Monthly payroll (birr)')}</span></div>
        <div className={'chx-stat' + (tot.withoutSalary ? ' alert' : '')}><b>{tot.withoutSalary}</b><span>{t('Without a salary on record')}</span></div>
      </div>

      <div className="card">
        <h2>{t('By sub-city')}</h2>
        <table className="rank">
          <thead><tr><th>{t('Sub-city')}</th><th className="r">{t('Churches')}</th><th className="r">{t('Employees')}</th><th className="r">{t('Leaders and priests')}</th><th>{t('Monthly payroll (birr)')}</th></tr></thead>
          <tbody>{d.subCities.map(s => (
            <tr key={s.name} className="click" onClick={() => { setSub(s.name === '—' ? '—' : s.name); setQ('') }}>
              <td><b>{s.name === '—' ? t('Not set') : s.name}</b></td><td className="r">{s.churches}</td><td className="r">{s.employees}</td><td className="r">{s.leaders}</td>
              <td><div className="rbar"><i style={{ width: (Number(s.payroll) / maxSub) * 100 + '%' }} /><span>{money(s.payroll)}</span></div></td></tr>))}
          </tbody>
        </table>
      </div>

      <div className="card chx-list">
        <h2>{t('By church')}</h2>
        <div className="chx-bar">
          <input className="chx-search" type="search" placeholder={t('Search churches…')} value={q} onChange={e => setQ(e.target.value)} />
          <select className="chx-filter" value={sub} onChange={e => setSub(e.target.value)} aria-label={t('Sub-city')}>
            <option value="">{t('All sub-cities')}</option>
            {d.subCities.map(s => <option key={s.name} value={s.name}>{s.name === '—' ? t('Not set') : s.name}</option>)}
          </select>
          <select className="chx-filter" value={sort} onChange={e => setSort(e.target.value)} aria-label={t('Sort by')}>
            <option value="payroll">{t('Highest payroll')}</option><option value="employees">{t('Most employees')}</option><option value="name">{t('Name')}</option>
          </select>
        </div>
        <table className="chx-table wf-table">
          <thead><tr><th>{t('Church')}</th><th>{t('Sub-city')}</th><th className="r">{t('Employees')}</th><th>{t('Leaders and priests')}</th><th className="r">{t('Monthly payroll (birr)')}</th></tr></thead>
          <tbody>
            {rows.map(c => (
              <Fragment key={c.id}>
                <tr className="click" onClick={() => setOpen(open === c.id ? null : c.id)}>
                  <td><span className="chx-name">{open === c.id ? '▾' : '▸'} ⛪ {c.name}</span></td>
                  <td>{c.subCity === '—' ? '—' : c.subCity}</td><td className="r">{c.employees}</td>
                  <td>{c.leaderList.length ? c.leaderList.map(l => l.fullName).join(', ') : '—'}</td>
                  <td className="r"><b>{money(c.payroll)}</b>{c.withoutSalary > 0 && <small className="warn">{t('{n} without salary', { n: c.withoutSalary })}</small>}</td>
                </tr>
                {open === c.id && <tr><td colSpan={5}><Staff c={c} /></td></tr>}
              </Fragment>))}
          </tbody>
        </table>
        {!rows.length && <p className="muted" style={{ textAlign: 'center', padding: 18 }}>{t('No match.')}</p>}
      </div>
    </>
  )
}
