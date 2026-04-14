import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import useSchema, { buildDefaultValues, buildAcfPayload, extractValues } from '../../hooks/useSchema';
import FieldEditor from '../../components/ui/FieldEditor';
import PhotoUpload from '../../components/PhotoUpload';
import { setFeaturedMedia } from '../../services/mediaUploadService';
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
  } = useSchema('vc_artist', {
    skip: !activeSite?.appPassword,
    apiBase: activeSite ? `${activeSite.url}/wp-json/vc/v1` : '/wp-json/vc/v1',
    username: activeSite?.username,
    appPassword: activeSite?.appPassword,
  });

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
        const body = { title: values.title, status: 'publish' };
        if (Object.keys(acfPayload).length > 0) body.acf = acfPayload;
        const { data: newPost } = await client.post(WP_ENDPOINTS.artists.list, body);
        navigate(`/artists/${newPost.id}`, { replace: true });
      } else {
        const editBody = { title: values.title };
        if (Object.keys(acfPayload).length > 0) editBody.acf = acfPayload;
        await client.post(WP_ENDPOINTS.artists.single(id), editBody);
        await fetchArtist();
      }
    } finally {
      setSaving(false);
    }
  };


  // Photo handlers — must be declared before any conditional returns (Rules of Hooks)
  const handlePhotoChange = useCallback(async (url, mediaObject) => {
    setArtist(prev => ({ ...prev, vc_artist_photo: url }));

    if (!isCreate && artist?._wp?.id) {
      try {
        await setFeaturedMedia({
          siteUrl: activeSite?.url,
          username: activeSite?.username,
          appPassword: activeSite?.appPassword,
          postId: artist._wp.id,
          mediaId: mediaObject.id,
          postType: 'vc_artist',
        });
      } catch (err) {
        console.error('Failed to set featured media:', err);
      }
    }
  }, [activeSite, isCreate, artist?._wp?.id]);

  const handlePhotoRemove = useCallback(() => {
    setArtist(prev => ({ ...prev, vc_artist_photo: '' }));
  }, []);

  // ── Loading / error states ──────────────────────────────────────
  // Must come AFTER all hooks above.

  // Wait for auth to bootstrap
  if (!activeSite) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Credentials ready but schema not yet loaded — prevent premature render with null schema
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

  if (!artist) {
    return (
      <div className="p-4 text-center text-gray-400">
        Artist not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Photo upload section */}
      {activeSite && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-900 mb-4">
            Artist Photo
          </label>
          <PhotoUpload
            value={artist?.vc_artist_photo || ''}
            onChange={handlePhotoChange}
            onRemove={handlePhotoRemove}
            aspectRatio="circle"
            maxSize={2}
            siteUrl={activeSite.url}
            wpUsername={activeSite.username}
            wpAppPassword={activeSite.appPassword}
          />
        </div>
      )}

      {/* Form fields */}
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
    </div>
  );
}
