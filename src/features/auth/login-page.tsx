import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plane, Loader2, ArrowLeft, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAppDispatch } from '@/app/store'
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
      // Auto-select if only one org
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
      // Step 1: Login to get tokens
      const loginResult = await login({
        org_id: selectedOrg.org_id,
        email,
        password,
      }).unwrap()

      // Store tokens first so /auth/me can use them
      dispatch(
        setCredentials({
          token: loginResult.access_token,
          refreshToken: loginResult.refresh_token,
          orgId: selectedOrg.org_id,
        })
      )

      // Step 2: Fetch user profile to get real role and permissions
      try {
        const userProfile = await getMe().unwrap()
        dispatch(setUser(userProfile))
      } catch {
        // If /auth/me fails, create a basic user from email
        // This shouldn't happen but provides a fallback
        console.warn('Failed to fetch user profile, using basic info')
        const fallbackUser: ApiUser = {
          id: 'unknown',
          org_id: selectedOrg.org_id,
          email: email,
          role: 'mechanic', // Default to lowest privilege
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <Plane className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold">AMSS</span>
            </div>
          </div>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to Aircraft Maintenance Scheduling System
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleDemoMode}
              >
                Continue with Demo Mode
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                <p>Demo mode uses mock data without API connection</p>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-2 -ml-2"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Signing in as</p>
                <p className="font-medium">{email}</p>
              </div>

              {organizations.length > 1 && (
                <div className="space-y-2">
                  <Label>Select Organization</Label>
                  <div className="space-y-2">
                    {organizations.map((org) => (
                      <button
                        key={org.org_id}
                        type="button"
                        onClick={() => setSelectedOrg(org)}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          selectedOrg?.org_id === org.org_id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{org.org_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {organizations.length === 1 && selectedOrg && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Organization</p>
                      <p className="font-medium">{selectedOrg.org_name}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="text-sm text-primary hover:underline"
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
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !selectedOrg}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
