import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { t } from '../i18n.js'
import { readSheetFile, downloadCsv, SHEET_ACCEPT } from '../sheet.js'

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
  const pickFile = async ev => {
    const file = ev.target.files[0]; ev.target.value = ''
    if (!file) return
    setErr(''); setOk('')
    try {
      const grid = await readSheetFile(file)
      // use the column called name / church if there is one, otherwise the first column
      const head = (grid[0] || []).map(h => h.toLowerCase().replace(/[\s_-]/g, ''))
      let col = head.findIndex(h => ['name', 'church', 'churchname', 'ስም', 'ቤተክርስቲያን'].includes(h))
      const hasHeader = col >= 0 || /^(name|church|ስም)/i.test(grid[0]?.[0] || '')
      if (col < 0) col = 0
      const names = grid.slice(hasHeader ? 1 : 0).map(r => (r[col] || '').trim()).filter(Boolean)
      if (!names.length) return setErr(t('No church names found in this file.'))
      let added = 0, skipped = 0
      for (let i = 0; i < names.length; i += 1000) {
        const r = await api('/churches/bulk', { method: 'POST', body: { names: names.slice(i, i + 1000) } })
        added += r.added; skipped += r.skipped
      }
      setOk(`Added ${added} church${added === 1 ? '' : 'es'}${skipped ? `, skipped ${skipped} that were already there` : ''}.`); load()
    } catch (x) { setErr(x.message) }
  }
  const shown = list.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <h1>Churches</h1><p className="muted">{t('{n} churches on the list. These appear when registering a case.', { n: list.length })}</p>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
      <div className="cols">
        <div className="card">
          <h2>Add one church</h2>
          <form onSubmit={add}><label>Church name</label><input value={name} onChange={e => setName(e.target.value)} required maxLength={160} /><button className="btn">➕ Add church</button></form>
          <h2 style={{ marginTop: 22 }}>Import from a file</h2>
          <p className="hint">{t('Upload an Excel (.xlsx) or CSV file with one church per row. Use a column called “name”, or put the names in the first column. Names already on the list are skipped.')}</p>
          <div className="filepick">
            <label className="drop">📂 {t('Choose an Excel (.xlsx) or CSV file')}<input type="file" accept={SHEET_ACCEPT} onChange={pickFile} /></label>
            <button type="button" className="btn ghost sm" style={{ margin: 0 }} onClick={() => downloadCsv('churches-template.csv', ['name'], ['Kidist Selassie Church'])}>⬇ {t('Download the template')}</button>
          </div>
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
