import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS, WP_ENDPOINTS } from '../../api/endpoints';
import { buildAcfPayload, flattenSchemaFields } from '../../hooks/useSchema';

// ── Tab extraction ─────────────────────────────────────────────────────────────
//
// ACF `tab` type fields act as section dividers in the field array.
// A tab field signals "everything after me belongs to this tab until the next tab."
// Fields before the first tab go into a nameless catch-all section (usually empty
// for well-structured ACF groups like ours, but handled gracefully).

function extractSections(fields = []) {
  const sections = [];
  let current = null;

  for (const field of fields) {
    if (field.type === 'tab') {
      current = { label: field.label, key: field.key, fields: [] };
      sections.push(current);
    } else {
      if (!current) {
        // Fields before first tab
        current = { label: null, key: '__pre__', fields: [] };
        sections.push(current);
      }
      current.fields.push(field);
    }
  }

  return sections.filter(s => s.fields.length > 0);
}

// ── Field renderer ─────────────────────────────────────────────────────────────
//
// Handles all scalar ACF types used in the partnership page.
// Repeaters and complex groups are shown as informational placeholders — they
// require WP admin for v1. Images show a preview with a "set in WP" note.
// Override toggles (true_false) are the most critical — they control which style
// tokens the frontend uses, so they get the full toggle UI treatment.

function PartnershipField({ field, value, onChange }) {
  const { name, label, type, acf_type, choices, placeholder, instructions, multiple } = field;

  const inputBase =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent ' +
    'transition-colors placeholder:text-gray-300';

  const labelEl = (
    <div className="mb-1">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {instructions && (
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{instructions}</p>
      )}
    </div>
  );

  // ── Toggle (true_false) ──────────────────────────────────────────────────────
  // Override toggles sit at the top of every style field pair — make them prominent
  if (type === 'true_false') {
    const isOn = Boolean(value);
    return (
      <div className="flex items-center justify-between py-1.5">
        <div className="pr-4">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {instructions && (
            <p className="text-xs text-gray-400 mt-0.5">{instructions}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(!isOn)}
          aria-checked={isOn}
          role="switch"
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
            transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
            isOn ? 'bg-violet-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm
              transition-transform duration-200 ${isOn ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
    );
  }

  // ── Select / radio / checkbox ─────────────────────────────────────────────────
  if (type === 'select') {
    if (multiple) {
      // Multi-select as checkbox group
      const selected = Array.isArray(value) ? value : [];
      return (
        <div>
          {labelEl}
          <div className="space-y-1.5">
            {(choices || []).map(c => {
              const checked = selected.includes(c.value);
              return (
                <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? selected.filter(v => v !== c.value)
                        : [...selected, c.value];
                      onChange(next);
                    }}
                    className="rounded border-gray-300 text-violet-500 focus:ring-violet-400"
                  />
                  <span className="text-sm text-gray-700">{c.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      );
    }
    return (
      <div>
        {labelEl}
        <select
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className={inputBase}
        >
          <option value="">— Select —</option>
          {(choices || []).map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
    );
  }

  // ── Color picker ──────────────────────────────────────────────────────────────
  if (type === 'color' || acf_type === 'color_picker') {
    return (
      <div>
        {labelEl}
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value || '#000000'}
            onChange={e => onChange(e.target.value)}
            className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
          />
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="#000000"
            className={inputBase + ' flex-1 font-mono'}
          />
        </div>
      </div>
    );
  }

  // ── Textarea / WYSIWYG ────────────────────────────────────────────────────────
  if (type === 'textarea' || type === 'wysiwyg') {
    return (
      <div>
        {labelEl}
        <textarea
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={type === 'wysiwyg' ? 6 : 4}
          className={inputBase + ' resize-y leading-relaxed'}
        />
        {type === 'wysiwyg' && (
          <p className="text-xs text-gray-400 mt-1">Plain text saved — HTML editing requires WP admin.</p>
        )}
      </div>
    );
  }

  // ── Image ─────────────────────────────────────────────────────────────────────
  if (type === 'image') {
    const imgUrl = value?.url || value?.sizes?.medium?.url || (typeof value === 'string' ? value : null);
    return (
      <div>
        {labelEl}
        {imgUrl ? (
          <div className="flex items-center gap-3">
            <img
              src={imgUrl}
              alt=""
              className="w-16 h-16 object-cover rounded-xl border border-gray-200 bg-gray-50"
            />
            <p className="text-xs text-gray-400">Set via WP Media Library</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 border border-dashed border-gray-300 rounded-xl bg-gray-50">
            <p className="text-xs text-gray-400">No image — set in WP admin</p>
          </div>
        )}
      </div>
    );
  }

  // ── Repeater / group — informational placeholder ───────────────────────────────
  // v1: complex nested structures stay in WP admin. The data is still fetched and
  // preserved in form state — it won't be overwritten unless edited.
  if (type === 'repeater' || type === 'group') {
    const count = Array.isArray(value) ? value.length : value ? 1 : 0;
    return (
      <div>
        {labelEl}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <p className="text-xs text-gray-500">
            {type === 'repeater'
              ? `${count} row${count !== 1 ? 's' : ''} — edit in WP admin`
              : 'Nested group — edit in WP admin'}
          </p>
        </div>
      </div>
    );
  }

  // ── Scalar fallback: text / number / url / email ───────────────────────────────
  const inputType =
    acf_type === 'number' ? 'number' :
    acf_type === 'url'    ? 'url'    :
    acf_type === 'email'  ? 'email'  : 'text';

  return (
    <div>
      {labelEl}
      <input
        type={inputType}
        value={value ?? ''}
        onChange={e => {
          const v = e.target.value;
          onChange(acf_type === 'number' && v !== '' ? Number(v) : v);
        }}
        placeholder={placeholder}
        className={inputBase}
      />
    </div>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────────

export default function PartnershipEditor() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { getClient, hasSites } = useAuth();

  const [schema,    setSchema]    = useState(null);
  const [values,    setValues]    = useState({});
  const [pageTitle, setPageTitle] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [savedMsg,  setSavedMsg]  = useState('');

  // Two-level tab state: top = ACF field group, inner = ACF tab fields within group
  const [activeGroup,   setActiveGroup]   = useState(0);
  const [activeSection, setActiveSection] = useState(0);

  // ── Fetch schema + values in parallel ─────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setLoading(true);
    setError(null);

    try {
      const [schemaRes, pageRes] = await Promise.all([
        client.get(VC_ENDPOINTS.partnership.schema),
        client.get(VC_ENDPOINTS.partnership.single(id)),
      ]);
      setSchema(schemaRes.data);
      setPageTitle(pageRes.data.title || '');
      setValues(pageRes.data.acf || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getClient, id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Reset inner tab when top group changes
  useEffect(() => { setActiveSection(0); }, [activeGroup]);

  // ── Form state ────────────────────────────────────────────────────────────────

  const handleChange = useCallback((fieldName, val) => {
    setValues(prev => ({ ...prev, [fieldName]: val }));
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────────
  // Writes via standard WP REST POST /wp/v2/pages/{id} with { acf: {...} }.
  // ACF's REST callbacks handle serialization — no custom endpoint needed for writes.
  // buildAcfPayload normalizes values: images → ID, repeater rows → normalized,
  // taxonomy → term IDs. Fields not in schema are excluded (safe partial update).

  const handleSave = useCallback(async () => {
    const client = getClient();
    if (!client || !schema) return;
    setSaving(true);
    setSavedMsg('');
    setError(null);

    try {
      // Flatten all fields across all groups, excluding tab-type fields
      const allFields = flattenSchemaFields(schema).filter(f => f.type !== 'tab');
      const acfPayload = buildAcfPayload(allFields, values);

      await client.post(WP_ENDPOINTS.pages.single(id), { acf: acfPayload });

      setSavedMsg('Saved');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [getClient, schema, values, id]);

  // ── Derived: sections within current group ────────────────────────────────────

  const groups = useMemo(() => schema?.groups || [], [schema]);

  const sections = useMemo(() => {
    const group = groups[activeGroup];
    return group ? extractSections(group.fields || []) : [];
  }, [groups, activeGroup]);

  const currentSection = sections[activeSection] ?? sections[0];

  // ── Guards ────────────────────────────────────────────────────────────────────

  if (!hasSites) return (
    <div className="p-6 text-center py-20">
      <p className="text-sm text-gray-400">Connect a site to edit partnerships.</p>
    </div>
  );

  if (loading) return (
    <div className="p-6 text-center py-20">
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  );

  if (!schema) return null;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
        <button
          onClick={() => navigate('/partnership')}
          className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Back"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-gray-900 flex-1 truncate">
          {pageTitle || 'Partnership Page'}
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
            savedMsg
              ? 'bg-green-500 text-white'
              : 'bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50'
          }`}
        >
          {saving ? 'Saving…' : savedMsg || 'Save'}
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg shrink-0">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* ── Group tabs (ACF field groups: main + styles) ── */}
      {groups.length > 1 && (
        <div className="flex gap-1.5 px-4 pt-3 shrink-0 overflow-x-auto no-scrollbar">
          {groups.map((g, i) => (
            <button
              key={g.key}
              onClick={() => setActiveGroup(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap shrink-0 transition-colors ${
                activeGroup === i
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {g.title}
            </button>
          ))}
        </div>
      )}

      {/* ── Section tabs (ACF tab fields within the active group) ── */}
      {sections.length > 1 && (
        <div className="flex gap-0 px-4 pt-3 pb-0 shrink-0 overflow-x-auto no-scrollbar border-b border-gray-100">
          {sections.map((s, i) => (
            <button
              key={s.key || i}
              onClick={() => setActiveSection(i)}
              className={`px-3 pb-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors border-b-2 -mb-px ${
                activeSection === i
                  ? 'text-violet-600 border-violet-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {s.label || 'General'}
            </button>
          ))}
        </div>
      )}

      {/* ── Fields ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {(currentSection?.fields || []).map(field => (
          <PartnershipField
            key={field.key}
            field={field}
            value={values[field.name]}
            onChange={val => handleChange(field.name, val)}
          />
        ))}

        {(!currentSection?.fields?.length) && (
          <p className="text-sm text-gray-400 text-center py-10">No fields in this section.</p>
        )}

        {/* Bottom padding so last field isn't clipped by safe area */}
        <div className="h-8" />
      </div>
    </div>
  );
}
