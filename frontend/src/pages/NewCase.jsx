import { useEffect, useState } from 'react'
import { api, upload } from '../api.js'
import { t } from '../i18n.js'
import GroupSheet, { blankRow } from '../components/GroupSheet.jsx'
import { askConfirm } from '../dialog.js'
import AppointmentPicker from '../components/AppointmentPicker.jsx'
import { CATEGORY, catOptions, WORKING, addDays, todayStr, fmtSize, fmtId } from '../ui.js'

const blankIssue = () => ({ category: 'HR', description: '', departmentId: '', returnOn: addDays(todayStr(), 7) })
const blankParty = (status = 'ACTIVE_EMPLOYEE') => ({ employeeId: '', fullName: '', churchName: '', phone: '', extraPhones: [], phoneExempt: false, workingStatus: status, sebekaGubayeNo: '' })

function Chips({ options, value, onChange }) {
  return <div className="chips">{Object.entries(options).map(([k, v]) =>
    <button type="button" key={k} className={'chip' + (value === k ? ' on' : '')} onClick={() => onChange(k)}>{v}</button>)}</div>
}

function PartyEditor({ title, party, onChange, onRemove, churches, autoFocus, isAdmin, sub, needId }) {
  const [matches, setMatches] = useState([])
  const set = patch => onChange({ ...party, ...patch })

  useEffect(() => {
    if (sub || party.fullName.trim().length < 3) { setMatches([]); return }
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
      setFound(m); set({ fullName: m.fullName, churchName: m.churchName, phone: m.phone || party.phone, extraPhones: m.extraPhones?.length ? m.extraPhones : party.extraPhones, phoneExempt: !!m.phoneExempt, workingStatus: m.workingStatus })
    } catch (x) { setIdMsg(x.message && x.message.includes('valid') ? x.message : t('No one with this number yet. Fill in the details below; a new employee ID is created when the case is saved.')) }
  }

  const [q, setQ] = useState('')
  const [hits, setHits] = useState([])
  useEffect(() => {
    if (sub || q.trim().length < 3) { setHits([]); return }
    const h = setTimeout(() => api('/persons/lookup?name=' + encodeURIComponent(q.trim())).then(setHits).catch(() => {}), 350)
    return () => clearTimeout(h)
  }, [q])
  const pick = m => {
    setFound(m); setIdMsg(''); setQ(''); setHits([])
    set({ employeeId: m.employeeId || party.employeeId, fullName: m.fullName, churchName: m.churchName, phone: m.phone || party.phone, extraPhones: m.extraPhones?.length ? m.extraPhones : party.extraPhones, phoneExempt: !!m.phoneExempt, workingStatus: m.workingStatus })
  }

  const chosen = churches.find(c => c.name.toLowerCase() === party.churchName.trim().toLowerCase())
  const exact = matches.filter(m => m.fullName.toLowerCase() === party.fullName.trim().toLowerCase())
  const use = m => set({ fullName: m.fullName, churchName: m.churchName, phone: m.phone || party.phone, extraPhones: m.extraPhones?.length ? m.extraPhones : party.extraPhones, phoneExempt: !!m.phoneExempt, workingStatus: m.workingStatus })

  return (
    <div className="issue">
      <div className="top"><b>{title}</b>{onRemove && <button type="button" className="btn x" onClick={onRemove}>Remove</button>}</div>
      {!sub && <><label>{t('Find an existing person')}</label>
      <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('Name, phone or ID number')} maxLength={80} /></>}
      {hits.length > 0 && <div className="pickbox">{hits.map(m =>
        <button type="button" key={m.id} className="pickrow" onClick={() => pick(m)}>
          <b>{m.fullName}</b><span>{[m.employeeId && fmtId(m.employeeId), m.churchName, m.phone].filter(Boolean).join(' · ')}</span>
        </button>)}</div>}
      {q.trim().length >= 3 && hits.length === 0 && <small className="muted">{t('No one found. Fill in the details below to add a new person.')}</small>}
      {party.workingStatus === 'CHURCH_MEMBER' ? <>
        <label>{t('Sebeka Gubaye number')}{needId && <span className="req"> *</span>}</label>
        <input value={party.sebekaGubayeNo || ''} onChange={e => set({ sebekaGubayeNo: e.target.value })} maxLength={40} required={!!needId} placeholder={t('Number on the Sebeka Gubaye card')} />
        <small className="muted">{t('Asked for people who are not employees.')}</small></>
      : sub ? <>
        <label>{t('Employee ID')}{needId && <span className="req"> *</span>}</label>
        <input value={party.employeeId} onChange={e => set({ employeeId: e.target.value })} maxLength={40} required={!!needId} placeholder="0000 0000 0000" autoCapitalize="characters" /></>
      : <><label>{t('Employee ID (12 digits) or the church’s own number')}{needId && <span className="req"> *</span>}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={party.employeeId} onChange={e => { setFound(null); setIdMsg(''); set({ employeeId: e.target.value }) }} onBlur={() => !found && findById()}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); findById() } }} maxLength={40} placeholder="0000 0000 0000" autoCapitalize="characters" required={!!needId} />
        <button type="button" className="btn ghost sm" style={{ margin: 0 }} onClick={findById} disabled={!party.employeeId.trim()}>🔎 Find</button>
      </div></>}
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
        <div><label>Church</label><input list="church-list" value={party.churchName} onChange={e => set({ churchName: e.target.value })} placeholder="Start typing…" />
          {chosen && <small className={'subnote' + (chosen.subCity ? '' : ' warn')}>📍 {chosen.subCity ? t('Sub-city: {x}', { x: chosen.subCity }) : t('Sub-city not set for this church yet. Ask the administrator to set it in Churches.')}</small>}</div>
        <div><label>{t('Phone number')}{!party.phoneExempt && <span className="req"> *</span>}</label>
          <input value={party.phone} onChange={e => set({ phone: e.target.value })} inputMode="tel" maxLength={40} required={!party.phoneExempt} placeholder="09…" /></div>
      </div>
      {(party.extraPhones || []).map((ph, k) => (
        <div className="phrow" key={k}>
          <input value={ph} onChange={e => set({ extraPhones: party.extraPhones.map((x, j) => (j === k ? e.target.value : x)) })} inputMode="tel" maxLength={40} placeholder={t('Another phone number (optional)')} aria-label={t('Another phone number (optional)')} />
          <button type="button" className="btn ghost sm" onClick={() => set({ extraPhones: party.extraPhones.filter((_, j) => j !== k) })} aria-label={t('Remove')}>✕</button>
        </div>
      ))}
      <div className="phtools">
        {(party.extraPhones || []).length < 5 && <button type="button" className="btn ghost sm" onClick={() => set({ extraPhones: [...(party.extraPhones || []), ''] })}>➕ {t('Add another phone number')}</button>}
        {isAdmin && <label className="chk"><input type="checkbox" checked={!!party.phoneExempt} onChange={e => set({ phoneExempt: e.target.checked })} /> {t('This person has no phone (admin allows it)')}</label>}
      </div>
      <label>This person is</label>
      <Chips options={WORKING} value={party.workingStatus} onChange={v => set({ workingStatus: v })} />
    </div>
  )
}

export default function NewCase({ me, onCreated, goChurches }) {
  const [complainants, setComplainants] = useState([blankParty()])
  const [size, setSize] = useState('1')              // 1, 2, 3 or 'many' (more than 3)
  const [expected, setExpected] = useState(4)         // how many people are expected when the group is big
  const [rows, setRows] = useState([blankRow(), blankRow(), blankRow()]) // the people after the first, for a big group
  const many = size === 'many'
  const [subjects, setSubjects] = useState([])
  const [issues, setIssues] = useState([blankIssue()])
  const [notes, setNotes] = useState('')
  const [letter, setLetter] = useState(false)
  const [charity, setCharity] = useState(false)   // a request for help, not an issue
  const [solved, setSolved] = useState(false)     // sub-city only: already solved at the sub-city
  const [solution, setSolution] = useState('')
  const [churches, setChurches] = useState([])
  const [departments, setDepartments] = useState([])
  const [files, setFiles] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const sub = me.role === 'SUBCITY'   // a sub-city office submits for review instead of registering

  useEffect(() => {
    api('/churches').then(setChurches).catch(e => setErr(e.message))
    if (!sub) api('/departments').then(d => setDepartments(d.filter(x => x.active))).catch(() => {})
  }, [])

  // picking 1, 2 or 3 shows that many full forms; "more than 3" switches to the compact list
  const pickSize = k => {
    if (k === 'many') { setExpected(e => Math.max(4, e, complainants.length)); setSize('many'); return }
    const n = Number(k)
    setSize(k)
    setComplainants(l => {
      const kept = l.slice(0, Math.max(n, l.filter((p, i) => i === 0 || p.fullName.trim()).length))
      return kept.length >= n ? kept : [...kept, ...Array.from({ length: n - kept.length }, () => blankParty(l[0]?.workingStatus))]
    })
  }
  const setAt = (setter, i) => v => setter(l => l.map((x, k) => (k === i ? v : x)))
  const removeAt = (setter, i) => () => setter(l => l.filter((_, k) => k !== i))
  const setIssue = (i, patch) => setIssues(l => l.map((x, k) => (k === i ? { ...x, ...patch } : x)))
  const findChurch = name => churches.find(c => c.name.toLowerCase() === name.trim().toLowerCase())

  const toPayload = (p, label, needId) => {
    if (needId && p.workingStatus === 'CHURCH_MEMBER' && !(p.sebekaGubayeNo || '').trim()) throw new Error(t('{x}: please enter the Sebeka Gubaye number.', { x: label }))
    if (needId && p.workingStatus !== 'CHURCH_MEMBER' && !p.employeeId.trim()) throw new Error(t('{x}: please enter the Employee ID.', { x: label }))
    const church = findChurch(p.churchName)
    if (!church) throw new Error(t('{x}: please choose the church from the list (start typing its name).', { x: label }))
    if (!p.phoneExempt && !p.phone.trim()) throw new Error(t('{x}: please enter a phone number.', { x: label }))
    return { fullName: p.fullName.trim(), churchId: church.id, phone: p.phone.trim(), extraPhones: (p.extraPhones || []).map(x => x.trim()).filter(Boolean), phoneExempt: !!p.phoneExempt, workingStatus: p.workingStatus, employeeId: p.workingStatus === 'CHURCH_MEMBER' ? null : p.employeeId.trim() || null, sebekaGubayeNo: p.workingStatus === 'CHURCH_MEMBER' ? (p.sebekaGubayeNo || '').trim() || null : null }
  }

  const submit = async e => {
    e.preventDefault(); setErr('')
    try {
      // for a big group, the people after the first use the first person's church and kind; empty lines are ignored
      const lead = complainants[0]
      const people = many
        ? [lead, ...rows.filter(r => r.fullName.trim() || r.phone.trim() || r.idNo.trim()).map(r => ({ ...blankParty(lead.workingStatus), churchName: lead.churchName, workingStatus: lead.workingStatus, fullName: r.fullName, phone: r.phone, employeeId: lead.workingStatus === 'CHURCH_MEMBER' ? '' : r.idNo, sebekaGubayeNo: lead.workingStatus === 'CHURCH_MEMBER' ? r.idNo : '' }))]
        : complainants
      const comp = people.map((p, i) => {
        if (!p.fullName.trim()) throw new Error(t('{x}: please enter the name.', { x: t('Person {n} reporting', { n: i + 1 }) }))
        return toPayload(p, t('Person {n} reporting', { n: i + 1 }), true)
      })
      if (many && comp.length < expected && !(await askConfirm(t('Only {a} of {b} people are listed. Save the case now? You can add the others later from the case page.', { a: comp.length, b: expected }), { title: t('Not everyone is listed'), confirmText: t('Save anyway') }))) return
      const subj = subjects.filter(p => p.fullName.trim()).map((p, i) => toPayload(p, t('Person {n} it is about', { n: i + 1 })))
      const bad = issues.findIndex(i => (charity || i.category !== 'UNCLEAR') && !i.description.trim())
      if (bad >= 0) throw new Error(charity ? t('Please write what help is needed.') : t('Issue {n}: please describe the cause, or mark it “Not clear yet”.', { n: bad + 1 }))
      if (sub && solved && !solution.trim()) throw new Error(t('Please write what the sub-city did to solve it.'))
      setBusy(true)
      const payload = issues.map(i => ({
        category: i.category, description: i.description,
        departmentId: i.departmentId ? Number(i.departmentId) : null, returnOn: i.departmentId ? i.returnOn || null : null,
      }))
      const c = await api(sub ? '/cases/submit' : '/cases', { method: 'POST', body: { complainants: comp, subjects: subj, issues: payload, discussionNotes: notes, letterIssued: letter, kind: charity ? 'CHARITY' : 'ISSUE', expectedPeople: many ? expected : null, localSolution: sub && solved ? solution.trim() : null } })
      // the case exists now, so attach the files one by one; a failed file never loses the case
      const failed = []
      for (const f of files) { try { await upload(`/cases/${c.id}/files`, f) } catch (x) { failed.push(f.name + ': ' + x.message) } }
      onCreated(c.id, failed)
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit}>
      <h1>{sub ? t('Submit a case') : 'Register a case'}</h1>
      <p className="muted">{sub ? t('Cases from {x} are sent to the diocese for review. You will be told when it is accepted or returned.', { x: me.subCity || '' }) : 'Listen first, then record. A short code is created when you save.'}</p>
      {err && <div className="err">{err}</div>}
      <datalist id="church-list">{churches.map(c => <option key={c.id} value={c.name} label={c.subCity || ''} />)}</datalist>
      {churches.length === 0 && <div className="banner warn">No churches yet. {me.role === 'ADMIN' ? <a href="#" onClick={e => { e.preventDefault(); goChurches() }}>Add the church list first →</a> : 'Ask an administrator to add the church list.'}</div>}
      {sub && churches.length > 0 && <div className="banner">📍 {t('You can choose churches of {x} only.', { x: me.subCity || '' })}</div>}

      <div className="kindpick" role="radiogroup" aria-label={t('What kind of case is it?')}>
        <button type="button" role="radio" aria-checked={!charity} className={'kind' + (!charity ? ' on' : '')} onClick={() => setCharity(false)}><b>⚖️ {t('A problem to solve')}</b><small>{t('A complaint, a dispute or a matter that needs a decision.')}</small></button>
        <button type="button" role="radio" aria-checked={charity} className={'kind' + (charity ? ' on' : '')} onClick={() => setCharity(true)}><b>🤝 {t('A charity request')}</b><small>{t('Someone asks the church for help. It is not an issue.')}</small></button>
      </div>

      <div className="formgrid">
      <div className="card">
        <h2><span className="num">1</span>Who is reporting?</h2>
        <p className="hint">One employee, a group of employees asking together, or a church member who is not an employee. Add everyone who came.</p>
        <div className="sizepick" role="radiogroup" aria-label={t('How many people are reporting?')}>
          <span>{t('How many people are reporting?')}</span>
          {['1', '2', '3', 'many'].map(k => <button type="button" key={k} role="radio" aria-checked={size === k} className={'chip' + (size === k ? ' on' : '')} onClick={() => pickSize(k)}>{k === 'many' ? t('More than 3') : k}</button>)}
          {many && <label className="expect">{t('How many are expected?')}<input type="number" min={4} max={1000} value={expected} onChange={e => setExpected(Math.max(4, Math.min(1000, Number(e.target.value) || 4)))} /></label>}
        </div>
        {many ? (
          <>
            <PartyEditor title={t('Person 1')} party={complainants[0]} churches={churches} isAdmin={me.role === 'ADMIN'} sub={sub} needId autoFocus onChange={setAt(setComplainants, 0)} onRemove={null} />
            <GroupSheet rows={rows} onChange={setRows} expected={expected} idLabel={complainants[0].workingStatus === 'CHURCH_MEMBER' ? t('Sebeka Gubaye number') : t('Employee ID')} />
          </>
        ) : (
          <>
            {complainants.map((p, i) => (
              <PartyEditor key={i} title={complainants.length > 1 ? t('Person {n}', { n: i + 1 }) : t('Person reporting')} party={p} churches={churches} isAdmin={me.role === 'ADMIN'} sub={sub} needId autoFocus={i === 0}
                onChange={setAt(setComplainants, i)} onRemove={complainants.length > 1 ? removeAt(setComplainants, i) : null} />
            ))}
            <button type="button" className="btn ghost" onClick={() => { setComplainants(l => [...l, blankParty(l[0]?.workingStatus)]); if (complainants.length >= 3) setSize('many') }}>➕ Add another person (group)</button>
          </>
        )}
      </div>

      <div className="card">
        <h2><span className="num">2</span>Who is it about? <small className="inl">(optional)</small></h2>
        <p className="hint">If the report is about an employee or a leader, add them here. Leave empty for a request or general matter.</p>
        {subjects.map((p, i) => (
          <PartyEditor key={i} title={t('Person {n} it is about', { n: i + 1 })} party={p} churches={churches} isAdmin={me.role === 'ADMIN'} sub={sub}
            onChange={setAt(setSubjects, i)} onRemove={removeAt(setSubjects, i)} />
        ))}
        <button type="button" className="btn ghost" onClick={() => setSubjects(l => [...l, blankParty()])}>➕ Add an employee or leader</button>
      </div>

      <div className="card">
        <h2><span className="num">3</span>{charity ? t('What help is needed?') : 'What are the issues?'}</h2>
        <p className="hint">{charity ? t('Write what the person needs and why. The desk decides how the church can help.') : 'Add each issue separately. Not sure yet? Choose “Not clear yet”.'}</p>
        {issues.map((it, i) => (
          <div className="issue" key={i}>
            <div className="top"><b>{t('Issue {n}', { n: i + 1 })}</b>{issues.length > 1 && <button type="button" className="btn x" onClick={() => setIssues(l => l.filter((_, k) => k !== i))}>Remove</button>}</div>
            {!charity && <select value={it.category} onChange={e => setIssue(i, { category: e.target.value })}>
              {catOptions().filter(([k]) => k !== 'CHARITY').map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>}
            <textarea rows={3} placeholder={charity ? t('What help does the person need?') : 'Describe the cause…'} value={it.description} maxLength={4000} onChange={e => setIssue(i, { description: e.target.value })} />
            {!sub && departments.length > 0 && (
              <div className="grid" style={{ marginTop: 8 }}>
                <div><label>Send to a department now? (optional)</label>
                  <select value={it.departmentId} onChange={e => setIssue(i, { departmentId: e.target.value })}>
                    <option value="">Keep with the desk for now</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}{d.handlesCategory === it.category ? ' ★' : ''}</option>)}
                  </select></div>
                {it.departmentId && <div style={{ gridColumn: '1 / -1' }}><label>{t('Appointment day')}</label><AppointmentPicker value={it.returnOn} onChange={v => setIssue(i, { returnOn: v })} /></div>}
              </div>
            )}
          </div>
        ))}
        {issues.length >= 3 && <div className="banner">📎 {t('{n} issues in one case. Consider noting which one is most urgent.', { n: issues.length })}</div>}
        {!charity && <button type="button" className="btn ghost" onClick={() => setIssues(l => [...l, blankIssue()])}>➕ Add another issue</button>}
        {sub && (
          <div className="solvedbox">
            <label className="chk"><input type="checkbox" checked={solved} onChange={e => setSolved(e.target.checked)} /> 🏙️ {t('We already solved this at the sub-city')}</label>
            {solved && <><textarea rows={3} value={solution} maxLength={4000} onChange={e => setSolution(e.target.value)} placeholder={t('What did the sub-city do?')} />
              <small className="muted">{t('The case is shared with the diocese with your solution, so the head diocese knows.')}</small></>}
          </div>
        )}
      </div>

      <div className="card">
        <h2><span className="num">4</span>Discussion &amp; letter</h2>
        <label>Discussion notes</label>
        <textarea rows={4} value={notes} maxLength={8000} onChange={e => setNotes(e.target.value)} placeholder="What was discussed and agreed…" />
        {!sub && <label className="check"><input type="checkbox" checked={letter} onChange={e => setLetter(e.target.checked)} /> ✉️ A letter has been issued</label>}
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

      <div className="savebar">
        <p className="savehint"><span className="savedot" />{sub ? t('The diocese reviews your case before it moves on.') : t('A case code is created when you save. You can print the receipt right after.')}</p>
        <button className="savebtn" disabled={busy}>
          {busy ? <span className="spin" aria-hidden="true" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>}
          <span>{busy ? t('Saving…') : sub ? t('Submit for review') : t('Save case')}</span>
        </button>
      </div>
    </form>
  )
}
