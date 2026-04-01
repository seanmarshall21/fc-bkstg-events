import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import FieldEditor from '../../components/ui/FieldEditor';
import { Loader2 } from 'lucide-react';

const LINEUP_FIELDS = [
  { key: 'title', label: 'Slot Label', type: 'text' },
  {
    key: 'vc_ls_set_type',
    label: 'Set Type',
    type: 'select',
    options: [
      { value: 'dj_set', label: 'DJ Set' },
      { value: 'live_set', label: 'Live Set' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'b2b', label: 'B2B' },
    ],
  },
  {
    key: 'vc_ls_billing',
    label: 'Billing',
    type: 'select',
    options: [
      { value: 'support', label: 'Support' },
      { value: 'headline', label: 'Headline' },
      { value: 'special', label: 'Special Guest' },
    ],
  },
  { key: 'vc_ls_start_time', label: 'Start Time', type: 'text', placeholder: '2:00 PM' },
  { key: 'vc_ls_end_time', label: 'End Time', type: 'text', placeholder: '3:30 PM' },
  { key: 'vc_ls_sort_order', label: 'Sort Order', type: 'number' },
];

export default function LineupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient } = useAuth();
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSlot = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(WP_ENDPOINTS.lineupSlots.single(id), { context: 'edit' });
      setSlot({
        ...data,
        title: data.title?.raw || '',
        vc_ls_set_type: data.acf?.vc_ls_set_type || '',
        vc_ls_billing: data.acf?.vc_ls_billing || '',
        vc_ls_start_time: data.acf?.vc_ls_start_time || '',
        vc_ls_end_time: data.acf?.vc_ls_end_time || '',
        vc_ls_sort_order: data.acf?.vc_ls_sort_order || '',
      });
    } catch (err) {
      console.error('Failed to fetch lineup slot:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, id]);

  useEffect(() => { fetchSlot(); }, [fetchSlot]);

  const handleSave = async (values) => {
    const client = getClient();
    if (!client) return;
    setSaving(true);
    try {
      await client.post(WP_ENDPOINTS.lineupSlots.single(id), {
        title: values.title,
        acf: {
          vc_ls_set_type: values.vc_ls_set_type,
          vc_ls_billing: values.vc_ls_billing,
          vc_ls_start_time: values.vc_ls_start_time,
          vc_ls_end_time: values.vc_ls_end_time,
          vc_ls_sort_order: values.vc_ls_sort_order,
        },
      });
      await fetchSlot();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (!slot) return <div className="p-4 text-center text-gray-400">Slot not found</div>;

  return (
    <FieldEditor
      title={slot.title || 'Edit Lineup Slot'}
      fields={LINEUP_FIELDS}
      initialValues={slot}
      onSave={handleSave}
      onCancel={() => navigate('/lineup')}
      saving={saving}
    />
  );
}
