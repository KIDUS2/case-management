import Skeleton from '../components/Skeleton.jsx'
import DateFilter from '../components/DateFilter.jsx'
import { periodOf } from '../components/PeriodFilter.jsx'
import { useEffect, useState } from 'react'
import { api, upload } from '../api.js'
import { t } from '../i18n.js'
import IssueFlags from '../components/IssueFlags.jsx'
import { CATEGORY, ISSUE_STATUS, ago, dayDiff, fmtCode, fmtDay, initial, names } from '../ui.js'

/** What has been sent to a department. Its staff resolve issues here; the person who registered the case is notified. */
export default function Inbox({ me, onOpen }) {
  const isDept = me.role === 'DEPARTMENT'
  const isBoss = me.role === 'SERA_ASKIYAJIE' || me.role === 'PAPAS'   // they work on what was passed up to them
  const [act, setAct] = useState(null)   // { id, kind: 'hold' | 'up' } the small form open on one issue
  const [reason, setReason] = useState('')
  const [departments, setDepartments] = useState([])
  const [deptId, setDeptId] = useState(isDept ? me.departmentId : '')
  const [tab, setTab] = useState('pending')
  const [page, setPage] = useState(0)
  const [period, setPeriod] = useState(periodOf('all'))
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [open, setOpen] = useState(null) // issue id with the resolve form open
  const [note, setNote] = useState('')
  const [picked, setPicked] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isDept || isBoss) return
    api('/departments').then(d => { const a = d.filter(x => x.active); setDepartments(a); if (a[0]) setDeptId(a[0].id) }).catch(e => setErr(e.message))
  }, [isDept])
  useEffect(() => { setPage(0) }, [tab, deptId, period])

  const load = () => {
    const range = (period.from ? '&from=' + period.from : '') + (period.to ? '&to=' + period.to : '')
    if (isBoss) { api(`/inbox/passed-up?page=${page}&size=15${range}`).then(d => { setData(d); setErr('') }).catch(e => setErr(e.message)); return }
    if (!deptId) return
    const p = new URLSearchParams({ resolved: tab === 'done', page, size: 15 })
    if (!isDept) p.set('departmentId', deptId)
    if (period.from) p.set('from', period.from)
    if (period.to) p.set('to', period.to)
    api('/inbox?' + p).then(d => { setData(d); setErr('') }).catch(e => setErr(e.message))
  }
  useEffect(load, [deptId, tab, page, isBoss, period]) // eslint-disable-line react-hooks/exhaustive-deps

  const resolve = async it => {
    setBusy(true); setErr(''); setOk('')
    try {
      await api(`/cases/${it.caseId}/issues/${it.issueId}/resolve`, { method: 'POST', body: { note } })
      const failed = []
      for (const f of picked) { try { await upload(`/cases/${it.caseId}/files?issueId=${it.issueId}`, f) } catch (x) { failed.push(f.name + ': ' + x.message) } }
      setOk(t('Done. The person who registered the case and the admin have been told. ✅'))
      if (failed.length) setErr('These files were not saved: ' + failed.join(' · '))
      setOpen(null); setNote(''); setPicked([]); load()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  const doAct = async it => {
    setBusy(true); setErr(''); setOk('')
    try {
      if (act.kind === 'hold') await api(`/cases/${it.caseId}/issues/${it.issueId}/hold`, { method: 'POST', body: { hold: true, reason } })
      else await api(`/cases/${it.caseId}/issues/${it.issueId}/escalate`, { method: 'POST', body: { text: reason } })
      setOk(act.kind === 'hold' ? t('Set aside. The next case can be served now.') : t('Passed up. You will be told when it is decided.'))
      setAct(null); setReason(''); load()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const putBack = async it => {
    setBusy(true); setErr('')
    try { await api(`/cases/${it.caseId}/issues/${it.issueId}/hold`, { method: 'POST', body: { hold: false } }); load() } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1
  const deptName = isBoss ? null : isDept ? me.departmentName : departments.find(d => String(d.id) === String(deptId))?.name

  return (
    <>
      <div className="head"><div><h1>{isBoss ? (me.role === 'PAPAS' ? t('Waiting for your final decision') : t('Passed up to you')) : deptName ? t('{x} inbox', { x: deptName }) : t('Department inbox')}</h1>
        <p className="muted">{isBoss ? t('Issues a department could not finish. You can see everything below you and give the decision.') : t('Issues sent to {x}. Finishing one tells the desk straight away.', { x: isDept ? 'your department' : 'this department' })}{tab === 'pending' ? ' ' + t('They are listed in the order they must be served: urgent first, then first come, first served.') : ''}</p></div>
        {!isDept && !isBoss && departments.length > 0 && (
          <select style={{ width: 'auto', minWidth: 200 }} value={deptId} onChange={e => setDeptId(e.target.value)}>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
      </div>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
      <div className="lbar">{!isBoss && <div className="tabs" style={{ margin: 0 }}>
        <button className={'chip' + (tab === 'pending' ? ' on' : '')} onClick={() => setTab('pending')}>⏳ {data ? t('Waiting ({n})', { n: data.pending }) : t('Waiting')}</button>
        <button className={'chip' + (tab === 'done' ? ' on' : '')} onClick={() => setTab('done')}>✅ {t('Finished')}</button>
      </div>}<DateFilter value={period} onChange={setPeriod} />{data && <span className="lcount">{t('Showing {a} of {b}', { a: data.items.length, b: data.total })}</span>}</div>
      {!data && !err && <Skeleton rows={4} tall />}
      {data && data.items.length === 0 && <div className="card empty">{tab === 'pending' ? '🎉 ' + t('Nothing is waiting. Great work!') : t('Nothing finished yet.')}</div>}
      {data && data.items.map(it => {
        const st = ISSUE_STATUS[it.status]
        const d = it.returnOn ? dayDiff(it.returnOn) : null
        return (
          <div className={'case ' + st.cls + (it.priority === 'URGENT' && it.status !== 'RESOLVED' ? ' urgentcase' : '')} style={{ cursor: 'default', display: 'block' }} key={it.issueId}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className="avatar">{initial(it.complainants[0])}</div>
              <div className="grow">
                <div className="ctitle"><b>{CATEGORY[it.category].icon} {CATEGORY[it.category].label}</b><span className={'badge ' + st.cls}>{st.label}</span><IssueFlags i={it} />{it.handlerLevel > 0 && <span className="idept lvl">⬆️ {it.handlerLevel === 1 ? t('With Sera Askiyajie') : t('With Papas')}</span>}{it.held && <span className="idept hold">⏸️ {t('Set aside')}</span>}{it.subCity && <span className="idept">📍 {it.subCity}</span>}</div>
                <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{it.description || <span className="muted">No detail written.</span>}</p>
                <small>👤 {names(it.complainants)} · ⛪ {it.churchName}{it.subjects.length ? ' · about ' + names(it.subjects) : ''}</small>
                {it.status !== 'RESOLVED' && <small>{t('Received {x}', { x: it.referredAt ? ago(it.referredAt) : '' })}{it.returnOn ? <> · {t('person returns')} <b className={'iret' + (d < 0 ? ' late' : d <= 1 ? ' soon' : '')}>{fmtDay(it.returnOn)}</b></> : ''}</small>}
                {it.status === 'RESOLVED' && <div className="resbox">✅ {t('Resolved {when} by @{who}{note}', { when: ago(it.resolvedAt), who: it.resolvedBy, note: it.resolutionNote ? ' — ' + it.resolutionNote : '' })}</div>}
              </div>
              <div className="cside"><span className="codechip">{fmtCode(it.code)}</span></div>
            </div>
            {open === it.issueId && (
              <div className="panel">
                <label>What was done? (this is sent to the desk)</label>
                <textarea rows={3} autoFocus value={note} maxLength={4000} onChange={e => setNote(e.target.value)} placeholder="e.g. Salary difference paid on 12 Nov." />
                <label className="drop" style={{ marginTop: 8, padding: 10 }}>📎 {picked.length ? picked.map(f => f.name).join(', ') : 'Attach the paper or proof (optional)'}
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt" onChange={e => { const f = Array.from(e.target.files); e.target.value = ''; setPicked(l => [...l, ...f]) }} /></label>
                <div className="iact"><button className="btn ok sm" disabled={busy} aria-busy={busy} onClick={() => resolve(it)}>{busy ? t('Saving…') : '✅ ' + t('Confirm finished')}</button><button className="btn ghost sm" onClick={() => setOpen(null)}>Cancel</button></div>
              </div>
            )}
            {act?.id === it.issueId && (
              <div className="panel">
                <label>{act.kind === 'hold' ? t('What is it waiting for?') : t('Why does it need a higher decision?')}</label>
                <textarea rows={2} autoFocus value={reason} maxLength={500} onChange={e => setReason(e.target.value)} />
                <div className="iact"><button className="btn sm" disabled={busy || !reason.trim()} onClick={() => doAct(it)}>{act.kind === 'hold' ? '⏸️ ' + t('Set aside') : '⬆️ ' + t('Pass it up')}</button>
                  <button className="btn ghost sm" onClick={() => setAct(null)}>{t('Cancel')}</button></div>
                {act.kind === 'hold' && <small>{t('A long case should not keep simple cases waiting. Set it aside and serve the next one. It keeps its place and can be put back in line.')}</small>}
              </div>
            )}
            <div className="iact">
              {it.status === 'REFERRED' && open !== it.issueId && (isDept && it.queuePosition > 1
                ? <small className="muted">⏳ {t('Please finish the cases ahead of this one first. If one of them must wait, set it aside. Or ask the administrator to mark this one urgent.')}</small>
                : <button className="btn ok sm" onClick={() => { setOpen(it.issueId); setNote(''); setPicked([]) }}>{it.handlerLevel === 2 || me.role === 'PAPAS' ? '⚖️ ' + t('Give the final decision') : '✅ ' + t('Finished')}</button>)}
              {it.status === 'REFERRED' && !it.held && (isDept ? it.handlerLevel === 0 : me.role === 'SERA_ASKIYAJIE') && <button className="btn ghost sm" onClick={() => { setAct({ id: it.issueId, kind: 'hold' }); setReason('') }}>⏸️ {t('Set aside for now')}</button>}
              {it.held && (isDept || isBoss) && <button className="btn ghost sm" disabled={busy} onClick={() => putBack(it)}>▶️ {t('Put back in line')}</button>}
              {it.status === 'REFERRED' && ((isDept && it.handlerLevel === 0) || me.role === 'SERA_ASKIYAJIE') && it.handlerLevel < 2 && <button className="btn ghost sm" onClick={() => { setAct({ id: it.issueId, kind: 'up' }); setReason('') }}>⬆️ {me.role === 'SERA_ASKIYAJIE' ? t('Pass up to Papas') : t('Pass up to Sera Askiyajie')}</button>}
              <button className="btn ghost sm" onClick={() => onOpen(it.caseId)}>Open case</button>
            </div>
          </div>
        )
      })}
      {data && data.total > data.size && (
        <div className="pager">
          <button className="btn ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>← Previous</button>
          <span className="muted">{t('Page {a} of {b}', { a: page + 1, b: pages })}</span>
          <button className="btn ghost" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </>
  )
}
