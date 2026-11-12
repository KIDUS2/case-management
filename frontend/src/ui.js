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
}
export const ROLE = { EMPLOYEE: 'Employee', LEADER: 'Leader', BOTH: 'Leader & employee' }
export const fmtDate = iso => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
export const initial = s => (s || '?').trim()[0]?.toUpperCase() || '?'
