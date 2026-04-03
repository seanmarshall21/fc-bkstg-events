import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS, WP_ENDPOINTS } from '../../api/endpoints';
import FieldEditor from '../../components/ui/FieldEditor';
import { Loader2 } from 'lucide-react';

const BOOKING_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'hold', label: 'On Hold' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'booked', label: 'Booked' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'unavailable', label: 'Unavailable' },
];

const ARTIST_FIELDS = [
  { key: 'vc_artist_bio', label: 'Bio', type: 'textarea', rows: 4 },
  { key: 'vc_artist_origin', label: 'Origin', type: 'text', placeholder: 'City, Country' },
];

const SOCIAL_FIELDS = [
  { key: 'vc_artist_social_instagram', label: 'Instagram' },
  { key: 'vc_artist_social_spotify', label: 'Spotify' },
  { key: 'vc_artist_social_soundcloud', label: 'SoundCloud' },
  { key: 'vc_artist_social_website', label: 'Website' },
  { key: 'vc_artist_social_x', label: 'X' },
  { key: 'vc_artist_social_facebook', label: 'Facebook' },
  { key: 'vc_artist_social_youtube', label: 'YouTube' },
  { key: 'vc_artist_social_tiktok', label: 'TikTok' },
  { key: 'vc_artist_social_apple_music', label: 'Apple Music' },
];

export default function ArtistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient } = useAuth();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isCreate = id === 'new';

  const fetchArtist = useCallback(async () => {
    if (isCreate) {
      setArtist({
        title: '',
        vc_artist_bio: '',
        vc_artist_origin: '',
        vc_artist_booking_status: 'available',
        vc_artist_photo: '',
        vc_artist_social_instagram: '',
        vc_artist_social_spotify: '',
        vc_artist_social_soundcloud: '',
        vc_artist_social_website: '',
        vc_artist_social_x: '',
        vc_artist_social_facebook: '',
        vc_artist_social_youtube: '',
        vc_artist_social_tiktok: '',
        vc_artist_social_apple_music: '',
        genres: [],
      });
      setLoading(false);
      return;
    }

    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      // Fetch from VC custom endpoint for rich data
      let vcData = null;
      try {
        const vcRes = await client.get(VC_ENDPOINTS.artists.single(id));
        vcData = vcRes.data;
      } catch (vcErr) {
        console.warn('VC endpoint failed, falling back to WP only:', vcErr.message);
      }

      // Always fetch from WP endpoint for edit context + ACF
      const { data: wpPost } = await client.get(
        WP_ENDPOINTS.artists.single(id),
        { context: 'edit' }
      );

      const acf = wpPost.acf || {};

      setArtist({
        ...(vcData || {}),
        _wp: wpPost,
        title: wpPost.title?.raw || vcData?.name || '',
        vc_artist_bio: acf.vc_artist_bio || vcData?.bio || '',
        vc_artist_origin: acf.vc_artist_origin || vcData?.origin || '',
        vc_artist_booking_status: acf.vc_artist_booking_status || vcData?.booking_status || '',
        vc_artist_photo: acf.vc_artist_photo || vcData?.photo?.medium || '',
        vc_artist_social_instagram: acf.vc_artist_social_instagram || vcData?.socials?.find(s => s.platform === 'instagram')?.url || '',
        vc_artist_social_spotify: acf.vc_artist_social_spotify || vcData?.socials?.find(s => s.platform === 'spotify')?.url || '',
        vc_artist_social_soundcloud: acf.vc_artist_social_soundcloud || vcData?.socials?.find(s => s.platform === 'soundcloud')?.url || '',
        vc_artist_social_website: acf.vc_artist_social_website || vcData?.socials?.find(s => s.platform === 'website')?.url || '',
        vc_artist_social_x: acf.vc_artist_social_x || vcData?.socials?.find(s => s.platform === 'x')?.url || '',
        vc_artist_social_facebook: acf.vc_artist_social_facebook || vcData?.socials?.find(s => s.platform === 'facebook')?.url || '',
        vc_artist_social_youtube: acf.vc_artist_social_youtube || vcData?.socials?.find(s => s.platform === 'youtube')?.url || '',
        vc_artist_social_tiktok: acf.vc_artist_social_tiktok || vcData?.socials?.find(s => s.platform === 'tiktok')?.url || '',
        vc_artist_social_apple_music: acf.vc_artist_social_apple_music || vcData?.socials?.find(s => s.platform === 'apple_music')?.url || '',
        genres: vcData?.genres || [],
      });
    } catch (err) {
      console.error('Failed to fetch artist:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, id, isCreate]);

  useEffect(() => {
    fetchArtist();
  }, [fetchArtist]);

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
        vc_artist_social_spotify: values.vc_artist_social_spotify,
        vc_artist_social_soundcloud: values.vc_artist_social_soundcloud,
        vc_artist_social_website: values.vc_artist_social_website,
        vc_artist_social_x: values.vc_artist_social_x,
        vc_artist_social_facebook: values.vc_artist_social_facebook,
        vc_artist_social_youtube: values.vc_artist_social_youtube,
        vc_artist_social_tiktok: values.vc_artist_social_tiktok,
        vc_artist_social_apple_music: values.vc_artist_social_apple_music,
      };

      if (isCreate) {
        // Create new artist post
        const { data: newPost } = await client.post(WP_ENDPOINTS.artists.list, {
          title: values.title,
          status: 'publish',
          acf: acfFields,
        });
        // Navigate to the new artist's edit page
        navigate(`/artists/${newPost.id}`, { replace: true });
      } else {
        // Update existing
        await client.post(WP_ENDPOINTS.artists.single(id), {
          title: values.title,
          acf: acfFields,
        });
        await fetchArtist();
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

  if (!artist) {
    return (
      <div className="p-4 text-center text-gray-400">
        Artist not found
      </div>
    );
  }

  return (
    <FieldEditor
      title={isCreate ? 'New Artist' : (artist.title || 'Edit Artist')}
      fields={ARTIST_FIELDS}
      initialValues={artist}
      onSave={handleSave}
      onCancel={() => navigate('/artists')}
      saving={saving}
      mode={isCreate ? 'create' : 'edit'}
      layout="detail"
      photoField="vc_artist_photo"
      titleField="title"
      badgeField={{
        key: 'vc_artist_booking_status',
        options: BOOKING_STATUS_OPTIONS,
      }}
      tagFields={[{ key: 'genres', label: 'Genres' }]}
      socialFields={SOCIAL_FIELDS}
    />
  );
}
