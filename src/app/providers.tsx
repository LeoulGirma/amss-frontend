import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { store } from './store'
import { ErrorBoundary } from '@/components/error-boundary'
import { OfflineIndicator, PWAInstallPrompt, UpdatePrompt } from '@/components/pwa-prompt'
import { OnboardingTour } from '@/components/onboarding-tour'
import { PendingKeyIndicator } from '@/components/keyboard-shortcuts'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <OfflineIndicator />
          {children}
          <OnboardingTour />
          <PWAInstallPrompt />
          <UpdatePrompt />
          <PendingKeyIndicator />
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  )
}
