import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { adoptNewVersion } from './version'

// نسخة جديدة من العامل ⇒ إعادة تحميل واحدة (لا هيكل قديم بعد نشر)
adoptNewVersion()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
