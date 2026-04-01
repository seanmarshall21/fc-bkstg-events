import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import FieldEditor from '../../components/ui/FieldEditor';
import { Loader2 } from 'lucide-react';
import { decodeHtml } from '../../utils/helpers';

const EVENT_FIELDS = [
  { key: 'title', label: 'Event Name', type: 'text' },
  { key: 'vc_event_date_start', label: 'Start Date', type: 'date' },
  { key: 'vc_event_date_end', label: 'End Date', type: 'date' },
  { key: 'vc_event_venue', label: 'Venue', type: 'text' },
  { key: 'vc_event_city', label: 'City', type: 'text' },
  { key: 'vc_event_website', label: 'Website URL', type: 'url' },
  { key: 'vc_event_ticket_url', label: 'Ticket URL', type: 'url' },
];

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchEvent = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(WP_ENDPOINTS.events.single(id), { context: 'edit' });
      const acf = data.acf || {};
      setEvent({
        ...data,
        title: decodeHtml(data.title?.raw || ''),
        vc_event_date_start: acf.vc_event_date_start || '',
        vc_event_date_end: acf.vc_event_date_end || '',
        vc_event_venue: acf.vc_event_venue || '',
        vc_event_city: acf.vc_event_city || '',
        vc_event_website: acf.vc_event_website || '',
        vc_event_ticket_url: acf.vc_event_ticket_url || '',
      });
    } catch (err) {
      console.error('Failed to fetch event:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, id]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const handleSave = async (values) => {
    const client = getClient();
    if (!client) return;
    setSaving(true);
    try {
      await client.post(WP_ENDPOINTS.events.single(id), {
        title: values.title,
        acf: {
          vc_event_date_start: values.vc_event_date_start,
          vc_event_date_end: values.vc_event_date_end,
          vc_event_venue: values.vc_event_venue,
          vc_event_city: values.vc_event_city,
          vc_event_website: values.vc_event_website,
          vc_event_ticket_url: values.vc_event_ticket_url,
        },
      });
      await fetchEvent();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (!event) return <div className="p-4 text-center text-gray-400">Event not found</div>;

  return (
    <FieldEditor
      title={event.title || 'Edit Event'}
      fields={EVENT_FIELDS}
      initialValues={event}
      onSave={handleSave}
      onCancel={() => navigate('/events')}
      saving={saving}
    />
  );
}
