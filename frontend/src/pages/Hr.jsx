import { useState } from 'react'
import Employees from './Employees.jsx'
import Workforce from './Workforce.jsx'
import { t } from '../i18n.js'

const readTab = () => { try { return sessionStorage.getItem('hrTab') } catch { return null } }
const saveTab = v => { try { sessionStorage.setItem('hrTab', v) } catch { /* private mode */ } }

/** One home for everything about the people who serve: the directory and the payroll. */
export default function Hr({ me, focus, onFocusDone, onSeeCases, onOpenCase }) {
  const admin = me.role === 'ADMIN'
  const tabs = [
    { key: 'people', icon: '🪪', label: 'Employees', hint: 'Directory and profiles' },
    ...(admin ? [{ key: 'payroll', icon: '🧾', label: 'Staff & payroll', hint: 'By church and sub-city' }] : []),
  ]
  const [tab, setTab] = useState(() => (focus ? 'people' : tabs.some(x => x.key === readTab()) ? readTab() : 'people'))
  const pick = k => { setTab(k); saveTab(k) }

  return (
    <div className="hr">
      <header className="hr-band">
        <div className="hr-title">
          <span className="hr-mark" aria-hidden="true">👥</span>
          <div><h1>{t('HR management')}</h1><p>{t('Everyone who serves in the diocese: who they are, where they serve, what they are paid and what cases they are part of.')}</p></div>
        </div>
        <div className="hr-tabs" role="tablist" aria-label={t('HR management')}>
          {tabs.map(x => (
            <button key={x.key} role="tab" aria-selected={tab === x.key} className={'hr-tab' + (tab === x.key ? ' on' : '')} onClick={() => pick(x.key)}>
              <span className="hr-ti" aria-hidden="true">{x.icon}</span>
              <span className="hr-tt"><b>{t(x.label)}</b><small>{t(x.hint)}</small></span>
            </button>
          ))}
        </div>
      </header>
      <div className="hr-body" role="tabpanel">
        {tab === 'people' && <Employees me={me} focus={focus} onFocusDone={onFocusDone} onSeeCases={onSeeCases} onOpenCase={onOpenCase} />}
        {tab === 'payroll' && admin && <Workforce onOpenEmployees={() => pick('people')} />}
      </div>
    </div>
  )
}
