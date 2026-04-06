import React, { useEffect, useState } from 'react';

/**
 * ArchiveEventDialog
 *
 * Confirmation modal for archiving a vc_event_property.
 * Fetches a server-side preview and shows:
 *   - count of items that will be drafted (unique to this event)
 *   - count of items that will stay published (linked to other events)
 *   - collapsible preview list of each
 *
 * Props:
 *   apiBase      - string, WP REST base
 *   eventId      - number
 *   eventTitle   - string
 *   onClose      - () => void
 *   onArchived   - (summary) => void   called after successful archive
 */
export default function ArchiveEventDialog({ apiBase, eventId, eventTitle, onClose, onArchived }) {

  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [error, setError]       = useState(null);
  const [showDrafted, setShowDrafted] = useState(true);
  const [showKept, setShowKept]       = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${apiBase}/vc/v1/archive-event/${eventId}/preview`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-WP-Nonce': window.wpApiSettings?.nonce || '' },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => !cancelled && setPreview(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [apiBase, eventId]);

  const handleConfirm = async () => {
    setArchiving(true);
    setError(null);
    try {
      const r = await fetch(`${apiBase}/vc/v1/archive-event/${eventId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-WP-Nonce': window.wpApiSettings?.nonce || '' },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const summary = await r.json();
      onArchived?.(summary);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="vc-dialog-backdrop" onClick={onClose}>
      <div className="vc-dialog" onClick={(e) => e.stopPropagation()}>

        <h2 className="vc-dialog__title">Archive event: {eventTitle}</h2>

        {loading && <p>Calculating impact…</p>}
        {error && <p className="vc-dialog__error">Error: {error}</p>}

        {preview && !loading && (
          <>
            <p className="vc-dialog__summary">
              <strong>{preview.draft_count}</strong> item{preview.draft_count === 1 ? '' : 's'} will be drafted
              (only belong to this event).
              <br />
              <strong>{preview.keep_count}</strong> item{preview.keep_count === 1 ? '' : 's'} will stay published
              (linked to other active events).
            </p>

            {preview.draft_count > 0 && (
              <div className="vc-dialog__section">
                <button className="vc-dialog__toggle" onClick={() => setShowDrafted((v) => !v)}>
                  {showDrafted ? '▾' : '▸'} Will be drafted ({preview.draft_count})
                </button>
                {showDrafted && (
                  <ul className="vc-dialog__list vc-dialog__list--draft">
                    {preview.will_be_drafted.map((item) => (
                      <li key={`${item.type}-${item.id}`}>
                        <span className="vc-dialog__type">{item.type}</span> {item.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {preview.keep_count > 0 && (
              <div className="vc-dialog__section">
                <button className="vc-dialog__toggle" onClick={() => setShowKept((v) => !v)}>
                  {showKept ? '▾' : '▸'} Will stay published ({preview.keep_count})
                </button>
                {showKept && (
                  <ul className="vc-dialog__list vc-dialog__list--keep">
                    {preview.will_stay_published.map((item) => (
                      <li key={`${item.type}-${item.id}`}>
                        <span className="vc-dialog__type">{item.type}</span> {item.title}
                        {item.other_events?.length > 0 && (
                          <span className="vc-dialog__other">
                            {' '}· also in: {item.other_events.map((e) => e.title).join(', ')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}

        <div className="vc-dialog__actions">
          <button className="vc-btn vc-btn--ghost" onClick={onClose} disabled={archiving}>
            Cancel
          </button>
          <button
            className="vc-btn vc-btn--danger"
            onClick={handleConfirm}
            disabled={archiving || loading || !preview}
          >
            {archiving ? 'Archiving…' : 'Archive event'}
          </button>
        </div>
      </div>
    </div>
  );
}
