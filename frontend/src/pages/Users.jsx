import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { ROLES } from '../ui.js'

const empty = { username: '', fullName: '', password: '', role: 'RECEPTION', departmentId: '' }

export default function Users({ me }) {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState(empty)
  const [find, setFind] = useState('')
  const [role, setRole] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const load = () => api('/users').then(setUsers).catch(e => setErr(e.message))
  useEffect(() => { load(); api('/departments').then(setDepartments).catch(() => {}) }, [])
  const set = k => e => setForm({ ...form, [k]: e.target.value })
  const activeDepts = departments.filter(d => d.active)

  const add = async e => {
    e.preventDefault(); setErr(''); setOk('')
    try {
      await api('/users', { method: 'POST', body: { ...form, departmentId: form.role === 'DEPARTMENT' ? Number(form.departmentId) || null : null } })
      setForm(empty); setOk('User added 🎉'); load()
    } catch (x) { setErr(x.message) }
  }
  const patch = async (u, body) => {
    setErr(''); setOk('')
    try { await api('/users/' + u.id, { method: 'PUT', body }); load() } catch (x) { setErr(x.message) }
  }
  const reset = u => { const p = prompt('New password for ' + u.fullName + ' (min 6 characters):'); if (p) patch(u, { password: p }) }
  const rename = u => { const n = prompt('Full name:', u.fullName); if (n && n.trim() && n !== u.fullName) patch(u, { fullName: n.trim() }) }
  const changeRole = (u, r) => {
    if (r !== 'DEPARTMENT') return patch(u, { role: r })
    const d = activeDepts[0]
    if (!d) return setErr('Add a department first (Departments page).')
    patch(u, { role: r, departmentId: u.departmentId || d.id })
  }

  const f = find.trim().toLowerCase()
  const shown = users.filter(u => (!role || u.role === role) && (!f || u.fullName.toLowerCase().includes(f) || u.username.includes(f)))

  return (
    <>
      <h1>Users</h1><p className="muted">Add staff and choose what each person can do. Department staff only see the issues sent to their own department.</p>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
      <form className="card grid" onSubmit={add}>
        <div><label>Full name</label><input value={form.fullName} onChange={set('fullName')} required /></div>
        <div><label>Username</label><input value={form.username} onChange={set('username')} required minLength={3} autoCapitalize="none" /></div>
        <div><label>Password</label><input type="password" value={form.password} onChange={set('password')} required minLength={6} autoComplete="new-password" /></div>
        <div><label>Role</label><select value={form.role} onChange={set('role')}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        {form.role === 'DEPARTMENT' && (
          <div className="span"><label>Department</label>
            <select value={form.departmentId} onChange={set('departmentId')} required>
              <option value="">Choose the department…</option>
              {activeDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
        )}
        <button className="btn span">➕ Add user</button>
      </form>

      <div className="card list">
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <input style={{ flex: '2 1 200px' }} placeholder="Search by name or username…" value={find} onChange={e => setFind(e.target.value)} />
          <select style={{ flex: '1 1 160px' }} value={role} onChange={e => setRole(e.target.value)}>
            <option value="">All roles</option>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {shown.map(u => (
          <div className={'row' + (u.active ? '' : ' off')} key={u.id} style={{ flexWrap: 'wrap' }}>
            <div className="avatar">{u.fullName[0]}</div>
            <div className="grow" style={{ minWidth: 160 }}><b>{u.fullName}</b><small>@{u.username}{u.departmentName ? ' · ' + u.departmentName : ''}{u.active ? '' : ' · deactivated'}</small></div>
            <select value={u.role} disabled={u.username === me.username} onChange={e => changeRole(u, e.target.value)}>
              {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {u.role === 'DEPARTMENT' && (
              <select value={u.departmentId || ''} onChange={e => patch(u, { departmentId: Number(e.target.value) })}>
                {departments.filter(d => d.active || d.id === u.departmentId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
            <button className="btn ghost" title="Edit name" onClick={() => rename(u)}>✏️</button>
            <button className="btn ghost" title="Reset password" onClick={() => reset(u)}>🔑</button>
            <button className="btn ghost" disabled={u.username === me.username} onClick={() => patch(u, { active: !u.active })}>{u.active ? 'Deactivate' : 'Activate'}</button>
          </div>
        ))}
        {shown.length === 0 && <p className="muted">No users match.</p>}
      </div>
    </>
  )
}
