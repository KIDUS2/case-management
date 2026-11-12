import { useState } from 'react'
import { api } from '../api.js'
import Prefs from '../components/Prefs.jsx'

export default function Login({ onLogin }) {
  const [username, setU] = useState('')
  const [password, setP] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { const r = await api('/auth/login', { method: 'POST', body: { username, password } }); onLogin(r.token, r.user) }
    catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div className="center loginhero">
      <div className="loginprefs"><Prefs /></div>
      <form className="card login" onSubmit={submit}>
        <img className="loginlogo" src="/logo.png" alt="Ethiopian Orthodox Tewahedo Church – Addis Ababa Diocese" />
        <p className="amh">የአዲስ አበባ ሀገረ ስብከት</p>
        <h1>Case Desk</h1>
        <p className="muted">Welcome! Please sign in to continue.</p>
        <label>Username</label><input value={username} onChange={e => setU(e.target.value)} autoFocus autoCapitalize="none" />
        <label>Password</label><input type="password" value={password} onChange={e => setP(e.target.value)} />
        {err && <div className="err">{err}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
