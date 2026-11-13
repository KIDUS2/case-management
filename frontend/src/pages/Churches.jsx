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

const PAGE = 25

export default function Churches() {
  const [list, setList] = useState([])
  const [name, setName] = useState('')
  const [sub, setSub] = useState('')
  const [bulk, setBulk] = useState('')
  const [q, setQ] = useState('')
  const [subFilter, setSubFilter] = useState('')
  const [page, setPage] = useState(0)
  const [panel, setPanel] = useState(null) // null | 'one' | 'file' | 'paste'
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const load = () => api('/churches').then(setList).catch(e => setErr(e.message))
  useEffect(() => { load() }, [])

  const say = r => setOk(t('Added {a}, filled in the sub-city of {b}, skipped {c} that were already there.', { a: r.added, b: r.updated, c: r.skipped }))
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
    try { await api('/churches', { method: 'POST', body: { name, subCity: sub || null } }); setName(''); setOk(t('Church added ⛪')); load() } catch (x) { setErr(x.message) }
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
  const known = [...new Set([...SUB_CITIES, ...list.map(c => c.subCity).filter(Boolean)])]
  const inUse = known.filter(k => counts[k]).length
  const missing = counts[''] || 0
  const shown = list.filter(c => c.name.toLowerCase().includes(q.trim().toLowerCase()) && (subFilter === '' || (subFilter === '-' ? !c.subCity : c.subCity === subFilter)))
  const pages = Math.max(1, Math.ceil(shown.length / PAGE))
  const cur = Math.min(page, pages - 1)
  const rows = shown.slice(cur * PAGE, cur * PAGE + PAGE)
  const toggle = p => setPanel(x => (x === p ? null : p))

  return (
    <>
      <div className="chx-head">
        <div><h1>{t('Churches')}</h1><p className="muted">{t('These appear when registering a case.')}</p></div>
        <div className="chx-actions">
          <button className={'btn ghost' + (panel === 'file' || panel === 'paste' ? ' on' : '')} onClick={() => toggle('file')}>📥 {t('Import')}</button>
          <button className="btn" style={{ margin: 0 }} onClick={() => toggle('one')}>➕ {t('Add church')}</button>
        </div>
      </div>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}

      <div className="chx-stats">
        <button type="button" className="chx-stat" onClick={() => { setSubFilter(''); setPage(0) }}><b>{list.length}</b><span>{t('Churches')}</span></button>
        <div className="chx-stat"><b>{inUse}</b><span>{t('Sub-cities in use')}</span></div>
        <button type="button" className={'chx-stat' + (missing ? ' alert' : '')} onClick={() => { setSubFilter('-'); setPage(0) }}><b>{missing}</b><span>{t('Without a sub-city')}</span></button>
      </div>

      {panel && (
        <div className="card chx-panel">
          <div className="chx-tabs" role="tablist">
            <button role="tab" className={panel === 'one' ? 'on' : ''} onClick={() => setPanel('one')}>{t('One church')}</button>
            <button role="tab" className={panel === 'file' ? 'on' : ''} onClick={() => setPanel('file')}>{t('From a file')}</button>
            <button role="tab" className={panel === 'paste' ? 'on' : ''} onClick={() => setPanel('paste')}>{t('Paste a list')}</button>
            <button className="chx-close" onClick={() => setPanel(null)} aria-label={t('Close')}>✕</button>
          </div>
          {panel === 'one' && (
            <form className="chx-form" onSubmit={add}>
              <div><label>{t('Church name')}</label><input value={name} onChange={e => setName(e.target.value)} required maxLength={160} autoFocus /></div>
              <div><label>{t('Sub-city')}</label>
                <select value={sub} onChange={e => setSub(e.target.value)}><option value="">{t('Not set')}</option>{known.map(k => <option key={k}>{k}</option>)}</select></div>
              <button className="btn" style={{ margin: 0 }}>{t('Save church')}</button>
            </form>
          )}
          {panel === 'file' && (
            <>
              <p className="hint">{t('Upload an Excel (.xlsx) or CSV file with one church per row. Use a column called “name” and a column called “subcity” (sub-city), or put the names in the first column. Churches already on the list are skipped, but get their sub-city filled in if it was empty.')}</p>
              <div className="filepick">
                <label className="drop">📂 {t('Choose an Excel (.xlsx) or CSV file')}<input type="file" accept={SHEET_ACCEPT} onChange={pickFile} /></label>
                <button type="button" className="btn ghost sm" onClick={() => downloadCsv('churches-template.csv', ['name', 'subcity'], [['Kidist Selassie Church', 'Bole'], ['Medhane Alem Church', 'Arada']])}>⬇ {t('Download the template')}</button>
              </div>
            </>
          )}
          {panel === 'paste' && (
            <>
              <p className="hint">{t('One church per line. After the name you can add the sub-city, separated by a comma or a tab.')}</p>
              <textarea rows={7} value={bulk} onChange={e => setBulk(e.target.value)} placeholder={'Church one, Bole\nChurch two, Arada\nChurch three'} />
              <button className="btn" style={{ marginTop: 10 }} onClick={addBulk} disabled={!bulk.trim()}>{t('Add all')}</button>
            </>
          )}
        </div>
      )}

      <div className="card chx-list">
        <div className="chx-bar">
          <input className="chx-search" type="search" placeholder={t('Search churches…')} value={q} onChange={e => { setQ(e.target.value); setPage(0) }} />
          <select className="chx-filter" value={subFilter} onChange={e => { setSubFilter(e.target.value); setPage(0) }} aria-label={t('Sub-city')}>
            <option value="">{t('All sub-cities')} ({list.length})</option>
            {known.filter(k => counts[k]).map(k => <option key={k} value={k}>{k} ({counts[k]})</option>)}
            {missing > 0 && <option value="-">{t('Not set')} ({missing})</option>}
          </select>
        </div>
        <table className="chx-table">
          <thead><tr><th className="n">#</th><th>{t('Church')}</th><th>{t('Sub-city')}</th></tr></thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={c.id}>
                <td className="n">{cur * PAGE + i + 1}</td>
                <td><span className="chx-name">⛪ {c.name}</span></td>
                <td><select className={'chx-sub' + (c.subCity ? '' : ' none')} aria-label={t('Sub-city')} value={c.subCity || ''} onChange={e => setSubCity(c, e.target.value)}>
                  <option value="">{t('Not set')}</option>{known.map(k => <option key={k}>{k}</option>)}</select></td>
              </tr>))}
          </tbody>
        </table>
        {!rows.length && <p className="muted" style={{ textAlign: 'center', padding: 18 }}>{list.length ? t('No match.') : t('The list is empty. Add the first church.')}</p>}
        {pages > 1 && (
          <div className="chx-pager">
            <button className="btn ghost sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>‹ {t('Previous')}</button>
            <span>{t('Page {a} of {b}', { a: cur + 1, b: pages })} · {shown.length}</span>
            <button className="btn ghost sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>{t('Next')} ›</button>
          </div>
        )}
      </div>
    </>
  )
}
