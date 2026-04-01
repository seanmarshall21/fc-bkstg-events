import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, ArrowRight, AlertCircle, HelpCircle, Lock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getSitesByCategory, SITE_CATEGORIES } from '../config/siteRegistry';

export default function AddSitePage() {
  const navigate = useNavigate();
  const { addSite, sites, error, setError } = useAuth();

  // Two-step flow: null = picker, object = credential form
  const [selectedSite, setSelectedSite] = useState(null);
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const grouped = getSitesByCategory();

  // Check which sites are already connected
  const connectedDomains = sites.map(s => {
    try { return new URL(s.url).hostname.replace('www.', ''); } catch { return ''; }
  });

  const handleSelect = (site) => {
    setError(null);
    setSelectedSite(site);
    setUsername('');
    setAppPassword('');
  };

  const handleBack = () => {
    setSelectedSite(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await addSite({
        url: selectedSite.url,
        username,
        appPassword,
        registrySlug: selectedSite.slug,
      });
      navigate('/');
    } catch {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2: Credential form ───────────────────────────────
  if (selectedSite) {
    return (
      <div className="p-4 pb-8 animate-fade-in">
        {/* Back + site header */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to sites
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-surface-2 overflow-hidden flex items-center justify-center">
            <img
              src={selectedSite.logo}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{selectedSite.name}</h2>
            <p className="text-xs text-gray-400">{selectedSite.domain}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 mb-5">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Credential form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              WordPress Username
            </label>
            <input
              type="text"
              className="vc-input"
              placeholder="Your WordPress username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Application Password
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-400 hover:text-vc-500 transition-colors"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {showHelp && (
              <div className="mt-2 p-3 rounded-lg bg-surface-1 border border-surface-3 text-xs text-gray-500 leading-relaxed space-y-1.5">
                <p className="font-medium text-gray-700">How to generate one:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-500">
                  <li>Log into <span className="text-gray-700">{selectedSite.domain}/wp-admin</span></li>
                  <li>Go to <span className="text-gray-700">Users &rarr; Profile</span></li>
                  <li>Scroll to <span className="text-gray-700">Application Passwords</span></li>
                  <li>Enter a name (e.g. "FC Events") and click <span className="text-gray-700">Add New</span></li>
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
                Connect {selectedSite.name}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          Requires the <span className="text-gray-500">VC Event Properties</span> plugin
        </p>
      </div>
    );
  }

  // ── Step 1: Site picker ───────────────────────────────────
  return (
    <div className="p-4 pb-8 animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Add a Site</h2>
        <p className="text-sm text-gray-500 mt-1">Select the site you want to connect</p>
      </div>

      {Object.entries(grouped).map(([catKey, catSites]) => (
        <div key={catKey} className="mb-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 px-1">
            {SITE_CATEGORIES[catKey] || catKey}
          </p>
          <div className="space-y-1.5">
            {catSites.map((site) => {
              const isConnected = connectedDomains.includes(site.domain);
              return (
                <button
                  key={site.slug}
                  onClick={() => !isConnected && handleSelect(site)}
                  disabled={isConnected}
                  className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-colors ${
                    isConnected
                      ? 'opacity-50 cursor-default bg-surface-1'
                      : 'hover:bg-surface-1 active:bg-surface-2'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-2 overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={site.logo}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span class="text-sm font-bold text-gray-400">${site.name.charAt(0)}</span>`;
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{site.name}</p>
                    <p className="text-xs text-gray-400 truncate">{site.domain}</p>
                  </div>
                  {isConnected ? (
                    <span className="text-xs text-green-600 font-medium px-2 py-0.5 bg-green-50 rounded-full">Connected</span>
                  ) : (
                    <Lock className="w-4 h-4 text-gray-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
