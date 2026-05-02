import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import { Upload, Download, ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react';

// ── CSV column definitions (mirrors PHP get_columns()) ────────────────────────

const COLUMNS = [
  { key: 'slug',            label: 'Slug',            notes: 'Match key — required',                             required: true },
  { key: 'title',           label: 'Title',           notes: 'Artist / act name' },
  { key: 'post_status',     label: 'Status',          notes: 'publish or draft' },
  { key: 'origin',          label: 'Origin',          notes: 'Hometown / city' },
  { key: 'booking_status',  label: 'Booking Status',  notes: 'confirmed | pending | hold | cancelled | available | booked | unavailable' },
  { key: 'booking_fee',     label: 'Booking Fee',     notes: 'Number' },
  { key: 'genre',           label: 'Genre',           notes: 'Genre slug (e.g. electronic). Comma-separate for multiple.' },
  { key: 'instagram',       label: 'Instagram',       notes: 'URL' },
  { key: 'spotify',         label: 'Spotify',         notes: 'URL' },
  { key: 'soundcloud',      label: 'SoundCloud',      notes: 'URL' },
  { key: 'twitter',         label: 'Twitter / X',     notes: 'URL' },
  { key: 'website',         label: 'Website',         notes: 'URL' },
  { key: 'agent_name',      label: 'Agent Name',      notes: 'Booking agent name' },
  { key: 'agent_email',     label: 'Agent Email',     notes: 'Booking agent email' },
  { key: 'agent_phone',     label: 'Agent Phone',     notes: 'Booking agent phone' },
  { key: 'contract_status', label: 'Contract Status', notes: 'Contract status select value' },
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
    'fisher', 'Fisher', 'publish', 'Sydney, Australia',
    'confirmed', '85000', 'electronic',
    'https://instagram.com/fisher', 'https://open.spotify.com/artist/fisher',
    'https://soundcloud.com/fisher', '', 'https://fisherdj.com',
    'Jane Smith', 'jane@agencyname.com', '+1 310 555 0100', 'signed',
  ];
  const escape = v => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  return [headers, example].map(row => row.map(escape).join(',')).join('\n');
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ImportArtists() {
  const { getClient, hasSites } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [status, setStatus]     = useState('idle'); // idle | importing | done | error
  const [results, setResults]   = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

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
    a.download = 'vc-artists-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    if (!preview?.rows?.length) return;
    const client = getClient();
    if (!client) return;

    setStatus('importing');
    setErrorMsg('');

    try {
      const { data } = await client.post(WP_ENDPOINTS.artists.import, {
        rows: preview.rows,
      });
      setResults(data);
      setStatus('done');
    } catch (err) {
      console.error('Artist import failed:', err);
      setErrorMsg(err?.response?.data?.message || 'Import failed — check the console.');
      setStatus('error');
    }
  }, [getClient, preview]);

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
          onClick={() => navigate('/artists')}
          className="w-9 h-9 rounded-xl border border-surface-3 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Import Artists</h2>
      </div>

      <div className="mx-4 border-b border-surface-3 mb-4" />

      <div className="px-4 flex flex-col gap-4">

        {/* ── Template download card ─────────────────────────── */}
        <div className="bg-white border border-surface-3 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">Need the template?</p>
          <p className="text-xs text-gray-400 mb-3">
            Download a CSV with all supported columns and an example row. Fill it in, then upload below.
            Photos, bio, and any fields not in the CSV are left untouched.
          </p>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 text-sm font-medium text-vc-600 hover:text-vc-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template CSV
          </button>
        </div>

        {/* ── File upload card ───────────────────────────────── */}
        <div className="bg-white border border-surface-3 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">Upload CSV</p>
          <p className="text-xs text-gray-400 mb-3">
            Rows are matched to existing artists by slug. Matched rows are updated, unmatched rows create new
            artist posts. Only columns present in your file are written.
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
              <><Upload className="w-4 h-4" /> Import {validRows.length} Artist{validRows.length !== 1 ? 's' : ''}</>
            )}
          </button>
        )}

        {status === 'done' && (
          <button
            onClick={() => navigate('/artists')}
            className="w-full py-4 rounded-2xl font-semibold text-sm bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            Back to Artists
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
          <p className="text-xs text-gray-400 mt-1">Genre: use the term slug (e.g. <code className="font-mono">electronic</code>), not the display name.</p>
        </div>

      </div>
    </div>
  );
}
