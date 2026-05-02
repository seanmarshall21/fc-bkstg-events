/**
 * VC API Client
 *
 * Handles authenticated requests to WordPress REST API.
 * Supports WP Application Passwords (Basic Auth over HTTPS).
 */

class VCApiClient {
  constructor(siteUrl, credentials = null) {
    // Normalize URL — strip trailing slash
    this.baseUrl = siteUrl.replace(/\/+$/, '');
    this.credentials = credentials; // { username, appPassword }
    this.abortControllers = new Map();
  }

  /**
   * Build auth headers.
   * WP Application Passwords use Basic Auth: base64(username:app_password)
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.credentials) {
      const { username, appPassword } = this.credentials;
      const token = btoa(`${username}:${appPassword}`);
      headers['Authorization'] = `Basic ${token}`;
    }

    return headers;
  }

  /**
   * Core fetch wrapper with error handling and abort support.
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      params = {},
      signal = null,
      abortKey = null,
    } = options;

    // Cancel previous request with same key
    if (abortKey && this.abortControllers.has(abortKey)) {
      this.abortControllers.get(abortKey).abort();
    }

    const controller = new AbortController();
    if (abortKey) {
      this.abortControllers.set(abortKey, controller);
    }

    // Build URL with query params
    const url = new URL(`${this.baseUrl}/wp-json${endpoint}`);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.set(key, val);
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : null,
        signal: signal || controller.signal,
      });

      // Clean up
      if (abortKey) {
        this.abortControllers.delete(abortKey);
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new VCApiError(
          error.message || `HTTP ${response.status}`,
          response.status,
          error.code || 'unknown_error'
        );
      }

      // Return headers + data for pagination
      const data = await response.json();
      return {
        data,
        total: parseInt(response.headers.get('X-WP-Total') || '0', 10),
        totalPages: parseInt(response.headers.get('X-WP-TotalPages') || '0', 10),
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err; // Let caller handle abort
      }
      if (err instanceof VCApiError) {
        throw err;
      }
      throw new VCApiError(err.message, 0, 'network_error');
    }
  }

  // Convenience methods
  get(endpoint, params = {}, opts = {}) {
    return this.request(endpoint, { method: 'GET', params, ...opts });
  }

  post(endpoint, body = {}, opts = {}) {
    return this.request(endpoint, { method: 'POST', body, ...opts });
  }

  put(endpoint, body = {}, opts = {}) {
    return this.request(endpoint, { method: 'PUT', body, ...opts });
  }

  del(endpoint, opts = {}) {
    return this.request(endpoint, { method: 'DELETE', params: { force: true }, ...opts });
  }

  /**
   * Validate credentials by fetching current user.
   * Returns user object or throws.
   */
  async validateAuth() {
    const { data } = await this.get('/wp/v2/users/me', { context: 'edit' });
    return data;
  }

  /**
   * Upload media (image).
   * Uses FormData instead of JSON.
   */
  async uploadMedia(file) {
    const url = `${this.baseUrl}/wp-json/wp/v2/media`;
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (this.credentials) {
      const { username, appPassword } = this.credentials;
      headers['Authorization'] = `Basic ${btoa(`${username}:${appPassword}`)}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new VCApiError(error.message || 'Upload failed', response.status);
    }

    return response.json();
  }

  // Cancel all pending requests
  cancelAll() {
    this.abortControllers.forEach(c => c.abort());
    this.abortControllers.clear();
  }
}

class VCApiError extends Error {
  constructor(message, status, code = 'api_error') {
    super(message);
    this.name = 'VCApiError';
    this.status = status;
    this.code = code;
  }
}

export { VCApiClient, VCApiError };
