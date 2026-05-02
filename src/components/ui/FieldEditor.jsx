import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import SchemaField, { AvatarUpload, StatusBadge } from './SchemaFields';

/**
 * Schema-driven field editor.
 *
 * Renders ACF fields dynamically from a schema definition.
 * Supports two layouts:
 *   - 'detail' : Centered photo → title → status badge → fields → groups
 *   - 'form'   : Vertical stacked fields
 *
 * Props:
 *   - schema: { groups: [{ fields: [...] }], ... } from useSchema()
 *   - fields: flat array of field definitions (alternative to schema)
 *   - values / initialValues: current form values
 *   - onSave: async (values) => void
 *   - onCancel: () => void
 *   - getClient: () => apiClient (for uploads, taxonomy searches, etc.)
 *   - saving: boolean
 *   - mode: 'edit' | 'create'
 *   - layout: 'detail' | 'form'
 *
 * Detail layout config (optional overrides — auto-detected from schema):
 *   - photoFieldName: field name to render as avatar (default: first image field)
 *   - titleFieldName: field name for the title (default: 'title')
 *   - badgeFieldName: field name to render as status badge (default: first select with status-like choices)
 */

/* ─── Tab grouping helpers ──────────────────────────────────── */

/**
 * Split a flat fields array into tab groups.
 * Returns { preTabs: Field[], tabs: { label: string, fields: Field[] }[] }
 * If no tab fields exist, tabs is empty and all fields are in preTabs.
 */
function groupFieldsByTabs(fields) {
  const hasTabs = fields.some(f => f.type === 'tab');
  if (!hasTabs) return { preTabs: fields, tabs: [] };

  const preTabs = [];
  const tabs = [];
  let current = null;

  for (const field of fields) {
    if (field.type === 'tab') {
      if (current) tabs.push(current);
      current = { label: field.label || 'Tab', fields: [] };
    } else if (!current) {
      preTabs.push(field);
    } else {
      current.fields.push(field);
    }
  }
  if (current) tabs.push(current);
  return { preTabs, tabs };
}

/**
 * Renders fields with a horizontal tab bar when ACF tab fields are present.
 * Falls back to a flat list when no tabs are detected.
 */
function TabbedFields({ fields, values, onChange, getClient }) {
  const { preTabs, tabs } = useMemo(() => groupFieldsByTabs(fields), [fields]);
  const [activeTab, setActiveTab] = useState(0);
  const tabBarRef = useRef(null);

  // Reset active tab if field schema changes
  useEffect(() => { setActiveTab(0); }, [fields]);

  // Scroll to top of content on tab switch
  useEffect(() => {
    tabBarRef.current?.closest('.vc-scroll')?.scrollTo({ top: 0 });
  }, [activeTab]);

  const renderField = (field) => {
    const fieldId = field.name || field.key;
    return (
      <SchemaField
        key={field.key || field.name}
        field={field}
        value={field.type === 'group' ? (values[fieldId] || {}) : (values[fieldId] ?? '')}
        onChange={(val) => onChange(fieldId, val)}
        getClient={getClient}
        depth={0}
      />
    );
  };

  // No tabs — flat render
  if (!tabs.length) {
    return <div className="space-y-3">{fields.map(renderField)}</div>;
  }

  return (
    <div>
      {/* Pre-tab fields (before first tab marker) */}
      {preTabs.length > 0 && (
        <div className="space-y-3 mb-4">{preTabs.map(renderField)}</div>
      )}

      {/* Tab bar — sticky below top nav, full-width opaque background */}
      <div className="sticky top-0 z-30 -mx-4 px-4 pt-2.5 pb-2 bg-white border-b border-surface-3 mb-4">
        <div
          ref={tabBarRef}
          className="flex gap-1 overflow-x-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {tabs.map((tab, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap ${
                activeTab === i
                  ? 'bg-vc-100 text-vc-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-surface-1'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active tab's fields */}
      <div className="space-y-3">
        {(tabs[activeTab]?.fields || []).map(renderField)}
      </div>
    </div>
  );
}

export default function FieldEditor({
  schema,
  fields: fieldsProp,
  values: valuesProp,
  initialValues: initialValuesProp,
  onSave,
  onCancel,
  onPhotoChange,
  getClient,
  saving = false,
  mode = 'edit',
  layout = 'detail',
  photoFieldName,
  renderPhotoInEditor = true,
  titleFieldName = 'title',
  badgeFieldName,
}) {
  // Flatten fields from schema groups or use direct fields prop
  const allFields = useMemo(() => {
    if (fieldsProp) return fieldsProp;
    if (schema?.groups) return schema.groups.flatMap(g => g.fields || []);
    return [];
  }, [schema, fieldsProp]);

  // Auto-detect special fields from schema
  const photoField = useMemo(() => {
    if (photoFieldName) return allFields.find(f => (f.name || f.key) === photoFieldName);
    return allFields.find(f => f.type === 'image');
  }, [allFields, photoFieldName]);

  const badgeField = useMemo(() => {
    if (badgeFieldName) return allFields.find(f => (f.name || f.key) === badgeFieldName);
    // Auto-detect: first select field with status/booking in name (guard against missing name)
    return allFields.find(f =>
      f.type === 'select' && f.name && (f.name.includes('status') || f.name.includes('booking'))
    );
  }, [allFields, badgeFieldName]);

  // Regular fields = everything except photo, badge, and title (title handled separately)
  const regularFields = useMemo(() => {
    const specialNames = new Set([
      photoField ? (photoField.name || photoField.key) : null,
      badgeField ? (badgeField.name || badgeField.key) : null,
    ].filter(Boolean));
    return allFields.filter(f => !specialNames.has(f.name || f.key));
  }, [allFields, photoField, badgeField]);

  // State
  const initial = valuesProp || initialValuesProp || {};
  const [values, setValues] = useState(initial);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setValues(valuesProp || initialValuesProp || {});
  }, [valuesProp, initialValuesProp]);

  const handleChange = (key, value) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleNestedChange = (groupName, subName, subValue) => {
    setValues(prev => ({
      ...prev,
      [groupName]: {
        ...(prev[groupName] || {}),
        [subName]: subValue,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setSaveStatus(null);
    try {
      await onSave(values);
      setSaveStatus('success');
      setSaveMessage(mode === 'create' ? 'Created successfully' : 'Saved successfully');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus('error');
      setSaveMessage(err.message || 'Save failed');
    }
  };

  const isDirty = JSON.stringify(values) !== JSON.stringify(initial);

  // ── Detail layout ────────────────────────────────────────
  if (layout === 'detail') {
    return (
      <div className="p-4 pb-28 animate-fade-in">
        {/* Header: back + save */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onCancel}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || (!isDirty && mode !== 'create')}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
              bg-[#b1d6c3] text-[#0f331f] hover:bg-[#9ac8b0]
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Save toast */}
        <SaveToast status={saveStatus} message={saveMessage} />

        <form onSubmit={handleSubmit}>
          {/* Photo avatar — skipped when handled externally (e.g. ArtistDetail has its own PhotoUpload) */}
          {photoField && renderPhotoInEditor && (
            <AvatarUpload
              value={values[photoField.name]}
              onChange={(val) => {
                handleChange(photoField.name, val);
                onPhotoChange?.(val);
              }}
              getClient={getClient}
            />
          )}

          {/* Title */}
          <div className="text-center mb-2">
            <input
              type="text"
              className="text-[22px] font-bold text-[#282828] text-center bg-transparent border-none outline-none w-full placeholder:text-gray-300"
              style={{ fontSize: '22px' }}
              value={values[titleFieldName] || ''}
              onChange={(e) => handleChange(titleFieldName, e.target.value)}
              placeholder={mode === 'create' ? 'Enter name...' : ''}
              autoFocus={mode === 'create'}
            />
          </div>

          {/* Status badge */}
          {badgeField && (
            <div className="flex justify-center mb-5">
              <StatusBadge
                value={values[badgeField.name || badgeField.key] || ''}
                choices={badgeField.choices}
                onChange={(val) => handleChange(badgeField.name || badgeField.key, val)}
              />
            </div>
          )}

          {/* Dynamic fields — tabs if ACF tab fields present */}
          <TabbedFields
            fields={regularFields}
            values={values}
            onChange={handleChange}
            getClient={getClient}
          />
        </form>
      </div>
    );
  }

  // ── Form layout ──────────────────────────────────────────
  return (
    <div className="p-4 pb-28 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving || (!isDirty && mode !== 'create')}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
            bg-[#b1d6c3] text-[#0f331f] hover:bg-[#9ac8b0]
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
        </button>
      </div>

      <SaveToast status={saveStatus} message={saveMessage} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title field for form layout */}
        <div>
          <label className="block text-[13px] font-medium text-[#979797] mb-1.5">Title</label>
          <div className="vc-field-bg">
            <input
              type="text"
              className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none placeholder:text-gray-300"
              style={{ fontSize: '16px' }}
              value={values[titleFieldName] || ''}
              onChange={(e) => handleChange(titleFieldName, e.target.value)}
              placeholder="Enter title..."
            />
          </div>
        </div>

        <TabbedFields
          fields={allFields}
          values={values}
          onChange={handleChange}
          getClient={getClient}
        />
      </form>
    </div>
  );
}

/* ─── Save toast ────────────────────────────────────────────── */

function SaveToast({ status, message }) {
  if (!status) return null;
  return (
    <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${
      status === 'success'
        ? 'bg-emerald-50 border border-emerald-200'
        : 'bg-red-50 border border-red-200'
    }`}>
      {status === 'success'
        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
        : <AlertCircle className="w-4 h-4 text-red-500" />
      }
      <span className={`text-sm ${
        status === 'success' ? 'text-emerald-700' : 'text-red-700'
      }`}>{message}</span>
    </div>
  );
}
