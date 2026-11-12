import { useState } from 'react'
import { api } from '../api.js'
import { ROLES } from '../ui.js'

export default function Account({ me }) {
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault(); setErr(''); setOk('')
    if (next !== again) return setErr('The two new passwords do not match.')
    setBusy(true)
    try {
      await api('/auth/password', { method: 'POST', body: { currentPassword: cur, newPassword: next } })
      setOk('Password changed 🎉'); setCur(''); setNext(''); setAgain('')
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  return (
    <>
      <h1>My account</h1><p className="muted">Your sign-in details.</p>
      <div className="formgrid">
        <div className="card">
          <h2>Profile</h2>
          <dl>
            <dt>Name</dt><dd>{me.fullName}</dd>
            <dt>Username</dt><dd>@{me.username}</dd>
            <dt>Role</dt><dd>{ROLES[me.role]}</dd>
            {me.departmentName && <><dt>Department</dt><dd>{me.departmentName}</dd></>}
          </dl>
        </div>
        <form className="card" onSubmit={submit}>
          <h2>Change password</h2>
          {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
          <label>Current password</label><input type="password" value={cur} onChange={e => setCur(e.target.value)} required autoComplete="current-password" />
          <label>New password (at least 6 characters)</label><input type="password" value={next} onChange={e => setNext(e.target.value)} required minLength={6} autoComplete="new-password" />
          <label>New password again</label><input type="password" value={again} onChange={e => setAgain(e.target.value)} required minLength={6} autoComplete="new-password" />
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : '🔑 Change password'}</button>
        </form>
      </div>
    </>
  )
}
