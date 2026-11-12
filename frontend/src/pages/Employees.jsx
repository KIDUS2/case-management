import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { t } from '../i18n.js'
import { locale } from '../i18n.js'
import { WORKING, initial, fmtId } from '../ui.js'
const fmtDay = d => new Date(d + 'T00:00:00').toLocaleDateString(locale(), { dateStyle: 'medium' })

const blank = { churchRef: '', fullName: '', churchName: '', phone: '', email: '', profession: '', position: '', gender: '', birthDate: '', hireDate: '', address: '', notes: '', workingStatus: 'ACTIVE_EMPLOYEE' }
const COLS = ['churchRef', 'fullName', 'church', 'phone', 'email', 'profession', 'position', 'gender', 'birthDate', 'hireDate', 'address']

/** Reads pasted CSV/TSV text; the first line holds the column names (any order). */
function parseRows(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const sep = lines[0].includes('\t') ? '\t' : ','
  const head = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ''))
  const alias = { churchRef: ['churchref', 'employeeid', 'id', 'idnumber'] }
  const idx = Object.fromEntries(COLS.map(c => [c, Math.max(...(alias[c] || [c.toLowerCase()]).map(a => head.indexOf(a)))]))
  return lines.slice(1).map(l => { const v = l.split(sep).map(x => x.trim()); const g = c => (idx[c] >= 0 ? v[idx[c]] || '' : ''); return Object.fromEntries(COLS.map(c => [c, g(c)])) })
}

function printCard(e) {
  const w = window.open('', '_blank', 'width=520,height=360'); if (!w) return
  const esc = x => String(x || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(e.fullName)}</title><style>
  body{margin:0;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;background:#eef2f9}
  .c{width:86mm;height:54mm;border-radius:10px;background:linear-gradient(135deg,#1f4fa8,#2f6fd6);color:#fff;padding:14px 16px;box-sizing:border-box;position:relative;box-shadow:0 4px 18px #0003}
  .c:after{content:"";position:absolute;left:0;right:0;bottom:0;height:8px;background:#f2b705;border-radius:0 0 10px 10px}
  .h{display:flex;gap:8px;align-items:center;font-size:9px;letter-spacing:.04em;text-transform:uppercase;opacity:.95}.h img{width:34px;height:34px;background:#fff;border-radius:6px;padding:2px;object-fit:contain}
  .n{font-size:17px;font-weight:700;margin-top:10px}.s{font-size:10px;opacity:.9;margin-top:2px}
  .id{position:absolute;left:16px;bottom:20px;font:700 20px ui-monospace,monospace;letter-spacing:.08em}
  @media print{body{background:#fff}.c{box-shadow:none}}</style>
  <div class="c"><div class="h"><img src="${location.origin}/logo.png"><div>Addis Ababa Diocese<br>የአዲስ አበባ ሀገረ ስብከት</div></div>
  <div class="n">${esc(e.fullName)}</div><div class="s">${esc([e.profession, e.position].filter(Boolean).join(' · '))}<br>⛪ ${esc(e.churchName)}</div>
  <div class="id">${esc(fmtId(e.employeeId))}</div></div><script>setTimeout(()=>print(),400)</script>`)
  w.document.close()
}

export default function Employees({ me }) {
  const canWrite = ['ADMIN', 'OFFICER'].includes(me.role)
  const [data, setData] = useState({ items: [], total: 0, size: 20 })
  const [churches, setChurches] = useState([])
  const [q, setQ] = useState('')
  const [church, setChurch] = useState('')
  const [page, setPage] = useState(0)
  const [form, setForm] = useState(null) // { id?, ...fields }
  const [open, setOpen] = useState(null)
  const [bulk, setBulk] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const load = () => {
    const p = new URLSearchParams({ page, size: 20 }); if (q.trim()) p.set('q', q.trim()); if (church) p.set('churchId', church)
    api('/employees?' + p).then(setData).catch(e => setErr(e.message))
  }
  useEffect(() => { api('/churches').then(setChurches).catch(() => {}) }, [])
  useEffect(() => { const h = setTimeout(load, 250); return () => clearTimeout(h) }, [q, church, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const toBody = f => {
    const ch = churches.find(c => c.name.toLowerCase() === f.churchName.trim().toLowerCase())
    if (!ch) throw new Error(t('Please choose the church from the list (start typing its name).'))
    const { churchName, ...rest } = f
    return { ...rest, churchId: ch.id, birthDate: f.birthDate || null, hireDate: f.hireDate || null }
  }
  const save = async e => {
    e.preventDefault(); setErr(''); setOk('')
    try {
      const body = toBody(form)
      if (form.id) await api('/employees/' + form.id, { method: 'PUT', body }); else await api('/employees', { method: 'POST', body })
      setForm(null); setOk(t('Employee saved ✅')); load()
    } catch (x) { setErr(x.message) }
  }
  const edit = e => setForm({ id: e.id, churchRef: e.churchRef || '', fullName: e.fullName, churchName: e.churchName, phone: e.phone || '', email: e.email || '', profession: e.profession || '', position: e.position || '', gender: e.gender || '', birthDate: e.birthDate || '', hireDate: e.hireDate || '', address: e.address || '', notes: e.notes || '', workingStatus: e.workingStatus })
  const doImport = async () => {
    setErr(''); setOk('')
    const rows = parseRows(bulk)
    if (!rows.length) return setErr(t('Paste the list with a first line of column names, then one employee per line.'))
    const byName = new Map(churches.map(c => [c.name.toLowerCase(), c.id]))
    const unknown = [...new Set(rows.filter(r => !byName.has(r.church.toLowerCase())).map(r => r.church || '(empty)'))]
    const good = rows.filter(r => byName.has(r.church.toLowerCase()) && r.fullName)
    try {
      const body = good.map(r => ({ churchRef: r.churchRef, fullName: r.fullName, churchId: byName.get(r.church.toLowerCase()), phone: r.phone, email: r.email, profession: r.profession, position: r.position, gender: r.gender, birthDate: r.birthDate || null, hireDate: r.hireDate || null, address: r.address, notes: '', workingStatus: 'ACTIVE_EMPLOYEE' }))
      const res = body.length ? await api('/employees/import', { method: 'POST', body }) : { created: 0, updated: 0, errors: [] }
      setOk(t('{a} added, {b} updated.', { a: res.created, b: res.updated }))
      const problems = [...res.errors, ...(unknown.length ? [t('Church not found: {x}', { x: unknown.slice(0, 5).join(', ') })] : [])]
      if (problems.length) setErr(problems.join(' · ')); else setBulk('')
      load()
    } catch (x) { setErr(x.message) }
  }
  const f = k => e => setForm({ ...form, [k]: e.target.value })
  const pages = Math.max(1, Math.ceil(data.total / data.size))

  return (
    <>
      <h1>Employees</h1><p className="muted">{t('{n} people on the list. Their church-issued ID brings back all their details when registering a case.', { n: data.total })}</p>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
      <datalist id="emp-church-list">{churches.map(c => <option key={c.id} value={c.name} />)}</datalist>
      <div className="card">
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <input style={{ flex: '2 1 200px' }} placeholder="Search by name, ID, phone or profession…" value={q} onChange={e => { setQ(e.target.value); setPage(0) }} />
          <select style={{ flex: '1 1 160px' }} value={church} onChange={e => { setChurch(e.target.value); setPage(0) }}>
            <option value="">All churches</option>{churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {canWrite && <button className="btn sm" style={{ margin: 0 }} onClick={() => setForm({ ...blank })}>➕ Register employee</button>}
          {canWrite && <button className="btn ghost sm" style={{ margin: 0 }} onClick={() => setShowBulk(!showBulk)}>📥 Import list</button>}
        </div>
      </div>

      {showBulk && canWrite && (
        <div className="card">
          <h2>Import the church’s employee list</h2>
          <p className="hint">Paste from Excel or a CSV file. First line = column names: <code>churchRef, fullName, church, phone, email, profession, position, gender, birthDate, hireDate, address</code>. Everyone gets a new 12-digit employee ID automatically. People already on the list (same ID or church number) are updated.</p>
          <textarea rows={6} value={bulk} onChange={e => setBulk(e.target.value)} placeholder={'churchRef,fullName,church,profession,phone\nEMP-0001,Abebe Kebede,Kidist Selassie Church,Accountant,0911223344'} />
          <button className="btn" onClick={doImport}>📥 Import</button>
        </div>
      )}

      {form && (
        <form className="card" onSubmit={save}>
          <h2>{form.id ? 'Edit employee' : 'Register employee'}</h2>
          <div className="grid">
            <div><label>Church’s own number (optional)</label><input value={form.churchRef} onChange={f('churchRef')} maxLength={40} />{!form.id && <small className="muted">{t('The employee ID (12 digits) is created automatically when you save.')}</small>}</div>
            <div><label>Full name</label><input value={form.fullName} onChange={f('fullName')} required maxLength={160} /></div>
            <div><label>Church</label><input list="emp-church-list" value={form.churchName} onChange={f('churchName')} required placeholder="Start typing…" /></div>
            <div><label>Working status</label><select value={form.workingStatus} onChange={f('workingStatus')}>{Object.entries(WORKING).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label>Profession</label><input value={form.profession} onChange={f('profession')} maxLength={120} placeholder="e.g. Accountant, Teacher, Priest" /></div>
            <div><label>Position at the church</label><input value={form.position} onChange={f('position')} maxLength={120} /></div>
            <div><label>Phone</label><input value={form.phone} onChange={f('phone')} inputMode="tel" maxLength={40} /></div>
            <div><label>Email</label><input type="email" value={form.email} onChange={f('email')} maxLength={120} /></div>
            <div><label>Gender</label><select value={form.gender} onChange={f('gender')}><option value="">—</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></div>
            <div><label>Date of birth</label><input type="date" value={form.birthDate} onChange={f('birthDate')} /></div>
            <div><label>Hired on</label><input type="date" value={form.hireDate} onChange={f('hireDate')} /></div>
            <div><label>Address</label><input value={form.address} onChange={f('address')} maxLength={255} /></div>
          </div>
          <label>Notes</label><textarea rows={3} value={form.notes} onChange={f('notes')} maxLength={4000} />
          <div className="iact"><button className="btn sm">Save</button><button type="button" className="btn ghost sm" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}

      <div className="card list">
        {data.items.map(e => (
          <div key={e.id}>
            <div className="row" style={{ cursor: 'pointer' }} onClick={() => setOpen(open === e.id ? null : e.id)}>
              <div className="avatar">{initial(e.fullName)}</div>
              <div className="grow"><b>{e.fullName}</b>
                <small>{e.employeeId ? '🪪 ' + fmtId(e.employeeId) + ' · ' : ''}⛪ {e.churchName}{e.profession ? ' · ' + e.profession : ''}{e.position ? ' · ' + e.position : ''}</small></div>
              {e.complaintsAgainst > 0 && <span className="badge st-referred">⚠️ {e.complaintsAgainst}</span>}
              <span className="badge st-open">{t('{n} cases', { n: e.totalCases })}</span>
            </div>
            {open === e.id && (
              <div className="panel">
                {e.employeeId && <div className="idcard-mini"><span>🪪 {t('Employee ID')}</span><b>{fmtId(e.employeeId)}</b>{e.churchRef && <small>{t('Church number')}: {e.churchRef}</small>}</div>}
                <div className="grid">
                  <div><small>{WORKING[e.workingStatus]}</small></div>
                  {e.phone && <div><small>📞 {e.phone}</small></div>}
                  {e.email && <div><small>✉️ {e.email}</small></div>}
                  {e.gender && <div><small>{e.gender === 'MALE' ? 'Male' : 'Female'}</small></div>}
                  {e.birthDate && <div><small>🎂 {fmtDay(e.birthDate)}</small></div>}
                  {e.hireDate && <div><small>📅 {t('Hired {d}', { d: fmtDay(e.hireDate) })}</small></div>}
                  {e.address && <div><small>📍 {e.address}</small></div>}
                </div>
                {e.notes && <p className="notes">{e.notes}</p>}
                <small>{t('{a} cases in total · {b} still active · {c} about this person', { a: e.totalCases, b: e.openCases, c: e.complaintsAgainst })}</small>
                <div className="iact"><button className="btn ghost sm" onClick={() => printCard(e)}>🖨️ {t('Print ID card')}</button></div>
                {canWrite && <div className="iact"><button className="btn ghost sm" onClick={() => { edit(e); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>✏️ Edit</button></div>}
              </div>
            )}
          </div>
        ))}
        {data.items.length === 0 && <p className="muted">No employees match.</p>}
        {pages > 1 && <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
          <button className="btn ghost sm" disabled={page === 0} onClick={() => setPage(page - 1)}>←</button><span>{page + 1} / {pages}</span>
          <button className="btn ghost sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>→</button></div>}
      </div>
    </>
  )
}
