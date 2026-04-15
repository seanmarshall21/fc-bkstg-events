import re

# ── ArtistDetail.jsx ─────────────────────────────────────
with open('src/modules/artists/ArtistDetail.jsx', 'r') as f:
    src = f.read()

# The two useCallback hooks that are illegally after early returns
photo_hooks = '''
  // Photo handlers — must be declared before any conditional returns (Rules of Hooks)
  const handlePhotoChange = useCallback(async (url, mediaObject) => {
    setArtist(prev => ({ ...prev, vc_artist_photo: url }));

    if (!isCreate && artist?._wp?.id) {
      try {
        await setFeaturedMedia({
          siteUrl: activeSite?.url,
          username: activeSite?.username,
          appPassword: activeSite?.appPassword,
          postId: artist._wp.id,
          mediaId: mediaObject.id,
          postType: \'vc_artist\',
        });
      } catch (err) {
        console.error(\'Failed to set featured media:\', err);
      }
    }
  }, [activeSite, isCreate, artist?._wp?.id]);

  const handlePhotoRemove = useCallback(() => {
    setArtist(prev => ({ ...prev, vc_artist_photo: \'\' }));
  }, []);

'''

# Remove the old (post-return) versions — they start after "  // Loading states"
# and end before "  return (" in the render section
old_block_pattern = r'  const handlePhotoChange = useCallback\(async \(url, mediaObject\) => \{.*?\}, \[activeSite, isCreate, artist\?._wp\?\.id\]\);\n\n  const handlePhotoRemove = useCallback\(\(\) => \{.*?\}, \[\]\);\n\n  return \('
new_block_replacement = '  return ('

src = re.sub(old_block_pattern, new_block_replacement, src, flags=re.DOTALL)

# Insert photo hooks before the loading state guards (before "  // Loading states")
anchor = '  // Loading states'
if anchor not in src:
    # fallback anchor
    anchor = '  if (schemaLoading || loading)'

src = src.replace(anchor, photo_hooks + '  // ── Loading / error states ──────────────────────────────────────\n  // Must come AFTER all hooks above.\n\n' + '  if (schemaLoading || loading)', 1)

with open('src/modules/artists/ArtistDetail.jsx', 'w') as f:
    f.write(src)
print('ArtistDetail.jsx patched')

# ── App.jsx ──────────────────────────────────────────────
with open('src/App.jsx', 'r') as f:
    app = f.read()

boundary_class = """import { Component } from 'react';

/**
 * Error boundary — catches render errors anywhere in the tree and shows
 * a readable message instead of a blank screen.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[App] Uncaught render error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'red', fontWeight: 600, marginBottom: 8 }}>Something went wrong</p>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>{this.state.error.message}</p>
          <button onClick={() => { this.setState({ error: null }); window.history.back(); }}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#6d28d9', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Go back
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

"""

# Inject after the last import line
last_import_pos = 0
for m in re.finditer(r'^import .+$', app, re.MULTILINE):
    last_import_pos = m.end()

app = app[:last_import_pos] + '\n\n' + boundary_class + app[last_import_pos:].lstrip('\n')

# Wrap the return in ErrorBoundary
app = app.replace(
    '    <BrowserRouter>',
    '    <ErrorBoundary>\n      <BrowserRouter>'
).replace(
    '    </BrowserRouter>',
    '    </BrowserRouter>\n    </ErrorBoundary>'
)

with open('src/App.jsx', 'w') as f:
    f.write(app)
print('App.jsx patched')
