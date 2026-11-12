import { t } from '../i18n.js'
import { todayStr, addDays } from '../ui.js'

const PRESETS = [
  ['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['30d', 'Last 30 days'], ['all', 'All time'], ['custom', 'Choose dates'],
]

/** The first and last day for a preset. Weeks start on Monday. */
export function rangeFor(key) {
  const today = todayStr()
  if (key === 'today') return { from: today, to: today }
  if (key === 'week') {
    const dow = (new Date(today + 'T00:00:00Z').getUTCDay() + 6) % 7
    return { from: addDays(today, -dow), to: today }
  }
  if (key === 'month') return { from: today.slice(0, 8) + '01', to: today }
  if (key === '30d') return { from: addDays(today, -29), to: today }
  return { from: '', to: '' }
}

export const periodOf = key => ({ key, ...rangeFor(key) })

export function periodQuery(p) {
  const q = []
  if (p.from) q.push('from=' + p.from)
  if (p.to) q.push('to=' + p.to)
  return q.join('&')
}

/** Quick ranges plus a custom start and end date; used on the dashboard and the summary page. */
export default function PeriodFilter({ value, onChange }) {
  const pick = key => onChange(key === 'custom' ? { key, from: value.from || addDays(todayStr(), -6), to: value.to || todayStr() } : periodOf(key))
  return (
    <div className="period" role="group" aria-label={t('Time period')}>
      <div className="chips">
        {PRESETS.map(([k, label]) => <button type="button" key={k} className={'chip' + (value.key === k ? ' on' : '')} onClick={() => pick(k)}>{t(label)}</button>)}
      </div>
      {value.key === 'custom' && (
        <div className="daterange">
          <label>{t('From')}<input type="date" value={value.from} max={value.to || undefined} onChange={e => onChange({ ...value, from: e.target.value })} /></label>
          <label>{t('To')}<input type="date" value={value.to} min={value.from || undefined} onChange={e => onChange({ ...value, to: e.target.value })} /></label>
        </div>
      )}
    </div>
  )
}
