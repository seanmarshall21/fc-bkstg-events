import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import useSchema, { buildDefaultValues, buildAcfPayload, extractValues } from '../../hooks/useSchema';
import SchemaField, { AvatarUpload } from '../../components/ui/SchemaFields';
import { decodeHtml } from '../../utils/helpers';
import { ChevronLeft, Loader2, Link as LinkIcon, CheckCircle, AlertCircle, ShieldCheck, ShieldOff } from 'lucide-react';
import PostControls from '../../components/ui/PostControls';

/**
 * ZooEventDetail — Zoo Agency-specific event detail/create form.
 *
 * Layout (top → bottom):
 *   ← Events  [Save]
 *   Event Title  (post_title — labeled input)
 *   Permalink    (read-only, from _wp.link)
 *   Event Icon   (vc_ep_event_icon — AvatarUpload, circle)
 *   ── Schema-driven ACF fields ──
 *   Title / Season / Confidential / Private Visibility  (flat)
 *   Dates / Details / Media / Social                   (Group sections, collapsible)
 */

// ── Event Icon field name ──────────────────────────────────────
const ICON_FIELD = 'vc_ep_event_icon';

// ── Save toast ─────────────────────────────────────────────────
function SaveToast({ status, message }) {
  if (!status) return null;
  return (
    <div className={`flex items-center gap-2 px-4 py-3 mx-4 rounded-xl mb-3 ${
      status === 'success'
        ? 'bg-emerald-50 border border-emerald-200'
        : 'bg-red-50 border border-red-200'
    }`}>
      {status === 'success'
        ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
        : <AlertCircle  className="w-4 h-4 text-red-500 shrink-0"    />
      }
      <span className={`text-[13px] ${
        status === 'success' ? 'text-emerald-700' : 'text-red-700'
      }`}>{message}</span>
    </div>
  );
}

// ── Labeled field wrapper ──────────────────────────────────────
function LabeledInput({ label, children }) {
  return (
    <div className="px-4 mb-3">
      <label className="block text-[11px] font-semibold text-[#979797] uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function ZooEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient, activeSite } = useAuth();

  const isCreate = id === 'new';

  const [event,          setEvent]          = useState(null);
  const [values,         setValues]         = useState({});
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [saveStatus,     setSaveStatus]     = useState(null);
  const [saveMsg,        setSaveMsg]        = useState('');
  const [confToggling,   setConfToggling]   = useState(false);
  const [wpStatus,       setWpStatus]       = useState(null);

  // ── Schema ──────────────────────────────────────────────────
  const {
    schema,
    fields: schemaFields,
    loading: schemaLoading,
    error: schemaError,
  } = useSchema('vc_event_property', {
    skip: !activeSite?.appPassword,
    apiBase: activeSite ? `${activeSite.url}/wp-json/vc/v1` : '/wp-json/vc/v1',
    username: activeSite?.username,
    appPassword: activeSite?.appPassword,
  });

  // ── Fields split: icon vs everything else ──────────────────
  // The icon field is rendered as AvatarUpload above the form.
  // All remaining schema fields render via SchemaField in order.
  const iconField    = schemaFields.find(f => f.name === ICON_FIELD);
  const bodyFields   = schemaFields.filter(f => f.name !== ICON_FIELD);

  // ── Fetch event ─────────────────────────────────────────────
  const fetchEvent = useCallback(async () => {
    if (isCreate) {
      const defaults = schemaFields.length > 0 ? buildDefaultValues(schemaFields) : {};
      setValues({ title: '', ...defaults });
      setEvent(null);
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
      setEvent(data);
      setWpStatus(data.status || 'publish');
      setValues({
        title: decodeHtml(data.title?.raw || ''),
        ...acfValues,
      });
    } catch (err) {
      console.error('[ZooEventDetail] fetch failed:', err);
      setEvent(null);
      setValues({ title: `Event #${id}`, _fetchError: true });
    } finally {
      setLoading(false);
    }
  }, [getClient, id, isCreate, schemaFields]);

  useEffect(() => {
    if (!schemaLoading) fetchEvent();
  }, [fetchEvent, schemaLoading]);

  // ── Handle field change ─────────────────────────────────────
  const handleChange = (key, value) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  // ── Save ────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setSaving(true);
    setSaveStatus(null);

    try {
      const acfPayload = schemaFields.length > 0 ? buildAcfPayload(schemaFields, values) : {};
      const body = { title: values.title || '' };
      if (Object.keys(acfPayload).length > 0) body.acf = acfPayload;

      if (isCreate) {
        body.status = 'publish';
        const { data: newPost } = await client.post(WP_ENDPOINTS.events.list, body);
        navigate(`/events/${newPost.id}`, { replace: true });
        return;
      }

      await client.post(WP_ENDPOINTS.events.single(id), body);
      await fetchEvent();
      setSaveStatus('success');
      setSaveMsg('Saved successfully');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('[ZooEventDetail] save failed:', err);
      setSaveStatus('error');
      setSaveMsg(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [getClient, id, isCreate, schemaFields, values, navigate, fetchEvent]);

  // ── Confidential master toggle (independent of form save) ──
  const handleToggleConfidential = useCallback(async () => {
    const client = getClient();
    if (!client || isCreate || confToggling) return;

    const current = Boolean(event?.acf?.vc_ep_confidential);
    const next    = !current;

    // Optimistic update
    setEvent(prev => prev ? {
      ...prev,
      acf: { ...prev.acf, vc_ep_confidential: next, vc_confidential_master: next },
    } : prev);
    setConfToggling(true);

    try {
      await client.post(WP_ENDPOINTS.events.single(id), {
        acf: { vc_ep_confidential: next, vc_confidential_master: next },
      });
    } catch (err) {
      console.error('[ZooEventDetail] confidential toggle failed:', err);
      // Revert
      setEvent(prev => prev ? {
        ...prev,
        acf: { ...prev.acf, vc_ep_confidential: current, vc_confidential_master: current },
      } : prev);
    } finally {
      setConfToggling(false);
    }
  }, [getClient, id, isCreate, event, confToggling]);

  // ── Permalink display ───────────────────────────────────────
  const permalink = event?.link || event?.permalink || '';
  const slug      = event?.slug || '';

  // ── Guards ──────────────────────────────────────────────────
  if (!activeSite) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (activeSite.appPassword && !schema && !schemaError) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (schemaLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (schemaError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 text-sm mb-1">Failed to load field schema</p>
        <p className="text-gray-400 text-xs">{schemaError.message}</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="pb-8 animate-fade-in">

      {/* ── Nav header ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Events</span>
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
            bg-[#b1d6c3] text-[#0f331f] hover:bg-[#9ac8b0]
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* ── Confidential master toggle bar ───────────────── */}
      {!isCreate && event && (() => {
        const isConf = Boolean(event.acf?.vc_ep_confidential);
        return (
          <button
            type="button"
            onClick={handleToggleConfidential}
            disabled={confToggling}
            className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${
              isConf
                ? 'bg-[#1a0a0a] text-[#f87171]'
                : 'bg-[#0a1a0f] text-[#4ade80]'
            } ${confToggling ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-2">
              {isConf
                ? <ShieldOff className="w-4 h-4 shrink-0" />
                : <ShieldCheck className="w-4 h-4 shrink-0" />
              }
              <span className="text-[13px] font-semibold">
                {isConf ? 'Confidential — tap to make live' : 'Live — tap to mark confidential'}
              </span>
            </div>
            {confToggling
              ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              : (
                <div className={`w-9 h-[20px] rounded-full relative transition-colors ${isConf ? 'bg-red-800' : 'bg-emerald-800'}`}>
                  <span className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow transition-all ${isConf ? 'left-[2px]' : 'left-[18px]'}`} />
                </div>
              )
            }
          </button>
        );
      })()}

      {/* ── Save toast ───────────────────────────────────── */}
      <div className="mt-3">
        <SaveToast status={saveStatus} message={saveMsg} />
      </div>

      {/* ── Event Title (post_title) ─────────────────────── */}
      <LabeledInput label="Event Title">
        <div className="vc-field-bg">
          <input
            type="text"
            className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none placeholder:text-gray-300"
            style={{ fontSize: '16px' }}
            value={values.title || ''}
            onChange={e => handleChange('title', e.target.value)}
            placeholder={isCreate ? 'Enter event title…' : ''}
            autoFocus={isCreate}
          />
        </div>
      </LabeledInput>

      {/* ── Permalink (read-only) ────────────────────────── */}
      {!isCreate && (
        <LabeledInput label="Permalink">
          <div className="vc-field-bg flex items-center gap-2">
            <LinkIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="flex-1 text-[13px] text-[#979797] truncate">
              {permalink || `${activeSite?.url || ''}/`}
            </span>
          </div>
        </LabeledInput>
      )}

      {/* ── Event Icon (vc_ep_event_icon) ────────────────── */}
      <div className="px-4 mb-2">
        <label className="block text-[11px] font-semibold text-[#979797] uppercase tracking-wide mb-2">
          Event Icon
        </label>
        <AvatarUpload
          value={values[ICON_FIELD] ?? null}
          onChange={val => handleChange(ICON_FIELD, val)}
          getClient={getClient}
        />
      </div>

      {/* ── Schema-driven ACF fields ─────────────────────── */}
      <div className="px-4 space-y-3 mt-2">
        {bodyFields.map(field => (
          <SchemaField
            key={field.key || field.name}
            field={field}
            value={field.type === 'group'
              ? (values[field.name] || {})
              : (values[field.name] ?? '')}
            onChange={val => handleChange(field.name, val)}
            getClient={getClient}
            depth={0}
          />
        ))}
      </div>

      {/* ── Post status + trash ──────────────────────────── */}
      {!isCreate && event && (
        <div className="px-4">
          <PostControls
            endpoint={WP_ENDPOINTS.events.single(id)}
            currentStatus={wpStatus}
            onStatusChanged={setWpStatus}
            onDeleted={() => navigate('/events')}
            getClient={getClient}
            isCreate={isCreate}
            disabled={saving}
          />
        </div>
      )}

    </div>
  );
}
