old = """  // ── Loading / error states ──────────────────────────────────────
  // Must come AFTER all hooks above.

  // Show spinner while auth context is still bootstrapping
  if (!activeSite && !schemaError) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }"""

new = """  // ── Loading / error states ──────────────────────────────────────
  // Must come AFTER all hooks above.

  // Wait for auth to bootstrap
  if (!activeSite) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Credentials ready but schema hasn't loaded yet — keep spinner.
  // Prevents a race where the form renders with schema=null before the
  // schema fetch has completed.
  if (activeSite.appPassword && !schema && !schemaError) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }"""

with open('src/modules/artists/ArtistDetail.jsx', 'r') as f:
    content = f.read()

if old in content:
    content = content.replace(old, new, 1)
    print('✓ ArtistDetail patched')
else:
    print('✗ NOT FOUND — check indentation')

with open('src/modules/artists/ArtistDetail.jsx', 'w') as f:
    f.write(content)
