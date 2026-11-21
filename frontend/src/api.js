function headers(json) {
  const token = localStorage.getItem('token')
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) }
}

/** fetch that never shows the browser's raw network error. */
const NET_MSG = 'Cannot reach the server. Please check the connection and try again.'
const netError = () => Object.assign(new Error(NET_MSG), { network: true })
/** `limit` (ms) gives up on a request that hangs, which is common on a weak connection. */
async function send(url, opts, limit = 0) {
  const ctl = limit ? new AbortController() : null
  const timer = limit ? setTimeout(() => ctl.abort(), limit) : null
  try {
    const res = await fetch(url, ctl ? { ...opts, signal: ctl.signal } : opts)
    window.dispatchEvent(new Event('net-ok'))
    return res
  } catch { window.dispatchEvent(new Event('net-fail')); throw netError() } finally { if (timer) clearTimeout(timer) }
}

/** Lists the forms need (churches, options, the signed-in user) are kept on this device and used when the server cannot be reached. */
const KEEP = /^\/(churches|options|departments|auth\/me)(\?|$)/
const kept = p => { try { return JSON.parse(localStorage.getItem('keep:' + p)) } catch { return null } }
export const forgetKept = () => Object.keys(localStorage).filter(k => k.startsWith('keep:')).forEach(k => localStorage.removeItem(k))

async function check(res) {
  if (res.status === 401 && localStorage.getItem('token')) { localStorage.removeItem('token'); forgetKept(); window.dispatchEvent(new Event('session-expired')) }
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.message || 'Something went wrong. Please try again.')
  }
  return res
}

/** The body as JSON; an empty body (204, or a 200 from an endpoint that returns nothing) gives null instead of an error. */
async function readJson(res) {
  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export async function api(path, { method = 'GET', body } = {}) {
  let res
  try { res = await check(await send('/api' + path, { method, headers: headers(true), body: body ? JSON.stringify(body) : undefined }, 30000)) }
  catch (e) {
    const old = e.network && method === 'GET' && KEEP.test(path) ? kept(path) : null
    if (old) return old
    throw e
  }
  const data = await readJson(res)
  if (method === 'GET' && KEEP.test(path) && data != null) { try { localStorage.setItem('keep:' + path, JSON.stringify(data)) } catch { /* storage full */ } }
  return data
}

/** Send one file as multipart/form-data. */
export async function upload(path, file, fields = {}) {
  const form = new FormData()
  form.append('file', file)
  Object.entries(fields).forEach(([k, v]) => { if (v) form.append(k, v) })
  const res = await check(await send('/api' + path, { method: 'POST', headers: headers(false), body: form }))
  return readJson(res)
}

/** Files need the login header, so fetch the bytes and let the browser save them. */
export async function download(id, name) {
  const res = await check(await send('/api/files/' + id, { headers: headers(false) }))
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

/** Fetch any protected file (photo, document) as a Blob. */
export async function blob(path) {
  const res = await check(await send('/api' + path, { headers: headers(false) }))
  return res.blob()
}

export async function downloadPath(path, name) {
  const url = URL.createObjectURL(await blob(path))
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
