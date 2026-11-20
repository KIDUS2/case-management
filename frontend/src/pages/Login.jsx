import { useState } from 'react'
import { api } from '../api.js'
import Prefs from '../components/Prefs.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

export default function Login({ onLogin, onBack, onTrack }) {
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
    <div className="center loginhero split">
      <div className="loginprefs"><Prefs /></div>
      {onBack && <button className="loginback" onClick={onBack}>← Home</button>}
      <div className="lpanel">
        <img src="/logo.png" alt="" />
        <h2>Addis Ababa Diocese</h2>
        <p className="amh">የአዲስ አበባ ሀገረ ስብከት</p>
        <p>Every case from every church, received, followed and closed in one place.</p>
        <div className="ribbon" />
      </div>
      <form className="card login" onSubmit={submit}>
        <img className="loginlogo" src="/logo.png" alt="Ethiopian Orthodox Tewahedo Church – Addis Ababa Diocese" />
        <p className="amh">የአዲስ አበባ ሀገረ ስብከት</p>
        <h1>Case Desk</h1>
        <p className="muted">Welcome! Please sign in to continue.</p>
        <label>Username</label><input value={username} onChange={e => setU(e.target.value)} autoFocus autoCapitalize="none" />
        <label>Password</label><PasswordInput value={password} onChange={e => setP(e.target.value)} />
        {err && <div className="err">{err}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        {onTrack && <button type="button" className="linkbtn" onClick={onTrack}>🔎 Check my case with the number from the text message</button>}
      </form>
    </div>
  )
}
