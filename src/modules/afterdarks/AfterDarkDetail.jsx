import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import useSchema, { buildDefaultValues, buildAcfPayload, extractValues } from '../../hooks/useSchema';
import FieldEditor from '../../components/ui/FieldEditor';
import { Loader2 } from 'lucide-react';

/**
 * Schema-driven After Dark detail / create page.
 *
 * Reads field schema from /vc/v1/schema/after-darks and renders
 * the ACF field group dynamically via FieldEditor. No hardcoded fields.
 *
 * Prerequisite: after-darks CPT must have Show in REST API enabled.
 */
export default function AfterDarkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient, activeSite } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isCreate = id === 'new';

  const {
    schema,
    fields: schemaFields,
    loading: schemaLoading,
    error: schemaError,
  } = useSchema('after-darks', {
    skip: !activeSite?.appPassword,
    apiBase: activeSite ? `${activeSite.url}/wp-json/vc/v1` : '/wp-json/vc/v1',
    username: activeSite?.username,
    appPassword: activeSite?.appPassword,
  });

  const fetchPost = useCallback(async () => {
    if (isCreate) {
      const defaults = schemaFields.length > 0 ? buildDefaultValues(schemaFields) : {};
      setPost({ title: '', ...defaults });
      setLoading(false);
      return;
    }

    const client = getClient();
    if (!client) return;
    setLoading(true);

    try {
      const { data: wpPost } = await client.get(
        WP_ENDPOINTS.afterdarks.single(id),
        { context: 'edit' }
      );

      const acf = wpPost.acf || {};
      const acfValues = schemaFields.length > 0 ? extractValues(schemaFields, acf) : acf;

      setPost({
        _wp: wpPost,
        title: wpPost.title?.raw || wpPost.title?.rendered || '',
        ...acfValues,
      });
    } catch (err) {
      console.error('Failed to fetch after dark:', err);
      setPost({ title: `After Dark #${id}`, _fetchError: true });
    } finally {
      setLoading(false);
    }
  }, [getClient, id, isCreate, schemaFields]);

  useEffect(() => {
    if (!schemaLoading) fetchPost();
  }, [fetchPost, schemaLoading]);

  const handleSave = useCallback(async (values) => {
    const client = getClient();
    if (!client) return;
    setSaving(true);

    try {
      const acfPayload = schemaFields.length > 0 ? buildAcfPayload(schemaFields, values) : {};

      if (isCreate) {
        const body = { title: values.title, status: 'publish' };
        if (Object.keys(acfPayload).length > 0) body.acf = acfPayload;
        const { data: newPost } = await client.post(WP_ENDPOINTS.afterdarks.list, body);
        navigate(`/afterdarks/${newPost.id}`, { replace: true });
      } else {
        const body = { title: values.title };
        if (Object.keys(acfPayload).length > 0) body.acf = acfPayload;
        await client.post(WP_ENDPOINTS.afterdarks.single(id), body);
        await fetchPost();
      }
    } finally {
      setSaving(false);
    }
  }, [getClient, id, isCreate, schemaFields, navigate, fetchPost]);

  // ── Guards ──────────────────────────────────────────────────────

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
        <p className="text-red-500 text-sm mb-2">Failed to load field schema</p>
        <p className="text-gray-400 text-xs">{schemaError.message}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-4 text-center text-gray-400">
        After Dark not found
      </div>
    );
  }

  return (
    <FieldEditor
      schema={schema}
      values={post}
      onSave={handleSave}
      onCancel={() => navigate(-1)}
      getClient={getClient}
      saving={saving}
      mode={isCreate ? 'create' : 'edit'}
      layout="detail"
      titleFieldName="title"
    />
  );
}
