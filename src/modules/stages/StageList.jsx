import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';
import { LayoutGrid, X, Loader2 } from 'lucide-react';

// ── Inline create sheet ──────────────────────────────────────────
function CreateStageSheet({ onClose, onCreated, getClient }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('Stage name is required.'); return; }
    const client = getClient();
    if (!client) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await client.post(WP_ENDPOINTS.stages.list, { name: name.trim() });
      onCreated(data);
    } catch (err) {
      setError(err.message || 'Failed to create stage.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl p-6 pb-10 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-bold text-gray-900">New Stage</p>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block text-xs font-medium text-gray-500 mb-1.5">Stage Name</label>
        <div className="vc-field-bg mb-4">
          <input
            type="text"
            className="w-full bg-transparent text-[15px] text-[#282828] border-none outline-none placeholder:text-gray-300"
            placeholder="e.g. Main Stage"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="flex-1 py-3 rounded-xl bg-vc-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline edit sheet ────────────────────────────────────────────
function EditStageSheet({ stage, onClose, onSaved, onDeleted, getClient }) {
  const [name, setName] = useState(stage.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Stage name is required.'); return; }
    const client = getClient();
    if (!client) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await client.post(WP_ENDPOINTS.stages.single(stage.id), { name: name.trim() });
      onSaved(data);
    } catch (err) {
      setError(err.message || 'Failed to save stage.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl p-6 pb-10 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-bold text-gray-900">Edit Stage</p>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block text-xs font-medium text-gray-500 mb-1.5">Stage Name</label>
        <div className="vc-field-bg mb-4">
          <input
            type="text"
            className="w-full bg-transparent text-[15px] text-[#282828] border-none outline-none"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 py-3 rounded-xl bg-vc-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main list ────────────────────────────────────────────────────
export default function StageList() {
  const { getClient, activeSite, hasSites } = useAuth();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editStage, setEditStage] = useState(null);

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

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to view stages.</p>
      </div>
    );
  }

  return (
    <>
      {showCreate && (
        <CreateStageSheet
          getClient={getClient}
          onClose={() => setShowCreate(false)}
          onCreated={(newStage) => {
            setStages(prev => [...prev, { ...newStage, title: newStage.name }]);
            setShowCreate(false);
          }}
        />
      )}

      {editStage && (
        <EditStageSheet
          stage={editStage}
          getClient={getClient}
          onClose={() => setEditStage(null)}
          onSaved={(updated) => {
            setStages(prev => prev.map(s => s.id === updated.id ? { ...updated, title: updated.name } : s));
            setEditStage(null);
          }}
          onDeleted={(id) => {
            setStages(prev => prev.filter(s => s.id !== id));
            setEditStage(null);
          }}
        />
      )}

      <ContentList
        title="Stages"
        items={stages}
        loading={loading}
        onRefresh={fetchStages}
        onAdd={() => setShowCreate(true)}
        onSelect={(stage) => setEditStage(stage)}
        searchKeys={['name']}
        emptyMessage="No Stages Added"
        emptySubtext="Add your first stage to use in lineup slots."
        addLabel="Add a Stage"
        moduleKey="stages"
        renderItem={(stage) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-800">{stage.name}</span>
          </div>
        )}
      />
    </>
  );
}
