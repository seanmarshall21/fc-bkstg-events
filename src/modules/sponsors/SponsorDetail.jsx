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
 * Schema-driven sponsor detail / create page.
 */
export default function SponsorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient, activeSite } = useAuth();
  const [sponsor, setSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wpStatus, setWpStatus] = useState(null);

  const isCreate = id === 'new';

  const { schema, fields: schemaFields, loading: schemaLoading, error: schemaError } = useSchema('vc_sponsor', {
    skip: !activeSite?.appPassword,
    apiBase: activeSite ? `${activeSite.url}/wp-json/vc/v1` : '/wp-json/vc/v1',
    username: activeSite?.username,
    appPassword: activeSite?.appPassword,
  });

  const fetchSponsor = useCallback(async () => {
    if (isCreate) {
      const defaults = schemaFields.length > 0 ? buildDefaultValues(schemaFields) : {};
      setSponsor({ title: '', ...defaults });
      setLoading(false);
      return;
    }

    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data: wpPost } = await client.get(WP_ENDPOINTS.sponsors.single(id), { context: 'edit' });
      const acf = wpPost.acf || {};
      const acfValues = schemaFields.length > 0 ? extractValues(schemaFields, acf) : acf;
      setSponsor({
        _wp: wpPost,
        title: wpPost.title?.raw || wpPost.title?.rendered || '',
        ...acfValues,
      });
      setWpStatus(wpPost.status || 'publish');
    } catch (err) {
      console.error('Failed to fetch sponsor:', err);
      setSponsor({ title: `Sponsor #${id}`, _fetchError: true });
    } finally {
      setLoading(false);
    }
  }, [getClient, id, isCreate, schemaFields]);

  useEffect(() => {
    if (!schemaLoading) fetchSponsor();
  }, [fetchSponsor, schemaLoading]);

  const handleSave = useCallback(async (values) => {
    const client = getClient();
    if (!client) return;
    setSaving(true);
    try {
      const acfPayload = schemaFields.length > 0 ? buildAcfPayload(schemaFields, values) : {};
      if (isCreate) {
        const createBody = { title: values.title, status: 'publish' };
        if (Object.keys(acfPayload).length > 0) createBody.acf = acfPayload;
        const { data: newPost } = await client.post(WP_ENDPOINTS.sponsors.list, createBody);
        navigate(`/sponsors/${newPost.id}`, { replace: true });
      } else {
        const updateBody = { title: values.title };
        if (Object.keys(acfPayload).length > 0) updateBody.acf = acfPayload;
        await client.post(WP_ENDPOINTS.sponsors.single(id), updateBody);
        await fetchSponsor();
      }
    } finally {
      setSaving(false);
    }
  }, [getClient, id, isCreate, schemaFields, navigate, fetchSponsor]);

  // Logo upload — mirrors ArtistDetail's photo handler
  const handleLogoChange = useCallback(async (url, mediaObject) => {
    setSponsor(prev => ({ ...prev, vc_sponsor_logo: url }));
    if (!isCreate && sponsor?._wp?.id) {
      try {
        await setFeaturedMedia({
          siteUrl: activeSite?.url,
          username: activeSite?.username,
          appPassword: activeSite?.appPassword,
          postId: sponsor._wp.id,
          mediaId: mediaObject.id,
          postType: 'vc_sponsor',
        });
      } catch (err) {
        console.error('Failed to set featured media:', err);
      }
    }
  }, [activeSite, isCreate, sponsor?._wp?.id]);

  const handleLogoRemove = useCallback(() => {
    setSponsor(prev => ({ ...prev, vc_sponsor_logo: '' }));
  }, []);

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
  if (!sponsor) {
    return <div className="p-4 text-center text-gray-400">Sponsor not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Logo upload — rendered outside FieldEditor so it doesn't duplicate */}
      {activeSite && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-900 mb-4">
            Sponsor Logo (Dark BG)
          </label>
          <PhotoUpload
            value={sponsor?.vc_sponsor_logo || ''}
            onChange={handleLogoChange}
            onRemove={handleLogoRemove}
            aspectRatio="landscape"
            maxSize={2}
            siteUrl={activeSite.url}
            wpUsername={activeSite.username}
            wpAppPassword={activeSite.appPassword}
          />
        </div>
      )}

      <FieldEditor
        schema={schema}
        values={sponsor}
        onSave={handleSave}
        onCancel={() => navigate('/sponsors')}
        getClient={getClient}
        saving={saving}
        mode={isCreate ? 'create' : 'edit'}
        layout="detail"
        titleFieldName="title"
        photoFieldName="vc_sponsor_logo"
        renderPhotoInEditor={false}
        postEndpoint={!isCreate ? WP_ENDPOINTS.sponsors.single(id) : undefined}
        postStatus={wpStatus}
        onPostStatusChange={setWpStatus}
        onPostDelete={() => navigate('/sponsors')}
      />
    </div>
  );
}
