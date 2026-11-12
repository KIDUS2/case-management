function headers(json) {
  const token = localStorage.getItem('token')
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) }
}

async function check(res) {
  if (res.status === 401 && localStorage.getItem('token')) { localStorage.removeItem('token'); location.reload() }
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.message || 'Something went wrong. Please try again.')
  }
  return res
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await check(await fetch('/api' + path, { method, headers: headers(true), body: body ? JSON.stringify(body) : undefined }))
  return res.status === 204 ? null : res.json()
}

/** Send one file as multipart/form-data. */
export async function upload(path, file) {
  const form = new FormData()
  form.append('file', file)
  const res = await check(await fetch('/api' + path, { method: 'POST', headers: headers(false), body: form }))
  return res.json()
}

/** Files need the login header, so fetch the bytes and let the browser save them. */
export async function download(id, name) {
  const res = await check(await fetch('/api/files/' + id, { headers: headers(false) }))
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
