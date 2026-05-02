import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ArrowRight, Mail, Lock, Eye, EyeOff, PlayCircle } from 'lucide-react';

/**
 * Login / Sign Up page.
 * Email + password auth with toggle between sign-in and sign-up.
 * Google OAuth button for one-tap sign-in.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInGoogle, authError, setAuthError } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setBusy(true);

    try {
      if (mode === 'signup') {
        const result = await signUp(email, password);
        // Supabase sends a confirmation email for new signups
        if (result?.user?.identities?.length === 0) {
          setAuthError('An account with this email already exists.');
        } else {
          setConfirmSent(true);
        }
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err) {
      // Error is set via AuthContext
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setAuthError(null);
    try {
      await signInGoogle();
      // OAuth redirects — won't reach here
    } catch (err) {
      // Error is set via AuthContext
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setAuthError(null);
    setConfirmSent(false);
  };

  // Confirmation sent state
  if (confirmSent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <Mail className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Check your email</h1>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            We sent a confirmation link to <strong>{email}</strong>.
            Click the link to activate your account, then come back and sign in.
          </p>
          <button
            onClick={() => { setConfirmSent(false); setMode('signin'); }}
            className="vc-btn vc-btn--primary w-full mt-8"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/icons/VC-WebApp-Logo-Purp-lt.svg"
            alt=""
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'signin'
              ? 'Sign in to sync your sites across devices.'
              : 'Create an account to sync across devices.'}
          </p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-surface-3 bg-white text-sm font-medium text-gray-700 hover:bg-surface-1 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-surface-3" />
          <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-surface-3" />
        </div>

        {/* Email / Password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="vc-input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
                required
                minLength={6}
                className="vc-input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {authError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="vc-btn vc-btn--primary w-full py-3"
          >
            {busy ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle sign in / sign up */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={toggleMode}
            className="text-vc-600 hover:text-vc-500 font-medium transition-colors"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        {/* Back to welcome */}
        <button
          onClick={() => navigate('/')}
          className="block mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back
        </button>

        {/* Watch tutorials */}
        <div className="mt-10 pt-6 border-t border-surface-3">
          <a
            href="/tutorials/video-tutorials.html"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-surface-3 bg-white text-sm font-medium text-gray-600 hover:bg-surface-1 hover:text-gray-800 transition-colors"
          >
            <PlayCircle className="w-4 h-4 text-vc-600" />
            Watch tutorials
          </a>
        </div>
      </div>
    </div>
  );
}
