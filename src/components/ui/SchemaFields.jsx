import { useState, useRef, useEffect } from 'react';
import { Camera, X, ChevronDown, ChevronRight, Plus, Trash2, Search, Loader2, ExternalLink } from 'lucide-react';

/**
 * Schema-driven field renderers.
 *
 * Each renderer receives:
 *   - field: schema field definition from /vc/v1/schema/{postType}
 *   - value: current value
 *   - onChange: (newValue) => void
 *   - getClient: () => apiClient (for uploads, taxonomy fetching, etc.)
 *   - depth: nesting depth (for groups)
 */

/* ─── Master dispatcher ─────────────────────────────────────── */

export default function SchemaField({ field, value, onChange, getClient, depth = 0 }) {
  const Component = FIELD_MAP[field.type] || TextField;
  return <Component field={field} value={value} onChange={onChange} getClient={getClient} depth={depth} />;
}

/* ─── Text / Email / URL / Password ─────────────────────────── */

function TextField({ field, value, onChange }) {
  const inputType = ['email', 'url', 'password'].includes(field.type) ? field.type : 'text';
  return (
    <FieldWrapper field={field}>
      <div className="vc-field-bg flex items-center">
        {field.prepend && <span className="text-[12px] text-[#979797] mr-1.5 shrink-0">{field.prepend}</span>}
        <input
          type={inputType}
          className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none placeholder:text-gray-300"
          style={{ fontSize: '16px' }}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || `Add ${field.label.toLowerCase()}...`}
          maxLength={field.maxlength || undefined}
        />
        {field.append && <span className="text-[12px] text-[#979797] ml-1.5 shrink-0">{field.append}</span>}
      </div>
    </FieldWrapper>
  );
}

/* ─── Textarea ──────────────────────────────────────────────── */

function TextareaField({ field, value, onChange }) {
  return (
    <FieldWrapper field={field}>
      <div className="vc-field-bg">
        <textarea
          className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none resize-none placeholder:text-gray-300"
          style={{ fontSize: '16px' }}
          rows={field.rows || 4}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || `Add ${field.label.toLowerCase()}...`}
          maxLength={field.maxlength || undefined}
        />
      </div>
    </FieldWrapper>
  );
}

/* ─── WYSIWYG (simplified — renders as textarea for mobile) ── */

function WysiwygField({ field, value, onChange }) {
  return (
    <FieldWrapper field={field}>
      <div className="vc-field-bg">
        <textarea
          className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none resize-none placeholder:text-gray-300"
          style={{ fontSize: '16px' }}
          rows={6}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || `Add ${field.label.toLowerCase()}...`}
        />
      </div>
    </FieldWrapper>
  );
}

/* ─── Number ────────────────────────────────────────────────── */

function NumberField({ field, value, onChange }) {
  return (
    <FieldWrapper field={field}>
      <div className="vc-field-bg flex items-center">
        {field.prepend && <span className="text-[12px] text-[#979797] mr-1.5 shrink-0">{field.prepend}</span>}
        <input
          type="number"
          className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none placeholder:text-gray-300"
          style={{ fontSize: '16px' }}
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder={field.placeholder || '0'}
          min={field.min}
          max={field.max}
          step={field.step}
        />
        {field.append && <span className="text-[12px] text-[#979797] ml-1.5 shrink-0">{field.append}</span>}
      </div>
    </FieldWrapper>
  );
}

/* ─── Select ────────────────────────────────────────────────── */

function SelectField({ field, value, onChange }) {
  const choices = normalizeChoices(field.choices);
  return (
    <FieldWrapper field={field}>
      <div className="vc-field-bg">
        <select
          className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none cursor-pointer"
          style={{ fontSize: '16px' }}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
        >
          {(field.allow_null || !field.required) && <option value="">Select...</option>}
          {choices.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </FieldWrapper>
  );
}

/* ─── Radio ─────────────────────────────────────────────────── */

function RadioField({ field, value, onChange }) {
  const choices = normalizeChoices(field.choices);
  return (
    <FieldWrapper field={field}>
      <div className="space-y-1.5">
        {choices.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={field.name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="w-4 h-4 accent-[#0f331f]"
            />
            <span className="text-[14px] text-[#282828]">{opt.label}</span>
          </label>
        ))}
      </div>
    </FieldWrapper>
  );
}

/* ─── Checkbox (multi-select) ───────────────────────────────── */

function CheckboxField({ field, value, onChange }) {
  const choices = normalizeChoices(field.choices);
  const selected = Array.isArray(value) ? value : [];
  const toggle = (val) => {
    const next = selected.includes(val)
      ? selected.filter(v => v !== val)
      : [...selected, val];
    onChange(next);
  };
  return (
    <FieldWrapper field={field}>
      <div className="space-y-1.5">
        {choices.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="w-4 h-4 accent-[#0f331f] rounded"
            />
            <span className="text-[14px] text-[#282828]">{opt.label}</span>
          </label>
        ))}
      </div>
    </FieldWrapper>
  );
}

/* ─── True/False ────────────────────────────────────────────── */

function TrueFalseField({ field, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <label className="text-[13px] font-medium text-[#979797]">{field.label}</label>
        {field.message && <p className="text-[12px] text-gray-400 mt-0.5">{field.message}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-[22px] rounded-full transition-colors ${
          value ? 'bg-[#0f331f]' : 'bg-gray-300'
        }`}
      >
        <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
          value ? 'left-[20px]' : 'left-[2px]'
        }`} />
      </button>
    </div>
  );
}

/* ─── Image Upload ──────────────────────────────────────────── */

function ImageField({ field, value, onChange, getClient }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const client = getClient?.();
    if (!client) return;

    setUploading(true);
    try {
      const media = await client.uploadMedia(file);
      // Store the full media object — buildAcfPayload extracts .id
      onChange({ id: media.id, url: media.source_url, ...media });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const imageUrl = value
    ? (typeof value === 'string' ? value : value?.url || value?.source_url)
    : null;

  return (
    <FieldWrapper field={field}>
      <input
        ref={fileRef}
        type="file"
        accept={field.mime_types || 'image/*'}
        className="hidden"
        onChange={handleUpload}
      />
      {imageUrl ? (
        <div className="relative group">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-40 object-cover rounded-xl border border-gray-200"
          />
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-1.5 rounded-lg bg-white/90 shadow text-gray-500 hover:text-gray-700"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-1.5 rounded-lg bg-white/90 shadow text-gray-500 hover:text-red-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 text-sm bg-gray-50 hover:border-gray-400 hover:text-gray-500 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span className="flex flex-col items-center gap-1">
              <Camera className="w-5 h-5" />
              <span>Tap to upload</span>
            </span>
          )}
        </button>
      )}
    </FieldWrapper>
  );
}

/* ─── Image (circular avatar variant for detail layout) ───── */

export function AvatarUpload({ value, onChange, getClient }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const client = getClient?.();
    if (!client) return;

    setUploading(true);
    try {
      const media = await client.uploadMedia(file);
      onChange({ id: media.id, url: media.source_url, ...media });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const imageUrl = value
    ? (typeof value === 'string' ? value : value?.url || value?.source_url)
    : null;

  return (
    <div className="flex justify-center mb-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
      <div
        onClick={() => fileRef.current?.click()}
        className="relative w-24 h-24 rounded-full bg-[#383842] flex items-center justify-center overflow-hidden group cursor-pointer"
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        ) : imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-7 h-7 text-gray-400" />
        )}
        {!uploading && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Taxonomy (tag chips + search picker) ──────────────────── */

function TaxonomyField({ field, value, onChange, getClient }) {
  const [open, setOpen] = useState(false);
  const [terms, setTerms] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingTerms, setLoadingTerms] = useState(false);
  const selected = Array.isArray(value) ? value : (value ? [value] : []);

  const fetchTerms = async (q = '') => {
    const client = getClient?.();
    if (!client || !field.taxonomy) return;
    setLoadingTerms(true);
    try {
      const params = { per_page: 50, hide_empty: false };
      if (q) params.search = q;
      const { data } = await client.get(`/wp/v2/${field.taxonomy}`, params);
      setTerms(data);
    } catch (err) {
      console.error('Failed to fetch terms:', err);
    } finally {
      setLoadingTerms(false);
    }
  };

  useEffect(() => {
    if (open && terms.length === 0) fetchTerms();
  }, [open]);

  const toggleTerm = (term) => {
    const termId = term.id;
    const isSelected = selected.some(t => (typeof t === 'object' ? (t.id || t.term_id) : t) === termId);

    if (isSelected) {
      onChange(selected.filter(t => (typeof t === 'object' ? (t.id || t.term_id) : t) !== termId));
    } else if (field.multiple !== false) {
      onChange([...selected, { id: term.id, name: term.name }]);
    } else {
      onChange({ id: term.id, name: term.name });
      setOpen(false);
    }
  };

  const isTermSelected = (term) => {
    return selected.some(t => (typeof t === 'object' ? (t.id || t.term_id) : t) === term.id);
  };

  return (
    <FieldWrapper field={field}>
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2">
        {selected.map((tag, i) => {
          const name = typeof tag === 'object' ? tag.name : tag;
          return (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#262b59] text-[#ececec] text-[13px] font-medium">
              {name}
              <button
                type="button"
                onClick={() => {
                  const id = typeof tag === 'object' ? (tag.id || tag.term_id) : tag;
                  onChange(selected.filter(t => (typeof t === 'object' ? (t.id || t.term_id) : t) !== id));
                }}
                className="ml-0.5 hover:text-red-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#fcfcfc] text-[#979797] text-[13px] font-medium border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dropdown picker */}
      {open && (
        <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="flex-1 text-[14px] bg-transparent outline-none placeholder:text-gray-300"
              style={{ fontSize: '16px' }}
              placeholder="Search..."
              value={search}
              onChange={e => { setSearch(e.target.value); fetchTerms(e.target.value); }}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loadingTerms ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
            ) : terms.length === 0 ? (
              <div className="py-4 text-center text-[13px] text-gray-400">No terms found</div>
            ) : (
              terms.map(term => (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => toggleTerm(term)}
                  className={`w-full text-left px-3 py-2 text-[14px] hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    isTermSelected(term) ? 'text-[#0f331f] font-medium bg-emerald-50' : 'text-[#282828]'
                  }`}
                >
                  <span dangerouslySetInnerHTML={{ __html: term.name }} />
                  {isTermSelected(term) && <span className="text-[#0f331f] text-[12px]">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </FieldWrapper>
  );
}

/* ─── Post Object / Relationship (search picker) ────────────── */

function PostObjectField({ field, value, onChange, getClient }) {
  const isMulti = field.multiple || field.type === 'relationship';
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const selected = isMulti
    ? (Array.isArray(value) ? value : [])
    : (value ? [value] : []);

  const targetPostType = Array.isArray(field.post_type) ? field.post_type[0] : field.post_type;

  const doSearch = async (q) => {
    const client = getClient?.();
    if (!client || !targetPostType) return;
    setLoading(true);
    try {
      const params = { per_page: 20, status: 'publish' };
      if (q) params.search = q;
      const { data } = await client.get(`/wp/v2/${targetPostType}`, params);
      setResults(data);
    } catch (err) {
      console.error('Post search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && results.length === 0) doSearch('');
  }, [open]);

  const getPostId = (item) => typeof item === 'object' ? (item.ID || item.id) : item;
  const getPostTitle = (item) => {
    if (typeof item === 'object') {
      return item.title?.rendered || item.title?.raw || item.name || item.post_title || `#${getPostId(item)}`;
    }
    return `#${item}`;
  };

  const togglePost = (post) => {
    const postId = post.id;
    const isSelected = selected.some(s => getPostId(s) === postId);
    const item = { id: post.id, ID: post.id, title: post.title };

    if (isSelected) {
      if (isMulti) {
        onChange(selected.filter(s => getPostId(s) !== postId));
      } else {
        onChange(null);
      }
    } else if (isMulti) {
      onChange([...selected, item]);
    } else {
      onChange(item);
      setOpen(false);
    }
  };

  return (
    <FieldWrapper field={field}>
      {/* Selected items */}
      {selected.length > 0 && (
        <div className="space-y-1 mb-2">
          {selected.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-[14px] text-[#282828]">{getPostTitle(item)}</span>
              <button
                type="button"
                onClick={() => {
                  if (isMulti) {
                    onChange(selected.filter(s => getPostId(s) !== getPostId(item)));
                  } else {
                    onChange(null);
                  }
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fcfcfc] text-[#979797] text-[13px] font-medium border border-gray-200 hover:bg-gray-100 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add {field.label}</span>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="flex-1 text-[14px] bg-transparent outline-none placeholder:text-gray-300"
              style={{ fontSize: '16px' }}
              placeholder="Search..."
              value={search}
              onChange={e => { setSearch(e.target.value); doSearch(e.target.value); }}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
            ) : results.length === 0 ? (
              <div className="py-4 text-center text-[13px] text-gray-400">No results</div>
            ) : (
              results.map(post => {
                const isSel = selected.some(s => getPostId(s) === post.id);
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => togglePost(post)}
                    className={`w-full text-left px-3 py-2 text-[14px] hover:bg-gray-50 transition-colors flex items-center justify-between ${
                      isSel ? 'text-[#0f331f] font-medium bg-emerald-50' : 'text-[#282828]'
                    }`}
                  >
                    <span dangerouslySetInnerHTML={{ __html: post.title?.rendered || `#${post.id}` }} />
                    {isSel && <span className="text-[#0f331f] text-[12px]">✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </FieldWrapper>
  );
}

/* ─── Date Picker ───────────────────────────────────────────── */

function DatePickerField({ field, value, onChange }) {
  // ACF stores dates as Ymd (20260315). HTML input needs YYYY-MM-DD.
  const htmlValue = value
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
    : '';

  const handleChange = (e) => {
    const raw = e.target.value; // YYYY-MM-DD
    onChange(raw ? raw.replace(/-/g, '') : '');
  };

  return (
    <FieldWrapper field={field}>
      <div className="vc-field-bg">
        <input
          type="date"
          className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none"
          style={{ fontSize: '16px' }}
          value={htmlValue}
          onChange={handleChange}
        />
      </div>
    </FieldWrapper>
  );
}

/* ─── Time Picker ───────────────────────────────────────────── */

function TimePickerField({ field, value, onChange }) {
  // ACF stores as H:i:s. HTML input uses HH:MM.
  const htmlValue = value ? value.slice(0, 5) : '';
  return (
    <FieldWrapper field={field}>
      <div className="vc-field-bg">
        <input
          type="time"
          className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none"
          style={{ fontSize: '16px' }}
          value={htmlValue}
          onChange={e => onChange(e.target.value ? `${e.target.value}:00` : '')}
        />
      </div>
    </FieldWrapper>
  );
}

/* ─── DateTime Picker ───────────────────────────────────────── */

function DateTimePickerField({ field, value, onChange }) {
  // ACF: Y-m-d H:i:s → HTML: YYYY-MM-DDTHH:MM
  const htmlValue = value ? value.replace(' ', 'T').slice(0, 16) : '';
  return (
    <FieldWrapper field={field}>
      <div className="vc-field-bg">
        <input
          type="datetime-local"
          className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none"
          style={{ fontSize: '16px' }}
          value={htmlValue}
          onChange={e => {
            const v = e.target.value;
            onChange(v ? v.replace('T', ' ') + ':00' : '');
          }}
        />
      </div>
    </FieldWrapper>
  );
}

/* ─── Color Picker ──────────────────────────────────────────── */

function ColorPickerField({ field, value, onChange }) {
  return (
    <FieldWrapper field={field}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
          value={value || '#000000'}
          onChange={e => onChange(e.target.value)}
        />
        <input
          type="text"
          className="flex-1 vc-field-bg text-[14px] text-[#282828] border-none outline-none"
          style={{ fontSize: '16px' }}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="#000000"
        />
      </div>
    </FieldWrapper>
  );
}

/* ─── Group (collapsible section with sub-fields) ────────────── */

function GroupField({ field, value, onChange, getClient, depth }) {
  const [collapsed, setCollapsed] = useState(false);
  const groupValues = (value && typeof value === 'object') ? value : {};

  const handleSubChange = (subName, subValue) => {
    onChange({ ...groupValues, [subName]: subValue });
  };

  if (!field.sub_fields?.length) return null;

  return (
    <div className={`${depth > 0 ? 'ml-2 pl-3 border-l-2 border-gray-200' : ''}`}>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 mb-2 text-[13px] font-semibold text-[#282828] hover:text-[#0f331f] transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {field.label}
      </button>
      {!collapsed && (
        <div className="space-y-3">
          {field.sub_fields.map(sub => (
            <SchemaField
              key={sub.key}
              field={sub}
              value={groupValues[sub.name] ?? ''}
              onChange={(val) => handleSubChange(sub.name, val)}
              getClient={getClient}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Repeater ──────────────────────────────────────────────── */

function RepeaterField({ field, value, onChange, getClient, depth }) {
  const rows = Array.isArray(value) ? value : [];

  const addRow = () => {
    const empty = {};
    (field.sub_fields || []).forEach(sf => { empty[sf.name] = ''; });
    onChange([...rows, empty]);
  };

  const removeRow = (index) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index, subName, subValue) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, [subName]: subValue } : row
    );
    onChange(updated);
  };

  return (
    <FieldWrapper field={field}>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="relative rounded-xl border border-gray-200 p-3 bg-gray-50/50">
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="space-y-2">
              {(field.sub_fields || []).map(sub => (
                <SchemaField
                  key={sub.key}
                  field={sub}
                  value={row[sub.name] ?? ''}
                  onChange={(val) => updateRow(i, sub.name, val)}
                  getClient={getClient}
                  depth={depth + 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {(!field.max || rows.length < field.max) && (
        <button
          type="button"
          onClick={addRow}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fcfcfc] text-[#979797] text-[13px] font-medium border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{field.button_label || 'Add Row'}</span>
        </button>
      )}
    </FieldWrapper>
  );
}

/* ─── Link ──────────────────────────────────────────────────── */

function LinkField({ field, value, onChange }) {
  const linkVal = (value && typeof value === 'object') ? value : { url: value || '', title: '', target: '' };
  return (
    <FieldWrapper field={field}>
      <div className="space-y-2">
        <div className="vc-field-bg">
          <input
            type="url"
            className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none placeholder:text-gray-300"
            style={{ fontSize: '16px' }}
            value={linkVal.url || ''}
            onChange={e => onChange({ ...linkVal, url: e.target.value })}
            placeholder="URL..."
          />
        </div>
        <div className="vc-field-bg">
          <input
            type="text"
            className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none placeholder:text-gray-300"
            style={{ fontSize: '16px' }}
            value={linkVal.title || ''}
            onChange={e => onChange({ ...linkVal, title: e.target.value })}
            placeholder="Link text..."
          />
        </div>
      </div>
    </FieldWrapper>
  );
}

/* ─── Gallery ───────────────────────────────────────────────── */

function GalleryField({ field, value, onChange, getClient }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const images = Array.isArray(value) ? value : [];

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const client = getClient?.();
    if (!client) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const media = await client.uploadMedia(file);
        uploaded.push({ id: media.id, url: media.source_url });
      }
      onChange([...images, ...uploaded]);
    } catch (err) {
      console.error('Gallery upload failed:', err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <FieldWrapper field={field}>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, i) => {
          const url = typeof img === 'string' ? img : img?.url || img?.source_url;
          return (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 p-1 rounded bg-white/90 shadow text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        {(!field.max || images.length < field.max) && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
        )}
      </div>
    </FieldWrapper>
  );
}

/* ─── oEmbed ────────────────────────────────────────────────── */

function OembedField({ field, value, onChange }) {
  return (
    <FieldWrapper field={field}>
      <div className="vc-field-bg flex items-center gap-2">
        <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="url"
          className="w-full bg-transparent text-[14px] text-[#282828] border-none outline-none placeholder:text-gray-300"
          style={{ fontSize: '16px' }}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Paste embed URL..."
        />
      </div>
    </FieldWrapper>
  );
}

/* ─── Status Badge (special presentation for select fields) ── */

export function StatusBadge({ value, choices, onChange }) {
  const colorMap = {
    confirmed:   { bg: 'bg-[#0f331f]', text: 'text-[#b1d6c3]' },
    booked:      { bg: 'bg-[#0f331f]', text: 'text-[#b1d6c3]' },
    pending:     { bg: 'bg-amber-100', text: 'text-amber-800' },
    hold:        { bg: 'bg-gray-200', text: 'text-gray-600' },
    declined:    { bg: 'bg-red-100', text: 'text-red-700' },
    cancelled:   { bg: 'bg-red-100', text: 'text-red-700' },
    available:   { bg: 'bg-blue-100', text: 'text-blue-700' },
    archived:    { bg: 'bg-gray-200', text: 'text-gray-500' },
    unavailable: { bg: 'bg-gray-200', text: 'text-gray-500' },
  };

  const normalized = normalizeChoices(choices);
  const colors = colorMap[value] || colorMap.available;
  const label = normalized.find(o => o.value === value)?.label || value || 'Select...';

  return (
    <div className="relative inline-block">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none ${colors.bg} ${colors.text} text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer outline-none pr-6`}
        style={{ fontSize: '16px' }}
      >
        <option value="">Select...</option>
        {normalized.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">&#x25BE;</span>
    </div>
  );
}

/* ─── Shared wrapper ────────────────────────────────────────── */

function FieldWrapper({ field, children }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-[#979797] mb-1.5">
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {field.instructions && (
        <p className="text-[11px] text-gray-400 mb-1.5">{field.instructions}</p>
      )}
      {children}
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────── */

/**
 * Normalize ACF choices object { value: label } or array
 * to [{ value, label }] format.
 */
function normalizeChoices(choices) {
  if (!choices) return [];
  if (Array.isArray(choices)) {
    return choices.map(c =>
      typeof c === 'object' ? c : { value: c, label: c }
    );
  }
  // ACF returns choices as { value: label } object
  return Object.entries(choices).map(([value, label]) => ({ value, label }));
}

/* ─── Field type → component map ────────────────────────────── */

const FIELD_MAP = {
  text: TextField,
  email: TextField,
  url: TextField,
  password: TextField,
  textarea: TextareaField,
  wysiwyg: WysiwygField,
  number: NumberField,
  select: SelectField,
  radio: RadioField,
  checkbox: CheckboxField,
  true_false: TrueFalseField,
  image: ImageField,
  file: ImageField,
  taxonomy: TaxonomyField,
  post_object: PostObjectField,
  relationship: PostObjectField,
  date_picker: DatePickerField,
  time_picker: TimePickerField,
  date_time_picker: DateTimePickerField,
  color_picker: ColorPickerField,
  group: GroupField,
  repeater: RepeaterField,
  gallery: GalleryField,
  link: LinkField,
  oembed: OembedField,
};
