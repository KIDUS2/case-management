import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api.js'
import { ROLES, NOTE_ICON, applyOptions } from './ui.js'
import Login from './pages/Login.jsx'
import Landing from './components/Landing.jsx'
import Summary from './pages/Summary.jsx'
import Users from './pages/Users.jsx'
import Cases from './pages/Cases.jsx'
import NewCase from './pages/NewCase.jsx'
import Churches from './pages/Churches.jsx'
import Hr from './pages/Hr.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Queue from './pages/Queue.jsx'
import Inbox from './pages/Inbox.jsx'
import Departments from './pages/Departments.jsx'
import Settings from './pages/Settings.jsx'
import Notifications from './pages/Notifications.jsx'
import Account from './pages/Account.jsx'
import SearchBar from './components/SearchBar.jsx'
import Bell from './components/Bell.jsx'
import Prefs from './components/Prefs.jsx'
import { notify } from './dialog.js'
import { t } from './i18n.js'

const DESK = ['ADMIN', 'OFFICER', 'RECEPTION']
/** Which pages each role sees. */
const NAV = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard', roles: ['ADMIN'] },
  { key: 'summary', icon: '🗂️', label: 'Summary', roles: ['ADMIN', 'OFFICER', 'RECEPTION', 'DEPARTMENT'] },
  { key: 'inbox', icon: '📥', label: 'Department inbox', roles: ['DEPARTMENT', 'ADMIN', 'OFFICER'] },
  { key: 'queue', icon: '🚪', label: 'Door queue', roles: DESK },
  { key: 'new', icon: '➕', label: 'Register case', roles: DESK },
  { key: 'cases', icon: '📁', label: 'All cases', roles: ['ADMIN', 'OFFICER', 'RECEPTION', 'DEPARTMENT'] },
  { key: 'notifications', icon: '🔔', label: 'Notifications', roles: ['ADMIN', 'OFFICER', 'RECEPTION', 'DEPARTMENT'], badge: true },
  { key: 'hr', icon: '👥', label: 'HR management', roles: ['ADMIN', 'OFFICER', 'RECEPTION'] },
  { key: 'churches', icon: '⛪', label: 'Churches', roles: ['ADMIN', 'OFFICER', 'RECEPTION'] },
  { key: 'departments', icon: '🏢', label: 'Departments', roles: ['ADMIN'] },
  { key: 'users', icon: '👥', label: 'Users', roles: ['ADMIN'] },
  { key: 'settings', icon: '🛠️', label: 'Settings', roles: ['ADMIN'] },
  { key: 'account', icon: '⚙️', label: 'My account', roles: ['ADMIN', 'OFFICER', 'RECEPTION', 'DEPARTMENT'] },
]
/** Switching language reloads the page; remember where the person was so they come back to the same place. */
const readView = () => { try { const v = JSON.parse(sessionStorage.getItem('view') || 'null'); if (v && (v.page === 'employees' || v.page === 'workforce')) v.page = 'hr'; return v } catch { return null } }
const saveView = v => { try { v ? sessionStorage.setItem('view', JSON.stringify(v)) : sessionStorage.removeItem('view') } catch { /* private mode */ } }
const HOME = { ADMIN: 'dashboard', DEPARTMENT: 'inbox', RECEPTION: 'queue', OFFICER: 'cases' }

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [page, setPage] = useState(() => (new URLSearchParams(location.search).get('emp') ? 'hr' : localStorage.getItem('token') ? readView()?.page || null : null))
  const [openId, setOpenId] = useState(() => (localStorage.getItem('token') ? readView()?.openId || null : null))
  const [optsReady, setOptsReady] = useState(false)
  const [fresh, setFresh] = useState(null)
  const [query, setQuery] = useState('')
  const [unread, setUnread] = useState(0)
  const [ring, setRing] = useState(false)
  const [toast, setToast] = useState(null)
  const lastUnread = useRef(0)
  const [signIn, setSignIn] = useState(() => !!new URLSearchParams(location.search).get('emp'))
  const [focusEmp, setFocusEmp] = useState(() => new URLSearchParams(location.search).get('emp'))

  useEffect(() => { if (user) saveView({ page, openId }) }, [user, page, openId])

  // the dropdown lists (issue types, kefle ketema) come from Settings
  useEffect(() => {
    if (!user) { setOptsReady(false); return }
    api('/options').then(applyOptions).catch(() => {}).finally(() => setOptsReady(true))
  }, [user])

  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true)
    api('/auth/me').then(setUser).catch(() => {}).finally(() => setReady(true))
  }, [])

  const refreshUnread = useCallback(async () => {
    try {
      const { count } = await api('/notifications/unread-count')
      if (count > lastUnread.current) {
        // something new arrived: pop a short message and ring the bell
        const r = await api('/notifications?unread=true&size=1').catch(() => null)
        if (r?.items?.[0]) { setToast(r.items[0]); setRing(true); setTimeout(() => setRing(false), 1200) }
      }
      lastUnread.current = count
      setUnread(count)
    } catch { /* a missed poll is fine, the next one will catch up */ }
  }, [])

  // check for news every 25 seconds while the tab is visible
  useEffect(() => {
    if (!user) return
    refreshUnread()
    const t = setInterval(() => { if (!document.hidden) refreshUnread() }, 25000)
    const vis = () => { if (!document.hidden) refreshUnread() }
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis) }
  }, [user, refreshUnread])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 8000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    const h = () => { saveView(null); setUser(null); setPage(null); setOpenId(null); setFresh(null); lastUnread.current = 0; setUnread(0); notify(t('Your session has ended. Please sign in again.'), 'info') }
    window.addEventListener('session-expired', h)
    return () => window.removeEventListener('session-expired', h)
  }, [])

  const logout = () => { saveView(null); localStorage.removeItem('token'); setUser(null); setPage(null); setOpenId(null); setFresh(null); lastUnread.current = 0; setUnread(0) }
  const go = key => { setOpenId(null); setFresh(null); setQuery(''); setPage(key) }
  const openCase = (id, isNew = false, failed = []) => { setOpenId(id); setFresh(isNew ? { failed } : null); setPage('cases') }
  const seeAll = q => { setOpenId(null); setFresh(null); setQuery(q); setPage('cases') }

  if (!ready || (user && !optsReady)) return <div className="center">Loading…</div>
  if (!user) return signIn
    ? <Login onBack={() => setSignIn(false)} onLogin={(t, u) => { localStorage.setItem('token', t); setUser(u) }} />
    : <Landing onLogin={() => setSignIn(true)} />

  const items = NAV.filter(n => n.roles.includes(user.role))
  const current = items.some(n => n.key === page) ? page : HOME[user.role]

  return (
    <div className="shell">
      <aside>
        <div className="topline">
          <div className="brand"><img src="/logo.png" alt="Ethiopian Orthodox Tewahedo Church" /><div className="bt">{t("Case Desk")}<small>{t("Addis Ababa Diocese")}</small></div></div>
          <div className="aside-foot">
            <div className="me"><b>{user.fullName}</b><small>{ROLES[user.role]}{user.departmentName ? ' · ' + user.departmentName : ''}</small></div>
            <button className="nav" onClick={logout}>↩️ Log out</button>
          </div>
        </div>
        <nav className="navlist">
          {items.map(n => (
            <button key={n.key} className={'nav' + (current === n.key ? ' on' : '')} onClick={() => go(n.key)}>
              <span>{n.icon}</span> {n.label}
              {n.badge && unread > 0 && <span className="nbadge">{unread > 99 ? '99+' : unread}</span>}
            </button>
          ))}
        </nav>
      </aside>
      <main>
        <div className="topbar">
          <SearchBar onOpen={id => openCase(id)} onSeeAll={seeAll} />
          <div className="tbspace">
            <Prefs />
            <Bell unread={unread} ring={ring} onOpenCase={id => openCase(id)} onSeeAll={() => go('notifications')} onChanged={refreshUnread} />
          </div>
        </div>
        {current === 'dashboard' && <Dashboard me={user} onOpen={openCase} goNew={() => go('new')} go={go} />}
        {current === 'inbox' && <Inbox me={user} onOpen={openCase} />}
        {current === 'queue' && <Queue onOpen={openCase} goNew={() => go('new')} />}
        {current === 'cases' && <Cases me={user} openId={openId} setOpenId={id => { setOpenId(id); setFresh(null) }} goNew={() => go('new')} fresh={fresh} initialQuery={query} />}
        {current === 'new' && <NewCase me={user} onCreated={(id, failed) => openCase(id, true, failed)} goChurches={() => go('churches')} />}
        {current === 'summary' && <Summary me={user} onOpen={id => openCase(id)} />}
        {current === 'notifications' && <Notifications onOpen={id => openCase(id)} onChanged={refreshUnread} />}
        {current === 'churches' && <Churches me={user} />}
        {current === 'hr' && <Hr me={user} focus={focusEmp} onFocusDone={() => { setFocusEmp(null); history.replaceState(null, '', location.pathname) }} onSeeCases={seeAll} onOpenCase={id => openCase(id)} />}
        {current === 'departments' && <Departments />}
        {current === 'settings' && <Settings />}
        {current === 'users' && <Users me={user} />}
        {current === 'account' && <Account me={user} onUser={setUser} />}
      </main>
      {toast && (
        <div className="toast" role="status" onClick={() => { setToast(null); if (toast.caseId) openCase(toast.caseId) }}>
          <span className="nicon">{NOTE_ICON[toast.type] || '🔔'}</span>
          <span><b>{toast.title}</b><small>{toast.body}</small></span>
        </div>
      )}
    </div>
  )
}
