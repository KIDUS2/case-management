export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token')
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401 && token) { localStorage.removeItem('token'); location.reload() }
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.message || 'Something went wrong. Please try again.')
  }
  return res.status === 204 ? null : res.json()
}
