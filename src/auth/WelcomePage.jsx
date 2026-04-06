import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Welcome / onboarding screen — first visit.
 * Matches the Figma "01 — Onboarding" sample.
 */
export default function WelcomePage({ onDismiss }) {
  const navigate = useNavigate();

  const handleSignIn = () => {
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
            onClick={handleSignIn}
            className="vc-btn vc-btn--primary w-full py-3.5 text-base"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Help link */}
        <p className="text-xs text-gray-400 mt-6">
          Sign in to connect sites and manage your events.
        </p>
      </div>
    </div>
  );
}
