import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';
import { Tag } from 'lucide-react';

export default function GenreList() {
  const { getClient, activeSite } = useAuth();
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGenres = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(VC_ENDPOINTS.genres.list);
      setGenres(data.map(g => ({ ...g, title: g.name })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  useEffect(() => { fetchGenres(); }, [fetchGenres, activeSite?.id]);

  return (
    <ContentList
      title="Genres"
      items={genres}
      loading={loading}
      onRefresh={fetchGenres}
      searchKeys={['name']}
      emptyMessage="No genres found"
      renderItem={(genre) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-900/30 flex items-center justify-center shrink-0">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <span className="text-sm text-gray-200">{genre.name}</span>
            <span className="text-xs text-gray-500 ml-2">{genre.count} artists</span>
          </div>
        </div>
      )}
    />
  );
}
