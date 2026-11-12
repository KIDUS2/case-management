import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { NOTE_ICON, ago } from '../ui.js'

/** The bell in the top bar. Count comes from App (it polls); this loads the list when opened. */
export default function Bell({ unread, ring, onOpenCase, onSeeAll, onChanged }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(null)
  const wrap = useRef(null)

  const load = () => api('/notifications?size=8').then(r => setItems(r.items)).catch(() => setItems([]))
  useEffect(() => { if (open) load() }, [open, unread])
  useEffect(() => {
    const down = e => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', down)
    return () => document.removeEventListener('mousedown', down)
  }, [])

  const click = async n => {
    if (!n.read) { await api(`/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {}); onChanged() }
    setOpen(false)
    if (n.caseId) onOpenCase(n.caseId)
  }
  const readAll = async () => { await api('/notifications/read-all', { method: 'POST' }).catch(() => {}); onChanged(); load() }

  return (
    <div className="bellwrap" ref={wrap}>
      <button className={'bellbtn' + (ring ? ' ring' : '')} onClick={() => setOpen(o => !o)} aria-label={`Notifications, ${unread} unread`}>
        🔔{unread > 0 && <span className="dot">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="bpanel">
          <div className="bhead"><b>Notifications</b>{unread > 0 && <button className="linkbtn" onClick={readAll}>Mark all read</button>}</div>
          <div className="blist">
            {items === null && <div className="gmsg">Loading…</div>}
            {items && items.length === 0 && <div className="gmsg">You are all caught up. 🎉</div>}
            {items && items.map(n => (
              <button key={n.id} className={'nitem' + (n.read ? '' : ' unread')} onClick={() => click(n)}>
                <span className="nicon">{NOTE_ICON[n.type] || '🔔'}</span>
                <span className="grow"><b>{n.title}</b>{n.body && <span className="nbody">{n.body}</span>}<small>{ago(n.createdAt)}</small></span>
                {!n.read && <span className="udot" />}
              </button>
            ))}
          </div>
          <button className="gfoot" onClick={() => { setOpen(false); onSeeAll() }}>See all notifications →</button>
        </div>
      )}
    </div>
  )
}
