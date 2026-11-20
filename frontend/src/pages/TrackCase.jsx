import { useState } from 'react'
import { api } from '../api.js'
import { t } from '../i18n.js'
import Prefs from '../components/Prefs.jsx'
import { CATEGORY, fmtCode, fmtDay } from '../ui.js'

// Where the case is, in the words a church member would use. Each stage says what is happening and what (if anything) they must do.
const STAGES = ['Received', 'With the diocese', 'Being handled', 'Finished']
const HEAD = {
  PENDING: { stage: 0, icon: '📨', tone: 'wait', title: 'We have received your case', text: 'It is waiting for the diocese to look at it. You do not need to do anything now.' },
  OPEN: { stage: 1, icon: '📝', tone: 'wait', title: 'The diocese is looking at your case', text: 'We will send your case to the right department. You do not need to do anything now.' },
  REFERRED: { stage: 2, icon: '🏢', tone: 'work', title: 'Your case is being handled', text: 'It is with the department that can solve it. We will send you a text message when there is news.' },
  COURT: { stage: 2, icon: '⚖️', tone: 'work', title: 'Your case is in the court process', text: 'This part takes longer. We will send you a text message when there is news.' },
  RESOLVED: { stage: 3, icon: '✅', tone: 'done', title: 'Your case is finished', text: 'Everything has been solved. If something is still wrong, please visit the diocese office with your case number.' },
}
const LINE = { REFERRED: ['🏢', 'With a department'], COURT: ['⚖️', 'In court'], RESOLVED: ['✅', 'Finished'], OPEN: ['📝', 'Being looked at'] }

function Result({ c }) {
  const h = HEAD[c.awaitingReview ? 'PENDING' : c.status] || HEAD.OPEN
  return (
    <article className={'tres ' + h.tone}>
      <header>
        <span className="tico" aria-hidden="true">{h.icon}</span>
        <div>
          <small>{t('Case number')} <b className="tcode">{fmtCode(c.code)}</b></small>
          <h2>{t(h.title)}</h2>
        </div>
      </header>
      <p className="tlead">{t(h.text)}</p>
      <ol className="tsteps" aria-label={t('Progress')}>
        {STAGES.map((s, i) => <li key={s} className={i < h.stage ? 'past' : i === h.stage ? 'now' : ''} aria-current={i === h.stage ? 'step' : undefined}><i>{i < h.stage ? '✓' : i + 1}</i><span>{t(s)}</span></li>)}
      </ol>
      {c.appointmentDate && (
        <div className="tappt"><span>📅</span><div><small>{t('Please come to the diocese office')}</small><b>{fmtDay(c.appointmentDate)}</b><small>{t('Your turn number: {n}', { n: c.appointmentSpot })}</small></div></div>
      )}
      {c.lines.length > 0 && !c.awaitingReview && (
        <section>
          <h3>{t('{a} of {b} finished', { a: c.resolved, b: c.issues })}</h3>
          <ul className="tlines">
            {c.lines.map((l, i) => { const [icon, label] = LINE[l.status] || ['•', l.status]; return <li key={i}><span>{icon}</span><b>{CATEGORY[l.category]?.label || l.category}</b><em>{t(label)}</em></li> })}
          </ul>
        </section>
      )}
    </article>
  )
}

/** A church member who got our text message can see how their case is going. No sign-in: the case number or the phone number is enough. */
export default function TrackCase({ onBack }) {
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault(); setErr(''); setRes(null)
    if (!code.trim() && !phone.trim()) { setErr(t('Please enter your case number or your phone number.')); return }
    setBusy(true)
    try { setRes((await api('/public/case-status', { method: 'POST', body: { code: code.trim() || null, phone: phone.trim() || null } })).cases) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div className="center loginhero trackpage">
      <div className="loginprefs"><Prefs /></div>
      <button className="loginback" onClick={onBack}>← {t('Home')}</button>
      <div className="trackwrap">
        <div className="card login track">
          <img className="tlogo" src="/logo.png" alt="" />
          <h1>{t('Check my case')}</h1>
          <p className="muted">{t('Type the case number from your text message, or the phone number you gave us. One of them is enough.')}</p>
          <form onSubmit={submit}>
            <label htmlFor="tc">{t('Case number')}</label>
            <input id="tc" value={code} onChange={e => setCode(e.target.value.toUpperCase())} autoFocus placeholder="K7M-2QX" autoCapitalize="characters" autoComplete="off" maxLength={12} />
            <div className="tor"><span>{t('or')}</span></div>
            <label htmlFor="tp">{t('Phone number')}</label>
            <input id="tp" value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="09 12 34 56 78" maxLength={30} />
            {err && <div className="err" role="alert">{err}</div>}
            <button className="btn" disabled={busy} aria-busy={busy}>{busy ? t('Checking…') : t('Show my case')}</button>
          </form>
        </div>
        {res && <div className="tresults" aria-live="polite">{res.length > 1 && <p className="tcount">{t('We found {n} cases for this number.', { n: res.length })}</p>}{res.map(c => <Result key={c.code} c={c} />)}</div>}
      </div>
    </div>
  )
}
