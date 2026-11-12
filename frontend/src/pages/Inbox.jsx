import { useEffect, useState } from 'react'
import { api, upload } from '../api.js'
import { t } from '../i18n.js'
import { CATEGORY, ISSUE_STATUS, ago, dayDiff, fmtCode, fmtDay, initial, names } from '../ui.js'

/** What has been sent to a department. Its staff resolve issues here; the person who registered the case is notified. */
export default function Inbox({ me, onOpen }) {
  const isDept = me.role === 'DEPARTMENT'
  const [departments, setDepartments] = useState([])
  const [deptId, setDeptId] = useState(isDept ? me.departmentId : '')
  const [tab, setTab] = useState('pending')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [open, setOpen] = useState(null) // issue id with the resolve form open
  const [note, setNote] = useState('')
  const [picked, setPicked] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isDept) return
    api('/departments').then(d => { const a = d.filter(x => x.active); setDepartments(a); if (a[0]) setDeptId(a[0].id) }).catch(e => setErr(e.message))
  }, [isDept])
  useEffect(() => { setPage(0) }, [tab, deptId])

  const load = () => {
    if (!deptId) return
    const p = new URLSearchParams({ resolved: tab === 'done', page, size: 15 })
    if (!isDept) p.set('departmentId', deptId)
    api('/inbox?' + p).then(d => { setData(d); setErr('') }).catch(e => setErr(e.message))
  }
  useEffect(load, [deptId, tab, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const resolve = async it => {
    setBusy(true); setErr(''); setOk('')
    try {
      await api(`/cases/${it.caseId}/issues/${it.issueId}/resolve`, { method: 'POST', body: { note } })
      const failed = []
      for (const f of picked) { try { await upload(`/cases/${it.caseId}/files?issueId=${it.issueId}`, f) } catch (x) { failed.push(f.name + ': ' + x.message) } }
      setOk('Resolved. The person who registered the case and the admin have been notified. ✅')
      if (failed.length) setErr('These files were not saved: ' + failed.join(' · '))
      setOpen(null); setNote(''); setPicked([]); load()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1
  const deptName = isDept ? me.departmentName : departments.find(d => String(d.id) === String(deptId))?.name

  return (
    <>
      <div className="head"><div><h1>{deptName ? t('{x} inbox', { x: deptName }) : t('Department inbox')}</h1>
        <p className="muted">{t('Issues sent to {x}. Resolving one tells the desk straight away.', { x: isDept ? 'your department' : 'this department' })}</p></div>
        {!isDept && departments.length > 0 && (
          <select style={{ width: 'auto', minWidth: 200 }} value={deptId} onChange={e => setDeptId(e.target.value)}>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
      </div>
      {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
      <div className="tabs">
        <button className={'chip' + (tab === 'pending' ? ' on' : '')} onClick={() => setTab('pending')}>⏳ {data ? t('Waiting ({n})', { n: data.pending }) : t('Waiting')}</button>
        <button className={'chip' + (tab === 'done' ? ' on' : '')} onClick={() => setTab('done')}>✅ Resolved</button>
      </div>
      {!data && !err && <div className="muted">Loading…</div>}
      {data && data.items.length === 0 && <div className="card empty">{tab === 'pending' ? '🎉 Nothing is waiting. Great work!' : 'Nothing resolved yet.'}</div>}
      {data && data.items.map(it => {
        const st = ISSUE_STATUS[it.status]
        const d = it.returnOn ? dayDiff(it.returnOn) : null
        return (
          <div className={'case ' + st.cls} style={{ cursor: 'default', display: 'block' }} key={it.issueId}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className="avatar">{initial(it.complainants[0])}</div>
              <div className="grow">
                <div className="ctitle"><b>{CATEGORY[it.category].icon} {CATEGORY[it.category].label}</b><span className={'badge ' + st.cls}>{st.label}</span></div>
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
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt" onChange={e => { setPicked(l => [...l, ...e.target.files]); e.target.value = '' }} /></label>
                <div className="iact"><button className="btn ok sm" disabled={busy} onClick={() => resolve(it)}>{busy ? 'Saving…' : '✅ Confirm resolved'}</button><button className="btn ghost sm" onClick={() => setOpen(null)}>Cancel</button></div>
              </div>
            )}
            <div className="iact">
              {it.status === 'REFERRED' && open !== it.issueId && <button className="btn ok sm" onClick={() => { setOpen(it.issueId); setNote(''); setPicked([]) }}>✅ Resolve</button>}
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
