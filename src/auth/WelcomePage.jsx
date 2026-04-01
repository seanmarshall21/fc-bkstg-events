import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Welcome / onboarding screen — first visit.
 * Matches the Figma "01 — Onboarding" sample.
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

  const handleLogin = () => {
    onDismiss();
    navigate('/login');
  };

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/bkgnds/Dirty Marble Mobile.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-sm relative z-10 text-center">
        {/* FC Logo — large hero mark */}
        <div className="w-40 h-40 mx-auto mb-6">
          <img src="/logos/fcevents-logo-main.png" alt="FC Event Manager" className="w-full h-full object-contain" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          FC Event Manager
        </h1>
        <p className="text-sm text-gray-600 mt-3 leading-relaxed max-w-[280px] mx-auto">
          Manage your festival content across all your brands, in one place.
        </p>

        {/* Action buttons */}
        <div className="mt-10 space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-white border border-surface-3 text-sm font-semibold text-gray-900 shadow-sm hover:shadow-md transition-all"
          >
            Go to Home Page
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleConnectSite}
            className="vc-btn vc-btn--primary w-full py-3.5 text-base"
          >
            Connect a Site
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Login link */}
        <p className="text-xs text-gray-500 mt-8">
          Already have an account?{' '}
          <button
            onClick={handleLogin}
            className="text-vc-600 hover:text-vc-500 transition-colors font-medium underline underline-offset-2"
          >
            Sign in
          </button>
        </p>

        {/* Help link */}
        <p className="text-xs text-gray-400 mt-3">
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
