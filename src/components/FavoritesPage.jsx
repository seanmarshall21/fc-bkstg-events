import { Star } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function FavoritesPage() {
  const { hasSites } = useAuth();

  return (
    <div className="p-6 text-center py-20 animate-fade-in">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-surface-2 flex items-center justify-center">
        <Star className="w-7 h-7 text-gray-300" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">Favorites</h2>
      <p className="text-sm text-gray-500 mt-2 max-w-[260px] mx-auto leading-relaxed">
        {hasSites
          ? 'Favorites coming soon. Star artists, sponsors, and other items for quick access.'
          : 'Connect a site to start saving favorites.'
        }
      </p>
    </div>
  );
}
