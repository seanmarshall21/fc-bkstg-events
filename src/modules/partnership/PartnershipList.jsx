import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS } from '../../api/endpoints';

/**
 * PartnershipList
 *
 * Discovery component. Fetches all pages on the connected site using the
 * partnership.php template and routes accordingly:
 *   - 0 pages  → setup instructions
 *   - 1 page   → auto-redirect to PartnershipEditor (replace so back works)
 *   - 2+ pages → list to select (multi-brand sites)
 */
export default function PartnershipList() {
  const { getClient, hasSites } = useAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPages = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await client.get(VC_ENDPOINTS.partnership.list);
      setPages(data);
      // Single partnership page — skip the list, go straight to editor
      if (data.length === 1) {
        navigate(`/partnership/${data[0].id}`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getClient, navigate]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to manage partnerships.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <button
          onClick={fetchPages}
          className="text-sm text-blue-500 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="p-8 text-center py-20 max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-800 mb-2">No partnership page found</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          Create a page in WordPress and set its template to{' '}
          <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">partnership.php</code>.
          Then install{' '}
          <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">vc-partnership-endpoint.php</code>{' '}
          as a WPCode snippet on the site.
        </p>
      </div>
    );
  }

  // Multiple partnership pages (multi-brand / multi-event sites)
  return (
    <div className="animate-fade-in">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-gray-900">Partnership</h2>
        <p className="text-sm text-gray-400 mt-0.5">Select a page to edit</p>
      </div>
      <div className="p-4 space-y-2">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => navigate(`/partnership/${page.id}`)}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate block">{page.title}</span>
                <span className="text-xs text-gray-400 truncate block">{page.url}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                page.status === 'publish' ? 'bg-green-50 text-green-600' :
                page.status === 'draft'   ? 'bg-yellow-50 text-yellow-600' :
                                            'bg-gray-100 text-gray-500'
              }`}>
                {page.status}
              </span>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
