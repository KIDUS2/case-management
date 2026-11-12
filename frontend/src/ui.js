export const STATUS = {
  OPEN: { label: 'Open', cls: 's-open', icon: '🟣' },
  REFERRED: { label: 'Referred', cls: 's-ref', icon: '➡️' },
  COURT: { label: 'In court', cls: 's-court', icon: '⚖️' },
  RESOLVED: { label: 'Resolved', cls: 's-ok', icon: '✅' },
}
export const CATEGORY = {
  HR: { label: 'HR management', icon: '👥' },
  FINANCE: { label: 'Finance', icon: '💰' },
  MANAGEMENT: { label: 'Management', icon: '🏛️' },
  COURT: { label: 'Court matter', icon: '⚖️' },
  UNCLEAR: { label: 'Not clear yet', icon: '❓' },
}
export const WORKING = {
  ACTIVE_EMPLOYEE: 'Active employee', LEADER_PRIEST: 'Leader / priest', RETIRED: 'Retired',
  SUSPENDED: 'Suspended', CONTRACT: 'Contract', VOLUNTEER: 'Volunteer',
  CHURCH_MEMBER: 'Church member (not an employee)',
}
export const fmtDate = iso => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
export const initial = s => (s || '?').trim()[0]?.toUpperCase() || '?'
/** K7M2QX -> K7M-2QX, easier to read out and write down */
export const fmtCode = c => (c && c.length > 3 ? c.slice(0, 3) + '-' + c.slice(3) : c || '')
export const names = list => (list.length > 2 ? list.slice(0, 2).join(', ') + ' +' + (list.length - 2) : list.join(', '))
export async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true } catch { return false }
}
