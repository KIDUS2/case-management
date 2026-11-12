import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { CATEGORY, WORKING } from '../ui.js'

const blankParty = (status = 'ACTIVE_EMPLOYEE') => ({ fullName: '', churchName: '', phone: '', workingStatus: status })

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

  const exact = matches.filter(m => m.fullName.toLowerCase() === party.fullName.trim().toLowerCase())
  const use = m => set({ fullName: m.fullName, churchName: m.churchName, phone: m.phone || party.phone, workingStatus: m.workingStatus })

  return (
    <div className="issue">
      <div className="top"><b>{title}</b>{onRemove && <button type="button" className="btn x" onClick={onRemove}>Remove</button>}</div>
      <label>Full name</label>
      <input value={party.fullName} onChange={e => set({ fullName: e.target.value })} maxLength={160} autoFocus={autoFocus} />
      {exact.map(m => (
        <div className="banner" key={m.id}>
          <b>👋 Already on record:</b> {m.fullName} · {m.churchName} · in {m.totalCases} case{m.totalCases === 1 ? '' : 's'} ({m.openCases} still active)
          {m.complaintsAgainst > 0 && <div className="warn">⚠️ {m.complaintsAgainst} earlier case{m.complaintsAgainst === 1 ? ' is' : 's are'} about this person</div>}
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
  const [issues, setIssues] = useState([{ category: 'HR', description: '' }])
  const [notes, setNotes] = useState('')
  const [letter, setLetter] = useState(false)
  const [churches, setChurches] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api('/churches').then(setChurches).catch(e => setErr(e.message)) }, [])

  const setAt = (setter, i) => v => setter(l => l.map((x, k) => (k === i ? v : x)))
  const removeAt = (setter, i) => () => setter(l => l.filter((_, k) => k !== i))
  const setIssue = (i, patch) => setIssues(l => l.map((x, k) => (k === i ? { ...x, ...patch } : x)))
  const findChurch = name => churches.find(c => c.name.toLowerCase() === name.trim().toLowerCase())

  const toPayload = (p, label) => {
    const church = findChurch(p.churchName)
    if (!church) throw new Error(`${label}: please choose the church from the list (start typing its name).`)
    return { fullName: p.fullName.trim(), churchId: church.id, phone: p.phone, workingStatus: p.workingStatus }
  }

  const submit = async e => {
    e.preventDefault(); setErr('')
    try {
      const comp = complainants.map((p, i) => {
        if (!p.fullName.trim()) throw new Error(`Person ${i + 1} reporting: please enter the name.`)
        return toPayload(p, `Person ${i + 1} reporting`)
      })
      const subj = subjects.filter(p => p.fullName.trim()).map((p, i) => toPayload(p, `Person ${i + 1} it is about`))
      const bad = issues.findIndex(i => i.category !== 'UNCLEAR' && !i.description.trim())
      if (bad >= 0) throw new Error(`Issue ${bad + 1}: please describe the cause, or mark it “Not clear yet”.`)
      setBusy(true)
      const c = await api('/cases', { method: 'POST', body: { complainants: comp, subjects: subj, issues, discussionNotes: notes, letterIssued: letter } })
      onCreated(c.id)
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit}>
      <h1>Register a case</h1><p className="muted">Listen first, then record. A short code is created when you save.</p>
      {err && <div className="err">{err}</div>}
      <datalist id="church-list">{churches.map(c => <option key={c.id} value={c.name} />)}</datalist>
      {churches.length === 0 && <div className="banner warn">No churches yet. {me.role === 'ADMIN' ? <a href="#" onClick={e => { e.preventDefault(); goChurches() }}>Add the church list first →</a> : 'Ask an administrator to add the church list.'}</div>}

      <div className="card">
        <h2><span className="num">1</span>Who is reporting?</h2>
        <p className="hint">One employee, a group of employees asking together, or a church member who is not an employee. Add everyone who came.</p>
        {complainants.map((p, i) => (
          <PartyEditor key={i} title={complainants.length > 1 ? `Person ${i + 1}` : 'Person reporting'} party={p} churches={churches} autoFocus={i === 0}
            onChange={setAt(setComplainants, i)} onRemove={complainants.length > 1 ? removeAt(setComplainants, i) : null} />
        ))}
        <button type="button" className="btn ghost" onClick={() => setComplainants(l => [...l, blankParty(l[0]?.workingStatus)])}>➕ Add another person (group)</button>
      </div>

      <div className="card">
        <h2><span className="num">2</span>Who is it about? <small className="inl">(optional)</small></h2>
        <p className="hint">If the report is about an employee or a leader, add them here. Leave empty for a request or general matter.</p>
        {subjects.map((p, i) => (
          <PartyEditor key={i} title={`Person ${i + 1} it is about`} party={p} churches={churches}
            onChange={setAt(setSubjects, i)} onRemove={removeAt(setSubjects, i)} />
        ))}
        <button type="button" className="btn ghost" onClick={() => setSubjects(l => [...l, blankParty()])}>➕ Add an employee or leader</button>
      </div>

      <div className="card">
        <h2><span className="num">3</span>What are the issues?</h2>
        <p className="hint">Add each issue separately. Not sure yet? Choose “Not clear yet”.</p>
        {issues.map((it, i) => (
          <div className="issue" key={i}>
            <div className="top"><b>Issue {i + 1}</b>{issues.length > 1 && <button type="button" className="btn x" onClick={() => setIssues(l => l.filter((_, k) => k !== i))}>Remove</button>}</div>
            <select value={it.category} onChange={e => setIssue(i, { category: e.target.value })}>
              {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <textarea rows={3} placeholder="Describe the cause…" value={it.description} maxLength={4000} onChange={e => setIssue(i, { description: e.target.value })} />
          </div>
        ))}
        {issues.length >= 3 && <div className="banner">📎 {issues.length} issues in one case. Consider noting which one is most urgent.</div>}
        <button type="button" className="btn ghost" onClick={() => setIssues(l => [...l, { category: 'HR', description: '' }])}>➕ Add another issue</button>
      </div>

      <div className="card">
        <h2><span className="num">4</span>Discussion &amp; letter</h2>
        <label>Discussion notes</label>
        <textarea rows={4} value={notes} maxLength={8000} onChange={e => setNotes(e.target.value)} placeholder="What was discussed and agreed…" />
        <label className="check"><input type="checkbox" checked={letter} onChange={e => setLetter(e.target.checked)} /> ✉️ A letter has been issued</label>
      </div>

      <button className="btn big" disabled={busy}>{busy ? 'Saving…' : '💾 Save case and get code'}</button>
    </form>
  )
}
