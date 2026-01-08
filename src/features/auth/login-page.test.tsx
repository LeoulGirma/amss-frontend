import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/theme-context'
import { LoginPage } from './login-page'
import * as apiModule from '@/lib/api'

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('LoginPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a lookup failure message when email lookup fails', async () => {
    const lookupTrigger = vi.fn().mockReturnValue({
      unwrap: () => Promise.reject({}),
    })

    vi.spyOn(apiModule, 'useLookupEmailMutation').mockReturnValue([
      lookupTrigger,
      { isLoading: false },
    ] as ReturnType<typeof apiModule.useLookupEmailMutation>)
    vi.spyOn(apiModule, 'useLoginMutation').mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as ReturnType<typeof apiModule.useLoginMutation>)
    vi.spyOn(apiModule, 'useLazyGetMeQuery').mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as ReturnType<typeof apiModule.useLazyGetMeQuery>)

    const store = configureStore({
      reducer: {
        auth: (state = {}) => state,
      },
    })

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ThemeProvider>
            <LoginPage />
          </ThemeProvider>
        </MemoryRouter>
      </Provider>
    )

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email address/i), 'tenant-admin@demo.local')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(
      await screen.findByText('Failed to look up email. Please try again.')
    ).toBeInTheDocument()
  })
})
