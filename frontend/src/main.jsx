import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Dialogs from './components/Dialogs.jsx'
import './styles.css'
import { startTranslator } from './i18n.js'
createRoot(document.getElementById('root')).render(<><App /><Dialogs /></>)
startTranslator()
