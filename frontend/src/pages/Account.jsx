import { useState } from 'react'
import { api } from '../api.js'
import { ROLES, initial } from '../ui.js'

export default function Account({ me, onUser }) {
  const [p, setP] = useState({ fullName: me.fullName || '', phone: me.phone || '', email: me.email || '', jobTitle: me.jobTitle || '' })
  const [pErr, setPErr] = useState('')
  const [pOk, setPOk] = useState('')
  const [pBusy, setPBusy] = useState(false)
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => setP({ ...p, [k]: e.target.value })

  const saveProfile = async e => {
    e.preventDefault(); setPErr(''); setPOk(''); setPBusy(true)
    try { onUser(await api('/auth/profile', { method: 'PUT', body: p })); setPOk('Profile saved 🎉') } catch (x) { setPErr(x.message) } finally { setPBusy(false) }
  }
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
      <h1>My account</h1><p className="muted">Your details and sign-in.</p>
      <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="avatar big" style={{ background: 'var(--solid)' }}>{initial(me.fullName)}</div>
        <div><b style={{ fontSize: '1.2rem' }}>{me.fullName}</b><small>@{me.username} · {ROLES[me.role]}{me.departmentName ? ' · ' + me.departmentName : ''}</small>
          {me.jobTitle && <small>{me.jobTitle}</small>}</div>
      </div>
      <div className="formgrid">
        <form className="card" onSubmit={saveProfile}>
          <h2>Profile</h2>
          {pErr && <div className="err">{pErr}</div>}{pOk && <div className="okmsg">{pOk}</div>}
          <label>Full name</label><input value={p.fullName} onChange={set('fullName')} required maxLength={120} />
          <label>Job title</label><input value={p.jobTitle} onChange={set('jobTitle')} maxLength={120} placeholder="e.g. Finance officer" />
          <label>Phone</label><input value={p.phone} onChange={set('phone')} inputMode="tel" maxLength={40} />
          <label>Email</label><input type="email" value={p.email} onChange={set('email')} maxLength={120} />
          <small style={{ marginTop: 10 }}>Your username, role and department are set by the administrator.</small>
          <button className="btn" disabled={pBusy}>{pBusy ? 'Saving…' : '💾 Save profile'}</button>
        </form>
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
