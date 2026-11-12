import { useEffect, useState } from 'react'
import { api, upload } from '../api.js'
import { t } from '../i18n.js'
import { CATEGORY, WORKING, addDays, todayStr, fmtSize, fmtId } from '../ui.js'

const blankIssue = () => ({ category: 'HR', description: '', departmentId: '', returnOn: addDays(todayStr(), 7) })
const blankParty = (status = 'ACTIVE_EMPLOYEE') => ({ employeeId: '', fullName: '', churchName: '', phone: '', workingStatus: status })

function Chips({ options, value, onChange }) {
  return <div className="chips">{Object.entries(options).map(([k, v]) =>
    <button type="button" key={k} className={'chip' + (value === k ? ' on' : '')} onClick={() => onChange(k)}>{v}</button>)}</div>
}

function PartyEditor({ title, party, onChange, onRemove, churches, autoFocus }) {
  const [matches, setMatches] = useState([])
  const set = patch => onChange({ ...party, ...patch })

  useEffect(() => {
    if (party.fullName.trim().length < 3) { setMatches([]); return }
    const t = setTimeout(() => api('/persons/lookup?name=' + encodeURIComponent(party.fullName.trim())).then(setMatches).catch(() => {}), 400)
    return () => clearTimeout(t)
  }, [party.fullName])

  const [found, setFound] = useState(null)
  const [idMsg, setIdMsg] = useState('')
  const findById = async () => {
    const id = party.employeeId.trim(); setFound(null); setIdMsg('')
    if (!id) return
    try {
      const m = await api('/persons/by-employee-id?id=' + encodeURIComponent(id))
      setFound(m); set({ fullName: m.fullName, churchName: m.churchName, phone: m.phone || party.phone, workingStatus: m.workingStatus })
    } catch (x) { setIdMsg(x.message && x.message.includes('valid') ? x.message : t('No one with this number yet. Fill in the details below; a new employee ID is created when the case is saved.')) }
  }

  const [q, setQ] = useState('')
  const [hits, setHits] = useState([])
  useEffect(() => {
    if (q.trim().length < 3) { setHits([]); return }
    const h = setTimeout(() => api('/persons/lookup?name=' + encodeURIComponent(q.trim())).then(setHits).catch(() => {}), 350)
    return () => clearTimeout(h)
  }, [q])
  const pick = m => {
    setFound(m); setIdMsg(''); setQ(''); setHits([])
    set({ employeeId: m.employeeId || party.employeeId, fullName: m.fullName, churchName: m.churchName, phone: m.phone || party.phone, workingStatus: m.workingStatus })
  }

  const exact = matches.filter(m => m.fullName.toLowerCase() === party.fullName.trim().toLowerCase())
  const use = m => set({ fullName: m.fullName, churchName: m.churchName, phone: m.phone || party.phone, workingStatus: m.workingStatus })

  return (
    <div className="issue">
      <div className="top"><b>{title}</b>{onRemove && <button type="button" className="btn x" onClick={onRemove}>Remove</button>}</div>
      <label>{t('Find an existing person')}</label>
      <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('Name, phone or ID number')} maxLength={80} />
      {hits.length > 0 && <div className="pickbox">{hits.map(m =>
        <button type="button" key={m.id} className="pickrow" onClick={() => pick(m)}>
          <b>{m.fullName}</b><span>{[m.employeeId && fmtId(m.employeeId), m.churchName, m.phone].filter(Boolean).join(' · ')}</span>
        </button>)}</div>}
      {q.trim().length >= 3 && hits.length === 0 && <small className="muted">{t('No one found. Fill in the details below to add a new person.')}</small>}
      <label>{t('Employee ID (12 digits) or the church’s own number')}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={party.employeeId} onChange={e => { setFound(null); setIdMsg(''); set({ employeeId: e.target.value }) }} onBlur={() => !found && findById()}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); findById() } }} maxLength={40} placeholder="0000 0000 0000" autoCapitalize="characters" />
        <button type="button" className="btn ghost sm" style={{ margin: 0 }} onClick={findById} disabled={!party.employeeId.trim()}>🔎 Find</button>
      </div>
      {found && <div className="banner"><b>✅ {t('Employee found')} 🪪 {fmtId(found.employeeId)}</b> {t('{a} · {b} · in {c} cases ({d} still active)', { a: found.fullName, b: found.churchName, c: found.totalCases, d: found.openCases })}
        {found.complaintsAgainst > 0 && <div className="warn">⚠️ {t('{n} earlier cases are about this person', { n: found.complaintsAgainst })}</div>}</div>}
      {idMsg && <small className="muted">{idMsg}</small>}
      <label>Full name</label>
      <input value={party.fullName} onChange={e => set({ fullName: e.target.value })} maxLength={160} autoFocus={autoFocus} />
      {exact.map(m => (
        <div className="banner" key={m.id}>
          <b>👋 {t('Already on record:')}</b> {t('{a} · {b} · in {c} cases ({d} still active)', { a: m.fullName, b: m.churchName, c: m.totalCases, d: m.openCases })}
          {m.complaintsAgainst > 0 && <div className="warn">⚠️ {t('{n} earlier cases are about this person', { n: m.complaintsAgainst })}</div>}
          <div><button type="button" className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => use(m)}>Use these details</button></div>
        </div>
      ))}
      <div className="grid">
        <div><label>Church</label><input list="church-list" value={party.churchName} onChange={e => set({ churchName: e.target.value })} placeholder="Start typing…" /></div>
        <div><label>Phone (optional)</label><input value={party.phone} onChange={e => set({ phone: e.target.value })} inputMode="tel" maxLength={40} /></div>
      </div>
      <label>This person is</label>
      <Chips options={WORKING} value={party.workingStatus} onChange={v => set({ workingStatus: v })} />
    </div>
  )
}

export default function NewCase({ me, onCreated, goChurches }) {
  const [complainants, setComplainants] = useState([blankParty()])
  const [subjects, setSubjects] = useState([])
  const [issues, setIssues] = useState([blankIssue()])
  const [notes, setNotes] = useState('')
  const [letter, setLetter] = useState(false)
  const [churches, setChurches] = useState([])
  const [departments, setDepartments] = useState([])
  const [files, setFiles] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/churches').then(setChurches).catch(e => setErr(e.message))
    api('/departments').then(d => setDepartments(d.filter(x => x.active))).catch(() => {})
  }, [])

  const setAt = (setter, i) => v => setter(l => l.map((x, k) => (k === i ? v : x)))
  const removeAt = (setter, i) => () => setter(l => l.filter((_, k) => k !== i))
  const setIssue = (i, patch) => setIssues(l => l.map((x, k) => (k === i ? { ...x, ...patch } : x)))
  const findChurch = name => churches.find(c => c.name.toLowerCase() === name.trim().toLowerCase())

  const toPayload = (p, label) => {
    const church = findChurch(p.churchName)
    if (!church) throw new Error(t('{x}: please choose the church from the list (start typing its name).', { x: label }))
    return { fullName: p.fullName.trim(), churchId: church.id, phone: p.phone, workingStatus: p.workingStatus, employeeId: p.employeeId.trim() || null }
  }

  const submit = async e => {
    e.preventDefault(); setErr('')
    try {
      const comp = complainants.map((p, i) => {
        if (!p.fullName.trim()) throw new Error(t('{x}: please enter the name.', { x: t('Person {n} reporting', { n: i + 1 }) }))
        return toPayload(p, t('Person {n} reporting', { n: i + 1 }))
      })
      const subj = subjects.filter(p => p.fullName.trim()).map((p, i) => toPayload(p, t('Person {n} it is about', { n: i + 1 })))
      const bad = issues.findIndex(i => i.category !== 'UNCLEAR' && !i.description.trim())
      if (bad >= 0) throw new Error(t('Issue {n}: please describe the cause, or mark it “Not clear yet”.', { n: bad + 1 }))
      setBusy(true)
      const payload = issues.map(i => ({
        category: i.category, description: i.description,
        departmentId: i.departmentId ? Number(i.departmentId) : null, returnOn: i.departmentId ? i.returnOn || null : null,
      }))
      const c = await api('/cases', { method: 'POST', body: { complainants: comp, subjects: subj, issues: payload, discussionNotes: notes, letterIssued: letter } })
      // the case exists now, so attach the files one by one; a failed file never loses the case
      const failed = []
      for (const f of files) { try { await upload(`/cases/${c.id}/files`, f) } catch (x) { failed.push(f.name + ': ' + x.message) } }
      onCreated(c.id, failed)
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit}>
      <h1>Register a case</h1><p className="muted">Listen first, then record. A short code is created when you save.</p>
      {err && <div className="err">{err}</div>}
      <datalist id="church-list">{churches.map(c => <option key={c.id} value={c.name} />)}</datalist>
      {churches.length === 0 && <div className="banner warn">No churches yet. {me.role === 'ADMIN' ? <a href="#" onClick={e => { e.preventDefault(); goChurches() }}>Add the church list first →</a> : 'Ask an administrator to add the church list.'}</div>}

      <div className="formgrid">
      <div className="card">
        <h2><span className="num">1</span>Who is reporting?</h2>
        <p className="hint">One employee, a group of employees asking together, or a church member who is not an employee. Add everyone who came.</p>
        {complainants.map((p, i) => (
          <PartyEditor key={i} title={complainants.length > 1 ? t('Person {n}', { n: i + 1 }) : t('Person reporting')} party={p} churches={churches} autoFocus={i === 0}
            onChange={setAt(setComplainants, i)} onRemove={complainants.length > 1 ? removeAt(setComplainants, i) : null} />
        ))}
        <button type="button" className="btn ghost" onClick={() => setComplainants(l => [...l, blankParty(l[0]?.workingStatus)])}>➕ Add another person (group)</button>
      </div>

      <div className="card">
        <h2><span className="num">2</span>Who is it about? <small className="inl">(optional)</small></h2>
        <p className="hint">If the report is about an employee or a leader, add them here. Leave empty for a request or general matter.</p>
        {subjects.map((p, i) => (
          <PartyEditor key={i} title={t('Person {n} it is about', { n: i + 1 })} party={p} churches={churches}
            onChange={setAt(setSubjects, i)} onRemove={removeAt(setSubjects, i)} />
        ))}
        <button type="button" className="btn ghost" onClick={() => setSubjects(l => [...l, blankParty()])}>➕ Add an employee or leader</button>
      </div>

      <div className="card">
        <h2><span className="num">3</span>What are the issues?</h2>
        <p className="hint">Add each issue separately. Not sure yet? Choose “Not clear yet”.</p>
        {issues.map((it, i) => (
          <div className="issue" key={i}>
            <div className="top"><b>{t('Issue {n}', { n: i + 1 })}</b>{issues.length > 1 && <button type="button" className="btn x" onClick={() => setIssues(l => l.filter((_, k) => k !== i))}>Remove</button>}</div>
            <select value={it.category} onChange={e => setIssue(i, { category: e.target.value })}>
              {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <textarea rows={3} placeholder="Describe the cause…" value={it.description} maxLength={4000} onChange={e => setIssue(i, { description: e.target.value })} />
            {departments.length > 0 && (
              <div className="grid" style={{ marginTop: 8 }}>
                <div><label>Send to a department now? (optional)</label>
                  <select value={it.departmentId} onChange={e => setIssue(i, { departmentId: e.target.value })}>
                    <option value="">Keep with the desk for now</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}{d.handlesCategory === it.category ? ' ★' : ''}</option>)}
                  </select></div>
                {it.departmentId && <div><label>Person comes back on</label><input type="date" min={todayStr()} value={it.returnOn} onChange={e => setIssue(i, { returnOn: e.target.value })} /></div>}
              </div>
            )}
          </div>
        ))}
        {issues.length >= 3 && <div className="banner">📎 {t('{n} issues in one case. Consider noting which one is most urgent.', { n: issues.length })}</div>}
        <button type="button" className="btn ghost" onClick={() => setIssues(l => [...l, blankIssue()])}>➕ Add another issue</button>
      </div>

      <div className="card">
        <h2><span className="num">4</span>Discussion &amp; letter</h2>
        <label>Discussion notes</label>
        <textarea rows={4} value={notes} maxLength={8000} onChange={e => setNotes(e.target.value)} placeholder="What was discussed and agreed…" />
        <label className="check"><input type="checkbox" checked={letter} onChange={e => setLetter(e.target.checked)} /> ✉️ A letter has been issued</label>
      </div>

      <div className="card">
        <h2><span className="num">5</span>Documents <small className="inl">(optional)</small></h2>
        <p className="hint">Attach the letter, scans or evidence. They are saved with the case.</p>
        {files.map((f, k) => (
          <div className="filerow" key={k}><span className="iicon">📄</span><div className="grow"><div className="fname">{f.name}</div><small>{fmtSize(f.size)}</small></div>
            <button type="button" className="btn x" onClick={() => setFiles(l => l.filter((_, j) => j !== k))}>Remove</button></div>
        ))}
        <label className="drop">📎 Choose files (PDF, image, Word, Excel · up to 10 MB each)
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt" onChange={e => { const picked = Array.from(e.target.files); e.target.value = ''; setFiles(l => [...l, ...picked]) }} /></label>
      </div>

      </div>

      <button className="btn big" disabled={busy}>{busy ? 'Saving…' : '💾 Save case and get code'}</button>
    </form>
  )
}
