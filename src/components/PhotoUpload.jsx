import { useState, useRef, useCallback, useEffect } from 'react';
import { uploadToWpMedia, compressImage } from '../services/mediaUploadService';

/**
 * PhotoUpload - Universal photo upload component for WP media library
 *
 * @param {string}   value           Current image URL
 * @param {function} onChange        Callback(newUrl, mediaObject) on successful upload
 * @param {function} onRemove        Callback() when user removes image
 * @param {string}   aspectRatio     "square" | "circle" | "landscape" | "portrait"
 * @param {number}   maxSize         Max file size in MB before compression triggers (default 2)
 * @param {string}   siteUrl         WordPress site URL (no trailing slash)
 * @param {string}   wpUsername      WP username for Application Password auth
 * @param {string}   wpAppPassword   WP Application Password
 * @param {string}   className       Extra classes for outer wrapper
 */
export default function PhotoUpload({
  value,
  onChange,
  onRemove,
  aspectRatio = 'square',
  maxSize = 2,
  siteUrl,
  wpUsername,
  wpAppPassword,
  className = '',
}) {
  const [previewUrl, setPreviewUrl] = useState(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastFile, setLastFile] = useState(null);

  const inputRef = useRef(null);
  const blobUrlRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    if (!isUploading) setPreviewUrl(value || null);
  }, [value, isUploading]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  // ---- Aspect ratio class map ----
  const aspectClasses = {
    square: 'aspect-square rounded-2xl',
    circle: 'aspect-square rounded-full',
    landscape: 'aspect-video rounded-2xl',
    portrait: 'aspect-[3/4] rounded-2xl',
  };
  const shapeClass = aspectClasses[aspectRatio] || aspectClasses.square;

  // ---- File handling ----
  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError(null);
    setLastFile(file);

    // Revoke previous blob URL
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);

    // Optimistic local preview
    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;
    setPreviewUrl(blobUrl);
    setIsUploading(true);
    setProgress(0);

    try {
      // Compress if over threshold
      let uploadFile = file;
      if (file.size > maxSize * 1024 * 1024) {
        const compressed = await compressImage(file, 1920, 0.85);
        uploadFile = new File([compressed], file.name.replace(/\.\w+$/, '.jpg'), {
          type: 'image/jpeg',
        });
      }

      const media = await uploadToWpMedia(uploadFile, {
        siteUrl,
        username: wpUsername,
        appPassword: wpAppPassword,
        onProgress: setProgress,
      });

      setPreviewUrl(media.source_url);
      setIsUploading(false);
      setProgress(100);
      onChange?.(media.source_url, media);
    } catch (err) {
      console.error('[PhotoUpload] Upload failed:', err);
      setError(err.message || 'Upload failed');
      setIsUploading(false);
    }
  }, [maxSize, siteUrl, wpUsername, wpAppPassword, onChange]);

  const handleRetry = () => {
    if (lastFile) handleFile(lastFile);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPreviewUrl(null);
    setError(null);
    setProgress(0);
    onRemove?.();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const openPicker = () => inputRef.current?.click();

  // ---- Render ----
  const hasImage = !!previewUrl;
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-block w-full max-w-xs ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        onClick={!hasImage || error ? openPicker : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'relative w-full overflow-hidden border-2 border-dashed transition-all',
          shapeClass,
          error
            ? 'border-red-400 bg-red-50'
            : isDragging
            ? 'border-purple-500 bg-purple-50'
            : hasImage
            ? 'border-solid border-gray-200 bg-white'
            : 'border-gray-300 bg-gray-50 cursor-pointer hover:border-purple-400 hover:bg-purple-50',
        ].join(' ')}
      >
        {hasImage ? (
          <>
            <img
              src={previewUrl}
              alt="Upload preview"
              className={`w-full h-full object-cover ${error ? 'opacity-40' : ''}`}
            />

            {/* Upload progress ring overlay */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke="rgba(255,255,255,0.3)" strokeWidth="6"
                  />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke="#a855f7" strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                  />
                </svg>
                <span className="absolute text-white font-semibold text-sm">
                  {Math.round(progress)}%
                </span>
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/20 gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                  className="px-3 py-1.5 bg-white text-red-600 rounded-md text-sm font-medium shadow-sm hover:bg-red-50"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Edit & Remove buttons (hidden during upload) */}
            {!isUploading && !error && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openPicker(); }}
                  className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-purple-50 transition-colors"
                  aria-label="Replace image"
                >
                  <CameraIcon className="w-4 h-4 text-purple-600" />
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                  aria-label="Remove image"
                >
                  <XIcon className="w-4 h-4 text-gray-700" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <CameraIcon className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Tap to upload</p>
            <p className="text-xs text-gray-500 hidden sm:block">or drag and drop</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}

// ---- Inline icons (no external deps) ----
function CameraIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
      <circle cx="12" cy="13" r="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function XIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  );
}
