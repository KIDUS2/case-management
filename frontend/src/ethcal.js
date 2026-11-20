/** Ethiopian calendar (ዓ.ም): 13 months, 12 of 30 days and Pagume of 5 days (6 in a leap year). Dates are stored as normal
 *  ISO dates (Gregorian) everywhere; this file only converts for showing and picking. The choice is remembered on this device. */
export const getCal = () => { try { return localStorage.getItem('cal') === 'ec' ? 'ec' : 'gc' } catch { return 'gc' } }
export const setCal = c => { try { localStorage.setItem('cal', c) } catch { /* private mode */ } location.reload() }
export const isEC = () => getCal() === 'ec'

const OFFSET = 1723856
const MONTHS_EN = ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume']
const MONTHS_AM = ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን']
export const monthNames = am => (am ? MONTHS_AM : MONTHS_EN)
export const daysIn = (y, m) => (m < 13 ? 30 : y % 4 === 3 ? 6 : 5)

const jdnOfIso = iso => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 86400000) + 2440588 }
const isoOfJdn = j => new Date((j - 2440588) * 86400000).toISOString().slice(0, 10)

/** "2026-11-21" -> { y: 2019, m: 3, d: 12 } */
export function toEC(iso) {
  const j = jdnOfIso(iso)
  const r = (j - OFFSET) % 1461, n = (r % 365) + 365 * Math.floor(r / 1460)
  return { y: 4 * Math.floor((j - OFFSET) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460), m: Math.floor(n / 30) + 1, d: (n % 30) + 1 }
}
/** { y: 2019, m: 3, d: 12 } -> "2026-11-21" */
export const fromEC = (y, m, d) => isoOfJdn(OFFSET + 365 + 365 * (y - 1) + Math.floor(y / 4) + 30 * m + d - 31)

/** Ethiopian text for an ISO date: "12 Hidar 2019" / "ኅዳር 12 ቀን 2019 ዓ.ም"; { short: true } leaves out the year. */
export function ecText(iso, am, { short } = {}) {
  const { y, m, d } = toEC(iso)
  return am ? `${MONTHS_AM[m - 1]} ${d}${short ? '' : ` ${y} ዓ.ም`}` : `${d} ${MONTHS_EN[m - 1]}${short ? '' : ' ' + y}`
}
