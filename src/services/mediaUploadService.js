/**
 * mediaUploadService.js
 * WordPress media library upload + client-side image compression
 *
 * Changelog:
 * v1.1.0 — 2026-04-28 — xhr.timeout set to 120s (was 0 / never fired).
 *                        uploadToWpMedia wraps _uploadOnce with 2x auto-retry
 *                        (exponential backoff) on timeout or network error.
 */

const UPLOAD_TIMEOUT_MS = 120000; // 2 minutes — generous for DreamHost PHP-FPM
const MAX_RETRIES       = 2;

/**
 * Single XHR upload attempt — internal use only.
 */
function _uploadOnce(file, { siteUrl, username, appPassword, onProgress, filename }) {
  return new Promise((resolve, reject) => {
    if (!siteUrl) return reject(new Error('siteUrl is required'));
    if (!username || !appPassword) return reject(new Error('WP credentials required'));

    const endpoint  = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/media`;
    const name      = filename || file.name || `upload-${Date.now()}.jpg`;
    const authToken = btoa(`${username}:${appPassword}`);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);
    xhr.timeout = UPLOAD_TIMEOUT_MS; // ← was never set before; ontimeout never fired
    xhr.setRequestHeader('Authorization',      `Basic ${authToken}`);
    xhr.setRequestHeader('Content-Disposition', `attachment; filename="${name}"`);
    xhr.setRequestHeader('Content-Type',        file.type || 'image/jpeg');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress((e.loaded / e.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid JSON response from WP'));
        }
      } else {
        let msg = `Upload failed: ${xhr.status}`;
        try {
          const errData = JSON.parse(xhr.responseText);
          msg = errData.message || msg;
        } catch (_) {}
        reject(new Error(msg));
      }
    };

    xhr.onerror   = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));

    xhr.send(file);
  });
}

/**
 * Upload a file to WP media library via REST API.
 * Auto-retries up to MAX_RETRIES times on timeout or network error.
 *
 * @param {File|Blob} file
 * @param {object}    opts
 * @param {string}    opts.siteUrl       WP site URL (no trailing slash)
 * @param {string}    opts.username      WP username
 * @param {string}    opts.appPassword   WP Application Password
 * @param {function}  opts.onProgress    (percent: 0–100) => void
 * @param {string}    opts.filename      Optional override filename
 * @returns {Promise<{id, source_url, media_details, title, alt_text}>}
 */
export async function uploadToWpMedia(file, opts, _attempt = 0) {
  try {
    return await _uploadOnce(file, opts);
  } catch (err) {
    const isRetryable = err.message.includes('timed out') ||
                        err.message.includes('Network error');
    if (isRetryable && _attempt < MAX_RETRIES) {
      const delay = 1000 * (_attempt + 1); // 1s, then 2s
      console.warn(`[mediaUpload] Attempt ${_attempt + 1} failed — retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
      return uploadToWpMedia(file, opts, _attempt + 1);
    }
    throw err;
  }
}

/**
 * Compress an image client-side using canvas.
 * Always converts to JPEG. If the compressed blob is larger than the
 * original file, the original is returned unchanged.
 *
 * @param {File|Blob} file
 * @param {number}    maxWidth   Max dimension for long edge (default 1600)
 * @param {number}    quality    JPEG quality 0–1 (default 0.82)
 * @returns {Promise<Blob>}
 */
export function compressImage(file, maxWidth = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Scale down keeping aspect ratio based on the longer edge
      const longEdge = Math.max(img.width, img.height);
      const scale    = longEdge > maxWidth ? maxWidth / longEdge : 1;
      const w        = Math.round(img.width  * scale);
      const h        = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled  = true;
      ctx.imageSmoothingQuality  = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          // Don't return a larger file than we started with
          resolve(blob.size < file.size ? blob : file);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
}

/**
 * Attach a media item to a post as the featured image.
 */
export async function setFeaturedMedia({ siteUrl, username, appPassword, postId, mediaId, postType = 'posts' }) {
  const endpoint  = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/${postType}/${postId}`;
  const authToken = btoa(`${username}:${appPassword}`);

  const res = await fetch(endpoint, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ featured_media: mediaId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to set featured media: ${res.status}`);
  }
  return res.json();
}
