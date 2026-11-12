import QRCode from 'qrcode'
import { blob } from './api.js'
import { fmtId } from './ui.js'

const RANKS = { LAYPERSON: 'Layperson', DEACON: 'Deacon', PRIEST: 'Priest', MONK: 'Monk', NUN: 'Nun', CHANTER: 'Chanter', TEACHER: 'Teacher', OTHER: 'Other' }
export const SPIRITUAL_RANK = RANKS

const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const day = d => (d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const toDataUrl = b => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b) })

/** The link inside the QR code: scanning it opens the employee's file in this app (after sign-in). */
export const profileLink = e => `${location.origin}/?emp=${e.employeeId}`

/** Opens a print page with the front and back of the employee ID card. */
export async function printIdCard(e) {
  // printed from a hidden frame inside the app, so no pop-up window can be blocked by the browser
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  document.body.appendChild(frame)
  const w = frame.contentWindow
  let photo = ''
  if (e.hasPhoto) { try { photo = await toDataUrl(await blob(`/employees/${e.id}/photo`)) } catch { /* the card still prints without it */ } }
  const asset = async u => { try { return await toDataUrl(await (await fetch(u)).blob()) } catch { return '' } }
  const cross = await asset('/ewtc-logo.png')
  const qr = await QRCode.toDataURL(profileLink(e), { margin: 0, width: 300, errorCorrectionLevel: 'M' })
  const sex = e.gender === 'MALE' ? 'Male · ወንድ' : e.gender === 'FEMALE' ? 'Female · ሴት' : '—'
  const rank = RANKS[e.spiritualRank] || ''
  const expired = e.idExpired
  w.document.open()
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(e.fullName)} – ID</title><style>
  @page{size:auto;margin:10mm}
  *{box-sizing:border-box}
  body{margin:0;font-family:"Noto Sans Ethiopic","Nyala",system-ui,sans-serif;background:#e9eef7;color:#12213f;display:flex;flex-direction:column;align-items:center;gap:14mm;padding:12mm 0}
  .card{width:85.6mm;height:54mm;border-radius:3.2mm;background:#fff;position:relative;overflow:hidden;box-shadow:0 2px 14px #0003;border:.3mm solid #c9d4ea;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .band{height:13.5mm;background:linear-gradient(100deg,#173f8f,#2f6fd6);color:#fff;display:flex;align-items:center;gap:2mm;padding:0 2.4mm}
  .band img{width:11mm;height:11mm;object-fit:contain;background:#fff;border-radius:50%;padding:.3mm}
  .band .t{flex:1;text-align:center;line-height:1.15}
  .band .t b{display:block;font-size:2.55mm}.band .t span{display:block;font-size:2.05mm;opacity:.95}
  .stripe{position:absolute;left:0;right:0;bottom:0;height:5.6mm;background:#f2b705;color:#3b2c00;display:flex;align-items:center;justify-content:space-between;padding:0 2.6mm;font-size:2mm;font-weight:700;letter-spacing:.02em}
  .body{display:flex;gap:2.6mm;padding:2.2mm 2.6mm 0}
  .photo{width:21mm;height:26mm;border:.35mm solid #173f8f;border-radius:1.2mm;background:#eef2fa;overflow:hidden;display:grid;place-items:center;color:#8aa;font-size:7mm;flex:none}
  .photo img{width:100%;height:100%;object-fit:cover}
  .f{flex:1;min-width:0;line-height:1.2}
  .f .lbl{font-size:1.65mm;color:#5b6b8f;text-transform:uppercase;letter-spacing:.04em;margin-top:.9mm}
  .f .v{font-size:2.5mm;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .f .name{font-size:3.5mm;font-weight:800;color:#173f8f;white-space:normal;line-height:1.12}
  .idno{position:absolute;left:2.6mm;bottom:6.6mm;font:800 4.1mm ui-monospace,Menlo,Consolas,monospace;letter-spacing:.32mm;color:#173f8f}
  .exp{color:#b00020}
  .back .body{padding-top:3mm}.qr{width:24mm;height:24mm;flex:none;border:.3mm solid #c9d4ea;padding:.8mm;border-radius:1mm}
  .small{font-size:1.85mm;color:#445;line-height:1.35;margin-top:1.4mm}
  .wm{position:absolute;right:-5mm;bottom:3mm;width:30mm;opacity:.07}
  .hint{font:12px system-ui;color:#456}
  @media print{body{background:#fff;padding:0;gap:8mm}.card{box-shadow:none}.hint{display:none}}
  </style></head><body>
  <div class="card front">
    <div class="band"><img src="${cross}" alt=""><div class="t"><b>የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን</b><span>Ethiopian Orthodox Tewahedo Church</span><span>አዲስ አበባ ሀገረ ስብከት · Addis Ababa Diocese</span></div><i style="width:11mm;flex:none"></i></div>
    <div class="body">
      <div class="photo">${photo ? `<img src="${photo}" alt="">` : '👤'}</div>
      <div class="f">
        <div class="lbl">Full name · ሙሉ ስም</div><div class="v name">${esc(e.fullName)}</div>
        <div class="lbl">Mother’s name · የእናት ስም</div><div class="v">${esc(e.motherName || '—')}</div>
        <div class="lbl">Sex · ፆታ &nbsp;|&nbsp; Date of birth · የትውልድ ቀን</div><div class="v">${esc(sex)} &nbsp;|&nbsp; ${esc(day(e.birthDate))}</div>
        <div class="lbl">Church · ቤተ ክርስቲያን</div><div class="v">${esc(e.churchName)}</div>
      </div>
    </div>
    <div class="idno">${esc(fmtId(e.employeeId))}</div>
    <div class="stripe"><span>EMPLOYEE ID · የሠራተኛ መታወቂያ</span><span class="${expired ? 'exp' : ''}">Exp ${esc(day(e.idExpiresOn))}</span></div>
  </div>
  <div class="card back">
    <div class="band"><img src="${cross}" alt=""><div class="t"><b>የሠራተኛ መታወቂያ ካርድ</b><span>Employee identification card</span></div><i style="width:11mm;flex:none"></i></div>
    <div class="body">
      <img class="qr" src="${qr}" alt="QR">
      <div class="f">
        <div class="lbl">Christian name · የክርስትና ስም</div><div class="v">${esc(e.christianName || '—')}</div>
        <div class="lbl">Father confessor · የንስሐ አባት</div><div class="v">${esc(e.fatherConfessor || '—')}</div>
        <div class="lbl">Service · አገልግሎት</div><div class="v">${esc([rank, e.profession, e.position].filter(Boolean).join(' · ') || '—')}</div>
        <div class="lbl">Issued · የተሰጠበት</div><div class="v">${esc(day(e.idIssuedOn))}</div>
      </div>
    </div>
    <div class="body" style="padding-top:.6mm"><div class="small">Scan the code to open the full file of the holder. This card is the property of the Addis Ababa Diocese. If found, please return it to the nearest church office.</div></div>
    <div class="stripe"><span>${esc(fmtId(e.employeeId))}</span><span>Valid until ${esc(day(e.idExpiresOn))}</span></div>
  </div>
  <div class="hint">Print on card stock at 100% size, front and back.</div>
  </body></html>`)
  w.document.close()
  await new Promise(r => setTimeout(r, 400))
  w.focus(); w.print()
  setTimeout(() => frame.remove(), 60000)
  return true
}
