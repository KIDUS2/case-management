import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { t } from '../i18n.js'
import { askConfirm } from '../dialog.js'
import { applyOptions } from '../ui.js'

/** One editable list: add a new entry, rename it, give it an Amharic name, switch it off or delete it. */
function ListEditor({ title, hint, list, kind, withIcon, onChange, setErr, setOk }) {
  const [form, setForm] = useState({ label: '', labelAm: '', icon: '' })
  const [edit, setEdit] = useState(null)

  const run = async fn => {
    setErr(''); setOk('')
    try { await fn(); await onChange() } catch (x) { setErr(x.message) }
  }
  const add = e => {
    e.preventDefault()
    run(async () => { await api('/options/' + kind, { method: 'POST', body: form }); setForm({ label: '', labelAm: '', icon: '' }); setOk(t('Added. It now shows in every list.')) })
  }
  const save = o => run(async () => { await api('/options/item/' + o.id, { method: 'PUT', body: edit }); setEdit(null); setOk(t('Saved')) })
  const toggle = o => run(() => api('/options/item/' + o.id, { method: 'PUT', body: { active: !o.active } }))
  const del = async o => {
    if (!(await askConfirm(t('Delete “{n}”?', { n: o.label }), { confirmText: t('Delete'), danger: true }))) return
    run(() => api('/options/item/' + o.id, { method: 'DELETE' }))
  }

  return (
    <div className="card">
      <h2>{title}</h2>
      <p className="hint">{hint}</p>
      <form className="setadd" onSubmit={add}>
        {withIcon && <input className="ico" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="🗂️" maxLength={4} aria-label="Icon" />}
        <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder={t('Name in English')} required maxLength={120} />
        <input value={form.labelAm} onChange={e => setForm({ ...form, labelAm: e.target.value })} placeholder={t('Name in Amharic (optional)')} maxLength={120} />
        <button className="btn sm">➕ {t('Add')}</button>
      </form>
      <div className="list">
        {list.map(o => (
          <div className={'row' + (o.active ? '' : ' off')} key={o.id} style={{ flexWrap: 'wrap' }}>
            {edit?.id === o.id ? (
              <>
                {withIcon && <input className="ico" value={edit.icon} onChange={e => setEdit({ ...edit, icon: e.target.value })} maxLength={4} aria-label="Icon" />}
                <input style={{ flex: '1 1 160px' }} value={edit.label} onChange={e => setEdit({ ...edit, label: e.target.value })} maxLength={120} />
                <input style={{ flex: '1 1 160px' }} value={edit.labelAm} onChange={e => setEdit({ ...edit, labelAm: e.target.value })} placeholder={t('Name in Amharic (optional)')} maxLength={120} />
                <button className="btn sm" style={{ margin: 0 }} onClick={() => save(o)}>{t('Save')}</button>
                <button className="btn ghost sm" onClick={() => setEdit(null)}>{t('Cancel')}</button>
              </>
            ) : (
              <>
                {withIcon && <div className="avatar sm">{o.icon}</div>}
                <div className="grow">
                  <b>{o.label}</b>
                  <small>{o.labelAm ? o.labelAm + ' · ' : ''}{t('used {n} times', { n: o.inUse })}{o.active ? '' : ' · ' + t('switched off')}{o.system ? ' · ' + t('built in') : ''}</small>
                </div>
                <button className="btn ghost sm" onClick={() => setEdit({ id: o.id, label: o.label, labelAm: o.labelAm || '', icon: o.icon || '' })}>✏️ {t('Edit')}</button>
                {!o.system && <button className="btn ghost sm" onClick={() => toggle(o)}>{o.active ? t('Switch off') : t('Switch on')}</button>}
                {!o.system && <button className="btn ghost sm" onClick={() => del(o)}>🗑️</button>}
              </>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="muted">{t('Nothing here yet.')}</p>}
      </div>
    </div>
  )
}

/** The dropdown lists used across the app. A change here shows up in every form and report. */
export default function Settings() {
  const [lists, setLists] = useState(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const load = async () => { const o = await api('/options'); applyOptions(o); setLists(o) }
  useEffect(() => { load().catch(e => setErr(e.message)) }, [])

  return (
    <>
      <h1>{t('Settings')}</h1>
      <p className="muted">{t('These lists fill the dropdowns in the whole app. Add a new entry here and it appears in every form, filter and report.')}</p>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
      {lists && (
        <div className="cols">
          <ListEditor kind="ISSUE_TYPE" withIcon title={t('Types of issue')} hint={t('Shown when registering a case or a sub-case, and when choosing what a department handles.')}
            list={lists.issueTypes} onChange={load} setErr={setErr} setOk={setOk} />
          <ListEditor kind="SUB_CITY" title={t('Kefle ketema (sub-cities)')} hint={t('Churches are grouped by these. Renaming one moves its churches along.')}
            list={lists.subCities} onChange={load} setErr={setErr} setOk={setOk} />
        </div>
      )}
    </>
  )
}
