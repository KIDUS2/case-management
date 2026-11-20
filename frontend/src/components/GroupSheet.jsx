import { useState } from 'react'
import { t } from '../i18n.js'

export const blankRow = () => ({ fullName: '', idNo: '', phone: '' })

/** Turns pasted lines like "Abebe Kebede, 0911 22 33 44, 1234 5678 9012" into rows. Names, phones and ID numbers can come in any order. */
export function parseList(text) {
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
    const row = blankRow()
    // pull every number out of the line first (phones and IDs may be glued to the name), whatever the separators
    const rest = line.replace(/\+?\d[\d \-()]{5,}\d/g, m => {
      const digits = m.replace(/[^0-9]/g, '')
      if (digits.length === 12 && !row.idNo) row.idNo = digits
      else if (digits.length >= 9 && !row.phone) row.phone = m.trim()
      else if (!row.idNo) row.idNo = digits
      else if (!row.phone) row.phone = m.trim()
      return ','
    })
    row.fullName = rest.split(/[,;\t]+/).map(x => x.trim()).filter(Boolean).join(' ')
    return row
  })
}

/** A compact list for big groups: one line per person. Church and "this person is" come from the first person above. */
export default function GroupSheet({ rows, onChange, idLabel, expected }) {
  const [paste, setPaste] = useState(false)
  const [text, setText] = useState('')
  const set = (i, patch) => onChange(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)))
  const addPasted = () => {
    const parsed = parseList(text)
    if (!parsed.length) return
    const kept = rows.filter(r => r.fullName.trim() || r.phone.trim() || r.idNo.trim())
    onChange([...kept, ...parsed]); setText(''); setPaste(false)
  }
  const listed = rows.filter(r => r.fullName.trim()).length + 1 // the first person is above
  const left = Math.max(0, expected - listed)

  return (
    <div className="gsheet">
      <div className="gcount" role="status">
        <b>{t('{a} of {b} people listed', { a: Math.min(listed, expected), b: expected })}</b>
        <span className="gbar"><i style={{ width: Math.min(100, (listed / expected) * 100) + '%' }} /></span>
        <small>{left > 0 ? t('{n} more to add', { n: left }) : listed > expected ? t('{n} more than expected', { n: listed - expected }) : t('Everyone is listed')}</small>
      </div>
      <p className="hint">{t('Same church and same kind of person as the first person. Write one line per person. You can also paste a list.')}</p>
      <div className="ghead" aria-hidden="true"><span>#</span><span>{t('Full name')}</span><span>{idLabel}</span><span>{t('Phone')}</span><span /></div>
      {rows.map((r, i) => (
        <div className="grow2" key={i}>
          <span className="gn">{i + 2}</span>
          <input aria-label={t('Full name')} placeholder={t('Full name')} value={r.fullName} maxLength={160} onChange={e => set(i, { fullName: e.target.value })} />
          <input aria-label={idLabel} placeholder={idLabel} value={r.idNo} maxLength={40} onChange={e => set(i, { idNo: e.target.value })} />
          <input aria-label={t('Phone')} placeholder="09…" inputMode="tel" value={r.phone} maxLength={40} onChange={e => set(i, { phone: e.target.value })} />
          <button type="button" className="btn x" aria-label={t('Remove')} onClick={() => onChange(rows.filter((_, k) => k !== i))}>✕</button>
        </div>
      ))}
      <div className="iact">
        <button type="button" className="btn ghost sm" onClick={() => onChange([...rows, blankRow()])}>➕ {t('Add a line')}</button>
        <button type="button" className="btn ghost sm" onClick={() => onChange([...rows, ...Array.from({ length: 5 }, blankRow)])}>➕ {t('Add 5 lines')}</button>
        <button type="button" className="btn ghost sm" onClick={() => setPaste(p => !p)}>📋 {t('Paste a list')}</button>
      </div>
      {paste && (
        <div className="panel">
          <label htmlFor="gp">{t('Paste one person per line')}</label>
          <textarea id="gp" rows={6} autoFocus value={text} onChange={e => setText(e.target.value)} placeholder={'Abebe Kebede, 0911 22 33 44, 1234 5678 9012\nAlmaz Tesfaye, 0922 11 00 99'} />
          <small className="muted">{t('Name, phone number and ID number can be in any order, separated by commas.')}</small>
          <div className="iact"><button type="button" className="btn sm" onClick={addPasted}>{t('Add these people')}</button><button type="button" className="btn ghost sm" onClick={() => setPaste(false)}>{t('Cancel')}</button></div>
        </div>
      )}
    </div>
  )
}
