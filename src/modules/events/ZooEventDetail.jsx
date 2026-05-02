import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import useSchema, { buildDefaultValues, buildAcfPayload, extractValues } from '../../hooks/useSchema';
import FieldEditor from '../../components/ui/FieldEditor';
import { AvatarUpload } from '../../components/ui/SchemaFields';
import ArchiveEventDialog from '../../components/ArchiveEventDialog';
import { Loader2, Archive, ExternalLink, AlertTriangle } from 'lucide-react';
import { decodeHtml } from '../../utils/helpers';

export default function ZooEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient, activeSite } = useAuth();

  const [event, setEvent]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  // Track icon separately so AvatarUpload can save independently
  const [iconValue, setIconValue]     = useState(null);

  const isCreate = id === 'new';

  // Schema endpoint is public (no auth required) — skip only if no site at all.
  // appPassword is needed for saves, not for schema fetch.
  const { schema, fields: schemaFields, loading: schemaLoading, error: schemaError } = useSchema('vc_event_property', {
    skip: !activeSite,
    apiBase: activeSite ? `${activeSite.url}/wp-json/vc/v1` : '/wp-json/vc/v1',
    username: activeSite?.username,
    appPassword: activeSite?.appPassword,
  });

  const fetchEvent = useCallback(async () => {
    if (isCreate) {
      const defaults = schemaFields.length > 0 ? buildDefaultValues(schemaFields) : {};
      setEvent({ title: '', ...defaults });
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
      setIconValue(acf.vc_ep_event_icon || null);
      setEvent({
        _wp: data,
        title: decodeHtml(data.title?.raw || ''),
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

  // ── Icon upload — immediate PATCH, independent of main form ───────────────

  const handleIconChange = useCallback(async (newIcon) => {
    setIconValue(newIcon);
    const client = getClient();
    if (!client || isCreate) return;
    try {
      await client.post(WP_ENDPOINTS.events.single(id), {
        acf: { vc_ep_event_icon: newIcon?.id ?? null },
      });
    } catch (err) {
      console.error('Icon save failed:', err);
      setIconValue(prev => prev);
    }
  }, [getClient, id, isCreate]);

  // ── Main form save ─────────────────────────────────────────────────────────

  const handleSave = useCallback(async (values) => {
    const client = getClient();
    if (!client) return;
    setSaving(true);
    try {
      const acfPayload = schemaFields.length > 0 ? buildAcfPayload(schemaFields, values) : {};
      // ACF returns image fields with uppercase ID; uploads return lowercase id — handle both
      if (iconValue !== null) acfPayload.vc_ep_event_icon = iconValue?.ID ?? iconValue?.id ?? null;

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
  }, [getClient, id, isCreate, schemaFields, iconValue, navigate, fetchEvent]);

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

  // Zoo visibility is driven by vc_ep_confidential / vc_ep_private_visibility ACF toggles,
  // not a phase cycle. Archived = WP post drafted via archive endpoint.
  const isArchived   = event._wp?.status === 'draft';
  const permalink    = event._wp?.link || null;
  const displayTitle = event.vc_ep_title || event.title || '';
  const hasCredentials = !!activeSite?.appPassword;

  return (
    <>
      {/* ── No-credentials banner ─────────────────────────────── */}
      {!hasCredentials && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>No WP credentials configured for this site — viewing only. Add an app password in site settings to enable saves.</span>
        </div>
      )}

      {/* ── Zoo header: icon + title ───────────────────────────── */}
      {!isCreate && (
        <div className="bg-white border-b border-surface-3 px-4 py-4 flex items-center gap-4">
          <AvatarUpload
            value={iconValue}
            onChange={handleIconChange}
            getClient={getClient}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
              Zoo Agency
            </p>
            <h2 className="text-lg font-bold text-gray-900 truncate leading-tight">
              {displayTitle || <span className="text-gray-300">Untitled Event</span>}
            </h2>
          </div>
        </div>
      )}

      {/* ── Permalink bar ─────────────────────────────────────── */}
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

      {/* ── Schema-driven field editor ────────────────────────── */}
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
