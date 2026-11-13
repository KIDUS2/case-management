export const STATUS = {
  OPEN: { label: 'Open', cls: 's-open', icon: '🟦' },
  REFERRED: { label: 'In a department', cls: 's-ref', icon: '➡️' },
  COURT: { label: 'In court', cls: 's-court', icon: '⚖️' },
  RESOLVED: { label: 'Resolved', cls: 's-ok', icon: '✅' },
}
/** Progress of a single issue. */
export const ISSUE_STATUS = {
  NEW: { label: 'With the desk', cls: 's-open', icon: '🟦' },
  REFERRED: { label: 'In a department', cls: 's-ref', icon: '➡️' },
  COURT: { label: 'In court', cls: 's-court', icon: '⚖️' },
  RESOLVED: { label: 'Resolved', cls: 's-ok', icon: '✅' },
}
/** Types of issue and kefle ketema come from Settings (loaded once after sign-in); these are what shows before that. */
const catStore = {
  HR: { label: 'HR management', icon: '👥', active: true },
  FINANCE: { label: 'Finance', icon: '💰', active: true },
  MANAGEMENT: { label: 'Management', icon: '🏛️', active: true },
  COURT: { label: 'Court matter', icon: '⚖️', active: true },
  UNCLEAR: { label: 'Not clear yet', icon: '❓', active: true },
}
/** Every issue type by code (switched-off ones too, so old cases still show). An unknown code shows as itself. */
export const CATEGORY = new Proxy(catStore, {
  get: (t0, k) => (k in t0 ? t0[k] : typeof k === 'string' ? { label: k, icon: '🗂️', active: false } : undefined),
})
/** The issue types that can be chosen right now, as [code, {label, icon}]. */
export const catOptions = () => Object.entries(catStore).filter(([, v]) => v.active)
export const WORKING = {
  ACTIVE_EMPLOYEE: 'Active employee', LEADER_PRIEST: 'Leader / priest', RETIRED: 'Retired',
  SUSPENDED: 'Suspended', CONTRACT: 'Contract', VOLUNTEER: 'Volunteer',
  CHURCH_MEMBER: 'Church member (not an employee)',
}
export const ROLES = { ADMIN: 'Administrator', OFFICER: 'Case officer', RECEPTION: 'Reception (door)', DEPARTMENT: 'Department staff' }
export const EVENT_ICON = { CREATED: '🆕', REFERRED: '➡️', RESOLVED: '✅', COURT: '⚖️', COURT_ACK: '🖊️', ARRIVED: '🚪', NOTE: '📝', LETTER: '✉️', FILE: '📎' }
export const NOTE_ICON = { REFERRED: '📥', RESOLVED: '✅', COURT: '⚖️', ACCESS: '🔓', INQUIRY: '💬', INQUIRY_DISPUTED: '⚠️', ESCALATION: '🚨', URGENT: '🔥' }

export const isStaff = role => ['ADMIN', 'OFFICER', 'RECEPTION'].includes(role)

import { t, locale, getLang } from './i18n.js'
export const fmtDate = iso => new Date(iso).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' })
export const initial = s => (s || '?').trim()[0]?.toUpperCase() || '?'
/** K7M2QX -> K7M-2QX, easier to read out and write down */
export const fmtCode = c => (c && c.length > 3 ? c.slice(0, 3) + '-' + c.slice(3) : c || '')
export const names = list => (list.length > 2 ? list.slice(0, 2).join(', ') + ' +' + (list.length - 2) : list.join(', '))
export async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true } catch { return false }
}

/** Dates are Ethiopian local time (Addis Ababa) as YYYY-MM-DD. */
export const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Addis_Ababa' })
export const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
export const fmtDay = iso => new Date(iso + 'T00:00:00').toLocaleDateString(locale(), { weekday: 'short', month: 'short', day: 'numeric' })
export const dayDiff = iso => Math.round((new Date(iso + 'T00:00:00Z') - new Date(todayStr() + 'T00:00:00Z')) / 86400000)

export function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return t('just now')
  if (s < 3600) return t('{n} min ago', { n: Math.floor(s / 60) })
  if (s < 86400) return t('{n} h ago', { n: Math.floor(s / 3600) })
  if (s < 86400 * 7) return t('{n} d ago', { n: Math.floor(s / 86400) })
  return new Date(iso).toLocaleDateString(locale(), { month: 'short', day: 'numeric' })
}
export const fmtSize = n => (n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : (n / 1048576).toFixed(1) + ' MB')

/** 123456789012 -> 1234 5678 9012, like a national ID */
export const fmtId = id => (id && /^\d{12}$/.test(id) ? id.replace(/(\d{4})(?=\d)/g, '$1 ') : id || '')

/** The kefle ketema (sub-cities) that can be chosen right now; filled from Settings. */
export const SUB_CITIES = ['Addis Ketema', 'Akaki Kaliti', 'Arada', 'Bole', 'Gullele', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Lemi Kura', 'Nifas Silk-Lafto', 'Yeka']
/** The full lists as the server has them (with ids, both languages and use counts), for the Settings page. */
export const OPTION_LISTS = { issueTypes: [], subCities: [] }

/** Put the lists from /api/options in place. Names show in Amharic when that language is on and an Amharic name exists. */
export function applyOptions(o) {
  const am = getLang() === 'am'
  const name = x => (am && x.labelAm ? x.labelAm : x.label)
  Object.keys(catStore).forEach(k => delete catStore[k])
  o.issueTypes.forEach(x => { catStore[x.code] = { label: name(x), icon: x.icon || '🗂️', active: x.active } })
  SUB_CITIES.length = 0
  o.subCities.filter(x => x.active).forEach(x => SUB_CITIES.push(x.code))
  OPTION_LISTS.issueTypes = o.issueTypes
  OPTION_LISTS.subCities = o.subCities
}
