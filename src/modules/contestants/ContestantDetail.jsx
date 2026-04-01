import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS, WP_ENDPOINTS } from '../../api/endpoints';
import FieldEditor from '../../components/ui/FieldEditor';
import { Loader2 } from 'lucide-react';
import { decodeHtml } from '../../utils/helpers';

/**
 * Contestant detail / edit view.
 * Uses same vc_artist CPT + ACF fields with rodeo-specific labels.
 */
const CONTESTANT_FIELDS = [
  { key: 'title', label: 'Contestant Name', type: 'text' },
  { key: 'vc_artist_photo', label: 'Photo', type: 'image' },
  { key: 'vc_artist_bio', label: 'Bio', type: 'textarea', rows: 6 },
  { key: 'vc_artist_origin', label: 'Hometown', type: 'text', placeholder: 'City, State' },
  {
    key: 'vc_artist_booking_status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'available', label: 'Available' },
      { value: 'hold', label: 'On Hold' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
  { key: 'vc_artist_social_instagram', label: 'Instagram URL', type: 'url' },
  { key: 'vc_artist_social_website', label: 'Website URL', type: 'url' },
];

export default function ContestantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient } = useAuth();
  const [contestant, setContestant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchContestant = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      // Contestants use the same vc_artist endpoints
      const { data } = await client.get(VC_ENDPOINTS.contestants.single(id));
      const { data: wpPost } = await client.get(
        WP_ENDPOINTS.contestants.single(id),
        { context: 'edit' }
      );

      setContestant({
        ...data,
        _wp: wpPost,
        title: decodeHtml(wpPost.title?.raw || data.name),
        vc_artist_bio: data.bio || '',
        vc_artist_origin: data.origin || '',
        vc_artist_booking_status: data.booking_status || '',
        vc_artist_photo: data.photo?.medium || '',
        vc_artist_social_instagram: data.socials?.find(s => s.platform === 'instagram')?.url || '',
        vc_artist_social_website: data.socials?.find(s => s.platform === 'website')?.url || '',
      });
    } catch (err) {
      console.error('Failed to fetch contestant:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, id]);

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

      await client.post(WP_ENDPOINTS.contestants.single(id), {
        title: values.title,
        acf: acfFields,
      });

      await fetchContestant();
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
      title={contestant.title || 'Edit Contestant'}
      fields={CONTESTANT_FIELDS}
      initialValues={contestant}
      onSave={handleSave}
      onCancel={() => navigate('/contestants')}
      saving={saving}
    />
  );
}
