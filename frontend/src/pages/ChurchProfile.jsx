import { useEffect, useState } from 'react'
import { api, upload, downloadPath } from '../api.js'
import { t, locale } from '../i18n.js'
import { askConfirm } from '../dialog.js'
import { WORKING, initial, fmtSize } from '../ui.js'

const KINDS = { CARTA: 'Carta (land title)', MAP: 'Map or plan', LETTER: 'Letter', PHOTO: 'Photo', OTHER: 'Other' }
const money = n => Number(n || 0).toLocaleString(locale(), { maximumFractionDigits: 0 })

/** Pulls latitude and longitude out of "9.03, 38.74" or out of a pasted Google Maps / OpenStreetMap link. */
const FAC = {
  HALL: { icon: '🏛️', label: 'Hall' }, SCHOOL: { icon: '🏫', label: 'School' }, CLINIC: { icon: '🏥', label: 'Clinic' },
  LIBRARY: { icon: '📚', label: 'Library' }, CEMETERY: { icon: '🪦', label: 'Cemetery' }, GUEST_HOUSE: { icon: '🛏️', label: 'Guest house' },
  HOLY_WATER: { icon: '💧', label: 'Holy water (tsebel)' }, RENTAL: { icon: '🏬', label: 'Rental property' }, PARKING: { icon: '🅿️', label: 'Parking' }, OTHER: { icon: '🧱', label: 'Other' },
}
const COND = { GOOD: 'Good', FAIR: 'Fair', NEEDS_REPAIR: 'Needs repair' }
export function parseLocation(text) {
  const s = decodeURIComponent((text || '').trim())
  const pats = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /[?&](?:q|ll|query)=(-?\d+\.\d+)[, ](-?\d+\.\d+)/, /mlat=(-?\d+\.\d+).*mlon=(-?\d+\.\d+)/, /^(-?\d+\.\d+)\s*[,; ]\s*(-?\d+\.\d+)$/]
  for (const p of pats) {
    const m = s.match(p)
    if (m) { const la = Number(m[1]), lo = Number(m[2]); if (Math.abs(la) <= 90 && Math.abs(lo) <= 180) return [la, lo] }
  }
  return null
}

function MapView({ lat, lng }) {
  const d = 0.004
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`
  return (
    <div className="cmap">
      <iframe title={t('Map')} src={src} loading="lazy" referrerPolicy="no-referrer" />
      <div className="cmap-links">
        <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noreferrer">📍 {t('Open in Google Maps')}</a>
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noreferrer">🧭 {t('Directions')}</a>
        <small>{lat.toFixed(5)}, {lng.toFixed(5)}</small>
      </div>
    </div>
  )
}

/** Everything about one church: details, place on the map, the carta and other documents, and the people who serve there. */
export default function ChurchProfile({ church, canWrite, isAdmin, onBack, onChanged, setErr }) {
  const [p, setP] = useState(null)
  const [form, setForm] = useState(null)
  const [files, setFiles] = useState(null)
  const [staff, setStaff] = useState(null)
  const [loc, setLoc] = useState('')
  const [kind, setKind] = useState('CARTA')
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [facs, setFacs] = useState(null)
  const [fac, setFac] = useState(null)
  const [ok, setOk] = useState('')

  const loadFiles = () => api(`/churches/${church.id}/files`).then(setFiles).catch(x => setErr(x.message))
  useEffect(() => {
    api(`/churches/${church.id}/profile`).then(setP).catch(x => setErr(x.message))
    loadFiles()
    api(`/churches/${church.id}/facilities`).then(setFacs).catch(x => setErr(x.message))
    api(`/employees?churchId=${church.id}&size=100`).then(r => setStaff(r.items)).catch(() => setStaff([]))
  }, [church.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return <div className="muted">…</div>
  const start = () => { setOk(''); setLoc(''); setForm({ address: p.address || '', phone: p.phone || '', email: p.email || '', patronSaint: p.patronSaint || '', establishedYear: p.establishedYear ?? '', landArea: p.landArea || '', cartaNumber: p.cartaNumber || '', latitude: p.latitude ?? '', longitude: p.longitude ?? '', notes: p.notes || '' }) }
  const f = k => e => setForm({ ...form, [k]: e.target.value })
  const num = v => (v === '' || v == null ? null : Number(v))

  const pasteLoc = v => {
    setLoc(v)
    const r = parseLocation(v)
    if (r) setForm(x => ({ ...x, latitude: r[0], longitude: r[1] }))
  }
  const here = () => {
    if (!navigator.geolocation) return setErr(t('This browser cannot give your location.'))
    navigator.geolocation.getCurrentPosition(
      pos => setForm(x => ({ ...x, latitude: +pos.coords.latitude.toFixed(6), longitude: +pos.coords.longitude.toFixed(6) })),
      () => setErr(t('Could not get your location. Allow location access, or paste a map link instead.')), { enableHighAccuracy: true, timeout: 10000 })
  }
  const save = async e => {
    e.preventDefault(); setErr('')
    try {
      const body = { ...form, establishedYear: num(form.establishedYear), latitude: num(form.latitude), longitude: num(form.longitude) }
      setP(await api(`/churches/${church.id}/profile`, { method: 'PUT', body })); setForm(null); setOk(t('Saved')); onChanged && onChanged()
    } catch (x) { setErr(x.message) }
  }
  const pick = async ev => {
    const file = ev.target.files[0]; ev.target.value = ''
    if (!file) return
    setBusy(true); setErr('')
    try { await upload(`/churches/${church.id}/files`, file, { kind, title }); setTitle(''); await loadFiles(); api(`/churches/${church.id}/profile`).then(setP) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const remove = async d => {
    if (!(await askConfirm(d.title, { title: t('Remove this document?'), confirmText: t('Remove'), danger: true }))) return
    try { await api('/church-files/' + d.id, { method: 'DELETE' }); loadFiles(); api(`/churches/${church.id}/profile`).then(setP) } catch (x) { setErr(x.message) }
  }

  const located = p.latitude != null && p.longitude != null
  const saveFac = async e => {
    e.preventDefault(); setErr('')
    const body = { kind: fac.kind, name: fac.name, capacity: fac.capacity === '' ? null : Number(fac.capacity), condition: fac.condition, notes: fac.notes }
    try {
      if (fac.id) await api('/church-facilities/' + fac.id, { method: 'PUT', body })
      else await api(`/churches/${church.id}/facilities`, { method: 'POST', body })
      setFac(null); setFacs(await api(`/churches/${church.id}/facilities`))
    } catch (x) { setErr(x.message) }
  }
  const removeFac = async x => {
    if (!(await askConfirm(x.name || t((FAC[x.kind] || FAC.OTHER).label), { title: t('Remove this facility?'), confirmText: t('Remove'), danger: true }))) return
    try { await api('/church-facilities/' + x.id, { method: 'DELETE' }); setFacs(l => l.filter(y => y.id !== x.id)) } catch (er) { setErr(er.message) }
  }
  const leaders = (staff || []).filter(x => x.workingStatus === 'LEADER_PRIEST')
  const others = (staff || []).filter(x => ['ACTIVE_EMPLOYEE', 'CONTRACT', 'SUSPENDED'].includes(x.workingStatus))
  const payroll = isAdmin ? [...leaders, ...others].reduce((a, x) => a + Number(x.salary || 0), 0) : null
  const Row = ({ k, v }) => (v ? <div className="kv"><span>{k}</span><b>{v}</b></div> : null)
  const person = x => (
    <div className="cp-person" key={x.id}><div className="avatar sm">{initial(x.fullName)}</div>
      <div className="grow"><b>{x.fullName}</b><small>{x.position || x.profession || t(WORKING[x.workingStatus])}{x.phone ? ' · ' + x.phone : ''}</small></div>
      {isAdmin && x.salary != null && <span className="badge s-open">{money(x.salary)}</span>}</div>
  )

  return (
    <>
      <button className="btn ghost back" onClick={onBack}>← {t('Churches')}</button>
      <div className="cp-head card">
        <div className="cp-title"><span className="cp-icon">⛪</span>
          <div><h1>{p.name}</h1><p className="muted">{p.subCity ? '📍 ' + p.subCity : t('Sub-city not set')}{p.patronSaint ? ' · ' + p.patronSaint : ''}{p.establishedYear ? ' · ' + t('since {y}', { y: p.establishedYear }) : ''}</p></div></div>
        <div className="cp-stats">
          <div><b>{staff ? leaders.length + others.length : '–'}</b><span>{t('Employees on staff')}</span></div>
          <div><b>{staff ? leaders.length : '–'}</b><span>{t('Leaders and priests')}</span></div>
          {isAdmin && <div><b>{staff ? money(payroll) : '–'}</b><span>{t('Monthly payroll (birr)')}</span></div>}
          <div className={p.hasCarta ? 'okc' : 'warnc'}><b>{p.hasCarta ? '✓' : '!'}</b><span>{p.hasCarta ? t('Carta on file') : t('No carta on file')}</span></div>
        </div>
      </div>
      {ok && <div className="okmsg">{ok}</div>}

      <div className="cols">
        <div>
          <div className="card"><h2>{t('Details')}</h2>
            {!form ? (
              <>
                <Row k={t('Address')} v={p.address} /><Row k={t('Phone number')} v={p.phone} /><Row k="Email" v={p.email} /><Row k={t('Patron saint')} v={p.patronSaint} />
                <Row k={t('Established')} v={p.establishedYear} /><Row k={t('Land area')} v={p.landArea} /><Row k={t('Carta number')} v={p.cartaNumber} />
                {p.notes && <p className="notes" style={{ marginTop: 10 }}>{p.notes}</p>}
                {!p.address && !p.phone && !p.cartaNumber && !p.notes && <p className="muted">{t('Nothing recorded yet.')}</p>}
                {canWrite && <button className="btn ghost sm" style={{ marginTop: 12 }} onClick={start}>✏️ {t('Edit details and location')}</button>}
              </>
            ) : (
              <form onSubmit={save}>
                <div className="grid">
                  <div className="span"><label>{t('Address')}</label><input value={form.address} onChange={f('address')} maxLength={255} /></div>
                  <div><label>{t('Phone number')}</label><input value={form.phone} onChange={f('phone')} inputMode="tel" maxLength={40} /></div>
                  <div><label>Email</label><input type="email" value={form.email} onChange={f('email')} maxLength={120} /></div>
                  <div><label>{t('Patron saint')}</label><input value={form.patronSaint} onChange={f('patronSaint')} maxLength={120} /></div>
                  <div><label>{t('Established')} ({t('year')})</label><input inputMode="numeric" maxLength={4} value={form.establishedYear} onChange={f('establishedYear')} placeholder="1960" /></div>
                  <div><label>{t('Land area')}</label><input value={form.landArea} onChange={f('landArea')} maxLength={60} placeholder="2,400 m²" /></div>
                  <div><label>{t('Carta number')}</label><input value={form.cartaNumber} onChange={f('cartaNumber')} maxLength={80} /></div>
                </div>
                <h3 className="sect">{t('Location on the map')}</h3>
                <label>{t('Paste a Google Maps link or “latitude, longitude”')}</label>
                <input value={loc} onChange={e => pasteLoc(e.target.value)} placeholder="https://maps.google.com/…  or  9.0300, 38.7400" />
                <div className="grid">
                  <div><label>{t('Latitude')}</label><input inputMode="decimal" value={form.latitude} onChange={f('latitude')} placeholder="9.0300" /></div>
                  <div><label>{t('Longitude')}</label><input inputMode="decimal" value={form.longitude} onChange={f('longitude')} placeholder="38.7400" /></div>
                </div>
                <div className="phtools"><button type="button" className="btn ghost sm" onClick={here}>🎯 {t('Use my current location')}</button>
                  {(form.latitude !== '' || form.longitude !== '') && <button type="button" className="btn ghost sm" onClick={() => setForm({ ...form, latitude: '', longitude: '' })}>✕ {t('Remove location')}</button>}</div>
                <label>{t('Notes')}</label><textarea rows={3} value={form.notes} onChange={f('notes')} maxLength={4000} />
                <div className="iact"><button className="btn sm">{t('Save')}</button><button type="button" className="btn ghost sm" onClick={() => setForm(null)}>{t('Cancel')}</button></div>
              </form>
            )}
          </div>

          <div className="card"><h2>{t('Facilities')} <span className="count">{facs ? facs.length : 0}</span> <small className="inl">{t('hall, school, clinic, cemetery…')}</small></h2>
            {(facs || []).map(x => (
              <div className="filerow" key={x.id}><span className="iicon">{(FAC[x.kind] || FAC.OTHER).icon}</span>
                <div className="grow"><div className="fname">{x.name || t((FAC[x.kind] || FAC.OTHER).label)}</div>
                  <small>{t((FAC[x.kind] || FAC.OTHER).label)}{x.capacity != null ? ' · ' + t('{n} people', { n: x.capacity }) : ''}{x.condition ? ' · ' + t(COND[x.condition]) : ''}{x.notes ? ' · ' + x.notes : ''}</small></div>
                {canWrite && <button className="btn x" aria-label={t('Edit')} onClick={() => setFac({ id: x.id, kind: x.kind, name: x.name || '', capacity: x.capacity ?? '', condition: x.condition || '', notes: x.notes || '' })}>✏️</button>}
                {canWrite && <button className="btn x" aria-label={t('Delete')} onClick={() => removeFac(x)}>🗑️</button>}</div>))}
            {facs && facs.length === 0 && !fac && <p className="muted">{t('No facilities recorded yet.')}</p>}
            {canWrite && !fac && <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={() => setFac({ kind: 'HALL', name: '', capacity: '', condition: '', notes: '' })}>➕ {t('Add a facility')}</button>}
            {fac && (
              <form onSubmit={saveFac} style={{ marginTop: 10 }}>
                <div className="grid">
                  <div><label>{t('Type')}</label><select value={fac.kind} onChange={e => setFac({ ...fac, kind: e.target.value })}>{Object.entries(FAC).map(([k, v]) => <option key={k} value={k}>{v.icon} {t(v.label)}</option>)}</select></div>
                  <div><label>{t('Name (optional)')}</label><input value={fac.name} maxLength={120} onChange={e => setFac({ ...fac, name: e.target.value })} /></div>
                  <div><label>{t('Capacity (people)')}</label><input inputMode="numeric" value={fac.capacity} onChange={e => setFac({ ...fac, capacity: e.target.value.replace(/\D/g, '') })} /></div>
                  <div><label>{t('Condition')}</label><select value={fac.condition} onChange={e => setFac({ ...fac, condition: e.target.value })}><option value="">—</option>{Object.entries(COND).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}</select></div>
                  <div className="span"><label>{t('Notes')}</label><input value={fac.notes} maxLength={500} onChange={e => setFac({ ...fac, notes: e.target.value })} /></div>
                </div>
                <div className="iact"><button className="btn sm">{t('Save')}</button><button type="button" className="btn ghost sm" onClick={() => setFac(null)}>{t('Cancel')}</button></div>
              </form>
            )}
          </div>

          <div className="card"><h2>{t('Documents')} <span className="count">{files ? files.length : 0}</span> <small className="inl">{t('carta, maps, letters')}</small></h2>
            {(files || []).map(d => (
              <div className="filerow" key={d.id}><span className="iicon">{d.kind === 'CARTA' ? '📜' : d.kind === 'MAP' ? '🗺️' : d.kind === 'PHOTO' ? '🖼️' : '📄'}</span>
                <div className="grow"><div className="fname">{d.title}</div><small>{t(KINDS[d.kind])} · {fmtSize(d.sizeBytes)} · @{d.uploadedBy}</small></div>
                <button className="btn x" onClick={() => downloadPath('/church-files/' + d.id, d.originalName).catch(x => setErr(x.message))}>⬇️</button>
                {canWrite && <button className="btn x" onClick={() => remove(d)}>🗑️</button>}</div>))}
            {files && files.length === 0 && <p className="muted">{t('No documents yet.')}</p>}
            {canWrite && (
              <>
                <div className="grid" style={{ marginTop: 10 }}>
                  <div><label>{t('Type')}</label><select value={kind} onChange={e => setKind(e.target.value)}>{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}</select></div>
                  <div><label>{t('Document name (optional)')}</label><input value={title} onChange={e => setTitle(e.target.value)} maxLength={160} /></div>
                </div>
                <label className="drop">{busy ? t('Uploading…') : '📎 ' + t('Add a document (PDF, image, Word, Excel · up to 10 MB)')}<input type="file" disabled={busy} onChange={pick} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt" /></label>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="card"><h2>{t('Location on the map')}</h2>
            {located ? <MapView lat={p.latitude} lng={p.longitude} />
              : <div className="cmap-empty"><span>🗺️</span><p className="muted">{t('No location yet.')}</p>{canWrite && <button className="btn ghost sm" onClick={start}>➕ {t('Add the location')}</button>}</div>}
          </div>
          <div className="card"><h2>{t('Leaders and staff')} <span className="count">{staff ? leaders.length + others.length : 0}</span></h2>
            {staff === null && <p className="muted">…</p>}
            {staff && leaders.length + others.length === 0 && <p className="muted">{t('No staff registered for this church yet.')}</p>}
            {leaders.length > 0 && <><h3 className="sect" style={{ marginTop: 0 }}>{t('Leaders and priests')}</h3>{leaders.map(person)}</>}
            {others.length > 0 && <><h3 className="sect">{t('Employees')}</h3>{others.map(person)}</>}
          </div>
        </div>
      </div>
    </>
  )
}
