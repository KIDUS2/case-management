import { useEffect, useRef, useState } from 'react'
import { t } from '../i18n.js'
import { todayStr, addDays, fmtDay } from '../ui.js'
import { periodOf } from './PeriodFilter.jsx'

const PRESETS = [['all', 'Any time'], ['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['30d', 'Last 30 days']]

/** One compact "📅 This week ▾" control for every list: pick a quick range or choose exact dates. */
export default function DateFilter({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  useEffect(() => {
    if (!open) return
    const down = e => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    const key = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [open])

  const preset = PRESETS.find(([k]) => k === value.key)
  const label = preset ? t(preset[1]) : value.from || value.to ? `${value.from ? fmtDay(value.from) : '…'} – ${value.to ? fmtDay(value.to) : '…'}` : t('Choose dates')
  const active = value.key !== 'all'
  const pick = k => { onChange(periodOf(k)); setOpen(false) }

  return (
    <div className="dfilter" ref={box}>
      <button type="button" className={'dfbtn' + (active ? ' on' : '')} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span aria-hidden="true">📅</span> {label} <i aria-hidden="true">▾</i>
      </button>
      {active && <button type="button" className="dfclear" aria-label={t('Clear dates')} title={t('Clear dates')} onClick={() => onChange(periodOf('all'))}>×</button>}
      {open && (
        <div className="dfpop" role="dialog" aria-label={t('Time period')}>
          <div className="dflist">
            {PRESETS.map(([k, l]) => <button type="button" key={k} className={value.key === k ? 'on' : ''} onClick={() => pick(k)}>{t(l)}</button>)}
          </div>
          <div className="dfcustom">
            <b>{t('Choose dates')}</b>
            <label>{t('From')}<input type="date" value={value.key === 'custom' ? value.from : ''} max={value.to || todayStr()} onChange={e => onChange({ key: 'custom', from: e.target.value, to: value.key === 'custom' ? value.to : todayStr() })} /></label>
            <label>{t('To')}<input type="date" value={value.key === 'custom' ? value.to : ''} min={value.from || undefined} max={todayStr()} onChange={e => onChange({ key: 'custom', from: value.key === 'custom' ? value.from : addDays(todayStr(), -29), to: e.target.value })} /></label>
            <button type="button" className="btn sm" onClick={() => setOpen(false)}>{t('Done')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
