import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import useSchema, { buildDefaultValues, buildAcfPayload, extractValues } from '../../hooks/useSchema';
import FieldEditor from '../../components/ui/FieldEditor';
import { Loader2 } from 'lucide-react';

/**
 * Schema-driven artist detail / create page.
 *
 * Fetches the ACF field schema for vc_artist from the WP plugin,
 * then renders a dynamic form. No hardcoded fields — adding a field
 * in ACF automatically surfaces it here.
 */
export default function ArtistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient, activeSite } = useAuth();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isCreate = id === 'new';

  // Fetch schema for vc_artist — cached per site+postType
  const {
    schema,
    fields: schemaFields,
    restBase,
    loading: schemaLoading,
    error: schemaError,
  } = useSchema('vc_artist', { skip: !activeSite });

  // Build form values from WP post + ACF data
  const fetchArtist = useCallback(async () => {
    if (isCreate) {
      // Build empty defaults from schema
      const defaults = schemaFields.length > 0
        ? buildDefaultValues(schemaFields)
        : {};
      setArtist({ title: '', ...defaults });
      setLoading(false);
      return;
    }

    const client = getClient();
    if (!client) return;
    setLoading(true);

    try {
      const { data: wpPost } = await client.get(
        WP_ENDPOINTS.artists.single(id),
        { context: 'edit' }
      );

      const acf = wpPost.acf || {};

      // Extract form values from ACF data using schema definitions
      const acfValues = schemaFields.length > 0
        ? extractValues(schemaFields, acf)
        : acf;

      setArtist({
        _wp: wpPost,
        title: wpPost.title?.raw || wpPost.title?.rendered || '',
        ...acfValues,
      });
    } catch (err) {
      console.error('Failed to fetch artist:', err);
      setArtist({ title: `Artist #${id}`, _fetchError: true });
    } finally {
      setLoading(false);
    }
  }, [getClient, id, isCreate, schemaFields]);

  // Re-fetch when schema is ready or ID changes
  useEffect(() => {
    if (!schemaLoading) {
      fetchArtist();
    }
  }, [fetchArtist, schemaLoading]);

  // Save handler — builds ACF payload from schema
  const handleSave = async (values) => {
    const client = getClient();
    if (!client) return;
    setSaving(true);

    try {
      // Build ACF-compatible payload from form values
      const acfPayload = schemaFields.length > 0
        ? buildAcfPayload(schemaFields, values)
        : {};

      if (isCreate) {
        const { data: newPost } = await client.post(WP_ENDPOINTS.artists.list, {
          title: values.title,
          status: 'publish',
          acf: acfPayload,
        });
        navigate(`/artists/${newPost.id}`, { replace: true });
      } else {
        await client.post(WP_ENDPOINTS.artists.single(id), {
          title: values.title,
          acf: acfPayload,
        });
        await fetchArtist();
      }
    } finally {
      setSaving(false);
    }
  };

  // Loading states
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

  if (!artist) {
    return (
      <div className="p-4 text-center text-gray-400">
        Artist not found
      </div>
    );
  }

  return (
    <FieldEditor
      schema={schema}
      values={artist}
      onSave={handleSave}
      onCancel={() => navigate(-1)}
      getClient={getClient}
      saving={saving}
      mode={isCreate ? 'create' : 'edit'}
      layout="detail"
      photoFieldName="vc_artist_photo"
      titleFieldName="title"
      badgeFieldName="vc_artist_booking_status"
    />
  );
}
