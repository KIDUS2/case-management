import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { CATEGORY, WORKING, ROLE } from '../ui.js'

const blank = { fullName: '', churchName: '', phone: '', workingStatus: 'ACTIVE_EMPLOYEE', roleInCase: 'EMPLOYEE', discussionNotes: '', letterIssued: false }

function Chips({ options, value, onChange }) {
  return <div className="chips">{Object.entries(options).map(([k, v]) =>
    <button type="button" key={k} className={'chip' + (value === k ? ' on' : '')} onClick={() => onChange(k)}>{v}</button>)}</div>
}

export default function NewCase({ me, onCreated, goChurches }) {
  const [f, setF] = useState(blank)
  const [issues, setIssues] = useState([{ category: 'HR', description: '' }])
  const [churches, setChurches] = useState([])
  const [matches, setMatches] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => v => setF(x => ({ ...x, [k]: v }))

  useEffect(() => { api('/churches').then(setChurches).catch(e => setErr(e.message)) }, [])
  useEffect(() => {
    if (f.fullName.trim().length < 3) { setMatches([]); return }
    const t = setTimeout(() => api('/persons/lookup?name=' + encodeURIComponent(f.fullName.trim())).then(setMatches).catch(() => {}), 400)
    return () => clearTimeout(t)
  }, [f.fullName])

  const church = churches.find(c => c.name.toLowerCase() === f.churchName.trim().toLowerCase())
  const setIssue = (i, patch) => setIssues(list => list.map((x, k) => k === i ? { ...x, ...patch } : x))
  const useMatch = m => setF(x => ({ ...x, fullName: m.fullName, churchName: m.churchName, phone: m.phone || x.phone, workingStatus: m.workingStatus }))

  const submit = async e => {
    e.preventDefault(); setErr('')
    if (!church) return setErr('Please choose the church from the list (start typing its name).')
    const bad = issues.findIndex(i => i.category !== 'UNCLEAR' && !i.description.trim())
    if (bad >= 0) return setErr(`Issue ${bad + 1}: please describe the cause, or mark it “Not clear yet”.`)
    setBusy(true)
    try {
      const c = await api('/cases', { method: 'POST', body: {
        fullName: f.fullName, churchId: church.id, phone: f.phone, workingStatus: f.workingStatus,
        roleInCase: f.roleInCase, discussionNotes: f.discussionNotes, letterIssued: f.letterIssued, issues } })
      onCreated(c.id)
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  const exact = matches.filter(m => m.fullName.toLowerCase() === f.fullName.trim().toLowerCase())

  return (
    <form onSubmit={submit}>
      <h1>Register a case</h1><p className="muted">Listen first, then record. One person can bring several issues.</p>
      {err && <div className="err">{err}</div>}

      <div className="card">
        <h2><span className="num">1</span>Who is coming?</h2>
        <label>Full name</label>
        <input value={f.fullName} onChange={e => set('fullName')(e.target.value)} required maxLength={160} autoFocus />
        {exact.length > 0 && (
          <div className="banner">
            <b>👋 Welcome back!</b> This person is already on record.
            {exact.map(m => (
              <div className="ret" key={m.id}>
                <span>{m.fullName} · {m.churchName} · {m.totalCases} case{m.totalCases === 1 ? '' : 's'} ({m.openCases} still active)</span>
                <button type="button" className="btn ghost sm" onClick={() => useMatch(m)}>Use these details</button>
              </div>
            ))}
          </div>
        )}
        <div className="grid">
          <div>
            <label>Church</label>
            <input list="church-list" value={f.churchName} onChange={e => set('churchName')(e.target.value)} placeholder="Start typing…" required />
            <datalist id="church-list">{churches.map(c => <option key={c.id} value={c.name} />)}</datalist>
            {churches.length === 0 && <small className="warn">No churches yet. {me.role === 'ADMIN' ? <a href="#" onClick={e => { e.preventDefault(); goChurches() }}>Add the church list first →</a> : 'Ask an administrator to add the church list.'}</small>}
          </div>
          <div><label>Phone (optional)</label><input value={f.phone} onChange={e => set('phone')(e.target.value)} inputMode="tel" maxLength={40} /></div>
        </div>
        <label>Working status</label><Chips options={WORKING} value={f.workingStatus} onChange={set('workingStatus')} />
        <label>Who is involved in the case?</label><Chips options={ROLE} value={f.roleInCase} onChange={set('roleInCase')} />
      </div>

      <div className="card">
        <h2><span className="num">2</span>What are the issues?</h2>
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
        {issues.length >= 3 && <div className="banner">📎 This person has {issues.length} issues. Consider noting which one is most urgent.</div>}
        <button type="button" className="btn ghost" onClick={() => setIssues(l => [...l, { category: 'HR', description: '' }])}>➕ Add another issue</button>
      </div>

      <div className="card">
        <h2><span className="num">3</span>Discussion &amp; letter</h2>
        <label>Discussion notes</label>
        <textarea rows={4} value={f.discussionNotes} maxLength={8000} onChange={e => set('discussionNotes')(e.target.value)} placeholder="What was discussed and agreed…" />
        <label className="check"><input type="checkbox" checked={f.letterIssued} onChange={e => set('letterIssued')(e.target.checked)} /> ✉️ A letter has been issued</label>
      </div>

      <button className="btn big" disabled={busy}>{busy ? 'Saving…' : '💾 Save case'}</button>
    </form>
  )
}
