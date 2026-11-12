import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { CATEGORY } from '../ui.js'

const empty = { name: '', handlesCategory: '' }

/** The admin decides which departments exist. Issues can only be sent to active ones. */
export default function Departments() {
  const [list, setList] = useState([])
  const [form, setForm] = useState(empty)
  const [edit, setEdit] = useState(null) // { id, name, handlesCategory }
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const load = () => api('/departments').then(setList).catch(e => setErr(e.message))
  useEffect(() => { load() }, [])

  const body = f => ({ name: f.name, handlesCategory: f.handlesCategory || null })
  const add = async e => {
    e.preventDefault(); setErr(''); setOk('')
    try { await api('/departments', { method: 'POST', body: body(form) }); setForm(empty); setOk('Department added 🎉'); load() } catch (x) { setErr(x.message) }
  }
  const save = async d => {
    setErr(''); setOk('')
    try { await api('/departments/' + d.id, { method: 'PUT', body: { ...body(edit), active: d.active } }); setEdit(null); load() } catch (x) { setErr(x.message) }
  }
  const toggle = async d => {
    setErr(''); setOk('')
    try { await api('/departments/' + d.id, { method: 'PUT', body: { name: d.name, handlesCategory: d.handlesCategory, active: !d.active } }); load() } catch (x) { setErr(x.message) }
  }

  const catSelect = (value, onChange) => (
    <select value={value || ''} onChange={e => onChange(e.target.value)}>
      <option value="">Any kind of issue</option>
      {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
    </select>
  )

  return (
    <>
      <h1>Departments</h1>
      <p className="muted">The offices that receive issues (HR, Finance, Legal…). Add, rename or switch them off. Staff accounts are linked to a department in <b>Users</b>.</p>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
      <form className="card grid" onSubmit={add}>
        <div><label>Department name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required maxLength={120} /></div>
        <div><label>Normally handles</label>{catSelect(form.handlesCategory, v => setForm({ ...form, handlesCategory: v }))}</div>
        <button className="btn span">➕ Add department</button>
      </form>
      <div className="card list">
        {list.map(d => (
          <div className={'row' + (d.active ? '' : ' off')} key={d.id} style={{ flexWrap: 'wrap' }}>
            <div className="avatar">🏢</div>
            {edit?.id === d.id ? (
              <>
                <input style={{ flex: '1 1 180px' }} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} />
                <div style={{ flex: '1 1 180px' }}>{catSelect(edit.handlesCategory, v => setEdit({ ...edit, handlesCategory: v }))}</div>
                <button className="btn sm" style={{ margin: 0 }} onClick={() => save(d)}>Save</button>
                <button className="btn ghost sm" onClick={() => setEdit(null)}>Cancel</button>
              </>
            ) : (
              <>
                <div className="grow">
                  <b>{d.name}</b>
                  <small>{d.handlesCategory ? CATEGORY[d.handlesCategory].icon + ' ' + CATEGORY[d.handlesCategory].label : 'Any kind of issue'} · {d.staff} staff account{d.staff === 1 ? '' : 's'}{d.active ? '' : ' · switched off'}</small>
                </div>
                <button className="btn ghost sm" onClick={() => setEdit({ id: d.id, name: d.name, handlesCategory: d.handlesCategory || '' })}>✏️ Edit</button>
                <button className="btn ghost sm" onClick={() => toggle(d)}>{d.active ? 'Switch off' : 'Switch on'}</button>
              </>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="muted">No departments yet.</p>}
      </div>
    </>
  )
}
