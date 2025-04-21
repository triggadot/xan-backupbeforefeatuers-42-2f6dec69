import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthProvider'
import ErrorBoundary from './components/ErrorBoundary'

// Import Preline
import 'preline/preline'
import { useEffect } from 'react'

// Create a component to handle Preline initialization
function PrelineScript() {
  useEffect(() => {
    // @ts-ignore
    import('preline/preline').then(({ HSStaticMethods }) => {
      // Initialize all components
      HSStaticMethods.autoInit()

      // Re-initialize on route change
      document.addEventListener('hs.overlay.shown', () => {
        HSStaticMethods.autoInit()
      })
    })
  }, [])

  return null
}

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <PrelineScript />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
