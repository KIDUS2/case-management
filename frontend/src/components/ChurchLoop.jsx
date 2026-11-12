import { useEffect, useState } from 'react'
import { api, upload, download } from '../api.js'
import { t } from '../i18n.js'
import { fmtDate, fmtSize } from '../ui.js'

const STATUS = {
  OPEN: { label: 'Waiting for the church', cls: 's-open' },
  ANSWERED: { label: 'Church replied · waiting for the administrator', cls: 's-ref' },
  DECIDED: { label: 'Decided · church agreed', cls: 's-ok' },
  DISPUTED: { label: 'Church did not agree', cls: 's-court' },
}
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt'

function FileList({ files, setErr }) {
  if (!files.length) return null
  return (
    <div className="lfiles">{files.map(f => (
      <button type="button" key={f.id} className="lfile" onClick={() => download(f.id, f.originalName).catch(x => setErr(x.message))}>
        📎 <span>{f.originalName}</span><small>{fmtSize(f.size)}</small>
      </button>))}
    </div>
  )
}

/** Choose files now, upload them after the text is saved. */
function Picker({ files, setFiles, busy }) {
  return (
    <>
      {files.map((f, k) => (
        <div className="filerow" key={k}><span className="iicon">📄</span><div className="grow"><div className="fname">{f.name}</div><small>{fmtSize(f.size)}</small></div>
          <button type="button" className="btn x" onClick={() => setFiles(l => l.filter((_, j) => j !== k))}>{t('Remove')}</button></div>))}
      <label className="drop">{busy ? t('Uploading…') : '📎 ' + t('Attach files (PDF, image, Word, Excel · up to 10 MB each)')}
        <input type="file" multiple disabled={busy} accept={ACCEPT} onChange={e => { const picked = Array.from(e.target.files); e.target.value = ''; setFiles(l => [...l, ...picked]) }} /></label>
    </>
  )
}

async function uploadAll(caseId, inquiryId, stage, files) {
  const failed = []
  for (const f of files) { try { await upload(`/cases/${caseId}/files`, f, { inquiryId: String(inquiryId), stage }) } catch (x) { failed.push(f.name + ': ' + x.message) } }
  return failed
}

function Ask({ c, onDone, setErr }) {
  const [issueId, setIssueId] = useState('')
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const send = async e => {
    e.preventDefault(); if (!text.trim()) return
    setBusy(true); setErr('')
    try {
      const q = await api(`/cases/${c.id}/inquiries`, { method: 'POST', body: { issueId: issueId ? Number(issueId) : null, question: text } })
      const failed = await uploadAll(c.id, q.id, 'REQUEST', files)
      setText(''); setFiles([]); setIssueId('')
      if (failed.length) setErr(t('The comment was sent, but these files were not saved: {f}', { f: failed.join(' · ') }))
      onDone()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <form onSubmit={send} className="loopform">
      <label>{t('Which issue is it about? (optional)')}</label>
      <select value={issueId} onChange={e => setIssueId(e.target.value)}>
        <option value="">{t('The whole case')}</option>
        {c.issues.map((i, k) => <option key={i.id} value={i.id}>{t('Issue')} {k + 1} · {i.category}</option>)}
      </select>
      <label>{t('Comment for the church')}</label>
      <textarea rows={3} maxLength={4000} value={text} onChange={e => setText(e.target.value)} placeholder={t('What do you need the church to explain, check or send?')} />
      <Picker files={files} setFiles={setFiles} busy={busy} />
      <button className="btn" disabled={busy || !text.trim()}>📤 {t('Send comment to the church')}</button>
    </form>
  )
}

function Inquiry({ q, c, me, canReply, onDone, setErr }) {
  const [finding, setFinding] = useState('')
  const [files, setFiles] = useState([])
  const [decision, setDecision] = useState('')
  const [agreed, setAgreed] = useState('yes')
  const [busy, setBusy] = useState(false)
  const st = STATUS[q.status]

  const reply = async e => {
    e.preventDefault(); if (!finding.trim()) return
    setBusy(true); setErr('')
    try {
      await api(`/inquiries/${q.id}/finding`, { method: 'POST', body: { finding } })
      const failed = await uploadAll(c.id, q.id, 'FINDING', files)
      setFinding(''); setFiles([])
      if (failed.length) setErr(t('The reply was saved, but these files were not: {f}', { f: failed.join(' · ') }))
      onDone()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const decide = async e => {
    e.preventDefault(); if (!decision.trim()) return
    setBusy(true); setErr('')
    try { await api(`/inquiries/${q.id}/decision`, { method: 'POST', body: { decision, churchAgreed: agreed === 'yes' } }); setDecision(''); onDone() }
    catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  return (
    <div className={'inq ' + st.cls}>
      <div className="inqhead">
        <span className={'badge ' + st.cls}>{t(st.label)}</span>
        <small>{q.issueLabel || t('The whole case')}{q.departmentName ? ' · ' + q.departmentName : ''}</small>
      </div>
      <div className="inqstep">
        <b>💬 {t('Comment sent to the church')}</b>
        <p>{q.question}</p><small>@{q.askedBy} · {fmtDate(q.askedAt)}</small>
        <FileList files={q.requestFiles} setErr={setErr} />
      </div>

      {q.finding && (
        <div className="inqstep">
          <b>⛪ {t('What the church found and replied')}</b>
          <p>{q.finding}</p><small>{t('Recorded by')} @{q.findingBy} · {fmtDate(q.findingAt)}</small>
          <FileList files={q.findingFiles} setErr={setErr} />
        </div>
      )}

      {q.decision && (
        <div className={'inqstep decision ' + (q.churchAgreed ? 'agree' : 'disagree')}>
          <b>🏛️ {t('Administrator’s decision')} — {q.churchAgreed ? t('the church agreed') : t('the church did not agree')}</b>
          <p>{q.decision}</p><small>@{q.decidedBy} · {fmtDate(q.decidedAt)}</small>
          {!q.churchAgreed && <small className="warn">{t('Everyone on this case was notified. The church can reply again below and the administrator can decide again.')}</small>}
        </div>
      )}

      {canReply && (q.status === 'OPEN' || q.status === 'DISPUTED' || q.status === 'ANSWERED') && (
        <form onSubmit={reply} className="loopform">
          <label>{q.finding ? t('Record a new reply from the church') : t('Record the church’s reply')}</label>
          <textarea rows={3} maxLength={6000} value={finding} onChange={e => setFinding(e.target.value)} placeholder={t('What did the church find? Write their answer here and attach their letter or evidence.')} />
          <Picker files={files} setFiles={setFiles} busy={busy} />
          <button className="btn ghost" disabled={busy || !finding.trim()}>💾 {t('Save the church’s reply')}</button>
        </form>
      )}

      {me.role === 'ADMIN' && q.finding && q.status === 'ANSWERED' && (
        <form onSubmit={decide} className="loopform">
          <label>{t('Your discussion and decision')}</label>
          <textarea rows={3} maxLength={6000} value={decision} onChange={e => setDecision(e.target.value)} placeholder={t('Based on the church’s findings, what is decided?')} />
          <div className="chips">
            <button type="button" className={'chip' + (agreed === 'yes' ? ' on' : '')} onClick={() => setAgreed('yes')}>✅ {t('The church agrees')}</button>
            <button type="button" className={'chip' + (agreed === 'no' ? ' on' : '')} onClick={() => setAgreed('no')}>⚠️ {t('The church does not agree')}</button>
          </div>
          <button className="btn" disabled={busy || !decision.trim()}>🏛️ {t('Save the decision and tell everyone')}</button>
        </form>
      )}
    </div>
  )
}

/** Department → church → administrator, with files at each step. */
export default function ChurchLoop({ c, me, onChanged, setErr }) {
  const [list, setList] = useState(null)
  const canAsk = ['ADMIN', 'OFFICER', 'RECEPTION', 'DEPARTMENT'].includes(me.role)
  const canReply = ['ADMIN', 'OFFICER', 'RECEPTION'].includes(me.role)
  const load = () => api(`/cases/${c.id}/inquiries`).then(setList).catch(x => setErr(x.message))
  useEffect(() => { load() }, [c.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const done = () => { load(); onChanged && onChanged() }
  if (!list) return null
  return (
    <div className="card" id="church-loop">
      <h2>{t('Comments to the church')} <span className="count">{list.length}</span></h2>
      <p className="hint">{t('Send a comment to the church. When the church replies, record what they found and attach their letter. The administrator then discusses it and decides.')}</p>
      {list.map(q => <Inquiry key={q.id} q={q} c={c} me={me} canReply={canReply} onDone={done} setErr={setErr} />)}
      {canAsk && <Ask c={c} onDone={done} setErr={setErr} />}
    </div>
  )
}
