import { BookOpen, ChevronRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTutorial } from '../context/TutorialContext';
import { GENERIC_TUTORIALS } from '../tutorials/tutorialData';

// Site-specific tutorial sets keyed by registrySlug
const SITE_TUTORIALS = {
  'zoo-agency': [
    { id: '06-add-event', title: 'Zoo Agency: Event Property Uploads', desc: 'Zoo-specific event structure and custom field groups.', icon: '🦒' },
  ],
  'crssd': [
    { id: '11-event-phases', title: 'CRSSD: Phase Advancement Workflow', desc: 'CRSSD-specific phase timeline and announcement checklist.', icon: '🌊' },
  ],
};

function TutorialCard({ tutorial, onOpen }) {
  return (
    <button
      onClick={() => onOpen(tutorial)}
      className="w-full flex items-center gap-3 text-left bg-white border border-surface-3 rounded-2xl px-4 py-3 hover:border-vc-300 hover:bg-vc-50 active:scale-95 transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-vc-50 border border-vc-100 flex items-center justify-center text-xl shrink-0">
        {tutorial.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800 truncate">{tutorial.title}</div>
        <div className="text-xs text-gray-400 mt-0.5 leading-snug">{tutorial.desc}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </button>
  );
}

export default function TutorialsPage() {
  const { activeSite } = useAuth();
  const { openTutorial } = useTutorial();

  const siteSlug = activeSite?.registrySlug || '';
  const siteTutorials = SITE_TUTORIALS[siteSlug] || [];

  return (
    <div className="p-4 pb-28 animate-fade-in">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-vc-600" />
          <h2 className="text-lg font-semibold text-gray-900">Tutorials & Support</h2>
        </div>
        <p className="text-xs text-gray-400 leading-snug">
          Interactive walkthroughs for every feature in the app.
        </p>
      </div>

      {/* Site-specific tutorials at top when on a matching site */}
      {siteTutorials.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs font-semibold text-vc-600 uppercase tracking-wider">
              {activeSite?.name || 'This Site'}
            </div>
            <div className="flex-1 h-px bg-vc-100" />
          </div>
          <div className="flex flex-col gap-2">
            {siteTutorials.map(t => (
              <TutorialCard key={`site-${t.id}`} tutorial={t} onOpen={openTutorial} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">All Tutorials</div>
          <div className="flex-1 h-px bg-surface-3" />
        </div>
        <div className="flex flex-col gap-2">
          {GENERIC_TUTORIALS.map(t => (
            <TutorialCard key={t.id} tutorial={t} onOpen={openTutorial} />
          ))}
        </div>
      </div>

      <div className="mt-6 bg-surface-1 border border-surface-3 rounded-2xl px-4 py-4">
        <div className="text-sm font-semibold text-gray-700 mb-1">Need more help?</div>
        <div className="text-xs text-gray-400 leading-snug">
          Contact Sean at Vivo Creative or check the companion plugin repo for field documentation.
        </div>
      </div>
    </div>
  );
}
