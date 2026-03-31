import { useState } from 'react';
import { Globe, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function LoginScreen() {
  const { addSite, error, setError } = useAuth();
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await addSite({ url, username, appPassword });
      // Success — AuthProvider updates state, app redirects automatically
    } catch {
      // Error is set in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-vc-600 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-100">
            VC Event Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect a WordPress site to get started
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-900/30 border border-red-800/50 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Site URL</label>
            <input
              type="text"
              className="vc-input"
              placeholder="https://yourdomain.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Username</label>
            <input
              type="text"
              className="vc-input"
              placeholder="WordPress username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Application Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="vc-input pr-10"
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                value={appPassword}
                onChange={e => setAppPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />
                }
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1.5">
              Generate one at WP Admin → Users → Profile → Application Passwords
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="vc-btn vc-btn--primary w-full mt-2"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Connect Site
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
