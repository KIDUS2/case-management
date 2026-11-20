import { useEffect, useState } from 'react'
import { isEC, toEC, fromEC, daysIn, monthNames } from '../ethcal.js'
import { getLang, t } from '../i18n.js'
import { todayStr } from '../ui.js'

/** A date field. In the Gregorian calendar it is the browser's date picker; with the Ethiopian calendar on it is
 *  day / month / year lists. Either way it gives the same value (an ISO date, "2026-11-21") and the same onChange({ target: { value } }). */
export default function DateInput({ value, onChange, min, max, required, ...rest }) {
  if (!isEC()) return <input type="date" value={value || ''} min={min} max={max} required={required} onChange={onChange} {...rest} />
  return <EcDate value={value || ''} onChange={onChange} min={min} max={max} required={required} />
}

function EcDate({ value, onChange, min, max, required }) {
  const now = toEC(todayStr())
  const [p, setP] = useState(value ? toEC(value) : { y: '', m: '', d: '' })
  useEffect(() => { if (value) setP(toEC(value)); else setP(q => (q.y && q.m && q.d ? { y: '', m: '', d: '' } : q)) }, [value])
  const am = getLang() === 'am'
  const set = patch => {
    let n = { ...p, ...patch }
    if (n.y && n.m && n.d > daysIn(+n.y, +n.m)) n.d = daysIn(+n.y, +n.m)
    setP(n)
    if (n.y && n.m && n.d) {
      const iso = fromEC(+n.y, +n.m, +n.d)
      onChange({ target: { value: (min && iso < min) || (max && iso > max) ? '' : iso } })
    } else if (value) onChange({ target: { value: '' } })
  }
  const maxY = max ? toEC(max).y : now.y + 10, minY = min ? toEC(min).y : now.y - 100
  const years = []; for (let y = maxY; y >= minY; y--) years.push(y)
  const dim = p.y && p.m ? daysIn(+p.y, +p.m) : 30
  return (
    <div className="ecdate">
      <select aria-label={t('Day')} value={p.d} onChange={e => set({ d: e.target.value ? +e.target.value : '' })}>
        <option value="">{t('Day')}</option>{Array.from({ length: dim }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
      </select>
      <select aria-label={t('Month')} value={p.m} onChange={e => set({ m: e.target.value ? +e.target.value : '' })}>
        <option value="">{t('Month')}</option>{monthNames(am).map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
      </select>
      <select aria-label={t('Year')} value={p.y} onChange={e => set({ y: e.target.value ? +e.target.value : '' })}>
        <option value="">{t('Year')}</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      {required && <input className="ecreq" tabIndex={-1} aria-hidden="true" value={value} onChange={() => {}} required />}
    </div>
  )
}
