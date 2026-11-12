import { useEffect, useState } from 'react'
import { api } from './api.js'
import Login from './pages/Login.jsx'
import Users from './pages/Users.jsx'
import Cases from './pages/Cases.jsx'
import NewCase from './pages/NewCase.jsx'
import Churches from './pages/Churches.jsx'
import Dashboard from './pages/Dashboard.jsx'

function CodeLookup({ onFound }) {
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const go = async e => {
    e.preventDefault(); setMsg('')
    if (!code.trim()) return
    try { const c = await api('/cases/code/' + encodeURIComponent(code.trim())); setCode(''); onFound(c.id) }
    catch (x) { setMsg(x.message) }
  }
  return (
    <form className="lookup" onSubmit={go}>
      <label>Open a case by code</label>
      <div className="lrow"><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. K7M-2QX" maxLength={12} /><button className="btn">Go</button></div>
      {msg && <small className="warn">{msg}</small>}
    </form>
  )
}

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard', admin: true },
  { key: 'cases', icon: '📁', label: 'Cases' },
  { key: 'new', icon: '➕', label: 'Register case' },
  { key: 'churches', icon: '⛪', label: 'Churches', admin: true },
  { key: 'users', icon: '👥', label: 'Users', admin: true },
  { key: 'queue', icon: '🚪', label: 'Door queue', soon: true },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [page, setPage] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [fresh, setFresh] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true)
    api('/auth/me').then(setUser).catch(() => {}).finally(() => setReady(true))
  }, [])

  const logout = () => { localStorage.removeItem('token'); setUser(null); setPage(null); setOpenId(null); setFresh(false) }
  const go = key => { setOpenId(null); setFresh(false); setPage(key) }
  const openCase = (id, isNew = false) => { setOpenId(id); setFresh(isNew); setPage('cases') }

  const current = page ?? (user?.role === 'ADMIN' ? 'dashboard' : 'cases')

  if (!ready) return <div className="center">Loading…</div>
  if (!user) return <Login onLogin={(t, u) => { localStorage.setItem('token', t); setUser(u) }} />

  return (
    <div className="shell">
      <aside>
        <div className="brand">🕊️ Case Desk</div>
        <CodeLookup onFound={id => openCase(id)} />
        {NAV.filter(n => !n.admin || user.role === 'ADMIN').map(n => (
          <button key={n.key} disabled={n.soon} className={'nav' + (current === n.key ? ' on' : '')} onClick={() => go(n.key)}>
            <span>{n.icon}</span> {n.label} {n.soon && <small>soon</small>}
          </button>
        ))}
        <div className="grow" />
        <div className="me"><b>{user.fullName}</b><small>{user.role}</small></div>
        <button className="nav" onClick={logout}>↩️ Log out</button>
      </aside>
      <main>
        {current === 'dashboard' && <Dashboard me={user} onOpen={openCase} goNew={() => go('new')} />}
        {current === 'cases' && <Cases openId={openId} setOpenId={id => { setOpenId(id); setFresh(false) }} goNew={() => go('new')} fresh={fresh} />}
        {current === 'new' && <NewCase me={user} onCreated={id => openCase(id, true)} goChurches={() => go('churches')} />}
        {current === 'churches' && <Churches />}
        {current === 'users' && <Users me={user} />}
      </main>
    </div>
  )
}
