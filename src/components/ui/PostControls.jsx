import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';

/**
 * PostControls — WP post status picker + trash button.
 *
 * Renders at the bottom of detail pages (edit mode only).
 * Status change POSTs { status } to endpoint via WP REST.
 * Delete sends DELETE to endpoint (no force — moves to trash).
 *
 * Props:
 *   endpoint         WP REST URL for this post (e.g. /wp/v2/vc_artist/42)
 *   currentStatus    'publish' | 'draft' | 'private'
 *   onStatusChanged  (newStatus: string) => void
 *   onDeleted        () => void  — navigate back after trash
 *   getClient        () => VCApiClient
 *   isCreate         boolean — hides controls on create mode
 *   disabled         boolean — disable during parent save
 */

const STATUS_OPTIONS = [
  { value: 'publish', label: 'Published' },
  { value: 'draft',   label: 'Draft'     },
  { value: 'private', label: 'Private'   },
];

export default function PostControls({
  endpoint,
  currentStatus,
  onStatusChanged,
  onDeleted,
  getClient,
  isCreate = false,
  disabled = false,
}) {
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleteState,    setDeleteState]    = useState('idle'); // 'idle' | 'confirm' | 'deleting'

  if (isCreate || !endpoint) return null;

  // ── Status change ─────────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus || statusUpdating || disabled) return;
    const client = getClient();
    if (!client) return;
    setStatusUpdating(true);
    try {
      await client.post(endpoint, { status: newStatus });
      onStatusChanged?.(newStatus);
    } catch (err) {
      console.error('[PostControls] status change failed:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  // ── Delete (trash — no force) ─────────────────────────────────
  const handleDelete = async () => {
    if (deleteState === 'idle') {
      setDeleteState('confirm');
      return;
    }
    if (deleteState !== 'confirm') return;
    const client = getClient();
    if (!client) return;
    setDeleteState('deleting');
    try {
      // Use request() directly — client.del() appends ?force=true which permanently deletes
      await client.request(endpoint, { method: 'DELETE' });
      onDeleted?.();
    } catch (err) {
      console.error('[PostControls] delete failed:', err);
      setDeleteState('idle');
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="mt-8 pt-5 border-t border-gray-100">

      {/* Status pills */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-[#979797] uppercase tracking-wide mb-2">
          Post Status
        </p>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(opt => {
            const isActive = currentStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled || statusUpdating}
                onClick={() => handleStatusChange(opt.value)}
                className={[
                  'inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-medium transition-all',
                  isActive
                    ? 'bg-[#282828] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                  (disabled || statusUpdating) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
              >
                {statusUpdating && isActive
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : opt.label
                }
              </button>
            );
          })}
        </div>
      </div>

      {/* Trash */}
      <div className="pt-4 border-t border-gray-50">
        {deleteState === 'idle' && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Move to trash
          </button>
        )}

        {deleteState === 'confirm' && (
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-red-500 font-medium">Move to trash?</span>
            <button
              type="button"
              onClick={handleDelete}
              className="text-[12px] font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setDeleteState('idle')}
              className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {deleteState === 'deleting' && (
          <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Moving to trash…
          </div>
        )}
      </div>
    </div>
  );
}
