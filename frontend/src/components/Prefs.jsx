import { useEffect, useState } from 'react'
import { getLang, setLang, t } from '../i18n.js'

const ORDER = ['system', 'light', 'dark']
const ICON = { system: '🖥️', light: '☀️', dark: '🌙' }
const LABEL = { system: 'Same as device', light: 'Light mode', dark: 'Dark mode' }

export const getTheme = () => { try { const v = localStorage.getItem('theme'); return ORDER.includes(v) ? v : 'system' } catch { return 'system' } }
export function applyTheme(v) {
  const root = document.documentElement
  if (v === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', v)
  try { localStorage.setItem('theme', v) } catch { /* private mode */ }
}

/** Language and light/dark choice. Both are remembered on this device. */
export default function Prefs({ compact }) {
  const [theme, setTheme] = useState(getTheme())
  useEffect(() => { applyTheme(theme) }, [theme])
  const next = () => setTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length])
  const lang = getLang()
  return (
    <div className={'prefs' + (compact ? ' compact' : '')}>
      <button type="button" className="pbtn" onClick={next} title={t(LABEL[theme])} aria-label={t('Theme') + ': ' + t(LABEL[theme])}>{ICON[theme]}</button>
      <div className="lang" role="group" aria-label={t('Language')}>
        <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => lang !== 'en' && setLang('en')}>EN</button>
        <button type="button" className={lang === 'am' ? 'on' : ''} onClick={() => lang !== 'am' && setLang('am')}>አማ</button>
      </div>
    </div>
  )
}
