import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DiscussionProvider } from './contexts/DebateContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <DiscussionProvider>
        <App />
      </DiscussionProvider>
    </ThemeProvider>
  </StrictMode>,
)
