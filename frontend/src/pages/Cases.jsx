import { useEffect, useState } from 'react'
import { api, upload, download } from '../api.js'
import { t } from '../i18n.js'
import { STATUS, ISSUE_STATUS, CATEGORY, WORKING, EVENT_ICON, fmtDate, fmtDay, fmtSize, ago, dayDiff, todayStr, addDays, initial, fmtCode, names, copyText, isStaff, fmtId } from '../ui.js'

export default function Cases({ me, openId, setOpenId, goNew, fresh, initialQuery }) {
  if (openId) return <CaseDetail me={me} id={openId} fresh={fresh} onBack={() => setOpenId(null)} onOpen={setOpenId} />
  return <CaseList key={initialQuery} me={me} onOpen={setOpenId} goNew={goNew} initialQuery={initialQuery} />
}

function CaseList({ me, onOpen, goNew, initialQuery }) {
  const [q, setQ] = useState(initialQuery || '')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ items: [], total: 0, size: 12 })
  const [sum, setSum] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { api('/cases/summary').then(setSum).catch(e => setErr(e.message)) }, [])
  useEffect(() => { setPage(0) }, [q, status])
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      const p = new URLSearchParams({ page, size: 12 })
      if (q.trim()) p.set('q', q.trim())
      if (status) p.set('status', status)
      api('/cases?' + p).then(d => { setData(d); setErr('') }).catch(e => setErr(e.message)).finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [q, status, page])

  const pages = Math.max(1, Math.ceil(data.total / data.size))
  const tiles = [
    { key: '', label: 'All cases', n: sum?.total, icon: '📚' },
    { key: 'OPEN', label: 'Open', n: sum?.open, icon: '🟦' },
    { key: 'REFERRED', label: 'Referred', n: sum?.referred, icon: '➡️' },
    { key: 'COURT', label: 'In court', n: sum?.court, icon: '⚖️' },
    { key: 'RESOLVED', label: 'Resolved', n: sum?.resolved, icon: '✅' },
  ]

  return (
    <>
      <div className="head"><div><h1>Cases</h1><p className="muted">Every report and request that came to the desk.</p></div>
        {isStaff(me.role) && <button className="btn" onClick={goNew}>➕ Register case</button>}</div>
      {err && <div className="err">{err}</div>}
      <div className="tiles">
        {tiles.map(t => (
          <button key={t.key} className={'tile' + (status === t.key ? ' on' : '')} onClick={() => setStatus(t.key)}>
            <span className="ti">{t.icon}</span><b>{t.n ?? '–'}</b><small>{t.label}</small>
          </button>
        ))}
      </div>
      <input className="search" placeholder="Filter this list by name, church or case code…" value={q} onChange={e => setQ(e.target.value)} />
      <div className={loading ? 'fade' : ''}>
        {data.items.map(c => (
          <button key={c.id} className={'case ' + STATUS[c.status].cls} onClick={() => onOpen(c.id)}>
            <div className="avatar">{initial(c.complainants[0])}</div>
            <div className="grow">
              <div className="ctitle"><b>{names(c.complainants)}</b><span className={'badge ' + STATUS[c.status].cls}>{STATUS[c.status].label}</span></div>
              <small>⛪ {c.churchName}{c.complainants.length > 1 ? ' · ' + t('group of {n}', { n: c.complainants.length }) : ''}</small>
              {c.subjects.length > 0 && <small className="about">👤 {t('About: {x}', { x: names(c.subjects) })}</small>}
              <div className="cats">{c.categories.map(k => <span key={k} className="cat">{CATEGORY[k].icon} {CATEGORY[k].label}</span>)}</div>
            </div>
            <div className="cside"><span className="codechip">{fmtCode(c.code)}</span><span>{t('{a}/{b} resolved', { a: c.resolvedCount, b: c.issueCount })}{c.letterIssued ? ' · ✉️' : ''}</span><small>{fmtDate(c.createdAt)}</small></div>
          </button>
        ))}
        {!loading && !data.items.length && (
          <div className="card empty">🌿<br />{q || status ? 'No cases match your search.' : me.role === 'ADMIN' ? 'No cases yet. Register the first one!' : 'You only see cases you registered, cases you were added to, or issues sent to your department.'}</div>
        )}
      </div>
      {data.total > data.size && (
        <div className="pager">
          <button className="btn ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>← Previous</button>
          <span className="muted">{t('Page {a} of {b}', { a: page + 1, b: pages })}</span>
          <button className="btn ghost" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </>
  )
}

function PersonRow({ p }) {
  return (
    <div className="prow">
      <div className="avatar">{initial(p.fullName)}</div>
      <div className="grow">
        <b>{p.fullName}</b>
        <small>{p.employeeId ? '🪪 ' + fmtId(p.employeeId) + ' · ' : ''}⛪ {p.churchName} · {WORKING[p.workingStatus]}{p.phone ? ' · ' + p.phone : ''}</small>
        {p.involvement && <small className="about">📌 {p.involvement}</small>}
        {p.complaintsAgainst > 1 && <small className="warn">⚠️ {t('{n} cases are about this person', { n: p.complaintsAgainst })}</small>}
        {p.totalCases > 1 && p.complaintsAgainst <= 1 && <small>{t('In {n} cases on record', { n: p.totalCases })}</small>}
      </div>
    </div>
  )
}

function IssueCard({ i, k, c, me, departments, onChange, setErr }) {
  const [panel, setPanel] = useState(null) // 'refer' | 'resolve' | 'court'
  const suggested = departments.find(d => d.handlesCategory === i.category)
  const [dept, setDept] = useState(i.departmentId || suggested?.id || '')
  const [ret, setRet] = useState(addDays(todayStr(), 7))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [picked, setPicked] = useState([])
  const myFiles = c.files.filter(f => f.issueId === i.id)
  useEffect(() => { if (!dept && suggested) setDept(suggested.id) }, [suggested]) // eslint-disable-line react-hooks/exhaustive-deps
  const st = ISSUE_STATUS[i.status]
  const done = i.status === 'RESOLVED'
  const desk = ['ADMIN', 'OFFICER', 'RECEPTION'].includes(me.role)
  const canRefer = desk && !done
  const canResolve = !done && (['ADMIN', 'OFFICER'].includes(me.role) || (me.role === 'DEPARTMENT' && i.status === 'REFERRED' && i.departmentId === me.departmentId))
  const canCourt = ['ADMIN', 'OFFICER'].includes(me.role) && !done && i.status !== 'COURT'
  const d = i.returnOn ? dayDiff(i.returnOn) : null

  const run = async (path, body) => {
    setBusy(true); setErr('')
    try { onChange(await api(`/cases/${c.id}/issues/${i.id}/${path}`, { method: 'POST', body })); setPanel(null); setNote('') }
    catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const open = p => { setPanel(panel === p ? null : p); setNote(''); setPicked([]) }

  const send = async list => {
    const failed = []
    for (const f of list) { try { await upload(`/cases/${c.id}/files?issueId=${i.id}`, f) } catch (x) { failed.push(f.name + ': ' + x.message) } }
    return failed
  }
  const resolveNow = async () => {
    setBusy(true); setErr('')
    try {
      let d = await api(`/cases/${c.id}/issues/${i.id}/resolve`, { method: 'POST', body: { note } })
      let failed = []
      if (picked.length) { failed = await send(picked); d = await api('/cases/' + c.id) }
      onChange(d); setPanel(null); setNote(''); setPicked([])
      if (failed.length) setErr('Resolved, but these files were not saved: ' + failed.join(' · '))
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const attach = async e => {
    const list = [...e.target.files]; e.target.value = ''
    if (!list.length) return
    setBusy(true); setErr('')
    const failed = await send(list)
    try { onChange(await api('/cases/' + c.id)) } catch { /* shown on next open */ }
    if (failed.length) setErr(failed.join(' · '))
    setBusy(false)
  }

  return (
    <div className="issue-row">
      <div className="iicon">{CATEGORY[i.category].icon}</div>
      <div className="issue-body">
        <div className="ihead"><b>{k + 1}. {CATEGORY[i.category].label}</b><span className={'badge ' + st.cls}>{st.icon} {st.label}</span>
          {i.departmentName && <span className="idept">🏢 {i.departmentName}</span>}
          {i.returnOn && !done && <span className={'iret' + (d < 0 ? ' late' : d <= 1 ? ' soon' : '')}>🚪 {t('Returns {x}', { x: fmtDay(i.returnOn) + (d < 0 ? ' (overdue)' : d === 0 ? ' (today)' : '') })}</span>}</div>
        <p>{i.description || <span className="muted">No detail written yet.</span>}</p>
        {done && <div className="resbox">✅ {t('Resolved {when}{by} (@{who}){note}', { when: ago(i.resolvedAt), by: i.departmentName ? ' by ' + i.departmentName : '', who: i.resolvedBy, note: i.resolutionNote ? ' — ' + i.resolutionNote : '' })}</div>}
        {myFiles.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {myFiles.map(f => (
              <div className="filerow" key={f.id}><span className="iicon" style={{ width: 32, height: 32 }}>📄</span>
                <div className="grow"><div className="fname">{f.originalName}</div><small>{fmtSize(f.size)} · @{f.uploadedBy} · {ago(f.uploadedAt)}</small></div>
                <button className="btn ghost sm" onClick={() => download(f.id, f.originalName).catch(x => setErr(x.message))}>⬇️</button></div>
            ))}
          </div>
        )}
        {i.courtAt && (
          <div className="courtbox">⚖️ {t('In court since {d} ·', { d: fmtDate(i.courtAt) })}{' '}
            {i.courtAckAt ? <b>{t('acknowledged by @{u}', { u: i.courtAckBy })}</b> : <b className="warn">waiting for the admin to acknowledge</b>}
            {me.role === 'ADMIN' && !i.courtAckAt && <> <button className="btn sm gold" style={{ margin: '0 0 0 8px' }} disabled={busy} onClick={() => run('acknowledge')}>🖊️ Acknowledge</button></>}
          </div>
        )}
        <div className="iact">
          {canRefer && <button className="btn ghost sm" onClick={() => open('refer')}>{i.departmentId ? '🔁 Send to another department' : '📤 Send to department'}</button>}
          {canResolve && <button className="btn ok sm" onClick={() => open('resolve')}>✅ Mark resolved</button>}
          {canCourt && <button className="btn court sm" onClick={() => open('court')}>⚖️ Take to court</button>}
          {(desk || me.role === 'DEPARTMENT') && <label className="btn ghost sm" style={{ margin: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>📎 Attach file<input type="file" multiple hidden disabled={busy} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt" onChange={attach} /></label>}
        </div>
        {panel === 'refer' && (
          <div className="panel">
            <div className="two">
              <div><label>Department</label>
                <select value={dept} onChange={e => setDept(e.target.value)}>
                  <option value="">Choose…</option>
                  {departments.filter(x => x.active).map(x => <option key={x.id} value={x.id}>{t('{x}{s}', { x: x.name, s: x.id === suggested?.id ? ' ★ suggested' : '' })}</option>)}
                </select></div>
              <div><label>Person comes back on</label><input type="date" min={todayStr()} value={ret} onChange={e => setRet(e.target.value)} /></div>
            </div>
            <label>Note for the department (optional)</label>
            <textarea rows={2} value={note} maxLength={2000} onChange={e => setNote(e.target.value)} />
            <div className="iact"><button className="btn sm" disabled={busy || !dept} onClick={() => run('refer', { departmentId: Number(dept), returnOn: ret || null, note })}>{busy ? 'Sending…' : '📤 Send now'}</button>
              <button className="btn ghost sm" onClick={() => setPanel(null)}>Cancel</button></div>
            <small>The department is notified straight away, and the person will show in the door queue on that day.</small>
          </div>
        )}
        {panel === 'resolve' && (
          <div className="panel">
            <label>What was done? (the desk and admin are notified)</label>
            <textarea rows={3} autoFocus value={note} maxLength={4000} onChange={e => setNote(e.target.value)} />
            <label className="drop" style={{ marginTop: 8, padding: 10 }}>📎 {picked.length ? picked.map(f => f.name).join(', ') : 'Attach the paper or proof (optional)'}
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt" onChange={e => { setPicked(l => [...l, ...e.target.files]); e.target.value = '' }} /></label>
            <div className="iact"><button className="btn ok sm" disabled={busy} onClick={resolveNow}>{busy ? 'Saving…' : '✅ Confirm resolved'}</button>
              <button className="btn ghost sm" onClick={() => setPanel(null)}>Cancel</button></div>
          </div>
        )}
        {panel === 'court' && (
          <div className="panel">
            <label>Court details (optional)</label>
            <textarea rows={2} autoFocus value={note} maxLength={4000} onChange={e => setNote(e.target.value)} placeholder="Court, case number, next hearing…" />
            <div className="iact"><button className="btn court sm" disabled={busy} onClick={() => run('court', { note })}>{busy ? 'Saving…' : '⚖️ Mark as in court'}</button>
              <button className="btn ghost sm" onClick={() => setPanel(null)}>Cancel</button></div>
            <small>The admin is notified and must acknowledge it.</small>
          </div>
        )}
      </div>
    </div>
  )
}

function AddPerson({ c, churches, onChange, setErr, onDone }) {
  const blank = { role: 'INVOLVED', fullName: '', churchName: '', phone: '', workingStatus: 'ACTIVE_EMPLOYEE', involvement: '' }
  const [f, setF] = useState(blank)
  const [busy, setBusy] = useState(false)
  const set = patch => setF(x => ({ ...x, ...patch }))
  const save = async e => {
    e.preventDefault(); setErr('')
    const church = churches.find(x => x.name.toLowerCase() === f.churchName.trim().toLowerCase())
    if (!church) return setErr('Please choose the church from the list (start typing its name).')
    setBusy(true)
    try {
      onChange(await api(`/cases/${c.id}/parties`, { method: 'POST', body: { role: f.role, person: { fullName: f.fullName.trim(), churchId: church.id, phone: f.phone, workingStatus: f.workingStatus, involvement: f.involvement } } }))
      setF(blank); onDone()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <form className="panel" onSubmit={save}>
      <label>Who are they to this case?</label>
      <select value={f.role} onChange={e => set({ role: e.target.value })}>
        <option value="INVOLVED">Called in / involved (witness, accountant, other employee…)</option>
        <option value="SUBJECT">Another person the case is about</option>
        <option value="COMPLAINANT">Another person reporting</option>
      </select>
      <label>Full name</label><input value={f.fullName} onChange={e => set({ fullName: e.target.value })} required maxLength={160} autoFocus />
      <div className="two">
        <div><label>Church</label><input list="church-list-detail" value={f.churchName} onChange={e => set({ churchName: e.target.value })} placeholder="Start typing…" required /></div>
        <div><label>Phone (optional)</label><input value={f.phone} onChange={e => set({ phone: e.target.value })} inputMode="tel" maxLength={40} /></div>
      </div>
      <label>This person is</label>
      <select value={f.workingStatus} onChange={e => set({ workingStatus: e.target.value })}>{Object.entries(WORKING).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <label>What are they involved in? (what they said or provided)</label>
      <textarea rows={3} value={f.involvement} maxLength={1000} onChange={e => set({ involvement: e.target.value })} placeholder="e.g. Cashier in 2024, handed over the cash book." />
      <div className="iact"><button className="btn sm" disabled={busy}>{busy ? 'Adding…' : '➕ Add to case'}</button><button type="button" className="btn ghost sm" onClick={onDone}>Cancel</button></div>
      <small>Add their paper afterwards with “Attach file” on the issue, or in Documents.</small>
    </form>
  )
}

function InvolvedCard({ c, churches, onChange, setErr }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card">
      <h2>Other people involved <span className="count">{c.involved.length}</span></h2>
      {c.involved.length === 0 && !open && <p className="muted">No one else has been called in yet.</p>}
      {c.involved.map(p => <PersonRow key={p.id} p={p} />)}
      <datalist id="church-list-detail">{churches.map(x => <option key={x.id} value={x.name} />)}</datalist>
      {open ? <AddPerson c={c} churches={churches} onChange={onChange} setErr={setErr} onDone={() => setOpen(false)} />
        : <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>➕ Call in another person</button>}
    </div>
  )
}

/** Admin only: who else may open this case. */
function AccessCard({ c, setErr }) {
  const [grants, setGrants] = useState(null)
  const [users, setUsers] = useState([])
  const [pick, setPick] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    api(`/cases/${c.id}/access`).then(setGrants).catch(e => setErr(e.message))
    api('/users').then(setUsers).catch(() => {})
  }, [c.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!grants) return null
  const taken = new Set(grants.map(g => g.userId))
  const options = users.filter(u => u.active && u.role !== 'ADMIN' && !u.canViewAll && !taken.has(u.id) && u.username !== c.createdBy)
  const add = async () => {
    if (!pick) return
    setBusy(true); setErr('')
    try { setGrants(await api(`/cases/${c.id}/access`, { method: 'POST', body: { userId: Number(pick) } })); setPick('') } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const remove = async g => { setErr(''); try { setGrants(await api(`/cases/${c.id}/access/${g.userId}`, { method: 'DELETE' })) } catch (x) { setErr(x.message) } }
  return (
    <div className="card">
      <h2>Who can open this case <span className="count">{grants.length}</span></h2>
      <p className="hint">{t('Administrators, people with the “see all cases” privilege, @{u} (who registered it) and the departments it was sent to always have access. Add anyone else here.', { u: c.createdBy })}</p>
      {grants.map(g => (
        <div className="filerow" key={g.userId}><span className="avatar sm">{initial(g.fullName)}</span>
          <div className="grow"><div className="fname">{g.fullName}</div><small>{t('@{u} · added by @{b}', { u: g.username, b: g.grantedBy })} · {ago(g.grantedAt)}</small></div>
          <button className="btn x" onClick={() => remove(g)}>Remove</button></div>
      ))}
      {grants.length === 0 && <p className="muted">Nobody else has been added.</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <select style={{ flex: '1 1 180px' }} value={pick} onChange={e => setPick(e.target.value)}>
          <option value="">Add a person…</option>
          {options.map(u => <option key={u.id} value={u.id}>{u.fullName} (@{u.username})</option>)}
        </select>
        <button className="btn sm" style={{ margin: 0 }} disabled={!pick || busy} onClick={add}>🔓 Give access</button>
      </div>
    </div>
  )
}

function AddIssue({ c, departments, onChange, setErr }) {
  const [open, setOpen] = useState(false)
  const [cat, setCat] = useState('HR')
  const [desc, setDesc] = useState('')
  const [dept, setDept] = useState('')
  const [ret, setRet] = useState(addDays(todayStr(), 7))
  const [busy, setBusy] = useState(false)
  const save = async e => {
    e.preventDefault(); setErr('')
    if (cat !== 'UNCLEAR' && !desc.trim()) return setErr(t('Please describe the new sub-case, or mark it “Not clear yet”'))
    setBusy(true)
    try {
      onChange(await api(`/cases/${c.id}/issues`, { method: 'POST', body: { category: cat, description: desc, departmentId: dept ? Number(dept) : null, returnOn: dept ? ret || null : null } }))
      setDesc(''); setDept(''); setOpen(false)
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  if (!open) return <button className="btn ghost" onClick={() => setOpen(true)}>➕ Add a sub-case</button>
  return (
    <form className="panel" onSubmit={save}>
      <h2>New sub-case</h2>
      <select value={cat} onChange={e => setCat(e.target.value)}>
        {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
      </select>
      <textarea rows={3} placeholder="Describe the cause…" value={desc} maxLength={4000} onChange={e => setDesc(e.target.value)} autoFocus />
      {departments.length > 0 && (
        <div className="grid" style={{ marginTop: 8 }}>
          <div><label>Send to a department now? (optional)</label>
            <select value={dept} onChange={e => setDept(e.target.value)}>
              <option value="">Keep with the desk for now</option>
              {departments.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.name}{d.handlesCategory === cat ? ' ★' : ''}</option>)}
            </select></div>
          {dept && <div><label>Person comes back on</label><input type="date" min={todayStr()} value={ret} onChange={e => setRet(e.target.value)} /></div>}
        </div>
      )}
      <div className="iact"><button className="btn sm" disabled={busy}>💾 Add sub-case</button><button type="button" className="btn ghost sm" onClick={() => setOpen(false)}>Cancel</button></div>
    </form>
  )
}

function RelatedCard({ c, onOpen, onChange, setErr }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const linked = new Set(c.linkedCaseIds || [])
  const link = async e => {
    e.preventDefault(); if (!code.trim()) return
    setBusy(true); setErr('')
    try { onChange(await api(`/cases/${c.id}/links`, { method: 'POST', body: { code: code.trim() } })); setCode(''); setOpen(false) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const unlink = async o => { setErr(''); try { onChange(await api(`/cases/${c.id}/links/${o.id}`, { method: 'DELETE' })) } catch (x) { setErr(x.message) } }
  return (
    <div className="card">
      <h2>Related cases {c.relatedCases.length > 0 && <span className="count">{c.relatedCases.length}</span>}</h2>
      {c.relatedCases.length === 0 && <p className="muted">None of these people are in another case.</p>}
      {c.relatedCases.map(o => (
        <div key={o.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="mini" style={{ flex: 1 }} onClick={() => onOpen(o.id)}>
            <span><b>{fmtCode(o.code)}</b><small>{names(o.complainants)}{o.subjects.length ? ' → ' + names(o.subjects) : ''}{linked.has(o.id) ? ' · 🔗' : ''}</small></span>
            <span className={'badge ' + STATUS[o.status].cls}>{STATUS[o.status].label}</span>
          </button>
          {linked.has(o.id) && <button className="btn x" title="Remove link" onClick={() => unlink(o)}>✕</button>}
        </div>
      ))}
      {open ? (
        <form onSubmit={link} style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <input style={{ flex: '1 1 160px' }} placeholder="Case code, e.g. K7M-2QX" value={code} onChange={e => setCode(e.target.value)} autoFocus autoCapitalize="characters" />
          <button className="btn sm" style={{ margin: 0 }} disabled={busy || !code.trim()}>🔗 Link</button>
          <button type="button" className="btn ghost sm" style={{ margin: 0 }} onClick={() => { setOpen(false); setCode('') }}>Cancel</button>
        </form>
      ) : <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setOpen(true)}>🔗 Link another case</button>}
    </div>
  )
}

function Files({ c, me, onChange, setErr }) {
  const [busy, setBusy] = useState(false)
  const add = async e => {
    const picked = [...e.target.files]; e.target.value = ''
    if (!picked.length) return
    setBusy(true); setErr('')
    const failed = []
    for (const f of picked) { try { await upload(`/cases/${c.id}/files`, f) } catch (x) { failed.push(f.name + ': ' + x.message) } }
    try { onChange(await api('/cases/' + c.id)) } catch { /* list refresh failed; next open will show it */ }
    if (failed.length) setErr(failed.join(' · '))
    setBusy(false)
  }
  const remove = async f => {
    if (!confirm(t('Remove “{f}”?', { f: f.originalName }))) return
    try { await api('/files/' + f.id, { method: 'DELETE' }); onChange(await api('/cases/' + c.id)) } catch (x) { setErr(x.message) }
  }
  return (
    <div className="card">
      <h2>Documents <span className="count">{c.files.length}</span></h2>
      {c.files.length === 0 && <p className="muted">No files yet. Add the letter, scans or evidence.</p>}
      {c.files.map(f => (
        <div className="filerow" key={f.id}>
          <span className="iicon">📄</span>
          <div className="grow"><div className="fname">{f.originalName}</div><small>{f.issueId ? 'Issue ' + (c.issues.findIndex(i => i.id === f.issueId) + 1) + ' · ' : ''}{fmtSize(f.size)} · @{f.uploadedBy} · {ago(f.uploadedAt)}</small></div>
          <button className="btn ghost sm" onClick={() => download(f.id, f.originalName).catch(x => setErr(x.message))}>⬇️</button>
          {['ADMIN', 'OFFICER'].includes(me.role) && <button className="btn x" onClick={() => remove(f)} aria-label="Remove file">🗑️</button>}
        </div>
      ))}
      <label className="drop">{busy ? 'Uploading…' : '📎 Add files (PDF, image, Word, Excel · up to 10 MB each)'}
        <input type="file" multiple disabled={busy} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt" onChange={add} /></label>
    </div>
  )
}

function Timeline({ c, onChange, setErr }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const add = async e => {
    e.preventDefault(); if (!text.trim()) return
    setBusy(true); setErr('')
    try { onChange(await api(`/cases/${c.id}/notes`, { method: 'POST', body: { note: text } })); setText('') } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div className="card">
      <h2>History</h2>
      <form onSubmit={add} style={{ marginBottom: 16 }}>
        <textarea rows={2} value={text} maxLength={4000} placeholder="Add a note to the history…" onChange={e => setText(e.target.value)} />
        <button className="btn sm" disabled={busy || !text.trim()} style={{ marginTop: 8 }}>📝 Add note</button>
      </form>
      <ul className="timeline">
        {c.events.map(e => (
          <li key={e.id}>
            <span className="tdot">{EVENT_ICON[e.type] || '•'}</span>
            <div className="grow"><p>{e.message}</p><small>@{e.actor} · {fmtDate(e.createdAt)}</small></div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CaseDetail({ me, id, fresh, onBack, onOpen }) {
  const [c, setC] = useState(null)
  const [err, setErr] = useState('')
  const [fatal, setFatal] = useState('')
  const [copied, setCopied] = useState(false)
  const [departments, setDepartments] = useState([])
  const [churches, setChurches] = useState([])
  const desk = isStaff(me.role) && me.role !== 'DEPARTMENT'

  useEffect(() => { setC(null); setFatal(''); api('/cases/' + id).then(setC).catch(e => setFatal(e.message)) }, [id])
  useEffect(() => { api('/departments').then(setDepartments).catch(() => {}); api('/churches').then(setChurches).catch(() => {}) }, [])

  if (fatal) return <><button className="btn ghost" onClick={onBack}>← Back</button><div className="err">{fatal}</div></>
  if (!c) return <div className="muted">Loading…</div>
  const st = STATUS[c.status]
  const copy = async () => { if (await copyText(fmtCode(c.code))) { setCopied(true); setTimeout(() => setCopied(false), 1800) } }
  const resolved = c.issues.filter(i => i.status === 'RESOLVED').length
  const comingBack = c.issues.some(i => i.returnOn && i.status !== 'RESOLVED')
  const setLetter = async issued => { setErr(''); try { setC(await api(`/cases/${c.id}/letter`, { method: 'PUT', body: { issued } })) } catch (x) { setErr(x.message) } }
  const arrived = async () => { setErr(''); try { setC(await api(`/cases/${c.id}/arrived`, { method: 'POST' })) } catch (x) { setErr(x.message) } }

  return (
    <>
      <button className="btn ghost back" onClick={onBack}>← All cases</button>
      {fresh && (
        <div className="fresh">✅ <b>Case registered.</b> Give this code to the person. They can quote it when they come back, and staff can type it to find the case at once.
          {fresh.failed?.length > 0 && <div className="warn" style={{ marginTop: 6 }}>⚠️ {t('These files could not be uploaded: {f}. Add them again below.', { f: fresh.failed.join(', ') })}</div>}
        </div>
      )}
      {err && <div className="err">{err}</div>}
      <div className={'hero-card ' + st.cls}>
        <div className="grow">
          <small className="onhero">Case code</small>
          <div className="bigcode">{fmtCode(c.code)}</div>
          <div className="onhero">{names(c.complainants.map(p => p.fullName))}{c.complainants.length > 1 ? ' · ' + t('group of {n}', { n: c.complainants.length }) : ''}</div>
          <div className="onhero" style={{ marginTop: 6 }}>{t('{a} of {b} issues resolved', { a: resolved, b: c.issues.length })}</div>
          <div className="progress"><i style={{ width: (c.issues.length ? (resolved / c.issues.length) * 100 : 0) + '%' }} /></div>
        </div>
        <div className="heroside">
          <span className="badge light">{st.icon} {st.label}</span>
          <button className="btn light sm" onClick={copy}>{copied ? '✔ Copied' : '📋 Copy code'}</button>
          {desk && comingBack && <button className="btn gold sm" onClick={arrived}>🚪 Person is here</button>}
        </div>
      </div>

      <div className="cols">
        <div>
          <div className="card">
            <h2>Issues <span className="count">{c.issues.length}</span> <small className="inl">each issue is a sub-case with its own status, department and files</small></h2>
            {c.issues.map((i, k) => <IssueCard key={i.id} i={i} k={k} c={c} me={me} departments={departments} onChange={setC} setErr={setErr} />)}
            {desk && <AddIssue c={c} departments={departments} onChange={setC} setErr={setErr} />}
          </div>
          <div className="card">
            <h2>Discussion notes</h2>
            <p className="notes">{c.discussionNotes || <span className="muted">No notes were written.</span>}</p>
            <span className={'pill ' + (c.letterIssued ? 'yes' : 'no')}>{c.letterIssued ? '✉️ Letter issued' : '✉️ Letter not issued yet'}</span>
            {desk && <button className="btn ghost sm" style={{ marginLeft: 8 }} onClick={() => setLetter(!c.letterIssued)}>{c.letterIssued ? 'Undo' : 'Mark as issued'}</button>}
            <small style={{ marginTop: 12 }}>{t('Registered {d} by @{u}', { d: fmtDate(c.createdAt), u: c.createdBy })}</small>
          </div>
          <Timeline c={c} onChange={setC} setErr={setErr} />
        </div>
        <div>
          <div className="card">
            <h2>{c.complainants.length > 1 ? t('Reported by a group ({n})', { n: c.complainants.length }) : t('Reported by')}</h2>
            {c.complainants.map(p => <PersonRow key={p.id} p={p} />)}
          </div>
          <div className="card">
            <h2>Who it is about</h2>
            {c.subjects.length === 0 && <p className="muted">No one in particular. This is a request or general matter.</p>}
            {c.subjects.map(p => <PersonRow key={p.id} p={p} />)}
          </div>
          {me.role === 'ADMIN' && <AccessCard c={c} setErr={setErr} />}
          <InvolvedCard c={c} churches={churches} onChange={setC} setErr={setErr} />
          <Files c={c} me={me} onChange={setC} setErr={setErr} />
          <RelatedCard c={c} onOpen={onOpen} onChange={setC} setErr={setErr} />
        </div>
      </div>
    </>
  )
}
