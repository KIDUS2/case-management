import { useEffect, useState } from 'react'
import { api } from '../api.js'

export default function Churches() {
  const [list, setList] = useState([])
  const [name, setName] = useState('')
  const [bulk, setBulk] = useState('')
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const load = () => api('/churches').then(setList).catch(e => setErr(e.message))
  useEffect(() => { load() }, [])

  const add = async e => {
    e.preventDefault(); setErr(''); setOk('')
    try { await api('/churches', { method: 'POST', body: { name } }); setName(''); setOk('Church added ⛪'); load() } catch (x) { setErr(x.message) }
  }
  const addBulk = async () => {
    setErr(''); setOk('')
    const names = bulk.split('\n').map(s => s.trim()).filter(Boolean)
    if (!names.length) return
    try {
      const r = await api('/churches/bulk', { method: 'POST', body: { names } })
      setBulk(''); setOk(`Added ${r.added} church${r.added === 1 ? '' : 'es'}${r.skipped ? `, skipped ${r.skipped} that were already there` : ''}.`); load()
    } catch (x) { setErr(x.message) }
  }
  const shown = list.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <h1>Churches</h1><p className="muted">{list.length} church{list.length === 1 ? '' : 'es'} on the list. These appear when registering a case.</p>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
      <div className="cols">
        <div className="card">
          <h2>Add one church</h2>
          <form onSubmit={add}><label>Church name</label><input value={name} onChange={e => setName(e.target.value)} required maxLength={160} /><button className="btn">➕ Add church</button></form>
          <h2 style={{ marginTop: 22 }}>Paste many at once</h2>
          <p className="hint">One church name per line. Names already on the list are skipped.</p>
          <textarea rows={7} value={bulk} onChange={e => setBulk(e.target.value)} placeholder={'Church one\nChurch two\nChurch three'} />
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={addBulk}>📥 Add all</button>
        </div>
        <div className="card">
          <input className="search" style={{ marginBottom: 8 }} placeholder="🔍 Search churches…" value={q} onChange={e => setQ(e.target.value)} />
          <div className="chlist">
            {shown.map(c => <div className="row" key={c.id}><span>⛪</span><div className="grow">{c.name}</div></div>)}
            {!shown.length && <p className="muted">{list.length ? 'No match.' : 'The list is empty. Add the first church.'}</p>}
          </div>
        </div>
      </div>
    </>
  )
}
