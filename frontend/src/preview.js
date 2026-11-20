/** Open a document in the app's viewer instead of downloading it. `path` is the protected API path, e.g. "/files/12". */
export const previewFile = (path, name, size) => window.dispatchEvent(new CustomEvent('preview-file', { detail: { path, name, size } }))
export const onPreview = fn => { const h = e => fn(e.detail); window.addEventListener('preview-file', h); return () => window.removeEventListener('preview-file', h) }
/** What the browser can show by itself. Word and Excel files cannot be shown, only downloaded. */
export const kindOf = name => {
  const ext = (name.split('.').pop() || '').toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
  if (['txt', 'csv'].includes(ext)) return 'text'
  return 'none'
}
