import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { t } from '../i18n.js'
import { readSheetFile, gridFromText, downloadCsv, SHEET_ACCEPT } from '../sheet.js'
import { SUB_CITIES } from '../ui.js'

const NAME_COLS = ['name', 'church', 'churchname', 'ስም', 'ቤተክርስቲያን']
const SUB_COLS = ['subcity', 'kefleketema', 'kefle', 'kefletema', 'ክፍለከተማ', 'ክፍለከተማ']
const norm = h => (h || '').toLowerCase().replace(/[\s_\-.]/g, '')

/** Turns rows (first row may be column names) into { name, subCity } items. */
function toItems(grid) {
  if (!grid.length) return []
  const head = grid[0].map(norm)
  let nameCol = head.findIndex(h => NAME_COLS.includes(h))
  let subCol = head.findIndex(h => SUB_COLS.includes(h))
  const hasHeader = nameCol >= 0 || subCol >= 0
  if (nameCol < 0) nameCol = 0
  if (subCol < 0 && grid[0].length > 1 && !hasHeader) subCol = 1
  return grid.slice(hasHeader ? 1 : 0).map(r => ({ name: (r[nameCol] || '').trim(), subCity: subCol >= 0 ? (r[subCol] || '').trim() : '' })).filter(x => x.name)
}

export default function Churches() {
  const [list, setList] = useState([])
  const [name, setName] = useState('')
  const [sub, setSub] = useState('')
  const [bulk, setBulk] = useState('')
  const [q, setQ] = useState('')
  const [subFilter, setSubFilter] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const load = () => api('/churches').then(setList).catch(e => setErr(e.message))
  useEffect(() => { load() }, [])

  const say = r => setOk(`Added ${r.added} church${r.added === 1 ? '' : 'es'}${r.updated ? `, filled in the kefle ketema of ${r.updated}` : ''}${r.skipped ? `, skipped ${r.skipped} that were already there` : ''}.`)
  const send = async items => {
    const total = { added: 0, skipped: 0, updated: 0 }
    for (let i = 0; i < items.length; i += 1000) {
      const r = await api('/churches/bulk', { method: 'POST', body: { items: items.slice(i, i + 1000) } })
      total.added += r.added; total.skipped += r.skipped; total.updated += r.updated
    }
    say(total); load()
  }

  const add = async e => {
    e.preventDefault(); setErr(''); setOk('')
    try { await api('/churches', { method: 'POST', body: { name, subCity: sub || null } }); setName(''); setOk('Church added ⛪'); load() } catch (x) { setErr(x.message) }
  }
  const addBulk = async () => {
    setErr(''); setOk('')
    const items = toItems(gridFromText(bulk))
    if (!items.length) return
    try { await send(items); setBulk('') } catch (x) { setErr(x.message) }
  }
  const pickFile = async ev => {
    const file = ev.target.files[0]; ev.target.value = ''
    if (!file) return
    setErr(''); setOk('')
    try {
      const items = toItems(await readSheetFile(file))
      if (!items.length) return setErr(t('No church names found in this file.'))
      await send(items)
    } catch (x) { setErr(x.message) }
  }
  const setSubCity = async (c, subCity) => {
    setErr('')
    try { await api('/churches/' + c.id, { method: 'PUT', body: { subCity: subCity || null } }); setList(l => l.map(x => x.id === c.id ? { ...x, subCity: subCity || null } : x)) } catch (x) { setErr(x.message) }
  }

  const counts = {}
  list.forEach(c => { const k = c.subCity || ''; counts[k] = (counts[k] || 0) + 1 })
  const shown = list.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) && (subFilter === '' || (subFilter === '-' ? !c.subCity : c.subCity === subFilter)))
  const known = [...new Set([...SUB_CITIES, ...list.map(c => c.subCity).filter(Boolean)])]

  return (
    <>
      <h1>Churches</h1><p className="muted">{t('{n} churches on the list. These appear when registering a case.', { n: list.length })}</p>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
      <div className="cols">
        <div className="card">
          <h2>Add one church</h2>
          <form onSubmit={add}>
            <label>Church name</label><input value={name} onChange={e => setName(e.target.value)} required maxLength={160} />
            <label>{t('Kefle ketema (sub-city)')}</label>
            <select value={sub} onChange={e => setSub(e.target.value)}><option value="">{t('Not set')}</option>{known.map(k => <option key={k}>{k}</option>)}</select>
            <button className="btn">➕ Add church</button>
          </form>
          <h2 style={{ marginTop: 22 }}>Import from a file</h2>
          <p className="hint">{t('Upload an Excel (.xlsx) or CSV file with one church per row. Use a column called “name” and a column called “subcity” (kefle ketema), or put the names in the first column. Churches already on the list are skipped, but get their kefle ketema filled in if it was empty.')}</p>
          <div className="filepick">
            <label className="drop">📂 {t('Choose an Excel (.xlsx) or CSV file')}<input type="file" accept={SHEET_ACCEPT} onChange={pickFile} /></label>
            <button type="button" className="btn ghost sm" style={{ margin: 0 }} onClick={() => downloadCsv('churches-template.csv', ['name', 'subcity'], [['Kidist Selassie Church', 'Bole'], ['Medhane Alem Church', 'Arada']])}>⬇ {t('Download the template')}</button>
          </div>
          <h2 style={{ marginTop: 22 }}>Paste many at once</h2>
          <p className="hint">{t('One church per line. After the name you can add the kefle ketema, separated by a comma or a tab.')}</p>
          <textarea rows={7} value={bulk} onChange={e => setBulk(e.target.value)} placeholder={'Church one, Bole\nChurch two, Arada\nChurch three'} />
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={addBulk}>📥 Add all</button>
        </div>
        <div className="card">
          <input className="search" style={{ marginBottom: 8 }} placeholder="🔍 Search churches…" value={q} onChange={e => setQ(e.target.value)} />
          <div className="chips" style={{ marginBottom: 10 }}>
            <button type="button" className={'chip' + (subFilter === '' ? ' on' : '')} onClick={() => setSubFilter('')}>{t('All')} {list.length}</button>
            {known.filter(k => counts[k]).map(k => <button type="button" key={k} className={'chip' + (subFilter === k ? ' on' : '')} onClick={() => setSubFilter(k)}>{k} {counts[k]}</button>)}
            {counts[''] > 0 && <button type="button" className={'chip' + (subFilter === '-' ? ' on' : '')} onClick={() => setSubFilter('-')}>{t('Not set')} {counts['']}</button>}
          </div>
          <div className="chlist">
            {shown.map(c => (
              <div className="row" key={c.id}><span>⛪</span><div className="grow">{c.name}</div>
                <select className="subsel" aria-label={t('Kefle ketema (sub-city)')} value={c.subCity || ''} onChange={e => setSubCity(c, e.target.value)}>
                  <option value="">{t('Not set')}</option>{known.map(k => <option key={k}>{k}</option>)}
                </select></div>))}
            {!shown.length && <p className="muted">{list.length ? 'No match.' : 'The list is empty. Add the first church.'}</p>}
          </div>
        </div>
      </div>
    </>
  )
}
