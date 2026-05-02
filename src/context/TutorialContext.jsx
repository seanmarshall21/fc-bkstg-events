import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { TUTORIAL_IMPORTS, ROUTE_TUTORIAL_MAP } from '../tutorials/tutorialData';

const TutorialContext = createContext(null);

export function useTutorial() {
  return useContext(TutorialContext);
}

const seenKey = (id) => `vc_tutorial_seen_${id}`;

export function TutorialProvider({ children }) {
  const location = useLocation();
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [tutorialHtml, setTutorialHtml] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [promptTutorial, setPromptTutorial] = useState(null);

  // First-visit prompt — fires once per tutorial, 800ms after route settles
  useEffect(() => {
    const mapped = ROUTE_TUTORIAL_MAP[location.pathname];
    if (!mapped) { setPromptTutorial(null); return; }
    if (localStorage.getItem(seenKey(mapped.id))) return;
    const t = setTimeout(() => setPromptTutorial(mapped), 800);
    return () => clearTimeout(t);
  }, [location.pathname]);

  // Listen for postMessage from tutorial iframe — 'tutorial-done' closes the overlay
  useEffect(() => {
    const handler = (e) => {
      if (e.data === 'tutorial-done') closeTutorial();
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Load bundled HTML string when a tutorial is opened
  useEffect(() => {
    if (!activeTutorial) { setTutorialHtml(''); setLoadError(false); return; }
    setTutorialHtml('');
    setLoadError(false);
    const loader = TUTORIAL_IMPORTS[activeTutorial.id];
    if (!loader) { setLoadError(true); return; }
    loader()
      .then(mod => setTutorialHtml(mod.default))
      .catch(() => setLoadError(true));
  }, [activeTutorial]);

  const openTutorial = (tutorial) => {
    setPromptTutorial(null);
    setActiveTutorial(tutorial);
  };

  const closeTutorial = () => {
    setActiveTutorial(null);
    setTutorialHtml('');
  };

  const acceptPrompt = () => {
    localStorage.setItem(seenKey(promptTutorial.id), '1');
    openTutorial(promptTutorial);
  };

  const dismissPrompt = () => {
    localStorage.setItem(seenKey(promptTutorial.id), '1');
    setPromptTutorial(null);
  };

  return (
    <TutorialContext.Provider value={{ openTutorial }}>
      {children}

      {/* ── First-visit prompt ── */}
      {promptTutorial && !activeTutorial && (
        <div className="fixed inset-x-0 bottom-0 z-[55] flex items-end pointer-events-none">
          <div className="w-full px-4 pb-[88px] pointer-events-auto animate-slide-up">
            <div className="bg-white rounded-2xl shadow-xl border border-surface-3 p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-vc-50 border border-vc-100 flex items-center justify-center text-xl shrink-0">
                  {promptTutorial.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">New to this section?</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-snug">
                    Take a quick walkthrough of <strong className="text-gray-600">{promptTutorial.title}</strong>
                  </div>
                </div>
                <button
                  onClick={dismissPrompt}
                  className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center text-gray-400 hover:bg-surface-3 transition-colors shrink-0 -mt-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={dismissPrompt}
                  className="flex-1 py-2.5 rounded-xl border border-surface-3 text-sm font-medium text-gray-500 hover:bg-surface-1 transition-colors"
                >
                  Not now
                </button>
                <button
                  onClick={acceptPrompt}
                  className="flex-[2] py-2.5 px-4 rounded-xl bg-vc-600 text-white text-sm font-semibold hover:bg-vc-700 transition-colors"
                >
                  Take the tour →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tutorial overlay ── */}
      {activeTutorial && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a2e] shrink-0">
            <div className="text-sm font-semibold text-white truncate pr-4">
              {activeTutorial.icon} {activeTutorial.title}
            </div>
            <button
              onClick={closeTutorial}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!tutorialHtml && !loadError && (
            <div className="flex-1 flex items-center justify-center bg-[#1a1a2e]">
              <div className="w-6 h-6 border-2 border-vc-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {loadError && (
            <div className="flex-1 flex items-center justify-center bg-[#1a1a2e]">
              <p className="text-sm text-gray-400">Failed to load tutorial.</p>
            </div>
          )}

          {tutorialHtml && (
            <iframe
              srcdoc={tutorialHtml}
              title={activeTutorial.title}
              className="flex-1 w-full border-none"
              sandbox="allow-scripts"
            />
          )}
        </div>
      )}
    </TutorialContext.Provider>
  );
}
