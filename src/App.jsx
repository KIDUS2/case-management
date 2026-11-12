import { useEffect, useState } from 'react'
import { api } from './api.js'
import Login from './pages/Login.jsx'
import Users from './pages/Users.jsx'

const NAV = [
  { key: 'users', icon: '👥', label: 'Users', admin: true },
  { key: 'queue', icon: '🚪', label: 'Door queue', soon: true },
  { key: 'cases', icon: '📁', label: 'Cases', soon: true },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [page, setPage] = useState('users')

  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true)
    api('/auth/me').then(setUser).catch(() => {}).finally(() => setReady(true))
  }, [])

  const logout = () => { localStorage.removeItem('token'); setUser(null) }
  if (!ready) return <div className="center">Loading…</div>
  if (!user) return <Login onLogin={(t, u) => { localStorage.setItem('token', t); setUser(u) }} />

  return (
    <div className="shell">
      <aside>
        <div className="brand">🕊️ Case Desk</div>
        {NAV.filter(n => !n.admin || user.role === 'ADMIN').map(n => (
          <button key={n.key} disabled={n.soon} className={'nav' + (page === n.key ? ' on' : '')} onClick={() => setPage(n.key)}>
            <span>{n.icon}</span> {n.label} {n.soon && <small>soon</small>}
          </button>
        ))}
        <div className="grow" />
        <div className="me"><b>{user.fullName}</b><small>{user.role}</small></div>
        <button className="nav" onClick={logout}>↩️ Log out</button>
      </aside>
      <main>{page === 'users' && <Users me={user} />}</main>
    </div>
  )
}
