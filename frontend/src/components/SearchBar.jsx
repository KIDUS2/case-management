import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { STATUS, fmtCode, initial, names } from '../ui.js'

/** One search box for everything: a person's name, a church, or a case code. */
export default function SearchBar({ onOpen, onSeeAll }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState(null) // null = nothing searched yet
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [sel, setSel] = useState(0)
  const box = useRef(null)
  const input = useRef(null)
  const seq = useRef(0)

  // search as the person types, but wait a moment so we do not ask the server for every key
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setHits(null); setBusy(false); setErr(''); return }
    setBusy(true)
    const mine = ++seq.current
    const t = setTimeout(() => {
      api('/cases?size=6&q=' + encodeURIComponent(term))
        .then(r => { if (mine === seq.current) { setHits(r.items); setTotal(r.total); setErr(''); setSel(0) } })
        .catch(e => { if (mine === seq.current) setErr(e.message) })
        .finally(() => { if (mine === seq.current) setBusy(false) })
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    const down = e => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    const key = e => {
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) { e.preventDefault(); input.current?.focus() }
    }
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [])

  const pick = c => { setOpen(false); setQ(''); setHits(null); input.current?.blur(); onOpen(c.id) }
  const seeAll = () => { setOpen(false); onSeeAll(q.trim()); setQ(''); setHits(null) }

  const onKey = e => {
    if (e.key === 'Escape') { setOpen(false); input.current?.blur() }
    else if (e.key === 'ArrowDown' && hits?.length) { e.preventDefault(); setSel(s => Math.min(s + 1, hits.length - 1)) }
    else if (e.key === 'ArrowUp' && hits?.length) { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (hits?.length) pick(hits[sel] || hits[0])
      else if (q.trim()) seeAll()
    }
  }

  const showPanel = open && q.trim().length >= 1
  return (
    <div className="gsearch" ref={box} role="search">
      <span className="gicon">🔍</span>
      <input ref={input} value={q} placeholder="Search a name, church or case code…" aria-label="Search cases"
        onChange={e => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={onKey} autoComplete="off" />
      {q ? <button type="button" className="gclear" aria-label="Clear search" onClick={() => { setQ(''); setHits(null); input.current?.focus() }}>×</button> : <kbd>/</kbd>}
      {showPanel && (
        <div className="gpanel">
          {q.trim().length < 2 && <div className="gmsg">Keep typing…</div>}
          {err && <div className="gmsg warn">{err}</div>}
          {q.trim().length >= 2 && !err && busy && !hits && <div className="gmsg">Searching…</div>}
          {q.trim().length >= 2 && !err && hits && hits.length === 0 && !busy && <div className="gmsg">No case found for “{q.trim()}”. Check the spelling or the code.</div>}
          {hits && hits.length > 0 && hits.map((c, i) => (
            <button key={c.id} className={'ghit' + (i === sel ? ' on' : '')} onMouseEnter={() => setSel(i)} onClick={() => pick(c)}>
              <span className="avatar sm">{initial(c.complainants[0])}</span>
              <span className="grow">
                <b>{names(c.complainants)}</b>
                <small>⛪ {c.churchName}{c.subjects.length ? ' · about ' + names(c.subjects) : ''}</small>
              </span>
              <span style={{ textAlign: 'right' }}>
                <span className="codechip">{fmtCode(c.code)}</span>
                <small><span className={'badge ' + STATUS[c.status].cls}>{STATUS[c.status].label}</span></small>
              </span>
            </button>
          ))}
          {hits && total > hits.length && <button className="gfoot" onClick={seeAll}>See all {total} results →</button>}
        </div>
      )}
    </div>
  )
}
