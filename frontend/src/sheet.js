/** Reads an uploaded CSV or Excel file into rows of text cells. */
export const SHEET_ACCEPT = '.csv,.tsv,.txt,.xlsx'

function parseDelimited(text) {
  text = text.replace(/^﻿/, '')
  const first = text.split(/\r?\n/, 1)[0] || ''
  const sep = [',', ';', '\t'].map(s => [s, first.split(s).length]).sort((a, b) => b[1] - a[1])[0][0]
  const rows = []; let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += ch
    } else if (ch === '"') q = true
    else if (ch === sep) { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += ch
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows
}

const day = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const cellText = v => v == null ? '' : v instanceof Date ? day(v) : String(v).trim()

/** Text pasted from a spreadsheet (tab or comma separated) uses the same reader. */
export const gridFromText = text => parseDelimited(text).map(r => r.map(c => c.trim())).filter(r => r.some(Boolean))

export async function readSheetFile(file) {
  const name = file.name.toLowerCase()
  let grid
  if (name.endsWith('.xlsx')) {
    const { default: readXlsx } = await import('read-excel-file')
    grid = (await readXlsx(file)).map(r => r.map(cellText))
  } else if (name.endsWith('.xls')) {
    throw new Error('Old .xls files are not supported. In Excel choose Save As → Excel Workbook (.xlsx) or CSV, then upload that.')
  } else if (/\.(csv|tsv|txt)$/.test(name)) {
    grid = parseDelimited(await file.text()).map(r => r.map(c => c.trim()))
  } else throw new Error('Upload an Excel (.xlsx) or CSV file.')
  return grid.filter(r => r.some(Boolean))
}

/** Lets the person download an empty template to fill in. */
export function downloadCsv(filename, header, example) {
  const esc = v => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v
  const text = '﻿' + [header, example].filter(Boolean).map(r => r.map(esc).join(',')).join('\r\n') + '\r\n'
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000)
}
