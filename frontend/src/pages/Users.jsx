import { useEffect, useState } from 'react'
import { api } from '../api.js'

const ROLES = { ADMIN: 'Administrator', RECEPTION: 'Reception (door)', OFFICER: 'Case officer' }
const empty = { username: '', fullName: '', password: '', role: 'RECEPTION' }

export default function Users({ me }) {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(empty)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const load = () => api('/users').then(setUsers).catch(e => setErr(e.message))
  useEffect(() => { load() }, [])
  const set = k => e => setForm({ ...form, [k]: e.target.value })

  const add = async e => {
    e.preventDefault(); setErr(''); setOk('')
    try { await api('/users', { method: 'POST', body: form }); setForm(empty); setOk('User added 🎉'); load() }
    catch (x) { setErr(x.message) }
  }
  const patch = async (u, body) => {
    setErr(''); setOk('')
    try { await api('/users/' + u.id, { method: 'PUT', body }); load() } catch (x) { setErr(x.message) }
  }
  const reset = u => { const p = prompt('New password for ' + u.fullName + ' (min 6 characters):'); if (p) patch(u, { password: p }) }

  return (
    <>
      <h1>Users</h1><p className="muted">Add staff and choose what each person can do.</p>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
      <form className="card grid" onSubmit={add}>
        <div><label>Full name</label><input value={form.fullName} onChange={set('fullName')} required /></div>
        <div><label>Username</label><input value={form.username} onChange={set('username')} required minLength={3} /></div>
        <div><label>Password</label><input type="password" value={form.password} onChange={set('password')} required minLength={6} /></div>
        <div><label>Role</label><select value={form.role} onChange={set('role')}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <button className="btn span">➕ Add user</button>
      </form>
      <div className="card list">
        {users.map(u => (
          <div className={'row' + (u.active ? '' : ' off')} key={u.id}>
            <div className="avatar">{u.fullName[0]}</div>
            <div className="grow"><b>{u.fullName}</b><small>@{u.username}</small></div>
            <select value={u.role} disabled={u.username === me.username} onChange={e => patch(u, { role: e.target.value })}>
              {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button className="btn ghost" onClick={() => reset(u)}>🔑</button>
            <button className="btn ghost" disabled={u.username === me.username} onClick={() => patch(u, { active: !u.active })}>{u.active ? 'Deactivate' : 'Activate'}</button>
          </div>
        ))}
      </div>
    </>
  )
}
