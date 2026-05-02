import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import useSchema, { buildDefaultValues, buildAcfPayload, extractValues } from '../../hooks/useSchema';
import FieldEditor from '../../components/ui/FieldEditor';
import ArchiveEventDialog from '../../components/ArchiveEventDialog';
import ZooEventDetail from './ZooEventDetail';
import { Loader2, ChevronRight, ChevronLeft, Archive, CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { decodeHtml } from '../../utils/helpers';

const PHASES = [
  { key: 'planning',        label: 'Planning',        color: 'bg-gray-100 text-gray-600' },
  { key: 'save-the-date',   label: 'Save the Date',   color: 'bg-gray-100 text-gray-600' },
  { key: 'lineup-phase-1',  label: 'Lineup Phase 1',  color: 'bg-purple-100 text-purple-700' },
  { key: 'presale',         label: 'Presale',         color: 'bg-purple-100 text-purple-700' },
  { key: 'onsale',          label: 'On Sale',         color: 'bg-purple-100 text-purple-700' },
  { key: 'lineup-phase-2',  label: 'Lineup Phase 2',  color: 'bg-blue-100 text-blue-700' },
  { key: 'set-times-live',  label: 'Set Times Live',  color: 'bg-blue-100 text-blue-700' },
  { key: 'event-day',       label: 'Event Day',       color: 'bg-green-100 text-green-700' },
  { key: 'post-event',      label: 'Post Event',      color: 'bg-amber-100 text-amber-700' },
  { key: 'archived',        label: 'Archived',        color: 'bg-gray-200 text-gray-500' },
];

function PhaseStrip({ currentPhase, onAdvance, advancing }) {
  const [showPicker, setShowPicker] = useState(false);
  const visiblePhases = PHASES.filter(p => p.key !== 'archived');
  const currentIdx = visiblePhases.findIndex(p => p.key === currentPhase);
  const prevPhase = currentIdx > 0 ? visiblePhases[currentIdx - 1] : null;
  const nextPhase = currentIdx < visiblePhases.length - 1 ? visiblePhases[currentIdx + 1] : null;
  const current = visiblePhases[currentIdx] || visiblePhases[0];

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          {prevPhase && (
            <button
              onClick={() => onAdvance(prevPhase.key)}
              disabled={advancing}
              className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-40 transition-colors"
              title={`Back to ${prevPhase.label}`}
            >
              {advancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            onClick={() => setShowPicker(v => !v)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${current.color}`}
          >
            {current.label}
          </button>
        </div>
        {nextPhase && (
          <button
            onClick={() => onAdvance(nextPhase.key)}
            disabled={advancing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {advancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
            {nextPhase.label}
          </button>
        )}
      </div>

      <div className="px-4 pb-2 flex gap-0.5">
        {visiblePhases.map((p, i) => (
          <button
            key={p.key}
            onClick={() => !advancing && onAdvance(p.key)}
            disabled={advancing}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= currentIdx ? 'bg-purple-500' : 'bg-gray-200'}`}
            title={p.label}
          />
        ))}
      </div>

      {showPicker && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {visiblePhases.map((p) => {
            const isCurrent = p.key === currentPhase;
            return (
              <button
                key={p.key}
                onClick={() => { onAdvance(p.key); setShowPicker(false); }}
                disabled={advancing || isCurrent}
                className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors
                  ${isCurrent ? 'bg-purple-50' : 'hover:bg-gray-50'}
                  ${advancing ? 'opacity-60' : ''}`}
              >
                {isCurrent
                  ? <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                  : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                }
                <span className={`text-sm ${isCurrent ? 'text-purple-700 font-medium' : 'text-gray-600'}`}>
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EventDetail() {
  const { activeSite } = useAuth();
  if (activeSite?.registrySlug === 'zoo-agency') return <ZooEventDetail />;
  return <EventDetailInner />;
}

function EventDetailInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient, activeSite } = useAuth();
  const [event, setEvent]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [advancing, setAdvancing]     = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const isCreate = id === 'new';

  const { schema, fields: schemaFields, loading: schemaLoading, error: schemaError } = useSchema('vc_event_property', {
    skip: !activeSite?.appPassword,
    apiBase: activeSite ? `${activeSite.url}/wp-json/vc/v1` : '/wp-json/vc/v1',
    username: activeSite?.username,
    appPassword: activeSite?.appPassword,
  });

  const fetchEvent = useCallback(async () => {
    if (isCreate) {
      const defaults = schemaFields.length > 0 ? buildDefaultValues(schemaFields) : {};
      setEvent({ title: '', event_phase: 'planning', ...defaults });
      setLoading(false);
      return;
    }

    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(WP_ENDPOINTS.events.single(id), { context: 'edit' });
      const acf = data.acf || {};
      const acfValues = schemaFields.length > 0 ? extractValues(schemaFields, acf) : acf;
      setEvent({
        _wp: data,
        title: decodeHtml(data.title?.raw || ''),
        event_phase: data.event_phase || acf.event_phase || 'planning',
        ...acfValues,
      });
    } catch (err) {
      console.error('Failed to fetch event:', err);
      setEvent({ title: `Event #${id}`, _fetchError: true });
    } finally {
      setLoading(false);
    }
  }, [getClient, id, isCreate, schemaFields]);

  useEffect(() => {
    if (!schemaLoading) fetchEvent();
  }, [fetchEvent, schemaLoading]);

  const handleSave = useCallback(async (values) => {
    const client = getClient();
    if (!client) return;
    setSaving(true);
    try {
      const acfPayload = schemaFields.length > 0 ? buildAcfPayload(schemaFields, values) : {};
      if (isCreate) {
        const createBody = { title: values.title, status: 'publish' };
        if (Object.keys(acfPayload).length > 0) createBody.acf = acfPayload;
        const { data: newPost } = await client.post(WP_ENDPOINTS.events.list, createBody);
        navigate(`/events/${newPost.id}`, { replace: true });
      } else {
        const updateBody = { title: values.title };
        if (Object.keys(acfPayload).length > 0) updateBody.acf = acfPayload;
        await client.post(WP_ENDPOINTS.events.single(id), updateBody);
        await fetchEvent();
      }
    } finally {
      setSaving(false);
    }
  }, [getClient, id, isCreate, schemaFields, navigate, fetchEvent]);

  const handleAdvancePhase = useCallback(async (targetPhase) => {
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
  }, [getClient, id, isCreate]);

  const handleArchived = () => {
    setShowArchive(false);
    navigate('/events');
  };

  // ── Guards ────────────────────────────────────────────────────
  if (!activeSite) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }
  if (activeSite.appPassword && !schema && !schemaError) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }
  if (schemaLoading || loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }
  if (schemaError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 text-sm mb-1">Failed to load field schema</p>
        <p className="text-gray-400 text-xs">{schemaError.message}</p>
      </div>
    );
  }
  if (!event) {
    return <div className="p-4 text-center text-gray-400">Event not found</div>;
  }

  const currentPhase = event.event_phase || 'planning';
  const isArchived   = currentPhase === 'archived';

  const permalink = event._wp?.link || null;

  return (
    <>
      {!isCreate && (
        <PhaseStrip
          currentPhase={currentPhase}
          onAdvance={handleAdvancePhase}
          advancing={advancing}
        />
      )}

      {/* Permalink bar */}
      {!isCreate && permalink && (
        <a
          href={permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-surface-1 border-b border-surface-3 text-xs text-gray-400 hover:text-vc-600 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span className="truncate">{permalink}</span>
        </a>
      )}

      <FieldEditor
        schema={schema}
        values={event}
        onSave={handleSave}
        onCancel={() => navigate('/events')}
        getClient={getClient}
        saving={saving}
        mode={isCreate ? 'create' : 'edit'}
        layout="detail"
        titleFieldName="title"
        renderPhotoInEditor={false}
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
          apiBase={activeSite ? `${activeSite.url}/wp-json` : ''}
          eventId={id}
          eventTitle={event.title}
          onClose={() => setShowArchive(false)}
          onArchived={handleArchived}
        />
      )}
    </>
  );
}
