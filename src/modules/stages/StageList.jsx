import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';
import { LayoutGrid } from 'lucide-react';

export default function StageList() {
  const { getClient, activeSite } = useAuth();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStages = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(WP_ENDPOINTS.stages.list, { per_page: 100 });
      setStages(data.map(s => ({ ...s, title: s.name })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  useEffect(() => { fetchStages(); }, [fetchStages, activeSite?.id]);

  return (
    <ContentList
      title="Stages"
      items={stages}
      loading={loading}
      onRefresh={fetchStages}
      searchKeys={['name']}
      emptyMessage="No stages found"
      renderItem={(stage) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-900/30 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-sm text-gray-200">{stage.name}</span>
        </div>
      )}
    />
  );
}
