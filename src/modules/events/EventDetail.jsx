import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import FieldEditor from '../../components/ui/FieldEditor';
import ArchiveEventDialog from '../../components/ArchiveEventDialog';
import { Loader2, ChevronRight, Archive } from 'lucide-react';
import { decodeHtml } from '../../utils/helpers';

const EVENT_FIELDS = [
  { key: 'title', label: 'Event Name', type: 'text' },
  { key: 'vc_event_date_start', label: 'Start Date', type: 'date' },
  { key: 'vc_event_date_end', label: 'End Date', type: 'date' },
  { key: 'vc_event_venue', label: 'Venue', type: 'text' },
  { key: 'vc_event_city', label: 'City', type: 'text' },
  { key: 'vc_event_website', label: 'Website URL', type: 'url' },
  { key: 'vc_event_ticket_url', label: 'Ticket URL', type: 'url' },
];

const PHASES = [
  { key: 'planning',        label: 'Planning',            color: 'bg-gray-100 text-gray-600' },
  { key: 'save-the-date',   label: 'Save the Date',       color: 'bg-gray-100 text-gray-600' },
  { key: 'lineup-phase-1',  label: 'Lineup Phase 1',      color: 'bg-purple-100 text-purple-700' },
  { key: 'presale',         label: 'Presale',             color: 'bg-purple-100 text-purple-700' },
  { key: 'onsale',          label: 'On Sale',             color: 'bg-purple-100 text-purple-700' },
  { key: 'lineup-phase-2',  label: 'Lineup Phase 2',      color: 'bg-blue-100 text-blue-700' },
  { key: 'set-times-live',  label: 'Set Times Live',      color: 'bg-blue-100 text-blue-700' },
  { key: 'event-day',       label: 'Event Day',           color: 'bg-green-100 text-green-700' },
  { key: 'post-event',      label: 'Post Event',          color: 'bg-amber-100 text-amber-700' },
  { key: 'archived',        label: 'Archived',            color: 'bg-gray-200 text-gray-500' },
];

function PhaseStrip({ currentPhase, onAdvance, advancing }) {
  const currentIdx = PHASES.findIndex(p => p.key === currentPhase);
  const nextPhase = PHASES[currentIdx + 1] || null;
  const current = PHASES[currentIdx] || PHASES[0];

  return (
    <div className="px-4 py-3 bg-white border-b border-gray-100">
      {/* Current phase + advance button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Phase</span>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${current.color}`}>
            {current.label}
          </span>
        </div>
        {nextPhase && nextPhase.key !== 'archived' && (
          <button
            onClick={() => onAdvance(nextPhase.key)}
            disabled={advancing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {advancing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            {nextPhase.label}
          </button>
        )}
      </div>

      {/* Phase progress bar */}
      <div className="mt-2 flex gap-0.5">
        {PHASES.filter(p => p.key !== 'archived').map((p, i) => (
          <div
            key={p.key}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= currentIdx
                ? 'bg-purple-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient } = useAuth();
  const [event, setEvent]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [advancing, setAdvancing]     = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const isCreate = id === 'new';

  const fetchEvent = useCallback(async () => {
    if (isCreate) {
      setEvent({
        title: '',
        vc_event_date_start: '',
        vc_event_date_end: '',
        vc_event_venue: '',
        vc_event_city: '',
        vc_event_website: '',
        vc_event_ticket_url: '',
        event_phase: 'planning',
      });
      setLoading(false);
      return;
    }

    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(WP_ENDPOINTS.events.single(id), { context: 'edit' });
      const acf = data.acf || {};
      setEvent({
        ...data,
        title: decodeHtml(data.title?.raw || ''),
        vc_event_date_start: acf.vc_event_date_start || '',
        vc_event_date_end:   acf.vc_event_date_end   || '',
        vc_event_venue:      acf.vc_event_venue       || '',
        vc_event_city:       acf.vc_event_city        || '',
        vc_event_website:    acf.vc_event_website     || '',
        vc_event_ticket_url: acf.vc_event_ticket_url  || '',
        event_phase:         data.event_phase || acf.event_phase || 'planning',
      });
    } catch (err) {
      console.error('Failed to fetch event:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, id, isCreate]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const handleSave = async (values) => {
    const client = getClient();
    if (!client) return;
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        acf: {
          vc_event_date_start: values.vc_event_date_start,
          vc_event_date_end:   values.vc_event_date_end,
          vc_event_venue:      values.vc_event_venue,
          vc_event_city:       values.vc_event_city,
          vc_event_website:    values.vc_event_website,
          vc_event_ticket_url: values.vc_event_ticket_url,
        },
      };
      if (isCreate) {
        payload.status = 'publish';
        const { data: newPost } = await client.post(WP_ENDPOINTS.events.list, payload);
        navigate(`/events/${newPost.id}`, { replace: true });
      } else {
        await client.post(WP_ENDPOINTS.events.single(id), payload);
        await fetchEvent();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAdvancePhase = async (targetPhase) => {
    const client = getClient();
    if (!client || !id || isCreate) return;
    setAdvancing(true);
    try {
      await client.post(`/vc/v1/event/${id}/phase`, { phase: targetPhase });
      setEvent(prev => ({ ...prev, event_phase: targetPhase }));
    } catch (err) {
      console.error('Phase advance failed:', err);
    } finally {
      setAdvancing(false);
    }
  };

  const handleArchived = () => {
    setShowArchive(false);
    navigate('/events');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (!event)  return <div className="p-4 text-center text-gray-400">Event not found</div>;

  const currentPhase = event.event_phase || 'planning';
  const isArchived   = currentPhase === 'archived';

  return (
    <>
      {/* Phase strip — only on existing events */}
      {!isCreate && (
        <PhaseStrip
          currentPhase={currentPhase}
          onAdvance={handleAdvancePhase}
          advancing={advancing}
        />
      )}

      <FieldEditor
        title={isCreate ? 'New Event' : (event.title || 'Edit Event')}
        fields={EVENT_FIELDS}
        initialValues={event}
        onSave={handleSave}
        onCancel={() => navigate('/events')}
        saving={saving}
        mode={isCreate ? 'create' : 'edit'}
        layout="form"
        extraActions={!isCreate && !isArchived ? [
          {
            label: 'Archive Event',
            icon: Archive,
            variant: 'danger',
            onClick: () => setShowArchive(true),
          },
        ] : undefined}
      />

      {showArchive && (
        <ArchiveEventDialog
          getClient={getClient}
          eventId={id}
          eventTitle={event.title}
          onClose={() => setShowArchive(false)}
          onArchived={handleArchived}
        />
      )}
    </>
  );
}
