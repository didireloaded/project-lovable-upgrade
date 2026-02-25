import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { BackgroundPaths } from '@/components/ui/background-paths'

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password.',
  'Email not confirmed': 'Check your inbox and confirm your email first.',
  'User already registered': 'An account with this email already exists.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
}

export default function Auth() {
  const { user, loading, signInWithEmail, signUpWithEmail } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (isSignUp) {
        const authError = await signUpWithEmail(email, password)
        if (authError) {
          setError(ERROR_MESSAGES[authError.message] ?? authError.message)
        } else {
          setSignUpSuccess(true)
        }
      } else {
        const authError = await signInWithEmail(email, password)
        if (authError) {
          setError(ERROR_MESSAGES[authError.message] ?? authError.message)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-5 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundPaths title="" />
      </div>

      <div className="relative z-10 w-full max-w-[380px]">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-primary-foreground tracking-[0.12em] uppercase">
            Drive<span className="text-secondary">Link</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        <div className="glass-card">
          {signUpSuccess ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">✉️</div>
              <p className="text-success font-display text-sm font-semibold">Check your email!</p>
              <p className="text-muted-foreground text-xs mt-2">
                We sent a confirmation link to <strong className="text-foreground">{email}</strong>
              </p>
              <button
                onClick={() => { setSignUpSuccess(false); setIsSignUp(false) }}
                className="mt-4 text-secondary text-xs underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="bg-foreground/[0.06] border border-foreground/[0.12] rounded-xl px-4 py-3 text-sm text-foreground outline-none font-body placeholder:text-muted-foreground focus:border-secondary/40 transition-colors"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                required
                minLength={6}
                className="bg-foreground/[0.06] border border-foreground/[0.12] rounded-xl px-4 py-3 text-sm text-foreground outline-none font-body placeholder:text-muted-foreground focus:border-secondary/40 transition-colors"
              />

              {error && (
                <div className="bg-destructive/15 border border-destructive/30 rounded-xl px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-primary to-secondary border-none rounded-xl py-3 font-display text-sm font-bold text-primary-foreground tracking-wider uppercase cursor-pointer disabled:opacity-50 transition-opacity"
              >
                {submitting ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
                className="text-muted-foreground text-xs border-none bg-transparent cursor-pointer hover:text-foreground transition-colors py-1"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
