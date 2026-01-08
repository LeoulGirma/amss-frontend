import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plane, Loader2, ArrowLeft, Building2, Moon, Sun, Shield, Clock, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAppDispatch } from '@/app/store'
import { useTheme } from '@/hooks'
import { setCredentials, setUser } from './auth-slice'
import { useLoginMutation, useLookupEmailMutation, useLazyGetMeQuery, type ApiUser, type OrgInfo } from '@/lib/api'

type LoginStep = 'email' | 'password'

export function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [login, { isLoading: isLoggingIn }] = useLoginMutation()
  const [lookupEmail, { isLoading: isLookingUp }] = useLookupEmailMutation()
  const [getMe, { isLoading: isFetchingProfile }] = useLazyGetMeQuery()

  const [step, setStep] = useState<LoginStep>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizations, setOrganizations] = useState<OrgInfo[]>([])
  const [selectedOrg, setSelectedOrg] = useState<OrgInfo | null>(null)
  const [error, setError] = useState('')

  const isLoading = isLoggingIn || isLookingUp || isFetchingProfile
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Please enter your email')
      return
    }

    try {
      const result = await lookupEmail({ email }).unwrap()

      if (result.organizations.length === 0) {
        setError('No account found with this email')
        return
      }

      setOrganizations(result.organizations)
      if (result.organizations.length === 1) {
        setSelectedOrg(result.organizations[0])
      }
      setStep('password')
    } catch (err: unknown) {
      const error = err as { data?: { error?: string }; status?: number }
      if (error.data?.error) {
        setError(error.data.error)
      } else {
        setError('Failed to look up email. Please try again.')
      }
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedOrg) {
      setError('Please select an organization')
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    try {
      const loginResult = await login({
        org_id: selectedOrg.org_id,
        email,
        password,
      }).unwrap()

      dispatch(
        setCredentials({
          token: loginResult.access_token,
          refreshToken: loginResult.refresh_token,
          orgId: selectedOrg.org_id,
        })
      )

      try {
        const userProfile = await getMe().unwrap()
        dispatch(setUser(userProfile))
      } catch {
        console.warn('Failed to fetch user profile, using basic info')
        const fallbackUser: ApiUser = {
          id: 'unknown',
          org_id: selectedOrg.org_id,
          email: email,
          role: 'mechanic',
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        dispatch(setUser(fallbackUser))
      }

      navigate('/')
    } catch (err: unknown) {
      const error = err as { data?: { error?: string; message?: string }; status?: number }
      if (error.data?.error) {
        setError(error.data.error)
      } else if (error.data?.message) {
        setError(error.data.message)
      } else if (error.status === 401) {
        setError('Invalid password')
      } else if (error.status === 429) {
        setError('Too many login attempts. Please try again later.')
      } else {
        setError('Login failed. Please try again.')
      }
    }
  }

  const handleBack = () => {
    setStep('email')
    setPassword('')
    setError('')
    setSelectedOrg(null)
    setOrganizations([])
  }

  const handleDemoMode = () => {
    const mockUser: ApiUser = {
      id: 'demo-user-1',
      org_id: 'demo-org',
      email: 'demo@amss.com',
      role: 'tenant_admin',
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    dispatch(
      setCredentials({
        user: mockUser,
        token: 'demo-token-' + Date.now(),
        refreshToken: 'demo-refresh-' + Date.now(),
        orgId: 'demo-org',
      })
    )
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Aviation Image & Branding */}
      <div className="relative lg:w-[55%] min-h-[280px] lg:min-h-screen overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=2574&auto=format&fit=crop')`,
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-sky-900/70" />

        {/* Animated Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-8 lg:p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Plane className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">AMSS</h1>
              <p className="text-xs text-sky-200/80 font-medium">Aviation Maintenance</p>
            </div>
          </div>

          {/* Hero Text - Hidden on mobile */}
          <div className="hidden lg:block max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Precision maintenance,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                zero downtime
              </span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              Streamline your aircraft maintenance operations with intelligent scheduling,
              real-time tracking, and comprehensive compliance management.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <Shield className="h-4 w-4 text-sky-400" />
                <span className="text-sm text-white font-medium">FAA Compliant</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-white font-medium">Real-time Tracking</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <Wrench className="h-4 w-4 text-amber-400" />
                <span className="text-sm text-white font-medium">Smart Scheduling</span>
              </div>
            </div>
          </div>

          {/* Bottom Stats - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-8">
            <div>
              <p className="text-3xl font-bold text-white">99.9%</p>
              <p className="text-sm text-slate-400">System Uptime</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-sm text-slate-400">Aircraft Managed</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-3xl font-bold text-white">24/7</p>
              <p className="text-sm text-slate-400">Support Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background relative">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 rounded-full"
          onClick={toggleTheme}
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Plane className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">AMSS</span>
          </div>

          {/* Form Card with Glassmorphism */}
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/20 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold tracking-tight mb-2">
                {step === 'email' ? 'Welcome back' : 'Enter your password'}
              </h2>
              <p className="text-muted-foreground">
                {step === 'email'
                  ? 'Sign in to your maintenance dashboard'
                  : 'Complete sign in to continue'}
              </p>
            </div>

            {step === 'email' ? (
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                    className="h-12 px-4 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card/50 backdrop-blur-xl px-3 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base border-border/50 hover:bg-muted/50"
                  onClick={handleDemoMode}
                >
                  <Plane className="mr-2 h-5 w-5" />
                  Demo Mode
                </Button>

                <p className="text-center text-xs text-muted-foreground pt-2">
                  Demo mode provides full access with sample data
                </p>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-ml-2 mb-2 text-muted-foreground hover:text-foreground"
                  onClick={handleBack}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {error && (
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Signing in as</p>
                  <p className="font-medium">{email}</p>
                </div>

                {organizations.length > 1 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Select Organization</Label>
                    <div className="space-y-2">
                      {organizations.map((org) => (
                        <button
                          key={org.org_id}
                          type="button"
                          onClick={() => setSelectedOrg(org)}
                          className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                            selectedOrg?.org_id === org.org_id
                              ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                              : 'border-border/50 hover:bg-muted/50 hover:border-border'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              selectedOrg?.org_id === org.org_id
                                ? 'bg-primary/10'
                                : 'bg-muted'
                            }`}>
                              <Building2 className={`h-5 w-5 ${
                                selectedOrg?.org_id === org.org_id
                                  ? 'text-primary'
                                  : 'text-muted-foreground'
                              }`} />
                            </div>
                            <span className="font-medium">{org.org_name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {organizations.length === 1 && selectedOrg && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Organization</p>
                        <p className="font-medium">{selectedOrg.org_name}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <a
                      href="#"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    autoFocus
                    className="h-12 px-4 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                  disabled={isLoading || !selectedOrg}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
