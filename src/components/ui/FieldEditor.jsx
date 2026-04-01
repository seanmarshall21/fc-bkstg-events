import { useState, useEffect } from 'react';
import { Save, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Reusable field editor for post/term editing.
 * Renders a list of field definitions and handles save state.
 */

export default function FieldEditor({
  title,
  fields = [],
  initialValues = {},
  onSave,
  onCancel,
  saving = false,
}) {
  const [values, setValues] = useState(initialValues);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (key, value) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus(null);
    try {
      await onSave(values);
      setSaveStatus('success');
      setSaveMessage('Saved successfully');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus('error');
      setSaveMessage(err.message || 'Save failed');
    }
  };

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {onCancel && (
          <button onClick={onCancel} className="vc-btn vc-btn--ghost !px-2.5">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status Toast */}
      {saveStatus && (
        <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${
          saveStatus === 'success'
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {saveStatus === 'success'
            ? <CheckCircle className="w-4 h-4 text-emerald-500" />
            : <AlertCircle className="w-4 h-4 text-red-500" />
          }
          <span className={`text-sm ${
            saveStatus === 'success' ? 'text-emerald-700' : 'text-red-700'
          }`}>{saveMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(field => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={values[field.key] ?? ''}
            onChange={(val) => handleChange(field.key, val)}
          />
        ))}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-surface-3">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="vc-btn vc-btn--primary"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="vc-btn vc-btn--secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function FieldRenderer({ field, value, onChange }) {
  const { type = 'text', label, key, options, placeholder, rows = 4 } = field;

  switch (type) {
    case 'textarea':
      return (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
          <textarea
            className="vc-input resize-none"
            rows={rows}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
          <select
            className="vc-input"
            value={value}
            onChange={e => onChange(e.target.value)}
          >
            <option value="">Select...</option>
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'toggle':
      return (
        <div className="flex items-center justify-between py-1">
          <label className="text-sm text-gray-700">{label}</label>
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={`relative w-10 h-5.5 rounded-full transition-colors ${
              value ? 'bg-vc-600' : 'bg-surface-4'
            }`}
          >
            <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
              value ? 'left-[22px]' : 'left-0.5'
            }`} />
          </button>
        </div>
      );

    case 'image':
      return (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
          {value ? (
            <div className="relative group">
              <img
                src={typeof value === 'string' ? value : value.url}
                alt=""
                className="w-full h-40 object-cover rounded-xl border border-surface-3"
              />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 shadow text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 rounded-xl border-2 border-dashed border-surface-4 text-gray-400 text-sm bg-surface-1">
              No image set
            </div>
          )}
        </div>
      );

    case 'tags':
      return (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
          <div className="flex flex-wrap gap-1.5">
            {(value || []).map((tag, i) => (
              <span key={i} className="vc-badge vc-badge--purple">
                {typeof tag === 'object' ? tag.name : tag}
              </span>
            ))}
            {(!value || value.length === 0) && (
              <span className="text-xs text-gray-400">No tags assigned</span>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
          <input
            type={type}
            className="vc-input"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      );
  }
}
