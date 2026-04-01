import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS, WP_ENDPOINTS } from '../../api/endpoints';
import FieldEditor from '../../components/ui/FieldEditor';
import { Loader2 } from 'lucide-react';

const ARTIST_FIELDS = [
  { key: 'title', label: 'Artist Name', type: 'text' },
  { key: 'vc_artist_photo', label: 'Photo', type: 'image' },
  { key: 'vc_artist_bio', label: 'Biography', type: 'textarea', rows: 6 },
  { key: 'vc_artist_origin', label: 'Origin', type: 'text', placeholder: 'City, Country' },
  {
    key: 'vc_artist_booking_status',
    label: 'Booking Status',
    type: 'select',
    options: [
      { value: 'available', label: 'Available' },
      { value: 'hold', label: 'On Hold' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
  { key: 'genres', label: 'Genres', type: 'tags' },
  { key: 'vc_artist_social_instagram', label: 'Instagram URL', type: 'url' },
  { key: 'vc_artist_social_spotify', label: 'Spotify URL', type: 'url' },
  { key: 'vc_artist_social_soundcloud', label: 'SoundCloud URL', type: 'url' },
  { key: 'vc_artist_social_website', label: 'Website URL', type: 'url' },
];

export default function ArtistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient } = useAuth();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchArtist = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(VC_ENDPOINTS.artists.single(id));
      const { data: wpPost } = await client.get(
        WP_ENDPOINTS.artists.single(id),
        { context: 'edit' }
      );

      setArtist({
        ...data,
        _wp: wpPost,
        title: wpPost.title?.raw || data.name,
        vc_artist_bio: data.bio || '',
        vc_artist_origin: data.origin || '',
        vc_artist_booking_status: data.booking_status || '',
        vc_artist_photo: data.photo?.medium || '',
        vc_artist_social_instagram: data.socials?.find(s => s.platform === 'instagram')?.url || '',
        vc_artist_social_spotify: data.socials?.find(s => s.platform === 'spotify')?.url || '',
        vc_artist_social_soundcloud: data.socials?.find(s => s.platform === 'soundcloud')?.url || '',
        vc_artist_social_website: data.socials?.find(s => s.platform === 'website')?.url || '',
      });
    } catch (err) {
      console.error('Failed to fetch artist:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, id]);

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
      };

      await client.post(WP_ENDPOINTS.artists.single(id), {
        title: values.title,
        acf: acfFields,
      });

      await fetchArtist();
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
      title={artist.title || 'Edit Artist'}
      fields={ARTIST_FIELDS}
      initialValues={artist}
      onSave={handleSave}
      onCancel={() => navigate('/artists')}
      saving={saving}
    />
  );
}
