import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS, WP_ENDPOINTS } from '../../api/endpoints';
import FieldEditor from '../../components/ui/FieldEditor';
import { Loader2 } from 'lucide-react';
import { decodeHtml } from '../../utils/helpers';

/**
 * Contestant detail / edit / create view.
 * Uses same vc_artist CPT + ACF fields with rodeo-specific labels.
 */

const BOOKING_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'hold', label: 'On Hold' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'registered', label: 'Registered' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const CONTESTANT_FIELDS = [
  { key: 'vc_artist_bio', label: 'Bio', type: 'textarea', rows: 4 },
  { key: 'vc_artist_origin', label: 'Hometown', type: 'text', placeholder: 'City, State' },
];

const SOCIAL_FIELDS = [
  { key: 'vc_artist_social_instagram', label: 'Instagram' },
  { key: 'vc_artist_social_website', label: 'Website' },
];

export default function ContestantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient } = useAuth();
  const [contestant, setContestant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isCreate = id === 'new';

  const fetchContestant = useCallback(async () => {
    if (isCreate) {
      setContestant({
        title: '',
        vc_artist_bio: '',
        vc_artist_origin: '',
        vc_artist_booking_status: 'available',
        vc_artist_photo: '',
        vc_artist_social_instagram: '',
        vc_artist_social_website: '',
      });
      setLoading(false);
      return;
    }

    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      let vcData = null;
      try {
        const vcRes = await client.get(VC_ENDPOINTS.contestants.single(id));
        vcData = vcRes.data;
      } catch (vcErr) {
        console.warn('VC endpoint failed, falling back to WP only:', vcErr.message);
      }

      const { data: wpPost } = await client.get(
        WP_ENDPOINTS.contestants.single(id),
        { context: 'edit' }
      );
      const acf = wpPost.acf || {};

      setContestant({
        ...(vcData || {}),
        _wp: wpPost,
        title: decodeHtml(wpPost.title?.raw || vcData?.name || ''),
        vc_artist_bio: acf.vc_artist_bio || vcData?.bio || '',
        vc_artist_origin: acf.vc_artist_origin || vcData?.origin || '',
        vc_artist_booking_status: acf.vc_artist_booking_status || vcData?.booking_status || '',
        vc_artist_photo: acf.vc_artist_photo || vcData?.photo?.medium || '',
        vc_artist_social_instagram: acf.vc_artist_social_instagram || vcData?.socials?.find(s => s.platform === 'instagram')?.url || '',
        vc_artist_social_website: acf.vc_artist_social_website || vcData?.socials?.find(s => s.platform === 'website')?.url || '',
      });
    } catch (err) {
      console.error('Failed to fetch contestant:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, id, isCreate]);

  useEffect(() => {
    fetchContestant();
  }, [fetchContestant]);

  const handleSave = async (values) => {
    const client = getClient();
    if (!client) return;
    setSaving(true);
    try {
      const acfFields = {
        vc_artist_bio: values.vc_artist_bio,
        vc_artist_origin: values.vc_artist_origin,
        vc_artist_booking_status: values.vc_artist_booking_status,
        vc_artist_social_instagram: values.vc_artist_social_instagram,
        vc_artist_social_website: values.vc_artist_social_website,
      };

      if (isCreate) {
        const { data: newPost } = await client.post(WP_ENDPOINTS.contestants.list, {
          title: values.title,
          status: 'publish',
          acf: acfFields,
        });
        navigate(`/contestants/${newPost.id}`, { replace: true });
      } else {
        await client.post(WP_ENDPOINTS.contestants.single(id), {
          title: values.title,
          acf: acfFields,
        });
        await fetchContestant();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!contestant) {
    return (
      <div className="p-4 text-center text-gray-400">
        Contestant not found
      </div>
    );
  }

  return (
    <FieldEditor
      title={isCreate ? 'New Contestant' : (contestant.title || 'Edit Contestant')}
      fields={CONTESTANT_FIELDS}
      initialValues={contestant}
      onSave={handleSave}
      onCancel={() => navigate('/contestants')}
      saving={saving}
      mode={isCreate ? 'create' : 'edit'}
      layout="detail"
      photoField="vc_artist_photo"
      titleField="title"
      badgeField={{
        key: 'vc_artist_booking_status',
        options: BOOKING_STATUS_OPTIONS,
      }}
      socialFields={SOCIAL_FIELDS}
    />
  );
}
