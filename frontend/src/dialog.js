/** App-level messages and questions, so nothing depends on the browser's own pop-ups. */
const bus = new EventTarget()
let seq = 0

/** A short message at the top of the screen. kind: 'error' | 'ok' | 'info' */
export const notify = (message, kind = 'error') => bus.dispatchEvent(new CustomEvent('toast', { detail: { id: ++seq, message: String(message || ''), kind } }))

const ask = detail => new Promise(resolve => bus.dispatchEvent(new CustomEvent('ask', { detail: { ...detail, resolve } })))

/** Yes / no question. Resolves true or false. */
export const askConfirm = (message, { title = '', confirmText = 'Yes', danger = false } = {}) => ask({ kind: 'confirm', message, title, confirmText, danger })

/** Asks for one line of text. Resolves the text, or null when cancelled. */
export const askText = (message, { title = '', type = 'text', minLength = 0, confirmText = 'Save' } = {}) => ask({ kind: 'text', message, title, type, minLength, confirmText })

export const onToast = fn => { const h = e => fn(e.detail); bus.addEventListener('toast', h); return () => bus.removeEventListener('toast', h) }
export const onAsk = fn => { const h = e => fn(e.detail); bus.addEventListener('ask', h); return () => bus.removeEventListener('ask', h) }
