/**
 * mediaUploadService.js
 * WordPress media library upload + client-side image compression
 */

/**
 * Upload a file to WP media library via REST API
 * @param {File|Blob} file
 * @param {object}   opts
 * @param {string}   opts.siteUrl       WP site URL (no trailing slash)
 * @param {string}   opts.username      WP username
 * @param {string}   opts.appPassword   WP Application Password
 * @param {function} opts.onProgress    (percent: 0-100) => void
 * @param {string}   opts.filename      Optional override filename
 * @returns {Promise<{id, source_url, media_details, title, alt_text}>}
 */
export function uploadToWpMedia(file, { siteUrl, username, appPassword, onProgress, filename }) {
  return new Promise((resolve, reject) => {
    if (!siteUrl) return reject(new Error('siteUrl is required'));
    if (!username || !appPassword) return reject(new Error('WP credentials required'));

    const endpoint = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/media`;
    const name = filename || file.name || `upload-${Date.now()}.jpg`;
    const authToken = btoa(`${username}:${appPassword}`);

    const MAX_RETRIES = 2;
    let attempt = 0;

    function attempt_upload() {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);
      xhr.timeout = 120000; // 2 min — generous for mobile on DreamHost
      xhr.setRequestHeader('Authorization', `Basic ${authToken}`);
      xhr.setRequestHeader('Content-Disposition', `attachment; filename="${name}"`);
      xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress((e.loaded / e.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (err) {
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

      const retry_or_reject = (msg) => {
        if (attempt < MAX_RETRIES) {
          attempt++;
          console.warn(`[mediaUpload] ${msg} — retry ${attempt}/${MAX_RETRIES}`);
          setTimeout(attempt_upload, attempt * 1500);
        } else {
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => retry_or_reject('Network error during upload');
      xhr.ontimeout = () => retry_or_reject('Upload timed out');

      xhr.send(file);
    }

    attempt_upload();
  });
}

/**
 * Compress an image client-side using canvas
 * @param {File|Blob} file
 * @param {number}    maxWidth   Max dimension for long edge (default 1920)
 * @param {number}    quality    JPEG quality 0-1 (default 0.85)
 * @returns {Promise<Blob>}
 */
export function compressImage(file, maxWidth = 1920, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Scale down keeping aspect ratio based on the longer edge
      const longEdge = Math.max(img.width, img.height);
      const scale = longEdge > maxWidth ? maxWidth / longEdge : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
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
 * Attach a media item to a post as the featured image
 * @param {object} opts
 * @param {string} opts.siteUrl
 * @param {string} opts.username
 * @param {string} opts.appPassword
 * @param {number} opts.postId
 * @param {number} opts.mediaId
 * @param {string} opts.postType  e.g. 'posts', 'artist', 'event'
 */
export async function setFeaturedMedia({ siteUrl, username, appPassword, postId, mediaId, postType = 'posts' }) {
  const endpoint = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/${postType}/${postId}`;
  const authToken = btoa(`${username}:${appPassword}`);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ featured_media: mediaId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to set featured media: ${res.status}`);
  }
  return res.json();
}
