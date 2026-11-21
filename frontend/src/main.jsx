import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import FilePreview from './components/FilePreview.jsx'
import Dialogs from './components/Dialogs.jsx'
import './styles.css'
import { startTranslator } from './i18n.js'
createRoot(document.getElementById('root')).render(<><App /><Dialogs /><FilePreview /></>)
startTranslator()

// the app opens without internet after the first visit
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
