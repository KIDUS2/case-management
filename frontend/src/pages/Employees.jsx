import { useEffect, useState } from 'react'
import { api, upload, blob, downloadPath } from '../api.js'
import { t, locale } from '../i18n.js'
import { WORKING, STATUS, initial, fmtId, fmtSize, fmtCode, fmtDate } from '../ui.js'
import { printIdCard, SPIRITUAL_RANK } from '../idcard.js'
import { askConfirm, notify } from '../dialog.js'
import { readSheetFile, gridFromText, downloadCsv, SHEET_ACCEPT } from '../sheet.js'

const fmtDay = d => (d ? new Date(d + 'T00:00:00').toLocaleDateString(locale(), { dateStyle: 'medium' }) : '—')
const DOC_KINDS = ['Appointment letter', 'Certificate', 'ID copy', 'Contract', 'Recommendation', 'Medical', 'Other']
const blank = { churchRef: '', firstName: '', middleName: '', lastName: '', motherName: '', churchName: '', phone: '', extraPhones: [], phoneExempt: false, salary: '', email: '', profession: '', position: '', gender: '', birthDate: '', hireDate: '', address: '', notes: '', christianName: '', fatherConfessor: '', spiritualRank: '', ordainedOn: '', idExpiresOn: '', workingStatus: 'ACTIVE_EMPLOYEE' }
const COLS = ['churchRef', 'firstName', 'middleName', 'lastName', 'motherName', 'church', 'phone', 'email', 'profession', 'position', 'gender', 'birthDate', 'hireDate', 'address', 'christianName', 'fatherConfessor']

/** Turns rows of cells (first row = column names, any order) into employee records. */
function parseRows(grid) {
  if (grid.length < 2) return []
  const head = grid[0].map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ''))
  const alias = { churchRef: ['churchref', 'employeeid', 'id', 'idnumber'], motherName: ['mothername', 'mother'], fatherConfessor: ['fatherconfessor', 'confessor'], christianName: ['christianname', 'baptismalname'] }
  const idx = Object.fromEntries(COLS.map(c => [c, Math.max(...(alias[c] || [c.toLowerCase()]).map(a => head.indexOf(a)))]))
  return grid.slice(1).map(v => Object.fromEntries(COLS.map(c => [c, idx[c] >= 0 ? (v[idx[c]] || '').trim() : ''])))
}

/** A picture that needs the login header to load. */
function AuthImg({ path, alt, fallback, version }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let url, dead = false
    blob(path).then(b => { if (!dead) { url = URL.createObjectURL(b); setSrc(url) } }).catch(() => setSrc(null))
    return () => { dead = true; if (url) URL.revokeObjectURL(url) }
  }, [path, version])
  return src ? <img src={src} alt={alt} /> : fallback
}

function Docs({ e, setErr }) {
  const [list, setList] = useState(null)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState(DOC_KINDS[0])
  const [busy, setBusy] = useState(false)
  const load = () => api(`/employees/${e.id}/documents`).then(setList).catch(x => setErr(x.message))
  useEffect(() => { load() }, [e.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const add = async ev => {
    const f = ev.target.files[0]; ev.target.value = ''
    if (!f) return
    setBusy(true); setErr('')
    try { await upload(`/employees/${e.id}/documents`, f, { title, kind }); setTitle(''); load() } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const remove = async d => { if (!(await askConfirm(t('Remove “{f}”?', { f: d.title }), { title: 'Remove this document?', confirmText: 'Remove', danger: true }))) return; try { await api('/employee-files/' + d.id, { method: 'DELETE' }); load() } catch (x) { setErr(x.message) } }
  if (!list) return null
  return (
    <div className="card">
      <h2>Documents <span className="count">{list.length}</span> <small className="inl">kept in this employee’s file</small></h2>
      {list.map(d => (
        <div className="filerow" key={d.id}><span className="iicon">📄</span>
          <div className="grow"><div className="fname">{d.title}</div><small>{d.kind ? d.kind + ' · ' : ''}{fmtSize(d.sizeBytes)} · @{d.uploadedBy}</small></div>
          <button className="btn x" onClick={() => downloadPath('/employee-files/' + d.id, d.originalName).catch(x => setErr(x.message))}>⬇️</button>
          <button className="btn x" onClick={() => remove(d)}>🗑️</button></div>
      ))}
      {list.length === 0 && <p className="muted">No documents yet.</p>}
      <div className="grid" style={{ marginTop: 10 }}>
        <div><label>Document name (optional)</label><input value={title} onChange={x => setTitle(x.target.value)} maxLength={160} /></div>
        <div><label>Type</label><select value={kind} onChange={x => setKind(x.target.value)}>{DOC_KINDS.map(k => <option key={k}>{k}</option>)}</select></div>
      </div>
      <label className="drop">{busy ? 'Uploading…' : '📎 Add a document (PDF, image, Word, Excel · up to 10 MB)'}
        <input type="file" disabled={busy} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt" onChange={add} /></label>
    </div>
  )
}

const LEVELS = {
  SPIRITUAL: ['Sunday school', 'Deacon school', 'Zema (chant)', 'Qene (poetry)', 'Aqwaqwam (liturgical movement)', 'Scripture and commentary', 'Theological college diploma', 'Theological BA', 'Theological MA', 'Monastic training', 'Other'],
  SECULAR: ['Grade 8', 'Grade 12', 'Certificate', 'Diploma', 'Bachelor’s degree', 'Master’s degree', 'PhD', 'Other'],
}
const yr = n => (n ? String(n) : '')

/** Education history, spiritual and secular, saved on the employee. */
function EducationCard({ e, canWrite, setErr }) {
  const [list, setList] = useState(null)
  const [form, setForm] = useState(null)
  const load = () => api(`/employees/${e.id}/education`).then(setList).catch(x => setErr(x.message))
  useEffect(() => { load() }, [e.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const start = kind => setForm({ kind, level: '', field: '', institution: '', startYear: '', endYear: '', completed: true, notes: '' })
  const num = v => (v === '' || v == null ? null : Number(v))
  const save = async ev => {
    ev.preventDefault(); setErr('')
    const body = { ...form, startYear: num(form.startYear), endYear: num(form.endYear) }
    try { setList(form.id ? await api('/employee-education/' + form.id, { method: 'PUT', body }) : await api(`/employees/${e.id}/education`, { method: 'POST', body })); setForm(null) } catch (x) { setErr(x.message) }
  }
  const remove = async r => {
    if (!(await askConfirm(r.level || r.field || r.institution, { title: 'Remove this record?', confirmText: 'Remove', danger: true }))) return
    try { setList(await api('/employee-education/' + r.id, { method: 'DELETE' })) } catch (x) { setErr(x.message) }
  }
  if (!list) return null
  const f = k => ev => setForm({ ...form, [k]: ev.target.value })
  const group = (kind, title, icon) => {
    const rows = list.filter(r => r.kind === kind)
    return (
      <div key={kind} style={{ marginBottom: 14 }}>
        <h3 className="sect" style={{ marginTop: 6 }}>{icon} {title}</h3>
        {rows.map(r => (
          <div className="edu" key={r.id}>
            <div className="grow">
              <b>{r.level || r.field || r.institution}</b>
              <small>{[r.level && r.field ? r.field : '', r.institution].filter(Boolean).join(' · ')}</small>
              <small>{r.startYear || r.endYear ? [yr(r.startYear), r.completed ? yr(r.endYear) : t('studying')].filter(Boolean).join(' – ') : ''}{!r.completed && !r.startYear ? t('studying') : ''}</small>
              {r.notes && <small>{r.notes}</small>}
            </div>
            {canWrite && <><button className="btn x" title="Edit" onClick={() => setForm({ ...r, startYear: yr(r.startYear), endYear: yr(r.endYear), notes: r.notes || '', level: r.level || '', field: r.field || '', institution: r.institution || '' })}>✏️</button>
              <button className="btn x" title="Remove" onClick={() => remove(r)}>🗑️</button></>}
          </div>
        ))}
        {rows.length === 0 && <p className="muted" style={{ margin: '2px 0 6px' }}>Nothing recorded yet.</p>}
        {canWrite && !form && <button className="btn ghost sm" onClick={() => start(kind)}>➕ Add</button>}
      </div>
    )
  }
  return (
    <div className="card">
      <h2>Education</h2>
      {group('SPIRITUAL', 'Spiritual education', '⛪')}
      {group('SECULAR', 'Secular education', '🎓')}
      {form && (
        <form className="panel" onSubmit={save}>
          <h3 className="sect" style={{ marginTop: 0 }}>{form.id ? 'Edit' : 'Add'} · {form.kind === 'SPIRITUAL' ? 'Spiritual education' : 'Secular education'}</h3>
          <datalist id="edu-levels">{LEVELS[form.kind].map(l => <option key={l} value={l} />)}</datalist>
          <div className="grid">
            <div><label>Level or course</label><input list="edu-levels" value={form.level} onChange={f('level')} maxLength={120} autoFocus /></div>
            <div><label>Field of study</label><input value={form.field} onChange={f('field')} maxLength={160} /></div>
            <div className="span"><label>School or college</label><input value={form.institution} onChange={f('institution')} maxLength={200} /></div>
            <div><label>Start year</label><input inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={form.startYear} onChange={f('startYear')} placeholder="2010" /></div>
            <div><label>End year</label><input inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={form.endYear} onChange={f('endYear')} placeholder="2014" /></div>
          </div>
          <label className="check"><input type="checkbox" checked={form.completed} onChange={ev => setForm({ ...form, completed: ev.target.checked })} /> Completed</label>
          <label>Notes</label><input value={form.notes} onChange={f('notes')} maxLength={1000} />
          <div className="iact"><button className="btn sm">Save</button><button type="button" className="btn ghost sm" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
    </div>
  )
}

/** Where the employee served and in which role, newest first. Moving churches in the profile adds to it automatically. */
function ServiceCard({ e, churches, canWrite, setErr }) {
  const [list, setList] = useState(null)
  const [form, setForm] = useState(null)
  const load = () => api(`/employees/${e.id}/service`).then(setList).catch(x => setErr(x.message))
  useEffect(() => { load() }, [e.id, e.churchName, e.position]) // eslint-disable-line react-hooks/exhaustive-deps
  const save = async ev => {
    ev.preventDefault(); setErr('')
    const body = { place: form.place, position: form.position, startDate: form.startDate || null, endDate: form.endDate || null, notes: form.notes }
    try { setList(form.id ? await api('/employee-service/' + form.id, { method: 'PUT', body }) : await api(`/employees/${e.id}/service`, { method: 'POST', body })); setForm(null) } catch (x) { setErr(x.message) }
  }
  const remove = async r => {
    if (!(await askConfirm(r.place, { title: 'Remove this record?', confirmText: 'Remove', danger: true }))) return
    try { setList(await api('/employee-service/' + r.id, { method: 'DELETE' })) } catch (x) { setErr(x.message) }
  }
  if (!list) return null
  const f = k => ev => setForm({ ...form, [k]: ev.target.value })
  return (
    <div className="card">
      <h2>Service history <span className="count">{list.length}</span></h2>
      <datalist id="svc-places">{churches.map(c => <option key={c.id} value={c.name} />)}</datalist>
      <ol className="timeline svc">
        {list.map(r => (
          <li key={r.id}>
            <span className="tdot">{r.endDate ? '⛪' : '📍'}</span>
            <div className="grow">
              <b>{r.place}</b> {!r.endDate && <span className="badge s-ok">Current</span>}
              <small>{[r.position, [r.startDate ? fmtDay(r.startDate) : '', r.endDate ? fmtDay(r.endDate) : r.startDate ? t('now') : ''].filter(Boolean).join(' → ')].filter(Boolean).join(' · ')}</small>
              {r.notes && <small>{r.notes}</small>}
            </div>
            {canWrite && <><button className="btn x" title="Edit" onClick={() => setForm({ ...r, position: r.position || '', startDate: r.startDate || '', endDate: r.endDate || '', notes: r.notes || '' })}>✏️</button>
              <button className="btn x" title="Remove" onClick={() => remove(r)}>🗑️</button></>}
          </li>
        ))}
      </ol>
      {list.length === 0 && <p className="muted">No service recorded yet.</p>}
      {canWrite && !form && <button className="btn ghost sm" onClick={() => setForm({ place: '', position: '', startDate: '', endDate: '', notes: '' })}>➕ Add a place of service</button>}
      {form && (
        <form className="panel" onSubmit={save}>
          <div className="grid">
            <div><label>Church or office</label><input list="svc-places" value={form.place} onChange={f('place')} required maxLength={200} autoFocus /></div>
            <div><label>Position</label><input value={form.position} onChange={f('position')} maxLength={160} /></div>
            <div><label>From</label><input type="date" value={form.startDate} onChange={f('startDate')} /></div>
            <div><label>Until (leave empty if still serving)</label><input type="date" value={form.endDate} onChange={f('endDate')} /></div>
          </div>
          <label>Notes</label><input value={form.notes} onChange={f('notes')} maxLength={1000} />
          <div className="iact"><button className="btn sm">Save</button><button type="button" className="btn ghost sm" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
    </div>
  )
}

const STEPS = ['Identity, position and contact', 'Education', 'Places served']

/** Education entered while registering: spiritual and secular, as many as needed. Saved together with the employee. */
function EduDraft({ items, setItems }) {
  const empty = kind => ({ kind, level: '', field: '', institution: '', startYear: '', endYear: '', completed: true })
  const [row, setRow] = useState(null)
  const f = k => ev => setRow({ ...row, [k]: ev.target.value })
  const add = () => {
    if (!row.level.trim() && !row.field.trim() && !row.institution.trim()) return
    setItems([...items, row]); setRow(null)
  }
  const group = (kind, title, icon) => (
    <div style={{ marginBottom: 14 }}>
      <h3 className="sect" style={{ marginTop: 6 }}>{icon} {t(title)}</h3>
      {items.map((r, i) => r.kind === kind && (
        <div className="edu" key={i}><div className="grow"><b>{r.level || r.field || r.institution}</b>
          <small>{[r.field, r.institution, [r.startYear, r.endYear || (r.completed ? '' : t('studying'))].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')}</small></div>
          <button type="button" className="btn x" onClick={() => setItems(items.filter((_, k) => k !== i))}>🗑️</button></div>))}
      {!items.some(r => r.kind === kind) && <p className="muted" style={{ margin: '2px 0 6px' }}>{t('Nothing recorded yet.')}</p>}
      {!row && <button type="button" className="btn ghost sm" onClick={() => setRow(empty(kind))}>➕ {t('Add')}</button>}
    </div>
  )
  return (
    <>
      {group('SPIRITUAL', 'Spiritual education', '⛪')}
      {group('SECULAR', 'Secular education', '🎓')}
      {row && (
        <div className="panel">
          <h3 className="sect" style={{ marginTop: 0 }}>{t('Add')} · {t(row.kind === 'SPIRITUAL' ? 'Spiritual education' : 'Secular education')}</h3>
          <datalist id="edu-levels">{LEVELS[row.kind].map(l => <option key={l} value={l} />)}</datalist>
          <div className="grid">
            <div><label>{t('Level or course')}</label><input list="edu-levels" value={row.level} onChange={f('level')} maxLength={120} autoFocus /></div>
            <div><label>{t('Field of study')}</label><input value={row.field} onChange={f('field')} maxLength={160} /></div>
            <div className="span"><label>{t('School or college')}</label><input value={row.institution} onChange={f('institution')} maxLength={200} /></div>
            <div><label>{t('Start year')}</label><input inputMode="numeric" maxLength={4} value={row.startYear} onChange={f('startYear')} placeholder="2010" /></div>
            <div><label>{t('End year')}</label><input inputMode="numeric" maxLength={4} value={row.endYear} onChange={f('endYear')} placeholder="2014" /></div>
          </div>
          <label className="check"><input type="checkbox" checked={row.completed} onChange={ev => setRow({ ...row, completed: ev.target.checked })} /> {t('Completed')}</label>
          <div className="iact"><button type="button" className="btn sm" onClick={add}>{t('Add to the list')}</button><button type="button" className="btn ghost sm" onClick={() => setRow(null)}>{t('Cancel')}</button></div>
        </div>
      )}
    </>
  )
}

/** Churches and offices served, each with its own position and dates. The same church can appear again with another role. */
function SvcDraft({ items, setItems, churches }) {
  const [row, setRow] = useState(null)
  const f = k => ev => setRow({ ...row, [k]: ev.target.value })
  const add = () => { if (!row.place.trim()) return; setItems([...items, row]); setRow(null) }
  return (
    <>
      <datalist id="svc-places">{churches.map(c => <option key={c.id} value={c.name} />)}</datalist>
      <p className="hint">{t('The church and position you entered in step 1 are recorded as the current place of service. Add the places served before, and any other role held now, here. The same church can be added again with a different position.')}</p>
      <ol className="timeline svc">
        {items.map((r, i) => (
          <li key={i}><span className="tdot">{r.endDate ? '⛪' : '📍'}</span>
            <div className="grow"><b>{r.place}</b><small>{[r.position, [r.startDate, r.endDate || (r.startDate ? t('now') : '')].filter(Boolean).join(' → ')].filter(Boolean).join(' · ')}</small></div>
            <button type="button" className="btn x" onClick={() => setItems(items.filter((_, k) => k !== i))}>🗑️</button></li>))}
      </ol>
      {items.length === 0 && <p className="muted">{t('No service recorded yet.')}</p>}
      {!row && <button type="button" className="btn ghost sm" onClick={() => setRow({ place: '', position: '', startDate: '', endDate: '', notes: '' })}>➕ {t('Add a place of service')}</button>}
      {row && (
        <div className="panel">
          <div className="grid">
            <div><label>{t('Church or office')}</label><input list="svc-places" value={row.place} onChange={f('place')} maxLength={200} autoFocus /></div>
            <div><label>{t('Position')}</label><input value={row.position} onChange={f('position')} maxLength={160} /></div>
            <div><label>{t('From')}</label><input type="date" value={row.startDate} onChange={f('startDate')} /></div>
            <div><label>{t('Until (leave empty if still serving)')}</label><input type="date" value={row.endDate} onChange={f('endDate')} /></div>
          </div>
          <div className="iact"><button type="button" className="btn sm" onClick={add}>{t('Add to the list')}</button><button type="button" className="btn ghost sm" onClick={() => setRow(null)}>{t('Cancel')}</button></div>
        </div>
      )}
    </>
  )
}

function Row({ k, v }) { return v ? <div className="kv"><span>{k}</span><b>{v}</b></div> : null }

const money = n => (n == null ? '' : Number(n).toLocaleString(locale(), { maximumFractionDigits: 2 }) + ' ' + t('birr'))
const ROLE = { COMPLAINANT: 'Reported the case', SUBJECT: 'Reported on', BOTH: 'Reported and reported on' }

/** Every case this person is in, with its issues. Court issues stand out. */
function CasesCard({ e, onOpenCase }) {
  const [d, setD] = useState(null)
  useEffect(() => { api(`/employees/${e.id}/cases`).then(setD).catch(() => setD({ cases: [], hidden: 0 })) }, [e.id])
  return (
    <div className="card"><h2>{t('Cases')}</h2>
      <p>{t('{a} cases in total · {b} still active · {c} about this person', { a: e.totalCases, b: e.openCases, c: e.complaintsAgainst })}</p>
      {d && d.cases.length === 0 && <p className="muted">{t('No cases yet.')}</p>}
      {d && d.cases.map(c => (
        <button type="button" key={c.caseId} className={'pcase' + (c.hasCourt ? ' court' : '')} onClick={() => onOpenCase && onOpenCase(c.caseId)}>
          <span className="pc-top"><b>{fmtCode(c.code)}</b><span className={'badge ' + STATUS[c.status].cls}>{t(STATUS[c.status].label)}</span>{c.hasCourt && <span className="badge s-court">⚖️ {t('Court')}</span>}</span>
          <small>{t(ROLE[c.role] || '')} · {fmtDate(c.createdAt)}</small>
          <span className="pc-issues">{c.issues.map((i, k) => <span key={k} className={'catchip' + (i.court ? ' court' : '')}>{i.court ? '⚖️ ' : ''}{i.category}{i.status === 'RESOLVED' ? ' ✅' : ''}</span>)}</span>
        </button>))}
      {d && d.hidden > 0 && <p className="muted">{t('{n} more cases you do not have access to.', { n: d.hidden })}</p>}
      {e.notes && <><h2 style={{ marginTop: 14 }}>{t('Notes')}</h2><p className="notes">{e.notes}</p></>}
    </div>
  )
}

function Profile({ churches, e0, canWrite, canDocs, onBack, onEdit, onChanged, onSeeCases, onOpenCase, setErr, setOk }) {
  const [e, setE] = useState(e0)
  const [ver, setVer] = useState(0)
  useEffect(() => setE(e0), [e0])
  const age = e.birthDate ? Math.floor((Date.now() - new Date(e.birthDate + 'T00:00:00')) / 31557600000) : null
  const setPhoto = async ev => {
    const f = ev.target.files[0]; ev.target.value = ''
    if (!f) return
    try { await upload(`/employees/${e.id}/photo`, f); setE({ ...e, hasPhoto: true }); setVer(v => v + 1); onChanged() } catch (x) { setErr(x.message) }
  }
  const renew = async () => {
    if (!(await askConfirm(t('The new card will be valid for five more years from today.'), { title: 'Renew the card?', confirmText: 'Renew' }))) return
    try { const n = await api(`/employees/${e.id}/renew`, { method: 'POST' }); setE(n); onChanged(); setOk(t('Card renewed ✅')) } catch (x) { setErr(x.message) }
  }
  const print = async () => { setErr(''); try { if (!(await printIdCard(e))) setErr(t('Please allow pop-ups to print the card.')) } catch (x) { setErr(x.message || String(x)) } }
  return (
    <>
      <button className="btn ghost sm" onClick={onBack}>← Employees</button>
      <div className="dossier">
        <div className="phbox">
          <div className="photo"><AuthImg path={`/employees/${e.id}/photo`} version={ver} alt={e.fullName} fallback={<span className="ph">{initial(e.fullName)}</span>} /></div>
          {canWrite && <label className="btn ghost sm" style={{ margin: '8px 0 0' }}>📷 {e.hasPhoto ? 'Change photo' : 'Add photo'}<input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={setPhoto} /></label>}
        </div>
        <div className="dhead">
          <h1 style={{ margin: 0 }}>{e.fullName}</h1>
          <div className="muted">{[e.profession, e.position].filter(Boolean).join(' · ') || WORKING[e.workingStatus]}</div>
          {e.employeeId ? <>
            <div className="idnum">🪪 {fmtId(e.employeeId)}</div>
            <span className={'badge ' + (e.idExpired ? 's-court' : 's-ok')}>{e.idExpired ? t('Card expired {d}', { d: fmtDay(e.idExpiresOn) }) : t('Valid until {d}', { d: fmtDay(e.idExpiresOn) })}</span>
          </> : <div className="muted">No employee ID (not an employee).</div>}
          <div className="iact" style={{ marginTop: 12 }}>
            {e.employeeId && <button className="btn sm" onClick={print}>🖨️ {t('Print ID card')}</button>}
            {canWrite && e.employeeId && <button className="btn ghost sm" onClick={renew}>🔄 Renew card</button>}
            {canWrite && <button className="btn ghost sm" onClick={() => onEdit(e)}>✏️ Edit</button>}
            <button className="btn ghost sm" onClick={() => onSeeCases(e.fullName)}>📁 See cases ({e.totalCases})</button>
          </div>
        </div>
      </div>
      <div className="cols">
        <div>
          <div className="card"><h2>Personal</h2>
            <Row k="First name" v={e.firstName} /><Row k="Middle name" v={e.middleName} /><Row k="Last name" v={e.lastName} />
            <Row k="Mother’s name" v={e.motherName} />
            <Row k="Gender" v={e.gender ? (e.gender === 'MALE' ? 'Male' : 'Female') : ''} />
            <Row k="Date of birth" v={e.birthDate ? fmtDay(e.birthDate) + (age != null ? ` (${age})` : '') : ''} />
            <Row k="Phone" v={[e.phone, ...(e.extraPhones || [])].filter(Boolean).join(' · ') || (e.phoneExempt ? t('No phone (allowed by admin)') : '')} /><Row k="Email" v={e.email} /><Row k="Address" v={e.address} />
          </div>
          <div className="card"><h2>Spiritual life</h2>
            <Row k="Christian name" v={e.christianName} /><Row k="Father confessor" v={e.fatherConfessor} />
            <Row k="Service" v={SPIRITUAL_RANK[e.spiritualRank] ? t(SPIRITUAL_RANK[e.spiritualRank]) : ''} /><Row k="Ordained on" v={e.ordainedOn ? fmtDay(e.ordainedOn) : ''} />
            {!e.christianName && !e.fatherConfessor && !e.spiritualRank && <p className="muted">Nothing recorded yet.</p>}
          </div>
          <div className="card"><h2>Work</h2>
            <Row k="Church" v={e.churchName} /><Row k="Working status" v={WORKING[e.workingStatus]} />
            <Row k="Profession" v={e.profession} /><Row k="Position at the church" v={e.position} />
            {e.salary != null && <Row k="Monthly salary" v={money(e.salary)} />}<Row k="Hired on" v={e.hireDate ? fmtDay(e.hireDate) : ''} /><Row k="Church’s own number" v={e.churchRef} />
          </div>
        </div>
        <div>
          <CasesCard e={e} onOpenCase={onOpenCase} />
          <EducationCard e={e} canWrite={canWrite} setErr={setErr} />
          <ServiceCard e={e} churches={churches} canWrite={canWrite} setErr={setErr} />
          {canDocs && <Docs e={e} setErr={setErr} />}
        </div>
      </div>
    </>
  )
}

export default function Employees({ me, focus, onFocusDone, onSeeCases, onOpenCase }) {
  const canWrite = ['ADMIN', 'OFFICER'].includes(me.role)
  const [data, setData] = useState({ items: [], total: 0, size: 20 })
  const [churches, setChurches] = useState([])
  const [q, setQ] = useState('')
  const [church, setChurch] = useState('')
  const [page, setPage] = useState(0)
  const [form, setForm] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [step, setStep] = useState(0)
  const [eduDraft, setEduDraft] = useState([])
  const [svcDraft, setSvcDraft] = useState([])
  const [view, setView] = useState(null) // the employee whose file is open
  const [bulk, setBulk] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const load = () => {
    const p = new URLSearchParams({ page, size: 20 }); if (q.trim()) p.set('q', q.trim()); if (church) p.set('churchId', church)
    api('/employees?' + p).then(setData).catch(e => setErr(e.message))
  }
  useEffect(() => { api('/churches').then(setChurches).catch(() => {}) }, [])
  useEffect(() => { const h = setTimeout(load, 250); return () => clearTimeout(h) }, [q, church, page]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // opened from the QR code on a card
    if (!focus) return
    api('/employees/by-id/' + encodeURIComponent(focus)).then(setView).catch(e => setErr(e.message)).finally(() => onFocusDone && onFocusDone())
  }, [focus]) // eslint-disable-line react-hooks/exhaustive-deps

  const toBody = f => {
    const ch = churches.find(c => c.name.toLowerCase() === f.churchName.trim().toLowerCase())
    if (!ch) throw new Error(t('Please choose the church from the list (start typing its name).'))
    const { churchName, ...rest } = f
    const nul = v => v || null
    return { ...rest, salary: f.salary === '' || f.salary == null ? null : Number(f.salary), extraPhones: (f.extraPhones || []).map(x => x.trim()).filter(Boolean), churchId: ch.id, birthDate: nul(f.birthDate), hireDate: nul(f.hireDate), ordainedOn: nul(f.ordainedOn), idExpiresOn: nul(f.idExpiresOn) }
  }
  const save = async e => {
    e.preventDefault(); setErr(''); setOk('')
    if (!form.id && step < STEPS.length - 1) { setStep(step + 1); window.scrollTo({ top: 0 }); return }
    try {
      const body = toBody(form)
      const saved = form.id ? await api('/employees/' + form.id, { method: 'PUT', body }) : await api('/employees', { method: 'POST', body })
      let note = ''
      if (!form.id) {
        const missed = []
        for (const ed of eduDraft) {
          try { await api(`/employees/${saved.id}/education`, { method: 'POST', body: { ...ed, startYear: ed.startYear ? Number(ed.startYear) : null, endYear: ed.endYear ? Number(ed.endYear) : null } }) } catch { missed.push(ed.level || ed.field || ed.institution) }
        }
        for (const sv of svcDraft) {
          try { await api(`/employees/${saved.id}/service`, { method: 'POST', body: { place: sv.place, position: sv.position, startDate: sv.startDate || null, endDate: sv.endDate || null, notes: sv.notes } }) } catch { missed.push(sv.place) }
        }
        if (missed.length) note += ' · ' + t('These were not saved: {f}', { f: missed.join(', ') })
      }
      if (photo) { try { await upload(`/employees/${saved.id}/photo`, photo); saved.hasPhoto = true } catch (x) { note = ' · ' + x.message } }
      setForm(null); setPhoto(null); setStep(0); setEduDraft([]); setSvcDraft([]); setOk(t('Employee saved ✅') + note); load()
      setView(await api('/employees/' + saved.id))
      window.scrollTo({ top: 0 })
    } catch (x) { setErr(x.message) }
  }
  const edit = e => {
    setForm({ id: e.id, churchRef: e.churchRef || '', firstName: e.firstName || '', middleName: e.middleName || '', lastName: e.lastName || '', motherName: e.motherName || '', churchName: e.churchName, phone: e.phone || '', extraPhones: e.extraPhones || [], phoneExempt: !!e.phoneExempt, salary: e.salary ?? '', email: e.email || '', profession: e.profession || '', position: e.position || '', gender: e.gender || '', birthDate: e.birthDate || '', hireDate: e.hireDate || '', address: e.address || '', notes: e.notes || '', christianName: e.christianName || '', fatherConfessor: e.fatherConfessor || '', spiritualRank: e.spiritualRank || '', ordainedOn: e.ordainedOn || '', idExpiresOn: e.idExpiresOn || '', workingStatus: e.workingStatus, employeeId: e.employeeId })
    setPhoto(null); setView(null); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const pickFile = async ev => {
    const file = ev.target.files[0]; ev.target.value = ''
    if (!file) return
    try { await runImport(parseRows(await readSheetFile(file))) } catch (x) { setErr(x.message) }
  }
  const doImport = () => runImport(parseRows(gridFromText(bulk)))
  const runImport = async rows => {
    setErr(''); setOk('')
    if (!rows.length) return setErr(t('The list is empty. The first line must hold the column names, then one employee per line.'))
    const byName = new Map(churches.map(c => [c.name.toLowerCase(), c.id]))
    const unknown = [...new Set(rows.filter(r => !byName.has(r.church.toLowerCase())).map(r => r.church || '(empty)'))]
    const good = rows.filter(r => byName.has(r.church.toLowerCase()) && r.firstName)
    try {
      const body = good.map(r => ({ churchRef: r.churchRef, firstName: r.firstName, middleName: r.middleName, lastName: r.lastName, motherName: r.motherName, churchId: byName.get(r.church.toLowerCase()), phone: r.phone, email: r.email, profession: r.profession, position: r.position, gender: r.gender.toUpperCase().startsWith('F') ? 'FEMALE' : r.gender.toUpperCase().startsWith('M') ? 'MALE' : '', birthDate: r.birthDate || null, hireDate: r.hireDate || null, address: r.address, notes: '', christianName: r.christianName, fatherConfessor: r.fatherConfessor, workingStatus: 'ACTIVE_EMPLOYEE' }))
      const res = body.length ? await api('/employees/import', { method: 'POST', body }) : { created: 0, updated: 0, errors: [] }
      setOk(t('{a} added, {b} updated.', { a: res.created, b: res.updated }) + (res.missingPhone ? ' ' + t('{n} have no phone number yet.', { n: res.missingPhone }) : ''))
      const problems = [...res.errors, ...(unknown.length ? [t('Church not found: {x}', { x: unknown.slice(0, 5).join(', ') })] : [])]
      if (problems.length) setErr(problems.join(' · ')); else setBulk('')
      load()
    } catch (x) { setErr(x.message) }
  }
  const f = k => e => setForm({ ...form, [k]: e.target.value })
  const pages = Math.max(1, Math.ceil(data.total / data.size))

  if (view && !form) return (
    <>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
      <Profile churches={churches} e0={view} canWrite={canWrite} canDocs={canWrite} onBack={() => { setView(null); setOk(''); load() }} onEdit={edit} onChanged={load}
        onSeeCases={name => onSeeCases && onSeeCases(name)} onOpenCase={onOpenCase} setErr={setErr} setOk={setOk} />
    </>
  )

  return (
    <>
      <div className="emp-head">
        <div><h1>{t('Employees')}</h1><p className="muted">{t('Type an employee ID when registering a case to bring back all their details.')}</p></div>
        {!form && <div className="chx-actions">
          {canWrite && <button className="btn ghost" onClick={() => setShowBulk(!showBulk)}>📥 {t('Import list')}</button>}
          {canWrite && <button className="btn" style={{ margin: 0 }} onClick={() => { setForm({ ...blank }); setPhoto(null) }}>➕ {t('Register employee')}</button>}
        </div>}
      </div>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
      <datalist id="emp-church-list">{churches.map(c => <option key={c.id} value={c.name} />)}</datalist>
      {!form && <div className="emp-bar">
        <div className="emp-total"><b>{data.total}</b><span>{t(data.total === 1 ? 'person on the list' : 'people on the list')}</span></div>
        <input className="emp-search" type="search" placeholder={t('Search by name, ID number, mother’s name, phone or profession…')} value={q} onChange={e => { setQ(e.target.value); setPage(0) }} />
        <select className="emp-church" value={church} onChange={e => { setChurch(e.target.value); setPage(0) }} aria-label={t('Church')}>
          <option value="">{t('All churches')}</option>{churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>}

      {showBulk && canWrite && !form && (
        <div className="card">
          <h2>Import the church’s employee list</h2>
          <div className="filepick">
            <label className="drop">📂 {t('Choose an Excel (.xlsx) or CSV file')}<input type="file" accept={SHEET_ACCEPT} onChange={pickFile} /></label>
            <button type="button" className="btn ghost sm" style={{ margin: 0 }} onClick={() => downloadCsv('employees-template.csv', COLS, ['EMP-0001', 'Abebe', 'Kebede', 'Tadesse', 'Almaz', 'Kidist Selassie Church', '0911000000', '', 'Accountant', 'Cashier', 'M', '1990-04-12', '2018-09-01', 'Addis Ababa', 'Gebre Mariam', ''])}>⬇ {t('Download the template')}</button>
          </div>
          <p className="hint">{t('Or paste')} Paste from Excel or a CSV file. First line = column names: <code>churchRef, firstName, middleName, lastName, motherName, church, phone, email, profession, position, gender, birthDate, hireDate, address, christianName, fatherConfessor</code>. Everyone gets a new 12-digit employee ID automatically. People already on the list (same ID or church number) are updated. Photos and documents are added afterwards on each profile.</p>
          <textarea rows={6} value={bulk} onChange={e => setBulk(e.target.value)} placeholder={'churchRef,firstName,middleName,lastName,motherName,church,profession\nEMP-0001,Abebe,Kebede,Tadesse,Almaz,Kidist Selassie Church,Accountant'} />
          <button className="btn" onClick={doImport}>📥 Import</button>
        </div>
      )}

      {form && (
        <form className="card" onSubmit={save}>
          <h2>{form.id ? 'Edit employee' : 'Register employee'}{form.employeeId && <span className="idnum sm"> 🪪 {fmtId(form.employeeId)}</span>}</h2>
          {!form.id && <p className="hint">{t('The employee ID (12 digits) is created automatically when you save.')}</p>}
          {!form.id && (
            <ol className="steps">{STEPS.map((x, i) => <li key={x} className={i === step ? 'on' : i < step ? 'done' : ''}><span>{i < step ? '✓' : i + 1}</span>{t(x)}</li>)}</ol>
          )}
          {(form.id || step === 0) && <>
          <h3 className="sect">Identity</h3>
          <div className="grid3">
            <div><label>First name</label><input value={form.firstName} onChange={f('firstName')} required maxLength={80} autoFocus /></div>
            <div><label>Middle name (father’s name)</label><input value={form.middleName} onChange={f('middleName')} required maxLength={80} /></div>
            <div><label>Last name (grandfather’s name)</label><input value={form.lastName} onChange={f('lastName')} required maxLength={80} /></div>
          </div>
          <div className="grid">
            <div><label>Mother’s name</label><input value={form.motherName} onChange={f('motherName')} required maxLength={160} /></div>
            <div><label>Gender</label><select value={form.gender} onChange={f('gender')} required><option value="">—</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></div>
            <div><label>Date of birth</label><input type="date" value={form.birthDate} onChange={f('birthDate')} required /></div>
            <div><label>Photo</label><input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => setPhoto(e.target.files[0] || null)} />{photo && <small className="muted">{photo.name}</small>}</div>
          </div>
          <h3 className="sect">Spiritual life</h3>
          <div className="grid">
            <div><label>Christian name</label><input value={form.christianName} onChange={f('christianName')} maxLength={120} /></div>
            <div><label>Father confessor</label><input value={form.fatherConfessor} onChange={f('fatherConfessor')} maxLength={160} /></div>
            <div><label>Service in the church</label><select value={form.spiritualRank} onChange={f('spiritualRank')}><option value="">—</option>{Object.entries(SPIRITUAL_RANK).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}</select></div>
            <div><label>Ordained on</label><input type="date" value={form.ordainedOn} onChange={f('ordainedOn')} /></div>
          </div>
          <h3 className="sect">Work and contact</h3>
          <div className="grid">
            <div><label>Church</label><input list="emp-church-list" value={form.churchName} onChange={f('churchName')} required placeholder="Start typing…" /></div>
            <div><label>Working status</label><select value={form.workingStatus} onChange={f('workingStatus')}>{Object.entries(WORKING).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label>Profession</label><input value={form.profession} onChange={f('profession')} maxLength={120} placeholder="e.g. Accountant, Teacher, Priest" /></div>
            <div><label>Position at the church</label><input value={form.position} onChange={f('position')} maxLength={120} /></div>
            {me.role === 'ADMIN' && <div><label>{t('Monthly salary (birr)')}</label><input type="number" min="0" step="0.01" value={form.salary} onChange={f('salary')} inputMode="decimal" /></div>}
            <div><label>{t('Phone number')}{!form.phoneExempt && <span className="req"> *</span>}</label><input value={form.phone} onChange={f('phone')} inputMode="tel" maxLength={40} required={!form.phoneExempt} /></div>
            <div className="span">
              {(form.extraPhones || []).map((ph, k) => (
                <div className="phrow" key={k}>
                  <input value={ph} onChange={e => setForm({ ...form, extraPhones: form.extraPhones.map((x, j) => (j === k ? e.target.value : x)) })} inputMode="tel" maxLength={40} placeholder={t('Another phone number (optional)')} />
                  <button type="button" className="btn ghost sm" onClick={() => setForm({ ...form, extraPhones: form.extraPhones.filter((_, j) => j !== k) })}>✕</button>
                </div>
              ))}
              <div className="phtools">
                {(form.extraPhones || []).length < 5 && <button type="button" className="btn ghost sm" onClick={() => setForm({ ...form, extraPhones: [...(form.extraPhones || []), ''] })}>➕ {t('Add another phone number')}</button>}
                {me.role === 'ADMIN' && <label className="chk"><input type="checkbox" checked={!!form.phoneExempt} onChange={e => setForm({ ...form, phoneExempt: e.target.checked })} /> {t('This person has no phone (admin allows it)')}</label>}
              </div>
            </div>
            <div><label>Email</label><input type="email" value={form.email} onChange={f('email')} maxLength={120} /></div>
            <div><label>Hired on</label><input type="date" value={form.hireDate} onChange={f('hireDate')} /></div>
            <div><label>Address</label><input value={form.address} onChange={f('address')} maxLength={255} /></div>
            <div><label>Church’s own number (optional)</label><input value={form.churchRef} onChange={f('churchRef')} maxLength={40} /></div>
            {form.id && form.employeeId && <div><label>Card valid until</label><input type="date" value={form.idExpiresOn} onChange={f('idExpiresOn')} /></div>}
          </div>
          <label>Notes</label><textarea rows={3} value={form.notes} onChange={f('notes')} maxLength={4000} />
          </>}
          {!form.id && step > 0 && <div onKeyDown={ev => { if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') ev.preventDefault() }}>
            {step === 1 && <EduDraft items={eduDraft} setItems={setEduDraft} />}
            {step === 2 && <SvcDraft items={svcDraft} setItems={setSvcDraft} churches={churches} />}
          </div>}
          <div className="iact">
            {!form.id && step > 0 && <button type="button" className="btn ghost sm" onClick={() => { setStep(step - 1); window.scrollTo({ top: 0 }) }}>‹ {t('Back')}</button>}
            <button className="btn sm">{form.id || step === STEPS.length - 1 ? t('Save') : t('Next') + ' ›'}</button>
            <button type="button" className="btn ghost sm" onClick={() => { setForm(null); setStep(0); setEduDraft([]); setSvcDraft([]) }}>{t('Cancel')}</button>
          </div>
        </form>
      )}

      {!form && <div className="card emp-list">
        <table className="emp-table">
          <thead><tr><th>{t('Employee')}</th><th>{t('Church')}</th><th>{t('Position')}</th><th>{t('Working status')}</th><th>{t('Phone number')}</th><th className="r">{t('Cases')}</th></tr></thead>
          <tbody>
            {data.items.map(e => (
              <tr key={e.id} onClick={() => { setErr(''); setView(e) }} tabIndex={0} onKeyDown={ev => { if (ev.key === 'Enter') setView(e) }}>
                <td><div className="emp-who"><div className="avatar">{initial(e.fullName)}</div>
                  <div><b>{e.fullName}</b><small>{e.employeeId ? fmtId(e.employeeId) : t('No employee ID')}{e.idExpired && <span className="badge s-court" style={{ marginLeft: 8 }}>{t('Expired')}</span>}</small></div></div></td>
                <td>{e.churchName}</td>
                <td>{e.position || e.profession || '—'}</td>
                <td><span className={'ws ws-' + e.workingStatus}>{t(WORKING[e.workingStatus])}</span></td>
                <td>{e.phone || '—'}</td>
                <td className="r"><span className="badge s-open">{e.totalCases}</span>{e.complaintsAgainst > 0 && <span className="badge s-ref" title={t('Reported on')} style={{ marginLeft: 6 }}>⚠️ {e.complaintsAgainst}</span>}</td>
              </tr>))}
          </tbody>
        </table>
        {data.items.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: 22 }}>{t('No employees match.')}</p>}
        <div className="chx-pager">
          <span>{data.total ? t('Showing {a}–{b} of {c}', { a: page * data.size + 1, b: Math.min(data.total, page * data.size + data.items.length), c: data.total }) : ''}</span>
          {pages > 1 && <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn ghost sm" disabled={page === 0} onClick={() => setPage(page - 1)}>‹ {t('Previous')}</button><span>{page + 1} / {pages}</span>
            <button className="btn ghost sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>{t('Next')} ›</button></span>}
        </div>
      </div>}
    </>
  )
}
