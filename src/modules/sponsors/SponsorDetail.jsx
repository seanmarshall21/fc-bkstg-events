import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import FieldEditor from '../../components/ui/FieldEditor';
import PhotoUpload from '../../components/PhotoUpload';
import { setFeaturedMedia } from '../../services/mediaUploadService';
import { Loader2 } from 'lucide-react';
import { decodeHtml } from '../../utils/helpers';

const SPONSOR_FIELDS = [
  { key: 'title', label: 'Sponsor Name', type: 'text' },
  { key: 'vc_sponsor_logo', label: 'Logo (Dark BG)', type: 'image' },
  { key: 'vc_sponsor_logo_light', label: 'Logo (Light BG)', type: 'image' },
  { key: 'vc_sponsor_url', label: 'Website URL', type: 'url', placeholder: 'https://...' },
  { key: 'excerpt', label: 'Description', type: 'textarea', rows: 4 },
  { key: 'vc_sponsor_activation_type', label: 'Activation Type', type: 'text' },
  { key: 'vc_sponsor_activation_details', label: 'Activation Details', type: 'textarea', rows: 4 },
  { key: 'vc_sponsor_contact_name', label: 'Contact Name', type: 'text' },
  { key: 'vc_sponsor_contact_email', label: 'Contact Email', type: 'email' },
];

export default function SponsorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient, activeSite } = useAuth();
  const [sponsor, setSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isCreate = id === 'new';

  const fetchSponsor = useCallback(async () => {
    if (isCreate) {
      setSponsor({
        title: '',
        excerpt: '',
        vc_sponsor_logo: '',
        vc_sponsor_logo_light: '',
        vc_sponsor_url: '',
        vc_sponsor_activation_type: '',
        vc_sponsor_activation_details: '',
        vc_sponsor_contact_name: '',
        vc_sponsor_contact_email: '',
      });
      setLoading(false);
      return;
    }

    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(WP_ENDPOINTS.sponsors.single(id), { context: 'edit' });
      const acf = data.acf || {};
      setSponsor({
        ...data,
        title: decodeHtml(data.title?.raw || ''),
        excerpt: data.excerpt?.raw || '',
        vc_sponsor_logo: acf.vc_sponsor_logo || '',
        vc_sponsor_logo_light: acf.vc_sponsor_logo_light || '',
        vc_sponsor_url: acf.vc_sponsor_url || '',
        vc_sponsor_activation_type: acf.vc_sponsor_activation_type || '',
        vc_sponsor_activation_details: acf.vc_sponsor_activation_details || '',
        vc_sponsor_contact_name: acf.vc_sponsor_contact_name || '',
        vc_sponsor_contact_email: acf.vc_sponsor_contact_email || '',
      });
    } catch (err) {
      console.error('Failed to fetch sponsor:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, id, isCreate]);

  useEffect(() => { fetchSponsor(); }, [fetchSponsor]);

  const handleSave = async (values) => {
    const client = getClient();
    if (!client) return;
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        excerpt: values.excerpt,
        acf: {
          vc_sponsor_url: values.vc_sponsor_url,
          vc_sponsor_activation_type: values.vc_sponsor_activation_type,
          vc_sponsor_activation_details: values.vc_sponsor_activation_details,
          vc_sponsor_contact_name: values.vc_sponsor_contact_name,
          vc_sponsor_contact_email: values.vc_sponsor_contact_email,
          vc_sponsor_logo: values.vc_sponsor_logo,
          vc_sponsor_logo_light: values.vc_sponsor_logo_light,
        },
      };

      if (isCreate) {
        payload.status = 'publish';
        const { data: newPost } = await client.post(WP_ENDPOINTS.sponsors.list, payload);
        navigate(`/sponsors/${newPost.id}`, { replace: true });
      } else {
        await client.post(WP_ENDPOINTS.sponsors.single(id), payload);
        await fetchSponsor();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = useCallback(async (url, mediaObject) => {
    // Update local form state
    setSponsor(prev => ({
      ...prev,
      vc_sponsor_logo: url,
    }));

    // Set as featured image if we have the post ID
    if (!isCreate && sponsor?.id) {
      try {
        await setFeaturedMedia({
          siteUrl: activeSite?.url,
          username: activeSite?.username,
          appPassword: activeSite?.appPassword,
          postId: sponsor.id,
          mediaId: mediaObject.id,
          postType: 'vc_sponsor',
        });
      } catch (err) {
        console.error('Failed to set featured media:', err);
      }
    }
  }, [activeSite, isCreate, sponsor?.id]);

  const handleLogoRemove = useCallback(() => {
    setSponsor(prev => ({
      ...prev,
      vc_sponsor_logo: '',
    }));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (!sponsor) return <div className="p-4 text-center text-gray-400">Sponsor not found</div>;

  return (
    <div className="space-y-6">
      {/* Logo upload section */}
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

      {/* Form fields */}
      <FieldEditor
        title={isCreate ? 'New Sponsor' : (sponsor.title || 'Edit Sponsor')}
        fields={SPONSOR_FIELDS}
        initialValues={sponsor}
        onSave={handleSave}
        onCancel={() => navigate('/sponsors')}
        saving={saving}
        mode={isCreate ? 'create' : 'edit'}
        layout="form"
      />
    </div>
  );
}
