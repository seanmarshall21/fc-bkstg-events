import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, AlertCircle, HelpCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function LoginScreen() {
  const { addSite, error, setError } = useAuth();
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await addSite({ url, username, appPassword });
    } catch {
      // Error is set in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-vc-600/8 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl overflow-hidden bg-surface-dark-1 border border-surface-dark-3 flex items-center justify-center shadow-lg shadow-black/30">
            <img src="/icons/icon-192.png" alt="FC.OP.LED" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
            Event Manager
          </h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Connect your WordPress site to manage<br />artists, lineups, sponsors & more.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-900/20 border border-red-800/40 mb-5 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Site URL
            </label>
            <input
              type="text"
              className="vc-input"
              placeholder="yourdomain.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Username
            </label>
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
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Application Password
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-600 hover:text-vc-400 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />
                }
              </button>
            </div>

            {/* Help expandable */}
            {showHelp && (
              <div className="mt-2 p-3 rounded-lg bg-surface-dark-1 border border-surface-dark-3 text-xs text-gray-400 leading-relaxed space-y-1.5">
                <p className="font-medium text-gray-300">How to generate one:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-500">
                  <li>Log into your WP Admin dashboard</li>
                  <li>Go to <span className="text-gray-300">Users → Profile</span></li>
                  <li>Scroll to <span className="text-gray-300">Application Passwords</span></li>
                  <li>Enter a name (e.g. "Event Manager") and click <span className="text-gray-300">Add New</span></li>
                  <li>Copy the generated password and paste it here</li>
                </ol>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="vc-btn vc-btn--primary w-full mt-3 py-3 text-base"
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

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-8">
          Requires the <span className="text-gray-500">VC Event Properties</span> plugin
        </p>
      </div>
    </div>
  );
}
