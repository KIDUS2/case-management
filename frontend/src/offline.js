/**
 * Cases registered without a connection. They are kept on this device (IndexedDB, files included) and sent one by one when the
 * internet is back. Every case carries a reference (its id), so if the answer is lost and it is sent again, the server gives back
 * the first case instead of making a second one.
 */
import { api, upload } from './api.js'
import { notify, celebrate } from './dialog.js'
import { t } from './i18n.js'

const DB = 'casedesk-outbox', STORE = 'outbox'
let dbp
const open = () => dbp || (dbp = new Promise((ok, no) => {
  const r = indexedDB.open(DB, 1)
  r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' })
  r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error)
}))
const tx = async (mode, fn) => {
  const db = await open()
  return new Promise((ok, no) => { const q = fn(db.transaction(STORE, mode).objectStore(STORE)); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error) })
}
const changed = () => window.dispatchEvent(new Event('outbox-changed'))

export const newRef = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10))

/** Items of this user, oldest first. */
export const outbox = async owner => (await tx('readonly', s => s.getAll())).filter(i => !owner || i.owner === owner).sort((a, b) => a.createdAt - b.createdAt)
const put = async item => { await tx('readwrite', s => s.put(item)); changed() }
export const dropItem = async id => { await tx('readwrite', s => s.delete(id)); changed() }

/** Keep a case on this device. `id` is the reference already put in the case body. */
export const queueCase = ({ id, owner, path, body, files, label }) =>
  put({ id, owner, path, body, files: files.map(f => ({ name: f.name, type: f.type, blob: f })), done: [], status: 'waiting', error: '', label, createdAt: Date.now() })

let busy = false
/** Send what is waiting. Stops quietly when the connection is still down. Returns how many cases were sent. */
export async function flush(owner) {
  if (busy || !navigator.onLine) return 0
  busy = true
  const sent = []
  try {
    for (const it of await outbox(owner)) {
      if (it.status === 'rejected') continue
      try {
        if (!it.caseId) {
          const c = await api(it.path, { method: 'POST', body: { ...it.body, clientRef: it.id } })
          it.caseId = c.id; it.code = c.code
          await put(it)
        }
        const failed = []
        for (const f of it.files) {
          if (it.done.includes(f.name)) continue
          try { await upload(`/cases/${it.caseId}/files`, new File([f.blob], f.name, { type: f.type })) }
          catch (x) { if (x.network) throw x; failed.push(f.name) }
          it.done.push(f.name); await put(it)
        }
        await dropItem(it.id)
        sent.push({ code: it.code, label: it.label, failed })
      } catch (x) {
        if (x.network) break                       // still no connection: try again later
        it.status = 'rejected'; it.error = x.message; await put(it)   // the server said no: the person must look at it
      }
    }
  } finally { busy = false }
  if (sent.length) {
    celebrate({
      title: sent.length === 1 ? t('Saved case sent') : t('{n} saved cases sent', { n: sent.length }),
      message: t('They were registered on the server now that the internet is back.'),
      code: sent.length === 1 ? sent[0].code : '',
    })
    if (sent.some(s => s.failed.length)) notify(t('Some documents could not be uploaded. Open the case and add them again.'))
  }
  return sent.length
}

export const retryItem = async id => { const it = (await tx('readonly', s => s.get(id))); if (it) { it.status = 'waiting'; it.error = ''; await put(it) } }
