import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import useSchema, { buildDefaultValues, buildAcfPayload, extractValues } from '../../hooks/useSchema';
import FieldEditor from '../../components/ui/FieldEditor';
import { Loader2 } from 'lucide-react';

/**
 * Schema-driven lineup slot detail / create page.
 *
 * Replaces hardcoded LINEUP_FIELDS with the live ACF schema for vc_lineup_slot,
 * giving artist search, stage taxonomy select, time pickers, event linkage, etc.
 */
export default function LineupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient, activeSite, activeEventId } = useAuth();
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isCreate = id === 'new';

  const { schema, fields: schemaFields, loading: schemaLoading, error: schemaError } = useSchema('vc_lineup_slot', {
    skip: !activeSite?.appPassword,
    apiBase: activeSite ? `${activeSite.url}/wp-json/vc/v1` : '/wp-json/vc/v1',
    username: activeSite?.username,
    appPassword: activeSite?.appPassword,
  });

  const fetchSlot = useCallback(async () => {
    if (isCreate) {
      const defaults = schemaFields.length > 0 ? buildDefaultValues(schemaFields) : {};
      // Pre-wire to active event
      if (activeEventId) defaults.vc_ls_event = activeEventId;
      setSlot({ title: '', ...defaults });
      setLoading(false);
      return;
    }

    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data: wpPost } = await client.get(
        WP_ENDPOINTS.lineupSlots.single(id),
        { context: 'edit' }
      );
      const acf = wpPost.acf || {};
      const acfValues = schemaFields.length > 0 ? extractValues(schemaFields, acf) : acf;
      setSlot({
        _wp: wpPost,
        title: wpPost.title?.raw || wpPost.title?.rendered || '',
        ...acfValues,
      });
    } catch (err) {
      console.error('Failed to fetch lineup slot:', err);
      setSlot({ title: `Slot #${id}`, _fetchError: true });
    } finally {
      setLoading(false);
    }
  }, [getClient, id, isCreate, schemaFields, activeEventId]);

  useEffect(() => {
    if (!schemaLoading) fetchSlot();
  }, [fetchSlot, schemaLoading]);

  const handleSave = useCallback(async (values) => {
    const client = getClient();
    if (!client) return;
    setSaving(true);
    try {
      const acfPayload = schemaFields.length > 0 ? buildAcfPayload(schemaFields, values) : {};
      if (isCreate) {
        const createBody = { title: values.title || 'New Slot', status: 'publish' };
        if (Object.keys(acfPayload).length > 0) createBody.acf = acfPayload;
        const { data: newPost } = await client.post(WP_ENDPOINTS.lineupSlots.list, createBody);
        navigate(`/lineup/${newPost.id}`, { replace: true });
      } else {
        const updateBody = { title: values.title };
        if (Object.keys(acfPayload).length > 0) updateBody.acf = acfPayload;
        await client.post(WP_ENDPOINTS.lineupSlots.single(id), updateBody);
        await fetchSlot();
      }
    } finally {
      setSaving(false);
    }
  }, [getClient, id, isCreate, schemaFields, navigate, fetchSlot]);

  // ── Guards (after hooks) ─────────────────────────────────────
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
  if (!slot) {
    return <div className="p-4 text-center text-gray-400">Slot not found</div>;
  }

  return (
    <FieldEditor
      schema={schema}
      values={slot}
      onSave={handleSave}
      onCancel={() => navigate('/lineup')}
      getClient={getClient}
      saving={saving}
      mode={isCreate ? 'create' : 'edit'}
      layout="detail"
      titleFieldName="title"
      badgeFieldName="vc_ls_billing"
      renderPhotoInEditor={false}
    />
  );
}
