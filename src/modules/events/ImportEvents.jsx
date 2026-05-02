import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import { Upload, Download, ArrowLeft, CheckCircle, AlertCircle, Loader, Link, RefreshCw, X } from 'lucide-react';

const SHEET_URL_CACHE_KEY = 'vc_import_sheet_url';

// ── CSV column definitions (mirrors PHP get_columns()) ────────────────────────

const COLUMNS = [
  { key: 'slug',         label: 'Slug',         notes: 'Match key — required',       required: true },
  { key: 'title',        label: 'Title',         notes: 'Event name' },
  { key: 'post_status',  label: 'Status',        notes: 'publish or draft' },
  { key: 'season',       label: 'Season',        notes: "e.g. Spring '26" },
  { key: 'start_date',   label: 'Start Date',    notes: 'YYYY-MM-DD' },
  { key: 'end_date',     label: 'End Date',      notes: 'YYYY-MM-DD' },
  { key: 'city',         label: 'City',          notes: '' },
  { key: 'state',        label: 'State',         notes: '' },
  { key: 'venue',        label: 'Venue',         notes: '' },
  { key: 'capacity',     label: 'Capacity',      notes: 'Number' },
  { key: 'established',  label: 'Established',   notes: 'Year (number)' },
  { key: 'website',      label: 'Website',       notes: 'URL' },
  { key: 'instagram',    label: 'Instagram',     notes: 'URL' },
  { key: 'facebook',     label: 'Facebook',      notes: 'URL' },
  { key: 'spotify',      label: 'Spotify',       notes: 'URL' },
  { key: 'twitter',      label: 'Twitter / X',   notes: 'URL' },
  { key: 'tiktok',       label: 'TikTok',        notes: 'URL' },
  { key: 'soundcloud',   label: 'SoundCloud',    notes: 'URL' },
  { key: 'confidential', label: 'Confidential',  notes: '0 or 1' },
  { key: 'private',      label: 'Private',       notes: '0 or 1' },
];

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });

  return { headers, rows };
}

function generateTemplateCSV() {
  const headers = COLUMNS.map(c => c.key);
  const example = [
    'crssd-fall-2026', 'CRSSD Fall 2026', 'publish', "Fall '26",
    '2026-10-03', '2026-10-04', 'San Diego', 'CA', 'Waterfront Park',
    '5000', '2013', 'https://crssdfest.com', 'https://instagram.com/crssd',
    '', '', '', '', '', '0', '0',
  ];
  const escape = v => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  return [headers, example].map(row => row.map(escape).join(',')).join('\n');
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ImportEvents() {
  const { getClient, hasSites } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null); // { headers, rows }
  const [status, setStatus]     = useState('idle'); // idle | importing | done | error
  const [results, setResults]   = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Google Sheet sync ──────────────────────────────────────────────────────
  const [sheetUrl, setSheetUrl]         = useState(() => localStorage.getItem(SHEET_URL_CACHE_KEY) || '');
  const [sheetSaving, setSheetSaving]   = useState(false);
  const [sheetFetching, setSheetFetching] = useState(false);
  const [sheetError, setSheetError]     = useState('');

  // ── File selection ─────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResults(null);
    setStatus('idle');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      setPreview(parsed);
    };
    reader.readAsText(f);
  };

  // ── Template download ──────────────────────────────────────────────────────

  const downloadTemplate = () => {
    const csv = generateTemplateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vc-events-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Sheet URL — load from WP on mount ─────────────────────────────────────

  useEffect(() => {
    const client = getClient();
    if (!client) return;
    client.get(WP_ENDPOINTS.events.sheetUrl)
      .then(({ data }) => {
        if (data?.url) {
          setSheetUrl(data.url);
          localStorage.setItem(SHEET_URL_CACHE_KEY, data.url);
        }
      })
      .catch(() => {}); // fall back to cached localStorage value
  }, [getClient]);

  // ── Sheet URL — save to WP on blur ────────────────────────────────────────

  const handleSheetUrlChange = (url) => {
    setSheetUrl(url);
    // Update cache immediately
    if (url.trim()) localStorage.setItem(SHEET_URL_CACHE_KEY, url.trim());
    else localStorage.removeItem(SHEET_URL_CACHE_KEY);
  };

  const handleSheetUrlBlur = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setSheetSaving(true);
    try {
      await client.post(WP_ENDPOINTS.events.sheetUrl, { url: sheetUrl.trim() });
    } catch (err) {
      console.warn('Sheet URL save failed:', err);
    } finally {
      setSheetSaving(false);
    }
  }, [getClient, sheetUrl]);

  // ── Fetch from Google Sheet ────────────────────────────────────────────────

  const fetchSheet = async () => {
    const url = sheetUrl.trim();
    if (!url) return;
    setSheetFetching(true);
    setSheetError('');
    setPreview(null);
    setFile(null);
    setResults(null);
    setStatus('idle');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseCSV(text);
      if (!parsed.rows.length) throw new Error('Sheet returned no rows — check the URL and column headers.');
      setPreview(parsed);
    } catch (err) {
      setSheetError(err.message || 'Could not fetch sheet. Make sure it is published as CSV.');
    } finally {
      setSheetFetching(false);
    }
  };

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!preview?.rows?.length) return;
    const client = getClient();
    if (!client) return;

    setStatus('importing');
    setErrorMsg('');

    try {
      const { data } = await client.post(WP_ENDPOINTS.events.import, {
        rows: preview.rows,
      });
      setResults(data);
      setStatus('done');
    } catch (err) {
      console.error('Import failed:', err);
      setErrorMsg(err?.response?.data?.message || 'Import failed — check the console.');
      setStatus('error');
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to use the importer.</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const validRows   = preview?.rows?.filter(r => r.slug?.trim()) ?? [];
  const invalidRows = (preview?.rows?.length ?? 0) - validRows.length;

  return (
    <div className="flex flex-col pb-28 animate-fade-in">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => navigate('/events')}
          className="w-9 h-9 rounded-xl border border-surface-3 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Import Events</h2>
      </div>

      <div className="mx-4 border-b border-surface-3 mb-4" />

      <div className="px-4 flex flex-col gap-4">

        {/* ── Template download card ─────────────────────────── */}
        <div className="bg-white border border-surface-3 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">Need the template?</p>
          <p className="text-xs text-gray-400 mb-3">
            Download a CSV with all supported columns and an example row. Fill it in, then upload below.
          </p>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 text-sm font-medium text-vc-600 hover:text-vc-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template CSV
          </button>
        </div>

        {/* ── Google Sheet link card ────────────────────────── */}
        <div className="bg-white border border-surface-3 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Link className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Link to Google Sheet</p>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Paste your published Google Sheet CSV URL. The link is saved — tap Sync any time to pull the latest data.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={sheetUrl}
                onChange={e => handleSheetUrlChange(e.target.value)}
                onBlur={handleSheetUrlBlur}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                className="w-full bg-surface-1 border border-surface-3 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-vc-500 focus:ring-2 focus:ring-vc-500/20 transition-colors pr-8"
              />
              {sheetUrl && !sheetSaving && (
                <button
                  onClick={() => { handleSheetUrlChange(''); handleSheetUrlBlur(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {sheetSaving && (
                <Loader className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
              )}
            </div>
            <button
              onClick={fetchSheet}
              disabled={!sheetUrl.trim() || sheetFetching}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                !sheetUrl.trim() || sheetFetching
                  ? 'bg-surface-2 text-gray-400 cursor-not-allowed'
                  : 'bg-vc-500 hover:bg-vc-600 text-white'
              }`}
            >
              {sheetFetching
                ? <Loader className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />}
              {sheetFetching ? 'Fetching…' : 'Sync'}
            </button>
          </div>
          {sheetError && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{sheetError}
            </p>
          )}
          {sheetUrl && !sheetError && !sheetFetching && !preview && (
            <p className="text-xs text-gray-400 mt-2">
              {sheetSaving ? 'Saving…' : 'Sheet linked — tap Sync to load data.'}
            </p>
          )}
        </div>

        {/* ── File upload card ───────────────────────────────── */}
        <div className="bg-white border border-surface-3 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">Upload CSV</p>
          <p className="text-xs text-gray-400 mb-3">
            Rows are matched to existing events by slug. Only columns present in your file are updated — photos and all other fields are left untouched.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-surface-4 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span className="text-sm font-medium">
              {file ? file.name : 'Tap to choose a CSV file'}
            </span>
            {file && (
              <span className="text-xs text-gray-400">
                {validRows.length} valid row{validRows.length !== 1 ? 's' : ''}
                {invalidRows > 0 ? `, ${invalidRows} missing slug` : ''}
              </span>
            )}
          </button>
        </div>

        {/* ── Preview table ──────────────────────────────────── */}
        {preview && validRows.length > 0 && (
          <div className="bg-white border border-surface-3 rounded-2xl p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Preview — {validRows.length} row{validRows.length !== 1 ? 's' : ''}
            </p>
            <div className="overflow-x-auto -mx-1">
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className="border-b border-surface-2">
                    {preview.headers.map(h => (
                      <th key={h} className="text-left text-gray-400 font-medium px-2 py-1.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-surface-1">
                      {preview.headers.map(h => (
                        <td key={h} className="px-2 py-1.5 text-gray-700 whitespace-nowrap max-w-[140px] truncate">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {validRows.length > 5 && (
                <p className="text-xs text-gray-400 mt-2 px-2">
                  +{validRows.length - 5} more rows not shown
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Results ────────────────────────────────────────── */}
        {status === 'done' && results && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 mb-1">Import complete</p>
              <p className="text-xs text-emerald-700">{results.summary}</p>
              {results.errors?.length > 0 && (
                <ul className="mt-2 text-xs text-red-600 space-y-0.5">
                  {results.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        {/* ── Import button ──────────────────────────────────── */}
        {validRows.length > 0 && status !== 'done' && (
          <button
            onClick={handleImport}
            disabled={status === 'importing'}
            className={`w-full py-4 rounded-2xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              status === 'importing'
                ? 'bg-vc-400 text-white cursor-not-allowed'
                : 'bg-vc-500 hover:bg-vc-600 text-white'
            }`}
          >
            {status === 'importing' ? (
              <><Loader className="w-4 h-4 animate-spin" /> Importing…</>
            ) : (
              <><Upload className="w-4 h-4" /> Import {validRows.length} Event{validRows.length !== 1 ? 's' : ''}</>
            )}
          </button>
        )}

        {status === 'done' && (
          <button
            onClick={() => navigate('/events')}
            className="w-full py-4 rounded-2xl font-semibold text-sm bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            Back to Events
          </button>
        )}

        {/* ── Column reference ───────────────────────────────── */}
        <div className="bg-white border border-surface-3 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">Supported Columns</p>
          <div className="divide-y divide-surface-2">
            {COLUMNS.map(col => (
              <div key={col.key} className="flex items-baseline gap-2 py-1.5">
                <span className={`font-mono text-xs shrink-0 ${col.required ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                  {col.key}{col.required ? ' *' : ''}
                </span>
                <span className="text-xs text-gray-400 truncate">{col.notes || col.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">* Required</p>
        </div>

      </div>
    </div>
  );
}
