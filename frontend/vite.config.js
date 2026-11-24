import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

// Vite keeps its pre-bundled libraries in a cache folder. Inside node_modules (the default) that folder can be damaged by
// iCloud / Dropbox syncing of ~/Documents, by `npm install` while the dev server runs, or by two servers at once, which
// gives "The file does not exist ... node_modules/.vite/deps/chunk-....js". So the cache lives in the system temp folder
// (never synced), with one folder per project, and the libraries are bundled once at start instead of when first used.
const here = path.dirname(new URL(import.meta.url).pathname)
const cacheDir = path.join(os.tmpdir(), 'vite-casedesk-' + crypto.createHash('md5').update(here).digest('hex').slice(0, 8))

export default defineConfig({
  plugins: [react()],
  cacheDir,
  optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'qrcode', 'read-excel-file'] },
  server: { proxy: { '/api': 'http://localhost:8080' } },
})
