import { useState, useEffect } from 'react';
import { Save, X, Loader2, AlertCircle, CheckCircle, ChevronLeft, Camera } from 'lucide-react';

/**
 * Reusable field editor for post/term editing + creation.
 * Renders a list of field definitions and handles save state.
 *
 * Supports two layouts:
 *   - 'detail' (default): Figma-style artist detail with centered photo, name, badge, card fields
 *   - 'form': Traditional vertical form layout
 *
 * Props:
 *   - mode: 'edit' | 'create' — controls header text and behavior
 *   - layout: 'detail' | 'form' — visual layout style
 *   - photoField: key of the photo/image field (renders as centered circle in 'detail' layout)
 *   - titleField: key of the title/name field (renders large centered in 'detail' layout)
 *   - badgeField: { key, options } — renders as colored badge below title
 *   - tagFields: [{ key, label }] — renders as tag chips
 *   - socialFields: [{ key, label, icon }] — renders as compact social link rows
 *   - fields: all other fields rendered as labeled card inputs
 */

export default function FieldEditor({
  title,
  fields = [],
  initialValues = {},
  onSave,
  onCancel,
  saving = false,
  mode = 'edit',
  layout = 'detail',
  photoField,
  titleField,
  badgeField,
  tagFields = [],
  socialFields = [],
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
      setSaveMessage(mode === 'create' ? 'Created successfully' : 'Saved successfully');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus('error');
      setSaveMessage(err.message || 'Save failed');
    }
  };

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  // Separate out special fields from regular fields
  const specialKeys = new Set([
    photoField,
    titleField,
    badgeField?.key,
    ...tagFields.map(f => f.key),
    ...socialFields.map(f => f.key),
  ].filter(Boolean));

  const regularFields = fields.filter(f => !specialKeys.has(f.key));

  // Detail layout (Figma-style)
  if (layout === 'detail') {
    return (
      <div className="p-4 pb-8 animate-fade-in">
        {/* Header row: back + save */}
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

        <form onSubmit={handleSubmit}>
          {/* Centered photo circle */}
          {photoField && (
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24 rounded-full bg-[#383842] flex items-center justify-center overflow-hidden group cursor-pointer">
                {values[photoField] ? (
                  <img
                    src={typeof values[photoField] === 'string' ? values[photoField] : values[photoField]?.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-7 h-7 text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          )}

          {/* Title field — large centered text */}
          {titleField && (
            <div className="text-center mb-2">
              {mode === 'create' ? (
                <input
                  type="text"
                  className="text-[22px] font-bold text-[#282828] text-center bg-transparent border-none outline-none w-full placeholder:text-gray-300"
                  value={values[titleField] || ''}
                  onChange={(e) => handleChange(titleField, e.target.value)}
                  placeholder="Enter name..."
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  className="text-[22px] font-bold text-[#282828] text-center bg-transparent border-none outline-none w-full"
                  value={values[titleField] || ''}
                  onChange={(e) => handleChange(titleField, e.target.value)}
                />
              )}
            </div>
          )}

          {/* Badge (booking status) */}
          {badgeField && (
            <div className="flex justify-center mb-5">
              <StatusBadge
                value={values[badgeField.key] || ''}
                options={badgeField.options}
                onChange={(val) => handleChange(badgeField.key, val)}
              />
            </div>
          )}

          {/* Regular fields as labeled card inputs */}
          <div className="space-y-3">
            {regularFields.map(field => (
              <CardField
                key={field.key}
                field={field}
                value={values[field.key] ?? ''}
                onChange={(val) => handleChange(field.key, val)}
              />
            ))}
          </div>

          {/* Tag fields */}
          {tagFields.length > 0 && tagFields.map(tagField => (
            <div key={tagField.key} className="mt-4">
              <label className="block text-[13px] font-medium text-[#979797] mb-2">{tagField.label || 'Tags'}</label>
              <div className="flex flex-wrap gap-2">
                {(values[tagField.key] || []).map((tag, i) => (
                  <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#262b59] text-[#ececec] text-[13px] font-medium">
                    {typeof tag === 'object' ? tag.name : tag}
                  </span>
                ))}
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#fcfcfc] text-[#979797] text-[13px] font-medium border border-surface-3 hover:bg-surface-2 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {/* Social links section */}
          {socialFields.length > 0 && (
            <div className="mt-5">
              <label className="block text-[13px] font-medium text-[#979797] mb-2">Social Links</label>
              <div className="space-y-1.5">
                {socialFields.map(sf => (
                  <div key={sf.key} className="flex items-center rounded-lg bg-[#ececec] px-3 py-2.5">
                    <span className="text-[12px] font-medium text-[#979797] w-24 shrink-0">{sf.label}</span>
                    <input
                      type="url"
                      className="flex-1 bg-transparent text-[13px] text-[#282828] border-none outline-none placeholder:text-gray-300"
                      value={values[sf.key] || ''}
                      onChange={(e) => handleChange(sf.key, e.target.value)}
                      placeholder={`Add ${sf.label}...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    );
  }

  // === Form layout (legacy / fallback) ===
  return (
    <div className="p-4 pb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {onCancel && (
          <button onClick={onCancel} className="vc-btn vc-btn--ghost !px-2.5">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

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
          <CardField
            key={field.key}
            field={field}
            value={values[field.key] ?? ''}
            onChange={(val) => handleChange(field.key, val)}
          />
        ))}

        <div className="flex items-center gap-3 pt-4 border-t border-surface-3">
          <button
            type="submit"
            disabled={saving || (!isDirty && mode !== 'create')}
            className="vc-btn vc-btn--primary"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="vc-btn vc-btn--secondary">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/* ─── Status badge with dropdown ──────────────────────────── */
function StatusBadge({ value, options = [], onChange }) {
  const colorMap = {
    confirmed: { bg: 'bg-[#0f331f]', text: 'text-[#b1d6c3]' },
    booked:    { bg: 'bg-[#0f331f]', text: 'text-[#b1d6c3]' },
    pending:   { bg: 'bg-amber-100', text: 'text-amber-800' },
    hold:      { bg: 'bg-gray-200', text: 'text-gray-600' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
    available: { bg: 'bg-blue-100', text: 'text-blue-700' },
    unavailable: { bg: 'bg-gray-200', text: 'text-gray-500' },
  };

  const colors = colorMap[value] || colorMap.available;
  const label = options.find(o => o.value === value)?.label || value || 'Select...';

  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none ${colors.bg} ${colors.text} text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer outline-none pr-6`}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">&#x25BE;</span>
    </div>
  );
}

/* ─── Card-style field (Figma: rounded bg-[#ececec] inputs) ─ */
function CardField({ field, value, onChange }) {
  const { type = 'text', label, key, options, placeholder, rows = 4 } = field;

  switch (type) {
    case 'textarea':
      return (
        <div>
          <label className="block text-[13px] font-medium text-[#979797] mb-1.5">{label}</label>
          <div className="bg-[#ececec] rounded-[10px] px-3.5 py-3">
            <textarea
              className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none resize-none placeholder:text-gray-300"
              rows={rows}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder || `Add ${label.toLowerCase()}...`}
            />
          </div>
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-[13px] font-medium text-[#979797] mb-1.5">{label}</label>
          <div className="bg-[#ececec] rounded-[10px] px-3.5 py-3">
            <select
              className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none cursor-pointer"
              value={value}
              onChange={e => onChange(e.target.value)}
            >
              <option value="">Select...</option>
              {options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
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
          <label className="block text-[13px] font-medium text-[#979797] mb-1.5">{label}</label>
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
          <label className="block text-[13px] font-medium text-[#979797] mb-1.5">{label}</label>
          <div className="flex flex-wrap gap-2">
            {(value || []).map((tag, i) => (
              <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#262b59] text-[#ececec] text-[13px] font-medium">
                {typeof tag === 'object' ? tag.name : tag}
              </span>
            ))}
            {(!value || value.length === 0) && (
              <span className="text-xs text-gray-400">No tags assigned</span>
            )}
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#fcfcfc] text-[#979797] text-[13px] font-medium border border-surface-3"
            >
              +
            </button>
          </div>
        </div>
      );

    default:
      return (
        <div>
          <label className="block text-[13px] font-medium text-[#979797] mb-1.5">{label}</label>
          <div className="bg-[#ececec] rounded-[10px] px-3.5 py-3">
            <input
              type={type}
              className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none placeholder:text-gray-300"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder || `Add ${label.toLowerCase()}...`}
            />
          </div>
        </div>
      );
  }
}
