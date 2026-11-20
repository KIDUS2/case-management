import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { t } from '../i18n.js'
import { fmtDay } from '../ui.js'

/**
 * Pick the day the person comes back. Every day has a limited number of spots, so full days and days we are closed
 * cannot be chosen. The numbered spot itself is given when the case is saved.
 */
export default function AppointmentPicker({ value, onChange }) {
  const [days, setDays] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => { api('/appointments/days?count=28').then(setDays).catch(e => setErr(e.message)) }, [])

  // keep the choice valid: if the wanted day is closed or full, move to the first day that has room
  useEffect(() => {
    if (!days) return
    const cur = days.find(d => d.date === value)
    if (cur && cur.open && cur.left > 0) return
    const next = days.find(d => d.open && d.left > 0 && (!value || d.date >= value)) || days.find(d => d.open && d.left > 0)
    if (next) onChange(next.date)
  }, [days])

  if (err) return <div className="err">{err}</div>
  if (!days) return <small className="muted">{t('Loading…')}</small>
  const anyFree = days.some(d => d.open && d.left > 0)
  return (
    <div className="apk">
      {!anyFree && <div className="banner warn">{t('There are no free appointment spots in the next 4 weeks. Ask the administrator to add more spots.')}</div>}
      <div className="apk-grid" role="radiogroup" aria-label={t('Appointment day')}>
        {days.map(d => {
          const off = !d.open || d.left <= 0
          return (
            <button type="button" key={d.date} role="radio" aria-checked={value === d.date} disabled={off}
              className={'apk-day' + (value === d.date ? ' on' : '') + (d.open && d.left > 0 && d.left <= 5 ? ' few' : '')} onClick={() => onChange(d.date)}>
              <b>{fmtDay(d.date)}</b>
              <small>{!d.open ? t('Closed') : d.left <= 0 ? t('Full') : t('{n} spots left', { n: d.left })}</small>
            </button>
          )
        })}
      </div>
      {value && <small className="muted">{t('A numbered spot on this day is given when you save.')}</small>}
    </div>
  )
}
