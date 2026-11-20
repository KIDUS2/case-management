import { useState } from 'react'
import { api } from '../api.js'
import { t } from '../i18n.js'
import Prefs from '../components/Prefs.jsx'
import { CATEGORY, fmtDay } from '../ui.js'

const STEP = { REFERRED: ['➡️', 'With a department'], COURT: ['⚖️', 'In court'], RESOLVED: ['✅', 'Finished'], OPEN: ['📝', 'Being looked at'] }

/** The person who got the SMS can check how their case is going. No sign-in; case number and phone number are both needed. */
export default function TrackCase({ onBack }) {
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault(); setErr(''); setRes(null); setBusy(true)
    try { setRes(await api('/public/case-status', { method: 'POST', body: { code, phone } })) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div className="center loginhero">
      <div className="loginprefs"><Prefs /></div>
      <button className="loginback" onClick={onBack}>← {t('Home')}</button>
      <div className="card login track">
        <img className="loginlogo" src="/logo.png" alt="" />
        <h1>{t('Check my case')}</h1>
        <p className="muted">{t('Enter the case number from your text message and the phone number you gave us.')}</p>
        <form onSubmit={submit}>
          <label>{t('Case number')}</label>
          <input value={code} onChange={e => setCode(e.target.value)} autoFocus placeholder="ABC-123" autoCapitalize="characters" maxLength={12} required />
          <label>{t('Phone number')}</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" placeholder="09…" maxLength={30} required />
          {err && <div className="err">{err}</div>}
          <button className="btn" disabled={busy}>{busy ? t('Checking…') : t('Check')}</button>
        </form>
        {res && (
          <div className="trackres" aria-live="polite">
            <h2>{res.code.slice(0, 3)}-{res.code.slice(3)}</h2>
            {res.awaitingReview && <p className="muted">{t('Your case has been received and is waiting to be looked at by the diocese.')}</p>}
            <p><b>{t('{a} of {b} finished', { a: res.resolved, b: res.issues })}</b></p>
            <ul>
              {res.lines.map((l, i) => { const [icon, label] = STEP[l.status] || ['•', l.status]; return <li key={i}>{icon} {CATEGORY[l.category]?.label || l.category} — {t(label)}</li> })}
            </ul>
            {res.appointmentDate && <p className="trackappt">📅 {t('Your appointment: {d}, spot {n}', { d: fmtDay(res.appointmentDate), n: res.appointmentSpot })}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
