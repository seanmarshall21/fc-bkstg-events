import { useState, useEffect, useMemo } from 'react';
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

export default function FieldEditor({
  schema,
  fields: fieldsProp,
  values: valuesProp,
  initialValues: initialValuesProp,
  onSave,
  onCancel,
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
      <div className="p-4 pb-8 animate-fade-in">
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
              onChange={(val) => handleChange(photoField.name, val)}
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

          {/* Dynamic fields */}
          <div className="space-y-3">
            {regularFields.map(field => {
              const fieldId = field.name || field.key;
              // Group fields: pass nested values
              if (field.type === 'group') {
                return (
                  <SchemaField
                    key={field.key || field.name}
                    field={field}
                    value={values[fieldId] || {}}
                    onChange={(val) => handleChange(fieldId, val)}
                    getClient={getClient}
                    depth={0}
                  />
                );
              }

              return (
                <SchemaField
                  key={field.key || field.name}
                  field={field}
                  value={values[fieldId] ?? ''}
                  onChange={(val) => handleChange(fieldId, val)}
                  getClient={getClient}
                  depth={0}
                />
              );
            })}
          </div>
        </form>
      </div>
    );
  }

  // ── Form layout ──────────────────────────────────────────
  return (
    <div className="p-4 pb-8 animate-fade-in">
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

        {allFields.map(field => {
          const fieldId = field.name || field.key;
          return (
            <SchemaField
              key={field.key || field.name}
              field={field}
              value={field.type === 'group' ? (values[fieldId] || {}) : (values[fieldId] ?? '')}
              onChange={(val) => handleChange(fieldId, val)}
              getClient={getClient}
              depth={0}
            />
          );
        })}
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
