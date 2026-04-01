import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';
import EventSelector from '../../components/EventSelector';

export default function SponsorList() {
  const { getClient, activeEventId, hasSites } = useAuth();
  const navigate = useNavigate();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSponsors = useCallback(async () => {
    if (!activeEventId) return;
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(VC_ENDPOINTS.sponsors.list, {
        event_id: activeEventId,
      });
      // Flatten tiers into sponsor list
      const flat = [];
      data.forEach(tier => {
        tier.sponsors?.forEach(s => {
          flat.push({ ...s, _tier: tier.tier_label, _tierSlug: tier.tier });
        });
      });
      setSponsors(flat);
    } catch (err) {
      console.error('Failed to fetch sponsors:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, activeEventId]);

  useEffect(() => { fetchSponsors(); }, [fetchSponsors]);

  const tierBadge = (tier) => {
    const map = {
      platinum: 'vc-badge--amber',
      gold: 'vc-badge--amber',
      silver: 'vc-badge--gray',
      bronze: 'vc-badge--gray',
      presenting: 'vc-badge--green',
    };
    return <span className={`vc-badge ${map[tier] || 'vc-badge--blue'}`}>{tier}</span>;
  };

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to view sponsors.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Event context */}
      <div className="mb-4">
        <EventSelector />
      </div>

      {!activeEventId && (
        <div className="text-center py-20 text-gray-400 text-sm">
          Select an event to view sponsors.
        </div>
      )}

      {activeEventId && (
        <ContentList
          title="Sponsors"
          items={sponsors}
          loading={loading}
          onRefresh={fetchSponsors}
          onSelect={(s) => navigate(`/sponsors/${s.id}`)}
          searchKeys={['name', '_tier']}
          emptyMessage="No sponsors for this event"
          renderItem={(sponsor) => (
            <div className="flex items-center gap-3">
              {sponsor.logo ? (
                <img src={sponsor.logo} alt="" className="w-10 h-10 rounded-lg object-contain bg-surface-1 p-1 shrink-0 border border-surface-3" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-surface-2 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">{sponsor.name}</span>
                  {tierBadge(sponsor._tier)}
                </div>
                {sponsor.url && (
                  <span className="text-xs text-gray-400 truncate block mt-0.5">{sponsor.url}</span>
                )}
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
