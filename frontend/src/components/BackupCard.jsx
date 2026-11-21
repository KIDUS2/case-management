import { useEffect, useState } from 'react'
import { api, downloadPath } from '../api.js'
import { t } from '../i18n.js'
import { fmtDate, fmtSize } from '../ui.js'
import { celebrate } from '../dialog.js'

/** Automatic backups: when the last one ran, make one now, download one. Restoring is done on the server (steps shown below). */
export default function BackupCard({ setErr }) {
  const [s, setS] = useState(null)
  const [busy, setBusy] = useState(false)
  const load = () => api('/backups').then(setS).catch(e => setErr(e.message))
  useEffect(() => { load() }, [])

  const run = async () => {
    setBusy(true); setErr('')
    try { setS(await api('/backups/run', { method: 'POST' })); celebrate({ title: t('Backup finished'), message: t('The database and the documents are saved.') }) }
    catch (e) { setErr(e.message); load() } finally { setBusy(false) }
  }
  if (!s) return null
  const stale = !s.lastOk || Date.now() - new Date(s.lastOk).getTime() > 36 * 3600e3
  return (
    <section className="card bkcard">
      <div className="bkhead">
        <div>
          <h2>{t('Backups')}</h2>
          <p className="muted">{t('Every night at 02:00 the database and all uploaded documents are saved automatically. Keep a copy away from this computer too.')}</p>
        </div>
        <button type="button" className="btn" disabled={busy} onClick={run}>{busy ? t('Backing up…') : '💾 ' + t('Back up now')}</button>
      </div>
      <div className={'bkstate ' + (s.lastError || stale ? 'bad' : 'good')}>
        <span aria-hidden="true">{s.lastError || stale ? '⚠️' : '✅'}</span>
        <div>
          {s.lastOk ? <b>{t('Last backup: {d}', { d: fmtDate(s.lastOk) })}</b> : <b>{t('No backup has been made yet.')}</b>}
          {s.lastError && <small>{s.lastError}</small>}
          {!s.lastError && stale && <small>{t('The last backup is more than a day and a half old. Check that the server is running at night and that pg_dump is installed.')}</small>}
          <small>{t('Saved in: {p}', { p: s.directory })}{s.copyTo ? ' · ' + t('Second copy in: {p}', { p: s.copyTo }) : ' · ' + t('No second copy set (BACKUP_COPY_TO).')}</small>
        </div>
      </div>
      {s.items.length > 0 && (
        <div className="bklist">
          {s.items.slice(0, 12).map(i => (
            <div className="bkrow" key={i.name}>
              <span aria-hidden="true">{i.kind === 'database' ? '🗄️' : '📎'}</span>
              <div className="grow"><b>{i.kind === 'database' ? t('Database') : t('Documents')}</b><small>{fmtDate(i.createdAt)} · {fmtSize(i.sizeBytes)}</small></div>
              <button type="button" className="btn ghost sm" onClick={() => downloadPath('/backups/' + i.name, i.name).catch(e => setErr(e.message))}>⬇ {t('Download')}</button>
            </div>
          ))}
        </div>
      )}
      <details className="bkrestore">
        <summary>{t('How to restore after a problem')}</summary>
        <ol>
          <li>{t('Stop the backend.')}</li>
          <li>{t('Restore the database from the .dump file:')} <code>pg_restore -h localhost -U casedesk -d casedesk --clean --if-exists churchdesk-….dump</code></li>
          <li>{t('Unzip the -files.zip into the uploads folder of the backend.')}</li>
          <li>{t('Start the backend again.')}</li>
        </ol>
      </details>
    </section>
  )
}
