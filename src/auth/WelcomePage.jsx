import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe } from 'lucide-react';

/**
 * Welcome / onboarding screen shown on first visit.
 * Two paths: "Go to Home Page" (no login) or "Connect a Site" (add credentials).
 */
export default function WelcomePage({ onDismiss }) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onDismiss();
    navigate('/');
  };

  const handleConnectSite = () => {
    onDismiss();
    navigate('/add-site');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-surface-0 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-vc-100/60 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 text-center">
        {/* Logo */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden shadow-xl shadow-vc-900/20">
          <img src="/icons/icon-512.png" alt="VC Event Manager" className="w-full h-full object-cover" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          VC Event Manager
        </h1>
        <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-[280px] mx-auto">
          Manage your festival content across all your brands, in one place.
        </p>

        {/* Action buttons */}
        <div className="mt-10 space-y-3">
          <button
            onClick={handleGoHome}
            className="vc-btn vc-btn--primary w-full py-3 text-base"
          >
            Go to Home Page
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleConnectSite}
            className="vc-btn vc-btn--secondary w-full py-3 text-base"
          >
            <Globe className="w-4 h-4" />
            Connect a Site
          </button>
        </div>

        {/* Help link */}
        <p className="text-xs text-gray-400 mt-8">
          Need help?{' '}
          <button
            onClick={handleGoHome}
            className="text-vc-600 hover:text-vc-500 transition-colors underline underline-offset-2"
          >
            See setup guide
          </button>
        </p>
      </div>
    </div>
  );
}
