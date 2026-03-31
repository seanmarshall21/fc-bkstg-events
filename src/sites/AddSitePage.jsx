import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Globe, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function AddSitePage() {
  const navigate = useNavigate();
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
      navigate('/');
    } catch {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-8">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-surface-dark-2 text-gray-400"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-100">Add Site</h2>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-900/30 border border-red-800/50 mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Site URL</label>
          <input type="text" className="vc-input" placeholder="https://yourdomain.com" value={url} onChange={e => setUrl(e.target.value)} required autoFocus />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Username</label>
          <input type="text" className="vc-input" placeholder="WordPress username" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Application Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} className="vc-input pr-10" placeholder="xxxx xxxx xxxx xxxx xxxx xxxx" value={appPassword} onChange={e => setAppPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={submitting} className="vc-btn vc-btn--primary w-full mt-2">
          {submitting ? 'Connecting...' : 'Connect Site'}
          {!submitting && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
