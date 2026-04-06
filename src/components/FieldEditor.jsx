/**
 * FieldEditor — schema-driven form renderer for vc-event-manager.
 *
 * Renders form fields dynamically based on a normalized ACF schema
 * returned from /wp-json/vc/v1/schema/{post_type}.
 *
 * Usage:
 *   <FieldEditor
 *     schema={schema}              // full schema object from useSchema
 *     value={formValues}           // { [field.name]: value }
 *     onChange={setFormValues}     // receives full updated value object
 *     onValidate={setErrors}       // optional: receives { [name]: errorMsg }
 *   />
 *
 * Or render a single field group / subset:
 *   <FieldEditor fields={group.fields} value={...} onChange={...} />
 *
 * Styling: Tailwind utility classes, white bg + purple accents, rounded.
 */

import React, { useCallback, useMemo, useState } from 'react';

// ============================================================
// Root component
// ============================================================
export function FieldEditor({
  schema,
  fields: fieldsOverride,
  value = {},
  onChange,
  onValidate,
  showGroupTitles = true,
  className = '',
}) {
  const fieldGroups = useMemo(() => {
    if (fieldsOverride) {
      return [{ key: '_root', title: '', fields: fieldsOverride }];
    }
    return schema?.field_groups || [];
  }, [schema, fieldsOverride]);

  const handleFieldChange = useCallback(
    (name, newValue) => {
      const next = { ...value, [name]: newValue };
      onChange?.(next);
    },
    [value, onChange]
  );

  const errors = useMemo(() => {
    const errs = {};
    fieldGroups.forEach((group) => {
      (group.fields || []).forEach((f) => {
        const err = validateField(f, value[f.name]);
        if (err) errs[f.name] = err;
      });
    });
    return errs;
  }, [fieldGroups, value]);

  React.useEffect(() => {
    onValidate?.(errors);
  }, [errors, onValidate]);

  if (!fieldGroups.length) {
    return (
      <div className="text-sm text-gray-500 italic">No fields defined.</div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {fieldGroups.map((group) => (
        <section key={group.key} className="space-y-4">
          {showGroupTitles && group.title && (
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">
              {group.title}
            </h3>
          )}
          {(group.fields || []).map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={value[field.name]}
              error={errors[field.name]}
              onChange={(v) => handleFieldChange(field.name, v)}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

// ============================================================
// Field renderer — maps type -> input component
// ============================================================
function FieldRenderer({ field, value, error, onChange }) {
  const InputComponent = INPUT_MAP[field.type] || TextInput;

  // Groups and repeaters render their own wrapper (no FieldWrapper label)
  if (field.type === 'group') {
    return (
      <GroupField
        field={field}
        value={value || {}}
        error={error}
        onChange={onChange}
      />
    );
  }
  if (field.type === 'repeater') {
    return (
      <RepeaterField
        field={field}
        value={Array.isArray(value) ? value : []}
        error={error}
        onChange={onChange}
      />
    );
  }

  return (
    <FieldWrapper field={field} error={error}>
      <InputComponent field={field} value={value} onChange={onChange} />
    </FieldWrapper>
  );
}

// ============================================================
// Field label/instructions/error wrapper
// ============================================================
function FieldWrapper({ field, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={field.key} className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-purple-600 ml-0.5">*</span>}
      </label>
      {field.instructions && (
        <p className="text-xs text-gray-500">{field.instructions}</p>
      )}
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ============================================================
// Shared input styles
// ============================================================
const inputBase =
  'w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 ' +
  'placeholder:text-gray-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ' +
  'transition-colors';

// ============================================================
// Text inputs
// ============================================================
function TextInput({ field, value, onChange }) {
  const inputType =
    field.type === 'email' ? 'email' :
    field.type === 'url' ? 'url' :
    field.type === 'number' ? 'number' :
    'text';

  return (
    <input
      id={field.key}
      type={inputType}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || ''}
      maxLength={field.maxlength || undefined}
      min={field.min ?? undefined}
      max={field.max ?? undefined}
      step={field.step ?? undefined}
      required={field.required}
      className={inputBase}
    />
  );
}

function TextArea({ field, value, onChange }) {
  return (
    <textarea
      id={field.key}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || ''}
      maxLength={field.maxlength || undefined}
      rows={4}
      className={`${inputBase} resize-y min-h-[96px]`}
    />
  );
}

function RichTextEditor({ field, value, onChange }) {
  // Lightweight WYSIWYG: contenteditable div with minimal toolbar.
  // For production, swap in TipTap/Quill and preserve the same interface.
  const ref = React.useRef(null);

  const exec = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <ToolbarBtn onClick={() => exec('bold')} label="B" className="font-bold" />
        <ToolbarBtn onClick={() => exec('italic')} label="I" className="italic" />
        <ToolbarBtn onClick={() => exec('underline')} label="U" className="underline" />
        <span className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarBtn onClick={() => exec('insertUnorderedList')} label="•" />
        <ToolbarBtn onClick={() => exec('insertOrderedList')} label="1." />
        <span className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarBtn
          onClick={() => {
            const url = prompt('Link URL:');
            if (url) exec('createLink', url);
          }}
          label="🔗"
        />
      </div>
      <div
        ref={ref}
        id={field.key}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value ?? '' }}
        className="px-3 py-2 min-h-[120px] text-sm text-gray-900 focus:outline-none"
      />
    </div>
  );
}

function ToolbarBtn({ onClick, label, className = '' }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`w-7 h-7 flex items-center justify-center text-xs text-gray-700 hover:bg-gray-200 rounded ${className}`}
    >
      {label}
    </button>
  );
}

// ============================================================
// Select / Dropdown
// ============================================================
function Dropdown({ field, value, onChange }) {
  const multiple = field.multiple;
  const choices = field.choices || [];

  if (multiple) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-1.5">
        {choices.map((c) => (
          <label key={c.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(c.value)}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, c.value]
                  : selected.filter((v) => v !== c.value);
                onChange(next);
              }}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <select
      id={field.key}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={inputBase}
    >
      <option value="">— Select —</option>
      {choices.map((c) => (
        <option key={c.value} value={c.value}>{c.label}</option>
      ))}
    </select>
  );
}

// ============================================================
// Toggle (true/false)
// ============================================================
function Toggle({ field, value, onChange }) {
  const checked = !!value;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
        checked ? 'bg-purple-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ============================================================
// Date / Time
// ============================================================
function DateInput({ field, value, onChange }) {
  return (
    <input
      id={field.key}
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={inputBase}
    />
  );
}

function TimeInput({ field, value, onChange }) {
  return (
    <input
      id={field.key}
      type="time"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={inputBase}
    />
  );
}

// ============================================================
// Image upload
// ============================================================
function ImageUpload({ field, value, onChange }) {
  // Expects WP media URL or { id, url } object. Simple file picker stub;
  // wire to WP REST /wp/v2/media in the app to do real uploads.
  const preview =
    typeof value === 'string' ? value :
    value?.url ? value.url :
    value?.sizes?.thumbnail ? value.sizes.thumbnail :
    null;

  return (
    <div className="flex items-center gap-3">
      {preview ? (
        <img
          src={preview}
          alt=""
          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
        />
      ) : (
        <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
          No image
        </div>
      )}
      <div className="flex-1 space-y-1.5">
        <input
          id={field.key}
          type="url"
          value={typeof value === 'string' ? value : value?.url || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL or upload via media library"
          className={inputBase}
        />
        <button
          type="button"
          onClick={() => {
            // Hook: integrate with WP media uploader here.
            // window.wp?.media?.({ title: field.label, multiple: false }).open();
            alert('Wire this to WP media uploader in host app.');
          }}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
        >
          Choose from library
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Searchable select (post_object, relationship)
// ============================================================
function SearchableSelect({ field, value, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const multiple = field.multiple;
  const selected = multiple ? (Array.isArray(value) ? value : []) : (value ? [value] : []);

  const search = useCallback(async (q) => {
    setLoading(true);
    try {
      const postTypes = Array.isArray(field.post_types) ? field.post_types : [field.post_types].filter(Boolean);
      const type = postTypes[0] || 'post';
      const nonce = typeof window !== 'undefined' ? window.vcEmConfig?.nonce : null;
      const url = `/wp-json/wp/v2/${type}?search=${encodeURIComponent(q)}&per_page=20&_fields=id,title`;
      const headers = {};
      if (nonce) headers['X-WP-Nonce'] = nonce;
      const res = await fetch(url, { credentials: 'include', headers });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [field.post_types]);

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, open, search]);

  const addItem = (item) => {
    const id = item.id;
    if (multiple) {
      if (!selected.some((s) => (s.id || s) === id)) {
        onChange([...selected, { id, title: item.title?.rendered || '' }]);
      }
    } else {
      onChange({ id, title: item.title?.rendered || '' });
    }
    setQuery('');
    if (!multiple) setOpen(false);
  };

  const removeItem = (id) => {
    if (multiple) {
      onChange(selected.filter((s) => (s.id || s) !== id));
    } else {
      onChange(null);
    }
  };

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => {
            const id = s.id || s;
            const title = s.title || s.post_title || `#${id}`;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium"
              >
                {title}
                <button
                  type="button"
                  onClick={() => removeItem(id)}
                  className="hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div className="relative">
        <input
          id={field.key}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={`Search ${field.label.toLowerCase()}...`}
          className={inputBase}
        />
        {open && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {loading && (
              <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
            )}
            {!loading && results.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500">No results</div>
            )}
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addItem(r); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50"
              >
                {r.title?.rendered || `#${r.id}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Taxonomy (multi-select from pre-fetched terms)
// ============================================================
function TaxonomySelect({ field, value, onChange }) {
  const terms = field.terms || [];
  const multiple = field.multiple;
  const selected = multiple
    ? (Array.isArray(value) ? value.map(String) : [])
    : (value != null ? [String(value)] : []);

  const toggle = (id) => {
    const strId = String(id);
    if (multiple) {
      const next = selected.includes(strId)
        ? selected.filter((s) => s !== strId)
        : [...selected, strId];
      onChange(next.map(Number));
    } else {
      onChange(Number(id));
    }
  };

  if (!multiple && terms.length <= 8) {
    // Render as dropdown for small sets
    return (
      <select
        id={field.key}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className={inputBase}
      >
        <option value="">— Select —</option>
        {terms.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    );
  }

  // Tag-pill multi-select
  return (
    <div className="flex flex-wrap gap-1.5">
      {terms.map((t) => {
        const isSelected = selected.includes(String(t.id));
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t.id)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              isSelected
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Group (nested object of sub_fields)
// ============================================================
function GroupField({ field, value, error, onChange }) {
  const [open, setOpen] = useState(true);
  const sub = field.sub_fields || [];

  const handleSubChange = (subName, subValue) => {
    onChange({ ...value, [subName]: subValue });
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900">
          {field.label}
          {field.required && <span className="text-purple-600 ml-0.5">*</span>}
        </span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="p-4 space-y-4 bg-white">
          {field.instructions && (
            <p className="text-xs text-gray-500">{field.instructions}</p>
          )}
          {sub.map((subField) => (
            <FieldRenderer
              key={subField.key}
              field={subField}
              value={value[subField.name]}
              onChange={(v) => handleSubChange(subField.name, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Repeater (array of rows with sub_fields)
// ============================================================
function RepeaterField({ field, value, error, onChange }) {
  const rows = Array.isArray(value) ? value : [];
  const sub = field.sub_fields || [];

  const addRow = () => {
    const blank = sub.reduce((acc, f) => ({ ...acc, [f.name]: f.default ?? null }), {});
    onChange([...rows, blank]);
  };

  const removeRow = (idx) => {
    onChange(rows.filter((_, i) => i !== idx));
  };

  const updateRow = (idx, subName, subValue) => {
    const next = rows.map((r, i) =>
      i === idx ? { ...r, [subName]: subValue } : r
    );
    onChange(next);
  };

  const moveRow = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const canAdd = field.max == null || rows.length < field.max;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-purple-600 ml-0.5">*</span>}
          <span className="ml-2 text-xs text-gray-400 font-normal">
            {rows.length}{field.max ? ` / ${field.max}` : ''}
          </span>
        </label>
      </div>
      {field.instructions && (
        <p className="text-xs text-gray-500">{field.instructions}</p>
      )}

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg p-4 bg-white"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Row {idx + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveRow(idx, -1)}
                  disabled={idx === 0}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move up"
                >↑</button>
                <button
                  type="button"
                  onClick={() => moveRow(idx, 1)}
                  disabled={idx === rows.length - 1}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move down"
                >↓</button>
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700"
                  title="Remove row"
                >×</button>
              </div>
            </div>
            <div className="space-y-4">
              {sub.map((subField) => (
                <FieldRenderer
                  key={subField.key}
                  field={subField}
                  value={row[subField.name]}
                  onChange={(v) => updateRow(idx, subField.name, v)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {canAdd && (
        <button
          type="button"
          onClick={addRow}
          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-colors"
        >
          + {field.button_label || 'Add Row'}
        </button>
      )}
    </div>
  );
}

// ============================================================
// Type -> component map
// ============================================================
const INPUT_MAP = {
  text: TextInput,
  textarea: TextArea,
  wysiwyg: RichTextEditor,
  number: TextInput,
  url: TextInput,
  email: TextInput,
  select: Dropdown,
  true_false: Toggle,
  date_picker: DateInput,
  time_picker: TimeInput,
  image: ImageUpload,
  relationship: SearchableSelect,
  taxonomy: TaxonomySelect,
  // group + repeater are handled in FieldRenderer directly
};

// ============================================================
// Validation
// ============================================================
export function validateField(field, value) {
  // Required
  if (field.required) {
    const empty =
      value == null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);
    if (empty) return `${field.label} is required`;
  }
  if (value == null || value === '') return null;

  // Type-specific
  if (field.type === 'email' && typeof value === 'string') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address';
  }
  if (field.type === 'url' && typeof value === 'string') {
    try { new URL(value); } catch { return 'Invalid URL'; }
  }
  if (field.type === 'number') {
    const n = Number(value);
    if (Number.isNaN(n)) return 'Must be a number';
    if (field.min != null && n < Number(field.min)) return `Must be ≥ ${field.min}`;
    if (field.max != null && n > Number(field.max)) return `Must be ≤ ${field.max}`;
  }
  if (field.maxlength && typeof value === 'string' && value.length > field.maxlength) {
    return `Max ${field.maxlength} characters`;
  }

  // Repeater min/max
  if (field.type === 'repeater' && Array.isArray(value)) {
    if (field.min != null && value.length < field.min) return `Minimum ${field.min} rows`;
    if (field.max != null && value.length > field.max) return `Maximum ${field.max} rows`;
  }

  return null;
}

export default FieldEditor;
