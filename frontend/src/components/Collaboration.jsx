import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { t } from '../i18n.js'
import { askConfirm } from '../dialog.js'
import { SUB_CITIES, ago } from '../ui.js'

const DIOCESE = ['ADMIN', 'OFFICER', 'SERA_ASKIYAJIE', 'PAPAS']

/** A committee looks into the case and writes what it found. The report is saved here and goes to the administrator. */
export function InvestigationCard({ c, me, setErr }) {
  const [list, setList] = useState(null)
  const [people, setPeople] = useState([])
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ instruction: '', team: '', assignedTo: '', issueId: '' })
  const [reporting, setReporting] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const diocese = DIOCESE.includes(me.role)

  const load = () => api(`/cases/${c.id}/investigations`).then(setList).catch(() => setList([]))
  useEffect(() => { load() }, [c.id])
  useEffect(() => { if (diocese) api('/investigations/people').then(setPeople).catch(() => {}) }, [diocese])

  const run = async fn => { setBusy(true); setErr(''); try { await fn(); await load() } catch (x) { setErr(x.message) } finally { setBusy(false) } }
  const ask = e => { e.preventDefault(); run(async () => {
    await api(`/cases/${c.id}/investigations`, { method: 'POST', body: { instruction: f.instruction, team: f.team, assignedTo: f.assignedTo || null, issueId: f.issueId ? Number(f.issueId) : null } })
    setOpen(false); setF({ instruction: '', team: '', assignedTo: '', issueId: '' })
  }) }
  const sendReport = inv => run(async () => { await api(`/investigations/${inv.id}/report`, { method: 'POST', body: { text } }); setReporting(null); setText('') })
  const close = inv => run(() => api(`/investigations/${inv.id}/close`, { method: 'POST' }))

  if (!list || (list.length === 0 && !diocese)) return null
  return (
    <div className="card collab">
      <h2>🔎 {t('Investigation committee')}</h2>
      <p className="hint">{t('Some cases need a small team to look into them. The team writes what it found here, and the administrator is told.')}</p>
      {list.length === 0 && <p className="muted">{t('No committee has been asked yet.')}</p>}
      {list.map(inv => {
        const mine = inv.assignedTo === me.username
        return (
          <div className="cbox" key={inv.id}>
            <div className="chead"><b>{inv.status === 'OPEN' ? '⏳ ' + t('Waiting for the report') : inv.status === 'REPORTED' ? '📄 ' + t('Report received') : '✅ ' + t('Closed')}</b>
              <small>{t('Asked {when} by @{who}', { when: ago(inv.requestedAt), who: inv.requestedBy })}</small></div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{inv.instruction}</p>
            {(inv.team || inv.assignedToName) && <small>👥 {[inv.team, inv.assignedToName && t('Report goes to {x}', { x: inv.assignedToName })].filter(Boolean).join(' · ')}</small>}
            {inv.report && <div className="resbox">📄 <b>{t('What the committee found')}</b> (@{inv.reportedBy}, {ago(inv.reportedAt)})<div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{inv.report}</div></div>}
            {inv.status !== 'CLOSED' && reporting !== inv.id && (
              <div className="iact">
                {(mine || diocese) && <button className="btn sm" onClick={() => { setReporting(inv.id); setText(inv.report || '') }}>✍️ {inv.report ? t('Write the report again') : t('Send the committee report')}</button>}
                {diocese && inv.status === 'REPORTED' && <button className="btn ghost sm" disabled={busy} onClick={() => close(inv)}>{t('Close this investigation')}</button>}
              </div>
            )}
            {reporting === inv.id && (
              <div className="panel">
                <label>{t('What did the committee find, and what do they suggest?')}</label>
                <textarea rows={4} autoFocus value={text} maxLength={8000} onChange={e => setText(e.target.value)} />
                <div className="iact"><button className="btn ok sm" disabled={busy || !text.trim()} onClick={() => sendReport(inv)}>{busy ? t('Sending…') : t('Send report')}</button>
                  <button className="btn ghost sm" onClick={() => setReporting(null)}>{t('Cancel')}</button></div>
              </div>
            )}
          </div>
        )
      })}
      {diocese && !open && <button className="btn ghost" onClick={() => setOpen(true)}>➕ {t('Ask a committee to look into this')}</button>}
      {open && (
        <form className="panel" onSubmit={ask}>
          <label>{t('What should the committee look into?')}</label>
          <textarea rows={3} required autoFocus value={f.instruction} maxLength={4000} onChange={e => setF({ ...f, instruction: e.target.value })} />
          <div className="two">
            <div><label>{t('Committee members (names)')}</label><input value={f.team} maxLength={500} onChange={e => setF({ ...f, team: e.target.value })} placeholder={t('e.g. Memhir Abebe, Deacon Dawit')} /></div>
            <div><label>{t('Who receives the report in the app?')}</label>
              <select value={f.assignedTo} onChange={e => setF({ ...f, assignedTo: e.target.value })}>
                <option value="">{t('Nobody in particular')}</option>
                {people.map(p => <option key={p.username} value={p.username}>{p.fullName}</option>)}
              </select></div>
          </div>
          {c.issues.length > 1 && <><label>{t('About which issue? (optional)')}</label>
            <select value={f.issueId} onChange={e => setF({ ...f, issueId: e.target.value })}><option value="">{t('The whole case')}</option>{c.issues.map((i, k) => <option key={i.id} value={i.id}>{k + 1}. {i.description?.slice(0, 40) || i.category}</option>)}</select></>}
          <div className="iact"><button className="btn sm" disabled={busy}>{t('Send to the committee')}</button><button type="button" className="btn ghost sm" onClick={() => setOpen(false)}>{t('Cancel')}</button></div>
        </form>
      )}
    </div>
  )
}

/** The diocese sends the case to a sub-city; the sub-city sends its solution back. */
export function SubcityCard({ c, me, setErr }) {
  const [list, setList] = useState(null)
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ subCity: '', instruction: '', issueId: '' })
  const [replying, setReplying] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const diocese = DIOCESE.includes(me.role)

  const load = () => api(`/cases/${c.id}/subcity-referrals`).then(setList).catch(() => setList([]))
  useEffect(() => { load() }, [c.id])
  const run = async fn => { setBusy(true); setErr(''); try { await fn(); await load() } catch (x) { setErr(x.message) } finally { setBusy(false) } }
  const send = e => { e.preventDefault(); run(async () => {
    await api(`/cases/${c.id}/subcity-referrals`, { method: 'POST', body: { subCity: f.subCity, instruction: f.instruction, issueId: f.issueId ? Number(f.issueId) : null } })
    setOpen(false); setF({ subCity: '', instruction: '', issueId: '' })
  }) }
  const reply = s => run(async () => { await api(`/subcity-referrals/${s.id}/solution`, { method: 'POST', body: { text } }); setReplying(null); setText('') })
  const close = async s => { if (await askConfirm(t('Close this? The solution is kept on the case.'), { confirmText: t('Close') })) run(() => api(`/subcity-referrals/${s.id}/close`, { method: 'POST' })) }

  if (!list || (list.length === 0 && !diocese)) return null
  return (
    <div className="card collab">
      <h2>🏙️ {t('Sub-city')}</h2>
      <p className="hint">{diocese ? t('Send the case to a sub-city to be handled there. The sub-city sends its solution back to the diocese.') : t('The diocese sent this case to your sub-city. Write what you did or decided and send it back.')}</p>
      {list.length === 0 && <p className="muted">{t('Not sent to a sub-city.')}</p>}
      {list.map(s => (
        <div className="cbox" key={s.id}>
          <div className="chead"><b>{s.status === 'SENT' ? '⏳ ' + t('Waiting for {x}', { x: s.subCity }) : s.status === 'REPLIED' ? '📄 ' + t('Solution from {x}', { x: s.subCity }) : '✅ ' + t('Closed')}</b>
            <small>{t('Sent {when} by @{who}', { when: ago(s.sentAt), who: s.sentBy })}</small></div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{s.instruction}</p>
          {s.solution && <div className="resbox">📄 <b>{t('Solution')}</b> (@{s.repliedBy}, {ago(s.repliedAt)})<div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{s.solution}</div></div>}
          {s.status !== 'CLOSED' && replying !== s.id && (
            <div className="iact">
              {(me.role === 'SUBCITY' || diocese) && <button className="btn sm" onClick={() => { setReplying(s.id); setText(s.solution || '') }}>✍️ {s.solution ? t('Change the solution') : t('Send the solution')}</button>}
              {diocese && s.status === 'REPLIED' && <button className="btn ghost sm" disabled={busy} onClick={() => close(s)}>{t('Close')}</button>}
            </div>
          )}
          {replying === s.id && (
            <div className="panel">
              <label>{t('What was done or decided?')}</label>
              <textarea rows={4} autoFocus value={text} maxLength={8000} onChange={e => setText(e.target.value)} />
              <div className="iact"><button className="btn ok sm" disabled={busy || !text.trim()} onClick={() => reply(s)}>{busy ? t('Sending…') : t('Send to the diocese')}</button>
                <button className="btn ghost sm" onClick={() => setReplying(null)}>{t('Cancel')}</button></div>
            </div>
          )}
        </div>
      ))}
      {diocese && !open && <button className="btn ghost" onClick={() => setOpen(true)}>➕ {t('Send to a sub-city')}</button>}
      {open && (
        <form className="panel" onSubmit={send}>
          <div className="two">
            <div><label>{t('Which sub-city?')}</label>
              <select required value={f.subCity} onChange={e => setF({ ...f, subCity: e.target.value })}><option value="">{t('Choose…')}</option>{SUB_CITIES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            {c.issues.length > 1 && <div><label>{t('About which issue? (optional)')}</label>
              <select value={f.issueId} onChange={e => setF({ ...f, issueId: e.target.value })}><option value="">{t('The whole case')}</option>{c.issues.map((i, k) => <option key={i.id} value={i.id}>{k + 1}. {i.description?.slice(0, 40) || i.category}</option>)}</select></div>}
          </div>
          <label>{t('What should the sub-city do?')}</label>
          <textarea rows={3} required value={f.instruction} maxLength={4000} onChange={e => setF({ ...f, instruction: e.target.value })} />
          <div className="iact"><button className="btn sm" disabled={busy}>{t('Send to the sub-city')}</button><button type="button" className="btn ghost sm" onClick={() => setOpen(false)}>{t('Cancel')}</button></div>
        </form>
      )}
    </div>
  )
}
