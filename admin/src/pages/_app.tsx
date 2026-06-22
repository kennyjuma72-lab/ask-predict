import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import '../styles/globals.css'
import { ErrorBoundary, ToastProvider } from '../components'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Handle MetaMask and other extension errors gracefully
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('Failed to connect') || event.message?.includes('chrome-extension')) {
        console.debug('Extension connection notice:', event.message);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    
    // Ensure window.ethereum is available for extensions
    if (typeof window !== 'undefined' && !window.ethereum) {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    }

    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </ErrorBoundary>
  )
}
