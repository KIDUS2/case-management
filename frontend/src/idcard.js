import QRCode from 'qrcode'
import { blob } from './api.js'
import { fmtId, personName } from './ui.js'
import { isEC, ecText } from './ethcal.js'

const RANKS = { LAYPERSON: 'Layperson', DEACON: 'Deacon', PRIEST: 'Priest', MONK: 'Monk', NUN: 'Nun', CHANTER: 'Chanter', TEACHER: 'Teacher', OTHER: 'Other' }
export const SPIRITUAL_RANK = RANKS

const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const day = d => (d ? (isEC() ? ecText(d, false) : new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })) : '—')
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
  @page{size:85.6mm 54mm;margin:0}
  *{box-sizing:border-box}
  :root{--pur:#231a33;--pur2:#3a2a5c;--grn:#1e5a2e;--grn2:#143d1f;--gold:#d4a937;--gold2:#f0d27a;--ink:#231a33;--mute:#6b6678;--paper:#fbf9f2}
  body{margin:0;font-family:"Noto Sans Ethiopic","Nyala",system-ui,sans-serif;background:#e7eadb;color:var(--ink);display:flex;flex-direction:column;align-items:center;gap:14mm;padding:12mm 0}
  .card{flex:none;width:85.6mm;height:54mm;break-inside:avoid;border-radius:3.2mm;background:var(--paper);position:relative;overflow:hidden;box-shadow:0 2px 14px #0003;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* fine diagonal guilloche-style texture + emblem watermark so the card is hard to copy */
  .card::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(135deg,#1e5a2e0d 0 .25mm,transparent .25mm 1.1mm),repeating-linear-gradient(45deg,#d4a9370f 0 .25mm,transparent .25mm 1.1mm)}
  .wm{position:absolute;right:-6mm;top:11mm;width:40mm;opacity:.08;filter:grayscale(.2)}
  .head{position:relative;height:12.6mm;background:linear-gradient(105deg,var(--pur) 0,var(--pur2) 58%,var(--grn) 100%);color:#fff;display:flex;align-items:center;gap:2.2mm;padding:0 2.6mm;border-bottom:.55mm solid var(--gold)}
  .head img{width:9.6mm;height:9.6mm;object-fit:contain;background:#fff;border-radius:50%;padding:.3mm;box-shadow:0 0 0 .35mm var(--gold)}
  .head .t{flex:1;line-height:1.2}
  .head .t b{display:block;font-size:2.7mm;font-weight:800;letter-spacing:.01em}
  .head .t span{display:block;font-size:1.95mm;color:#f3ecd2}
  .head .tag{flex:none;text-align:right;font-size:1.75mm;line-height:1.25;color:var(--gold2);font-weight:700}
  .body{position:relative;display:flex;gap:3mm;padding:2.6mm 2.8mm 0}
  .photo{position:relative;width:21.5mm;height:27mm;flex:none;border-radius:1.4mm;background:#eef1e6;overflow:hidden;display:grid;place-items:center;color:#8a9;font-size:7mm;box-shadow:0 0 0 .3mm #fff,0 0 0 .75mm var(--gold)}
  .photo img{width:100%;height:100%;object-fit:cover}
  .f{flex:1;min-width:0;line-height:1.2}
  .lbl{font-size:1.5mm;color:var(--mute);margin-top:1mm;letter-spacing:.02em}
  .v{font-size:2.5mm;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .name{font-size:3.7mm;font-weight:800;color:var(--grn);white-space:normal;line-height:1.1;margin-top:.2mm}
  .row{display:flex;gap:2.4mm}.row>div{min-width:0}
  .foot{position:absolute;left:0;right:0;bottom:0;height:6.6mm;background:linear-gradient(90deg,var(--grn2),var(--grn));color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 2.8mm;border-top:.4mm solid var(--gold)}
  .foot .no{font:800 3.7mm ui-monospace,Menlo,Consolas,monospace;letter-spacing:.35mm;color:var(--gold2)}
  .foot .ex{font-size:1.9mm;font-weight:700;text-align:right;line-height:1.15}
  .foot .ex small{display:block;font-size:1.45mm;font-weight:500;opacity:.8}
  .exp{color:#ffb4a8}
  .back .body{padding-top:2.4mm}
  .qr{width:23mm;height:23mm;flex:none;background:#fff;padding:1mm;border-radius:1.2mm;box-shadow:0 0 0 .3mm #fff,0 0 0 .7mm var(--gold)}
  .small{position:relative;margin:1.6mm 2.8mm 0;font-size:1.75mm;color:#4a4458;line-height:1.35}
  .sig{position:absolute;right:2.8mm;bottom:8.4mm;width:26mm;border-top:.25mm solid #9a94a8;font-size:1.4mm;color:var(--mute);text-align:center;padding-top:.3mm}
  .hint{font:12px system-ui;color:#456}
  @media print{body{background:#fff;padding:0;gap:0;display:block}.card{box-shadow:none;border-radius:0;page-break-after:always;break-after:page}.card.back{page-break-after:auto;break-after:auto}.hint{display:none}}
  </style></head><body>
  <div class="card front">
    <img class="wm" src="${cross}" alt="">
    <div class="head"><img src="${cross}" alt=""><div class="t"><b>የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን</b><span>Ethiopian Orthodox Tewahedo Church</span><span>አዲስ አበባ ሀገረ ስብከት · Addis Ababa Diocese</span></div><div class="tag">የሠራተኛ<br>መታወቂያ<br>STAFF ID</div></div>
    <div class="body">
      <div class="photo">${photo ? `<img src="${photo}" alt="">` : '👤'}</div>
      <div class="f">
        <div class="lbl" style="margin-top:0">Full name · ሙሉ ስም</div><div class="v name">${esc(personName(e))}</div>
        <div class="lbl">Mother’s name · የእናት ስም</div><div class="v">${esc(e.motherName || '—')}</div>
        <div class="row"><div><div class="lbl">Sex · ፆታ</div><div class="v">${esc(sex)}</div></div><div><div class="lbl">Date of birth · የትውልድ ቀን</div><div class="v">${esc(day(e.birthDate))}</div></div></div>
        <div class="lbl">Church · ቤተ ክርስቲያን</div><div class="v">${esc(e.churchName)}</div>
      </div>
    </div>
    <div class="foot"><span class="no">${esc(fmtId(e.employeeId))}</span><span class="ex ${expired ? 'exp' : ''}"><small>Valid until · የሚያበቃው</small>${esc(day(e.idExpiresOn))}</span></div>
  </div>
  <div class="card back">
    <img class="wm" src="${cross}" alt="">
    <div class="head" style="height:9.4mm"><img src="${cross}" alt="" style="width:7.2mm;height:7.2mm"><div class="t"><b>የሠራተኛ መታወቂያ ካርድ</b><span>Employee identification card · Addis Ababa Diocese</span></div></div>
    <div class="body">
      <img class="qr" src="${qr}" alt="QR">
      <div class="f">
        <div class="lbl" style="margin-top:0">Christian name · የክርስትና ስም</div><div class="v">${esc(e.christianName || '—')}</div>
        <div class="lbl">Father confessor · የንስሐ አባት</div><div class="v">${esc(e.fatherConfessor || '—')}</div>
        <div class="lbl">Service · አገልግሎት</div><div class="v">${esc([rank, e.profession, e.position].filter(Boolean).join(' · ') || '—')}</div>
        <div class="lbl">Issued · የተሰጠበት</div><div class="v">${esc(day(e.idIssuedOn))}</div>
      </div>
    </div>
    <div class="small">Scan the code to open the holder’s file. This card belongs to the Addis Ababa Diocese; if found, please return it to the nearest church office.</div>
    <div class="foot"><span class="no">${esc(fmtId(e.employeeId))}</span><span class="ex ${expired ? 'exp' : ''}"><small>Valid until · የሚያበቃው</small>${esc(day(e.idExpiresOn))}</span></div>
  </div>
  <div class="hint">Print on card stock at 100% size, front and back.</div>
  </body></html>`)
  w.document.close()
  await new Promise(r => setTimeout(r, 400))
  w.focus(); w.print()
  setTimeout(() => frame.remove(), 60000)
  return true
}
