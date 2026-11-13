import { t } from '../i18n.js'

/** Urgent, late, escalated and queue position of an issue, in one row of small badges. */
export default function IssueFlags({ i }) {
  const resolved = i.status === 'RESOLVED'
  if (resolved) return null
  return (
    <>
      {i.priority === 'URGENT' && <span className="flag urgent" title={t('The administrator marked this urgent. Serve it first.')}>🔥 {t('Urgent')}</span>}
      {i.daysLate > 0 && <span className="flag late" title={t('Past its date')}>⏰ {t('{n} days late', { n: i.daysLate })}</span>}
      {i.escalationLevel > 0 && <span className="flag esc" title={t('The administrator has been told')}>🚨 {t('Escalated to the administrator')}{i.escalationLevel > 1 ? ' ×' + i.escalationLevel : ''}</span>}
      {i.queuePosition > 0 && <span className="flag pos" title={t('Place in the department queue')}>#{i.queuePosition} {t('in line')}</span>}
    </>
  )
}
