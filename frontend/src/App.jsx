import { useEffect, useState } from 'react'
import { api } from './api.js'
import Login from './pages/Login.jsx'
import Users from './pages/Users.jsx'
import Cases from './pages/Cases.jsx'
import NewCase from './pages/NewCase.jsx'
import Churches from './pages/Churches.jsx'
import Dashboard from './pages/Dashboard.jsx'

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

  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true)
    api('/auth/me').then(setUser).catch(() => {}).finally(() => setReady(true))
  }, [])

  const logout = () => { localStorage.removeItem('token'); setUser(null); setPage(null); setOpenId(null) }
  const go = key => { setOpenId(null); setPage(key) }
  const openCase = id => { setOpenId(id); setPage('cases') }

  const current = page ?? (user?.role === 'ADMIN' ? 'dashboard' : 'cases')

  if (!ready) return <div className="center">Loading…</div>
  if (!user) return <Login onLogin={(t, u) => { localStorage.setItem('token', t); setUser(u) }} />

  return (
    <div className="shell">
      <aside>
        <div className="brand">🕊️ Case Desk</div>
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
        {current === 'cases' && <Cases openId={openId} setOpenId={setOpenId} goNew={() => go('new')} />}
        {current === 'new' && <NewCase me={user} onCreated={openCase} goChurches={() => go('churches')} />}
        {current === 'churches' && <Churches />}
        {current === 'users' && <Users me={user} />}
      </main>
    </div>
  )
}
